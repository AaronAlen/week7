import express from 'express';
import { processRefundWithAgent, getRefunds, decideRefund, sendRefundCustomerEmail } from '../controllers/refundController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/process', processRefundWithAgent);
router.get('/', getRefunds);
router.post('/:id/decide', authorizeRoles('ADMIN', 'MANAGER'), decideRefund);
router.post('/:id/send-email', authorizeRoles('ADMIN', 'MANAGER'), sendRefundCustomerEmail);
router.post('/send-email', authorizeRoles('ADMIN', 'MANAGER'), sendRefundCustomerEmail);

export default router;
