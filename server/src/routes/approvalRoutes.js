import { Router } from 'express';
import { approveRestock, getApprovals } from '../controllers/approvalController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authenticateToken);

router.post('/approve-restock', authorizeRoles('ADMIN', 'MANAGER'), approveRestock);
router.get('/approvals', authorizeRoles('ADMIN', 'MANAGER'), getApprovals);

export default router;
