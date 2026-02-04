#!/usr/bin/env python3
"""
RideShare Backend API Testing Suite
Tests all backend APIs for the carpooling application
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class RideShareAPITester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api"
        self.driver_token = None
        self.passenger_token = None
        self.driver_user = None
        self.passenger_user = None
        self.test_ride = None
        self.test_booking = None
        self.test_private_request = None
        
        # Test data
        self.driver_phone = "+1234567890"
        self.passenger_phone = "+1987654321"
        
        print(f"🚀 Initializing RideShare API Tester")
        print(f"📍 Base URL: {self.base_url}")
        print(f"🔗 API URL: {self.api_url}")
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None) -> Dict[str, Any]:
        """Make HTTP request with proper error handling"""
        url = f"{self.api_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            print(f"📡 {method.upper()} {endpoint} -> {response.status_code}")
            
            if response.status_code >= 400:
                print(f"❌ Error Response: {response.text}")
            
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "success": 200 <= response.status_code < 300
            }
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {str(e)}")
            return {
                "status_code": 0,
                "data": {"error": str(e)},
                "success": False
            }
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {str(e)}")
            return {
                "status_code": response.status_code if 'response' in locals() else 0,
                "data": {"error": "Invalid JSON response"},
                "success": False
            }
    
    def test_health_check(self) -> bool:
        """Test health check endpoint"""
        print("\n🏥 Testing Health Check...")
        result = self.make_request("GET", "/health")
        
        if result["success"] and result["data"].get("status") == "healthy":
            print("✅ Health check passed")
            return True
        else:
            print("❌ Health check failed")
            return False
    
    def test_send_otp(self, phone: str) -> Optional[str]:
        """Test OTP sending"""
        print(f"\n📱 Testing Send OTP for {phone}...")
        data = {"phone": phone}
        result = self.make_request("POST", "/auth/send-otp", data)
        
        if result["success"]:
            otp = result["data"].get("debug_otp")
            print(f"✅ OTP sent successfully. Debug OTP: {otp}")
            return otp
        else:
            print("❌ Failed to send OTP")
            return None
    
    def test_verify_otp(self, phone: str, otp: str) -> Optional[Dict]:
        """Test OTP verification"""
        print(f"\n🔐 Testing Verify OTP for {phone}...")
        data = {"phone": phone, "otp": otp}
        result = self.make_request("POST", "/auth/verify-otp", data)
        
        if result["success"]:
            token = result["data"].get("token")
            user = result["data"].get("user")
            print(f"✅ OTP verified successfully. User ID: {user.get('id')}")
            return {"token": token, "user": user}
        else:
            print("❌ Failed to verify OTP")
            return None
    
    def test_authentication_flow(self) -> bool:
        """Test complete authentication flow for both users"""
        print("\n🔑 Testing Authentication Flow...")
        
        # Test driver authentication
        driver_otp = self.test_send_otp(self.driver_phone)
        if not driver_otp:
            return False
        
        driver_auth = self.test_verify_otp(self.driver_phone, driver_otp)
        if not driver_auth:
            return False
        
        self.driver_token = driver_auth["token"]
        self.driver_user = driver_auth["user"]
        
        # Test passenger authentication
        passenger_otp = self.test_send_otp(self.passenger_phone)
        if not passenger_otp:
            return False
        
        passenger_auth = self.test_verify_otp(self.passenger_phone, passenger_otp)
        if not passenger_auth:
            return False
        
        self.passenger_token = passenger_auth["token"]
        self.passenger_user = passenger_auth["user"]
        
        print("✅ Authentication flow completed for both users")
        return True
    
    def test_user_profile(self) -> bool:
        """Test user profile operations"""
        print("\n👤 Testing User Profile Operations...")
        
        # Test get profile
        result = self.make_request("GET", "/users/profile", token=self.driver_token)
        if not result["success"]:
            print("❌ Failed to get user profile")
            return False
        
        # Test update profile
        update_data = {
            "name": "John Driver",
            "car_model": "Toyota Camry",
            "car_number": "ABC123"
        }
        result = self.make_request("PUT", "/users/profile", update_data, token=self.driver_token)
        if not result["success"]:
            print("❌ Failed to update user profile")
            return False
        
        # Update passenger profile too
        passenger_update = {"name": "Jane Passenger"}
        result = self.make_request("PUT", "/users/profile", passenger_update, token=self.passenger_token)
        if not result["success"]:
            print("❌ Failed to update passenger profile")
            return False
        
        print("✅ User profile operations completed")
        return True
    
    def test_create_ride(self) -> bool:
        """Test ride creation"""
        print("\n🚗 Testing Ride Creation...")
        
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        ride_data = {
            "pickup_location": "Downtown Station",
            "pickup_lat": 40.7128,
            "pickup_lng": -74.0060,
            "drop_location": "Airport Terminal",
            "drop_lat": 40.6892,
            "drop_lng": -74.1745,
            "date": tomorrow,
            "time": "14:30",
            "available_seats": 3,
            "price_per_seat": 25.50,
            "car_model": "Toyota Camry",
            "car_number": "ABC123",
            "notes": "Non-smoking ride"
        }
        
        result = self.make_request("POST", "/rides", ride_data, token=self.driver_token)
        if result["success"]:
            self.test_ride = result["data"]
            print(f"✅ Ride created successfully. Ride ID: {self.test_ride.get('id')}")
            return True
        else:
            print("❌ Failed to create ride")
            return False
    
    def test_rides_operations(self) -> bool:
        """Test ride CRUD operations"""
        print("\n🚗 Testing Ride Operations...")
        
        # Create ride
        if not self.test_create_ride():
            return False
        
        # Get all rides
        result = self.make_request("GET", "/rides", token=self.passenger_token)
        if not result["success"]:
            print("❌ Failed to get rides")
            return False
        
        # Get my rides (driver)
        result = self.make_request("GET", "/rides/my-rides", token=self.driver_token)
        if not result["success"]:
            print("❌ Failed to get my rides")
            return False
        
        # Get specific ride
        ride_id = self.test_ride["id"]
        result = self.make_request("GET", f"/rides/{ride_id}", token=self.passenger_token)
        if not result["success"]:
            print("❌ Failed to get specific ride")
            return False
        
        # Update ride
        update_data = {"available_seats": 2, "price_per_seat": 30.0}
        result = self.make_request("PUT", f"/rides/{ride_id}", update_data, token=self.driver_token)
        if not result["success"]:
            print("❌ Failed to update ride")
            return False
        
        print("✅ Ride operations completed")
        return True
    
    def test_ride_search(self) -> bool:
        """Test ride search functionality"""
        print("\n🔍 Testing Ride Search...")
        
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        search_data = {
            "pickup_lat": 40.7128,
            "pickup_lng": -74.0060,
            "drop_lat": 40.6892,
            "drop_lng": -74.1745,
            "date": tomorrow,
            "seats_needed": 1
        }
        
        result = self.make_request("POST", "/rides/search", search_data, token=self.passenger_token)
        if result["success"]:
            rides = result["data"]
            print(f"✅ Search completed. Found {len(rides)} rides")
            return True
        else:
            print("❌ Failed to search rides")
            return False
    
    def test_booking_operations(self) -> bool:
        """Test booking CRUD operations"""
        print("\n📋 Testing Booking Operations...")
        
        if not self.test_ride:
            print("❌ No test ride available for booking")
            return False
        
        # Create booking
        booking_data = {
            "ride_id": self.test_ride["id"],
            "seats": 1,
            "message": "Looking forward to the ride!"
        }
        
        result = self.make_request("POST", "/bookings", booking_data, token=self.passenger_token)
        if not result["success"]:
            print("❌ Failed to create booking")
            return False
        
        self.test_booking = result["data"]
        print(f"✅ Booking created. Booking ID: {self.test_booking.get('id')}")
        
        # Get my bookings (passenger)
        result = self.make_request("GET", "/bookings", token=self.passenger_token)
        if not result["success"]:
            print("❌ Failed to get my bookings")
            return False
        
        # Get booking requests (driver)
        result = self.make_request("GET", "/bookings/requests", token=self.driver_token)
        if not result["success"]:
            print("❌ Failed to get booking requests")
            return False
        
        # Accept booking
        booking_id = self.test_booking["id"]
        status_data = {"status": "accepted"}
        result = self.make_request("PUT", f"/bookings/{booking_id}/status", status_data, token=self.driver_token)
        if not result["success"]:
            print("❌ Failed to accept booking")
            return False
        
        print("✅ Booking operations completed")
        return True
    
    def test_private_requests(self) -> bool:
        """Test private request operations"""
        print("\n🔒 Testing Private Request Operations...")
        
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        request_data = {
            "from_location": "City Center",
            "from_lat": 40.7589,
            "from_lng": -73.9851,
            "to_location": "Shopping Mall",
            "to_lat": 40.7505,
            "to_lng": -73.9934,
            "preferred_date": tomorrow,
            "preferred_time": "16:00",
            "seats_needed": 2,
            "message": "Need a ride to the mall"
        }
        
        # Create private request
        result = self.make_request("POST", "/private-requests", request_data, token=self.passenger_token)
        if not result["success"]:
            print("❌ Failed to create private request")
            return False
        
        self.test_private_request = result["data"]
        print(f"✅ Private request created. Request ID: {self.test_private_request.get('id')}")
        
        # Get my private requests
        result = self.make_request("GET", "/private-requests", token=self.passenger_token)
        if not result["success"]:
            print("❌ Failed to get my private requests")
            return False
        
        # Get nearby requests (driver)
        result = self.make_request("GET", "/private-requests/nearby", token=self.driver_token)
        if not result["success"]:
            print("❌ Failed to get nearby requests")
            return False
        
        # Respond to private request
        request_id = self.test_private_request["id"]
        response_data = {
            "request_id": request_id,
            "message": "I can help with this ride"
        }
        result = self.make_request("POST", f"/private-requests/{request_id}/respond", response_data, token=self.driver_token)
        if not result["success"]:
            print("❌ Failed to respond to private request")
            return False
        
        print("✅ Private request operations completed")
        return True
    
    def test_chat_operations(self) -> bool:
        """Test chat messaging"""
        print("\n💬 Testing Chat Operations...")
        
        if not self.test_booking:
            print("❌ No test booking available for chat")
            return False
        
        # Send message from passenger to driver
        message_data = {
            "content": "Hi! Looking forward to our ride tomorrow.",
            "booking_id": self.test_booking["id"]
        }
        
        result = self.make_request("POST", "/chats/message", message_data, token=self.passenger_token)
        if not result["success"]:
            print("❌ Failed to send message from passenger")
            return False
        
        # Send reply from driver
        reply_data = {
            "content": "Great! I'll pick you up on time.",
            "booking_id": self.test_booking["id"]
        }
        
        result = self.make_request("POST", "/chats/message", reply_data, token=self.driver_token)
        if not result["success"]:
            print("❌ Failed to send reply from driver")
            return False
        
        # Get chat messages
        booking_id = self.test_booking["id"]
        result = self.make_request("GET", f"/chats/booking/{booking_id}", token=self.passenger_token)
        if not result["success"]:
            print("❌ Failed to get chat messages")
            return False
        
        messages = result["data"]
        print(f"✅ Chat operations completed. {len(messages)} messages exchanged")
        return True
    
    def test_reviews_operations(self) -> bool:
        """Test review operations"""
        print("\n⭐ Testing Review Operations...")
        
        if not self.test_ride or not self.test_booking:
            print("❌ No completed ride available for review")
            return False
        
        # First, mark the ride as completed (simulate)
        ride_id = self.test_ride["id"]
        booking_id = self.test_booking["id"]
        
        # Update ride status to completed
        update_data = {"status": "completed"}
        result = self.make_request("PUT", f"/rides/{ride_id}", update_data, token=self.driver_token)
        if not result["success"]:
            print("❌ Failed to mark ride as completed")
            return False
        
        # Update booking status to completed
        status_data = {"status": "completed"}
        result = self.make_request("PUT", f"/bookings/{booking_id}/status", status_data, token=self.driver_token)
        if not result["success"]:
            print("❌ Failed to mark booking as completed")
            return False
        
        # Create review from passenger to driver
        review_data = {
            "ride_id": ride_id,
            "reviewee_id": self.driver_user["id"],
            "rating": 5,
            "comment": "Excellent driver! Very punctual and friendly."
        }
        
        result = self.make_request("POST", "/reviews", review_data, token=self.passenger_token)
        if not result["success"]:
            print("❌ Failed to create review")
            return False
        
        # Get user reviews
        driver_id = self.driver_user["id"]
        result = self.make_request("GET", f"/reviews/user/{driver_id}", token=self.passenger_token)
        if not result["success"]:
            print("❌ Failed to get user reviews")
            return False
        
        reviews = result["data"]
        print(f"✅ Review operations completed. {len(reviews)} reviews found")
        return True
    
    def test_user_deletion(self) -> bool:
        """Test user account deletion"""
        print("\n🗑️ Testing User Account Deletion...")
        
        # Create a temporary user for deletion test
        temp_phone = "+1555000999"
        temp_otp = self.test_send_otp(temp_phone)
        if not temp_otp:
            return False
        
        temp_auth = self.test_verify_otp(temp_phone, temp_otp)
        if not temp_auth:
            return False
        
        # Delete the temporary account
        result = self.make_request("DELETE", "/users/account", token=temp_auth["token"])
        if result["success"]:
            print("✅ User account deletion completed")
            return True
        else:
            print("❌ Failed to delete user account")
            return False
    
    def run_all_tests(self) -> Dict[str, bool]:
        """Run all API tests"""
        print("🧪 Starting RideShare Backend API Tests")
        print("=" * 50)
        
        results = {}
        
        # Test health check
        results["health_check"] = self.test_health_check()
        
        # Test authentication
        results["authentication"] = self.test_authentication_flow()
        if not results["authentication"]:
            print("❌ Authentication failed - stopping tests")
            return results
        
        # Test user profile
        results["user_profile"] = self.test_user_profile()
        
        # Test rides
        results["rides_crud"] = self.test_rides_operations()
        results["ride_search"] = self.test_ride_search()
        
        # Test bookings
        results["bookings"] = self.test_booking_operations()
        
        # Test private requests
        results["private_requests"] = self.test_private_requests()
        
        # Test chat
        results["chat"] = self.test_chat_operations()
        
        # Test reviews
        results["reviews"] = self.test_reviews_operations()
        
        # Test user deletion
        results["user_deletion"] = self.test_user_deletion()
        
        return results
    
    def print_summary(self, results: Dict[str, bool]):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("🧪 TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed!")
        else:
            print("⚠️ Some tests failed - check logs above")

def main():
    """Main test runner"""
    # Get backend URL from environment or use default
    import os
    backend_url = os.getenv("EXPO_PUBLIC_BACKEND_URL", "https://tripmate-92.preview.emergentagent.com")
    
    print(f"🌐 Using backend URL: {backend_url}")
    
    tester = RideShareAPITester(backend_url)
    results = tester.run_all_tests()
    tester.print_summary(results)
    
    return results

if __name__ == "__main__":
    main()