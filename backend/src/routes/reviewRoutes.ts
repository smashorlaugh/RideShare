import { Router } from 'express';
import { createReview, getUserReviews } from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createReview);
router.get('/user/:userId', authenticate, getUserReviews);

export default router;
