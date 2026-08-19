import { Router } from 'express';
import { sellInventory, adjustInventory, getTransactions } from '../controllers/inventoryController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authenticateToken);

router.post('/sell', authorizeRoles('ADMIN', 'MANAGER', 'STAFF'), sellInventory);
router.post('/adjust', authorizeRoles('ADMIN', 'MANAGER'), adjustInventory);
router.get('/transactions', getTransactions);

export default router;
