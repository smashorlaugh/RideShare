"""
RideShare - Carpooling App Backend
A BlaBlaCar-style carpooling application API
"""

from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from jose import jwt, JWTError
from passlib.context import CryptContext
import os
import random
import string
import base64
from dotenv import load_dotenv

load_dotenv()

# ============== Configuration ==============
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "rideshare_db")
SECRET_KEY = os.getenv("SECRET_KEY", "rideshare-secret-key-2025-carpooling-app")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# ============== App Setup ==============
app = FastAPI(title="RideShare API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== Database ==============
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
users_collection = db["users"]
rides_collection = db["rides"]
bookings_collection = db["bookings"]
private_requests_collection = db["private_requests"]
chats_collection = db["chats"]
reviews_collection = db["reviews"]
otp_collection = db["otps"]

# ============== Security ==============
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============== Helpers ==============
def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc

def serialize_docs(docs):
    """Convert list of MongoDB documents"""
    return [serialize_doc(doc) for doc in docs]

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate JWT token and return current user"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return serialize_doc(user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def create_access_token(user_id: str):
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# ============== Pydantic Models ==============

# Auth Models
class SendOTPRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

class AuthResponse(BaseModel):
    token: str
    user: dict

# User Models
class UserUpdate(BaseModel):
    name: Optional[str] = None
    photo: Optional[str] = None  # Base64 encoded
    car_model: Optional[str] = None
    car_number: Optional[str] = None

# Ride Models
class RideCreate(BaseModel):
    pickup_location: str
    pickup_lat: float
    pickup_lng: float
    drop_location: str
    drop_lat: float
    drop_lng: float
    date: str  # ISO format
    time: str  # HH:MM format
    available_seats: int = Field(..., ge=1, le=8)
    price_per_seat: float = Field(..., ge=0)
    car_model: Optional[str] = None
    car_number: Optional[str] = None
    notes: Optional[str] = None

class RideUpdate(BaseModel):
    available_seats: Optional[int] = None
    price_per_seat: Optional[float] = None
    status: Optional[str] = None

class RideSearch(BaseModel):
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    drop_lat: Optional[float] = None
    drop_lng: Optional[float] = None
    date: Optional[str] = None
    seats_needed: Optional[int] = 1

# Booking Models
class BookingCreate(BaseModel):
    ride_id: str
    seats: int = Field(..., ge=1)
    message: Optional[str] = None

class BookingStatusUpdate(BaseModel):
    status: str  # pending, accepted, rejected, cancelled, completed

# Private Request Models
class PrivateRequestCreate(BaseModel):
    from_location: str
    from_lat: float
    from_lng: float
    to_location: str
    to_lat: float
    to_lng: float
    preferred_date: str
    preferred_time: str
    seats_needed: int = Field(..., ge=1, le=8)
    message: Optional[str] = None

class PrivateRequestResponse(BaseModel):
    request_id: str
    message: str
    ride_offer: Optional[dict] = None

# Chat Models
class ChatMessage(BaseModel):
    content: str
    booking_id: Optional[str] = None
    request_id: Optional[str] = None

# Review Models
class ReviewCreate(BaseModel):
    ride_id: str
    reviewee_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

# ============== Health Check ==============
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": "RideShare", "version": "1.0.0"}

# ============== Auth Endpoints ==============

@app.post("/api/auth/send-otp")
async def send_otp(request: SendOTPRequest):
    """Send OTP to phone number (Mock implementation for MVP)"""
    phone = request.phone.strip()
    
    # Generate 6-digit OTP
    otp = ''.join(random.choices(string.digits, k=6))
    
    # Store OTP with expiry (5 minutes)
    await otp_collection.update_one(
        {"phone": phone},
        {
            "$set": {
                "phone": phone,
                "otp": otp,
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(minutes=5)
            }
        },
        upsert=True
    )
    
    # In production, integrate with SMS service (Twilio/Firebase)
    # print(f"[DEBUG] OTP for {phone}: {otp}")
    
    return {
        "success": True,
        "message": "OTP sent successfully"
    }

@app.post("/api/auth/verify-otp", response_model=AuthResponse)
async def verify_otp(request: VerifyOTPRequest):
    """Verify OTP and create/login user"""
    phone = request.phone.strip()
    otp = request.otp.strip()
    
    # Find OTP record
    otp_record = await otp_collection.find_one({"phone": phone})
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="OTP not found. Please request a new one.")
    
    if otp_record["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    if datetime.utcnow() > otp_record["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
    
    # Delete used OTP
    await otp_collection.delete_one({"phone": phone})
    
    # Find or create user
    user = await users_collection.find_one({"phone": phone})
    
    if not user:
        # Create new user
        new_user = {
            "phone": phone,
            "name": None,
            "photo": None,
            "car_model": None,
            "car_number": None,
            "rating": 0.0,
            "total_ratings": 0,
            "total_rides_as_driver": 0,
            "total_rides_as_passenger": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await users_collection.insert_one(new_user)
        user = await users_collection.find_one({"_id": result.inserted_id})
    
    # Create token
    token = create_access_token(str(user["_id"]))
    
    return {
        "token": token,
        "user": serialize_doc(user)
    }

@app.post("/api/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user (client should delete token)"""
    return {"success": True, "message": "Logged out successfully"}

# ============== User Endpoints ==============

@app.get("/api/users/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

@app.put("/api/users/profile")
async def update_profile(update: UserUpdate, current_user: dict = Depends(get_current_user)):
    """Update user profile"""
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await users_collection.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_data}
    )
    
    user = await users_collection.find_one({"_id": ObjectId(current_user["id"])})
    return serialize_doc(user)

@app.delete("/api/users/account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    """Delete user account and all associated data"""
    user_id = ObjectId(current_user["id"])
    
    # Delete user's rides
    await rides_collection.delete_many({"driver_id": str(user_id)})
    
    # Delete user's bookings
    await bookings_collection.delete_many({"passenger_id": str(user_id)})
    
    # Delete user's private requests
    await private_requests_collection.delete_many({"passenger_id": str(user_id)})
    
    # Delete user's chats
    await chats_collection.delete_many({"$or": [
        {"sender_id": str(user_id)},
        {"receiver_id": str(user_id)}
    ]})
    
    # Delete user's reviews
    await reviews_collection.delete_many({"$or": [
        {"reviewer_id": str(user_id)},
        {"reviewee_id": str(user_id)}
    ]})
    
    # Delete user
    await users_collection.delete_one({"_id": user_id})
    
    return {"success": True, "message": "Account deleted successfully"}

@app.get("/api/users/{user_id}")
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get user by ID (public profile)"""
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return limited public info
    public_user = serialize_doc(user)
    # Remove sensitive data
    public_user.pop("phone", None)
    return public_user

# ============== Ride Endpoints ==============

@app.post("/api/rides")
async def create_ride(ride: RideCreate, current_user: dict = Depends(get_current_user)):
    """Create a new ride offer"""
    ride_data = ride.dict()
    ride_data["driver_id"] = current_user["id"]
    ride_data["driver_name"] = current_user.get("name", "Unknown Driver")
    ride_data["driver_photo"] = current_user.get("photo")
    ride_data["driver_rating"] = current_user.get("rating", 0.0)
    ride_data["status"] = "active"
    ride_data["booked_seats"] = 0
    ride_data["created_at"] = datetime.utcnow()
    ride_data["updated_at"] = datetime.utcnow()
    
    result = await rides_collection.insert_one(ride_data)
    ride_doc = await rides_collection.find_one({"_id": result.inserted_id})
    
    return serialize_doc(ride_doc)

@app.get("/api/rides")
async def get_rides(
    status: Optional[str] = "active",
    current_user: dict = Depends(get_current_user)
):
    """Get all rides (optionally filtered by status)"""
    query = {}
    if status:
        query["status"] = status
    
    rides = await rides_collection.find(query).sort("created_at", -1).to_list(100)
    return serialize_docs(rides)

@app.get("/api/rides/my-rides")
async def get_my_rides(current_user: dict = Depends(get_current_user)):
    """Get rides offered by current user"""
    rides = await rides_collection.find(
        {"driver_id": current_user["id"]}
    ).sort("created_at", -1).to_list(100)
    return serialize_docs(rides)

@app.post("/api/rides/search")
async def search_rides(search: RideSearch, current_user: dict = Depends(get_current_user)):
    """Search for rides"""
    query = {"status": "active"}
    
    # Filter by date if provided
    if search.date:
        query["date"] = search.date
    
    # Filter by available seats
    if search.seats_needed:
        query["$expr"] = {
            "$gte": [
                {"$subtract": ["$available_seats", "$booked_seats"]},
                search.seats_needed
            ]
        }
    
    rides = await rides_collection.find(query).sort("created_at", -1).to_list(100)
    results = serialize_docs(rides)
    
    # If coordinates provided, calculate approximate distance and sort
    if search.pickup_lat and search.pickup_lng and search.drop_lat and search.drop_lng:
        for ride in results:
            # Simple distance calculation (not accurate for large distances)
            pickup_dist = abs(ride["pickup_lat"] - search.pickup_lat) + abs(ride["pickup_lng"] - search.pickup_lng)
            drop_dist = abs(ride["drop_lat"] - search.drop_lat) + abs(ride["drop_lng"] - search.drop_lng)
            ride["relevance_score"] = pickup_dist + drop_dist
        
        results.sort(key=lambda x: x.get("relevance_score", 999))
    
    return results

@app.get("/api/rides/{ride_id}")
async def get_ride(ride_id: str, current_user: dict = Depends(get_current_user)):
    """Get ride details"""
    ride = await rides_collection.find_one({"_id": ObjectId(ride_id)})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    return serialize_doc(ride)

@app.put("/api/rides/{ride_id}")
async def update_ride(ride_id: str, update: RideUpdate, current_user: dict = Depends(get_current_user)):
    """Update ride (only by driver)"""
    ride = await rides_collection.find_one({"_id": ObjectId(ride_id)})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    if ride["driver_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await rides_collection.update_one(
        {"_id": ObjectId(ride_id)},
        {"$set": update_data}
    )
    
    ride = await rides_collection.find_one({"_id": ObjectId(ride_id)})
    return serialize_doc(ride)

@app.delete("/api/rides/{ride_id}")
async def cancel_ride(ride_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel/delete a ride (only by driver)"""
    ride = await rides_collection.find_one({"_id": ObjectId(ride_id)})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    if ride["driver_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update status to cancelled instead of deleting
    await rides_collection.update_one(
        {"_id": ObjectId(ride_id)},
        {"$set": {"status": "cancelled", "updated_at": datetime.utcnow()}}
    )
    
    # Cancel all pending bookings for this ride
    await bookings_collection.update_many(
        {"ride_id": ride_id, "status": "pending"},
        {"$set": {"status": "cancelled", "updated_at": datetime.utcnow()}}
    )
    
    return {"success": True, "message": "Ride cancelled"}

# ============== Booking Endpoints ==============

@app.post("/api/bookings")
async def create_booking(booking: BookingCreate, current_user: dict = Depends(get_current_user)):
    """Create a booking request"""
    ride = await rides_collection.find_one({"_id": ObjectId(booking.ride_id)})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    if ride["driver_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot book your own ride")
    
    if ride["status"] != "active":
        raise HTTPException(status_code=400, detail="Ride is not active")
    
    available = ride["available_seats"] - ride["booked_seats"]
    if booking.seats > available:
        raise HTTPException(status_code=400, detail=f"Only {available} seats available")
    
    # Check for existing pending booking
    existing = await bookings_collection.find_one({
        "ride_id": booking.ride_id,
        "passenger_id": current_user["id"],
        "status": {"$in": ["pending", "accepted"]}
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already have a booking for this ride")
    
    booking_data = {
        "ride_id": booking.ride_id,
        "passenger_id": current_user["id"],
        "passenger_name": current_user.get("name", "Unknown"),
        "passenger_photo": current_user.get("photo"),
        "driver_id": ride["driver_id"],
        "seats": booking.seats,
        "message": booking.message,
        "total_price": booking.seats * ride["price_per_seat"],
        "status": "pending",
        "pickup_location": ride["pickup_location"],
        "drop_location": ride["drop_location"],
        "date": ride["date"],
        "time": ride["time"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await bookings_collection.insert_one(booking_data)
    booking_doc = await bookings_collection.find_one({"_id": result.inserted_id})
    
    return serialize_doc(booking_doc)

@app.get("/api/bookings")
async def get_my_bookings(current_user: dict = Depends(get_current_user)):
    """Get all bookings for current user (as passenger)"""
    bookings = await bookings_collection.find(
        {"passenger_id": current_user["id"]}
    ).sort("created_at", -1).to_list(100)
    return serialize_docs(bookings)

@app.get("/api/bookings/requests")
async def get_booking_requests(current_user: dict = Depends(get_current_user)):
    """Get booking requests for driver's rides"""
    bookings = await bookings_collection.find(
        {"driver_id": current_user["id"]}
    ).sort("created_at", -1).to_list(100)
    return serialize_docs(bookings)

@app.put("/api/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    update: BookingStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update booking status"""
    booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Only driver can accept/reject, only passenger can cancel
    is_driver = booking["driver_id"] == current_user["id"]
    is_passenger = booking["passenger_id"] == current_user["id"]
    
    if not (is_driver or is_passenger):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    valid_transitions = {
        "pending": ["accepted", "rejected", "cancelled"],
        "accepted": ["cancelled", "completed"],
    }
    
    current_status = booking["status"]
    new_status = update.status
    
    if current_status not in valid_transitions:
        raise HTTPException(status_code=400, detail="Cannot update this booking")
    
    if new_status not in valid_transitions.get(current_status, []):
        raise HTTPException(status_code=400, detail=f"Invalid status transition from {current_status} to {new_status}")
    
    # Drivers can accept/reject, passengers can cancel
    if new_status in ["accepted", "rejected"] and not is_driver:
        raise HTTPException(status_code=403, detail="Only driver can accept/reject")
    
    if new_status == "cancelled" and not is_passenger and not is_driver:
        raise HTTPException(status_code=403, detail="Not authorized to cancel")
    
    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"status": new_status, "updated_at": datetime.utcnow()}}
    )
    
    # Update ride booked seats if accepted
    if new_status == "accepted":
        await rides_collection.update_one(
            {"_id": ObjectId(booking["ride_id"])},
            {"$inc": {"booked_seats": booking["seats"]}}
        )
    
    # Release seats if cancelled after acceptance
    if new_status == "cancelled" and current_status == "accepted":
        await rides_collection.update_one(
            {"_id": ObjectId(booking["ride_id"])},
            {"$inc": {"booked_seats": -booking["seats"]}}
        )
    
    booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    return serialize_doc(booking)

# ============== Private Request Endpoints ==============

@app.post("/api/private-requests")
async def create_private_request(
    request: PrivateRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a private ride request"""
    request_data = request.dict()
    request_data["passenger_id"] = current_user["id"]
    request_data["passenger_name"] = current_user.get("name", "Unknown")
    request_data["passenger_photo"] = current_user.get("photo")
    request_data["status"] = "active"
    request_data["expires_at"] = datetime.utcnow() + timedelta(hours=24)
    request_data["created_at"] = datetime.utcnow()
    request_data["updated_at"] = datetime.utcnow()
    
    result = await private_requests_collection.insert_one(request_data)
    doc = await private_requests_collection.find_one({"_id": result.inserted_id})
    
    return serialize_doc(doc)

@app.get("/api/private-requests")
async def get_my_private_requests(current_user: dict = Depends(get_current_user)):
    """Get private requests created by current user"""
    requests = await private_requests_collection.find(
        {"passenger_id": current_user["id"]}
    ).sort("created_at", -1).to_list(100)
    return serialize_docs(requests)

@app.get("/api/private-requests/nearby")
async def get_nearby_private_requests(current_user: dict = Depends(get_current_user)):
    """Get active private requests for drivers"""
    # Get all active, non-expired requests (excluding user's own)
    requests = await private_requests_collection.find({
        "status": "active",
        "expires_at": {"$gt": datetime.utcnow()},
        "passenger_id": {"$ne": current_user["id"]}
    }).sort("created_at", -1).to_list(100)
    
    return serialize_docs(requests)

@app.post("/api/private-requests/{request_id}/respond")
async def respond_to_private_request(
    request_id: str,
    response: PrivateRequestResponse,
    current_user: dict = Depends(get_current_user)
):
    """Driver responds to a private request"""
    request = await private_requests_collection.find_one({"_id": ObjectId(request_id)})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request["passenger_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot respond to your own request")
    
    # Create a ride offer based on the request
    ride_data = {
        "driver_id": current_user["id"],
        "driver_name": current_user.get("name", "Unknown Driver"),
        "driver_photo": current_user.get("photo"),
        "driver_rating": current_user.get("rating", 0.0),
        "pickup_location": request["from_location"],
        "pickup_lat": request["from_lat"],
        "pickup_lng": request["from_lng"],
        "drop_location": request["to_location"],
        "drop_lat": request["to_lat"],
        "drop_lng": request["to_lng"],
        "date": request["preferred_date"],
        "time": request["preferred_time"],
        "available_seats": request["seats_needed"],
        "price_per_seat": 0,  # Driver sets this
        "status": "active",
        "booked_seats": 0,
        "from_private_request": request_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await rides_collection.insert_one(ride_data)
    ride_doc = await rides_collection.find_one({"_id": result.inserted_id})
    
    # Update request status
    await private_requests_collection.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {
            "status": "responded",
            "responded_by": current_user["id"],
            "ride_offer_id": str(result.inserted_id),
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {
        "success": True,
        "message": "Response sent to passenger",
        "ride": serialize_doc(ride_doc)
    }

@app.delete("/api/private-requests/{request_id}")
async def cancel_private_request(request_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel a private request"""
    request = await private_requests_collection.find_one({"_id": ObjectId(request_id)})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request["passenger_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await private_requests_collection.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "cancelled", "updated_at": datetime.utcnow()}}
    )
    
    return {"success": True, "message": "Request cancelled"}

# ============== Chat Endpoints ==============

@app.post("/api/chats/message")
async def send_message(message: ChatMessage, current_user: dict = Depends(get_current_user)):
    """Send a chat message"""
    # Verify booking or request exists and user is authorized
    receiver_id = None
    
    if message.booking_id:
        booking = await bookings_collection.find_one({"_id": ObjectId(message.booking_id)})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        if booking["status"] not in ["pending", "accepted"]:
            raise HTTPException(status_code=400, detail="Cannot chat on this booking")
        
        # Determine receiver
        if current_user["id"] == booking["driver_id"]:
            receiver_id = booking["passenger_id"]
        elif current_user["id"] == booking["passenger_id"]:
            receiver_id = booking["driver_id"]
        else:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    elif message.request_id:
        request = await private_requests_collection.find_one({"_id": ObjectId(message.request_id)})
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        if request["status"] not in ["active", "responded"]:
            raise HTTPException(status_code=400, detail="Cannot chat on this request")
        
        # Determine receiver
        if current_user["id"] == request["passenger_id"]:
            receiver_id = request.get("responded_by")
        elif current_user["id"] == request.get("responded_by"):
            receiver_id = request["passenger_id"]
        
        if not receiver_id:
            raise HTTPException(status_code=400, detail="No chat partner available")
    else:
        raise HTTPException(status_code=400, detail="Must provide booking_id or request_id")
    
    chat_message = {
        "booking_id": message.booking_id,
        "request_id": message.request_id,
        "sender_id": current_user["id"],
        "sender_name": current_user.get("name", "Unknown"),
        "receiver_id": receiver_id,
        "content": message.content,
        "read": False,
        "created_at": datetime.utcnow()
    }
    
    result = await chats_collection.insert_one(chat_message)
    doc = await chats_collection.find_one({"_id": result.inserted_id})
    
    return serialize_doc(doc)

@app.get("/api/chats/{context_type}/{context_id}")
async def get_chat_messages(
    context_type: str,
    context_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get chat messages for a booking or request"""
    if context_type == "booking":
        query = {"booking_id": context_id}
    elif context_type == "request":
        query = {"request_id": context_id}
    else:
        raise HTTPException(status_code=400, detail="Invalid context type")
    
    messages = await chats_collection.find(query).sort("created_at", 1).to_list(500)
    
    # Mark messages as read
    await chats_collection.update_many(
        {**query, "receiver_id": current_user["id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return serialize_docs(messages)

# ============== Review Endpoints ==============

@app.post("/api/reviews")
async def create_review(review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    """Create a review (only after completed ride)"""
    # Verify ride is completed
    ride = await rides_collection.find_one({"_id": ObjectId(review.ride_id)})
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    if ride["status"] != "completed":
        raise HTTPException(status_code=400, detail="Can only review completed rides")
    
    # Verify user was part of this ride
    booking = await bookings_collection.find_one({
        "ride_id": review.ride_id,
        "$or": [
            {"passenger_id": current_user["id"]},
            {"driver_id": current_user["id"]}
        ],
        "status": "completed"
    })
    
    is_driver = ride["driver_id"] == current_user["id"]
    
    if not booking and not is_driver:
        raise HTTPException(status_code=403, detail="You were not part of this ride")
    
    # Check if already reviewed
    existing = await reviews_collection.find_one({
        "ride_id": review.ride_id,
        "reviewer_id": current_user["id"],
        "reviewee_id": review.reviewee_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already reviewed this user for this ride")
    
    review_data = {
        "ride_id": review.ride_id,
        "reviewer_id": current_user["id"],
        "reviewer_name": current_user.get("name", "Unknown"),
        "reviewee_id": review.reviewee_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": datetime.utcnow()
    }
    
    result = await reviews_collection.insert_one(review_data)
    
    # Update reviewee's average rating
    all_reviews = await reviews_collection.find({"reviewee_id": review.reviewee_id}).to_list(1000)
    if all_reviews:
        avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
        await users_collection.update_one(
            {"_id": ObjectId(review.reviewee_id)},
            {"$set": {"rating": round(avg_rating, 1), "total_ratings": len(all_reviews)}}
        )
    
    doc = await reviews_collection.find_one({"_id": result.inserted_id})
    return serialize_doc(doc)

@app.get("/api/reviews/user/{user_id}")
async def get_user_reviews(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get reviews for a user"""
    reviews = await reviews_collection.find(
        {"reviewee_id": user_id}
    ).sort("created_at", -1).to_list(100)
    return serialize_docs(reviews)

# ============== Image Upload ==============

@app.post("/api/upload/image")
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload image and return base64"""
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode('utf-8')
    
    # Determine mime type
    content_type = file.content_type or "image/jpeg"
    
    return {
        "success": True,
        "image": f"data:{content_type};base64,{base64_image}"
    }

# ============== Startup ==============

@app.on_event("startup")
async def startup_event():
    """Create indexes on startup"""
    try:
        # Check connectivity
        await db.command("ping")
        
        # User indexes
        await users_collection.create_index("phone", unique=True)
        
        # Rides indexes
        await rides_collection.create_index("driver_id")
        await rides_collection.create_index("status")
        await rides_collection.create_index("date")
        
        # Bookings indexes
        await bookings_collection.create_index("ride_id")
        await bookings_collection.create_index("passenger_id")
        await bookings_collection.create_index("driver_id")
        
        # Private requests indexes
        await private_requests_collection.create_index("passenger_id")
        await private_requests_collection.create_index("status")
        
        # Chats indexes
        await chats_collection.create_index("booking_id")
        await chats_collection.create_index("request_id")
        
        # Reviews indexes
        await reviews_collection.create_index("reviewee_id")
        await reviews_collection.create_index("ride_id")
        
        print("INFO: RideShare API started successfully with MongoDB!")
    except Exception as e:
        print(f"FATAL: Could not connect to MongoDB: {str(e)}")
        # In production, we might want the app to fail if DB is down

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
