import { Router } from 'express';
import { createBooking, getMyBookings, getIncomingRequests, updateBookingStatus } from '../controllers/bookingController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createBooking);
router.get('/', authenticate, getMyBookings);
router.get('/requests', authenticate, getIncomingRequests);
router.put('/:id/status', authenticate, updateBookingStatus);

export default router;
