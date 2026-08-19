import { Router } from 'express';
import {
  triggerRestock,
  getRestockRequests,
  getRestockById,
  retryRestock,
  receiveStockAction
} from '../controllers/restockController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getRestockRequests);
router.get('/:id', getRestockById);
router.post('/trigger', authorizeRoles('ADMIN', 'MANAGER'), triggerRestock);
router.post('/:id/retry', authorizeRoles('ADMIN', 'MANAGER'), retryRestock);
router.post('/:id/receive', authorizeRoles('ADMIN', 'MANAGER'), receiveStockAction);

export default router;
