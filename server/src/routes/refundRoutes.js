import express from 'express';
import { processRefundWithAgent, getRefunds, decideRefund } from '../controllers/refundController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/process', processRefundWithAgent);
router.get('/', getRefunds);
router.post('/:id/decide', authorizeRoles('ADMIN', 'MANAGER'), decideRefund);

export default router;
