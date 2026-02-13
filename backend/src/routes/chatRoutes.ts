import { Router } from 'express';
import { sendMessage, getMessages } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/message', authenticate, sendMessage);
router.get('/:type/:id', authenticate, getMessages);

export default router;
