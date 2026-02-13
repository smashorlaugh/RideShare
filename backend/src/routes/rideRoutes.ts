import { Router } from 'express';
import { createRide, getRides, getMyRides, searchRides, getRideById, updateRide, cancelRide } from '../controllers/rideController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createRide);
router.get('/', authenticate, getRides);
router.get('/my-rides', authenticate, getMyRides);
router.post('/search', authenticate, searchRides);
router.get('/:id', authenticate, getRideById);
router.put('/:id', authenticate, updateRide);
router.delete('/:id', authenticate, cancelRide);

export default router;
