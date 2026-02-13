import { Router } from 'express';
import { createRequest, getMyRequests, getNearbyRequests, respondToRequest } from '../controllers/requestController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createRequest);
router.get('/', authenticate, getMyRequests);
router.get('/nearby', authenticate, getNearbyRequests);
router.post('/:id/respond', authenticate, respondToRequest);

export default router;
