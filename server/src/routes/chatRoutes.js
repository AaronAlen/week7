import { Router } from 'express';
import { getChatMessages, postChatMessage } from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/messages', getChatMessages);
router.post('/messages', postChatMessage);

export default router;
