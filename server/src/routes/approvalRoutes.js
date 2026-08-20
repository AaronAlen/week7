import { Router } from 'express';
import { approveRestock, getApprovals, cancelApproval } from '../controllers/approvalController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authenticateToken);

router.post('/approve-restock', authorizeRoles('ADMIN', 'MANAGER'), approveRestock);
router.get('/approvals', authorizeRoles('ADMIN', 'MANAGER'), getApprovals);
router.delete('/approvals/:id', authorizeRoles('ADMIN', 'MANAGER'), cancelApproval);

export default router;
