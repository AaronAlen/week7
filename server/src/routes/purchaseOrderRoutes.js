import { Router } from 'express';
import { getPurchaseOrders, getPurchaseOrderById } from '../controllers/purchaseOrderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getPurchaseOrders);
router.get('/:id', getPurchaseOrderById);

export default router;
