import { Router } from 'express';
import { getChatMessages, postChatMessage, queryInventoryAssistant } from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/messages', getChatMessages);
router.post('/messages', postChatMessage);
router.post('/query', queryInventoryAssistant);

export default router;
