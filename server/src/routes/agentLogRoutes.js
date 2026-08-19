import { Router } from 'express';
import { getAgentLogs } from '../controllers/agentLogController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.get('/', getAgentLogs);

export default router;
