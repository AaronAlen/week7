import express from 'express';
import { analyzeFraudWithAgent, getFraudAlerts, decideFraudAlert } from '../controllers/fraudController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/analyze', analyzeFraudWithAgent);
router.get('/', getFraudAlerts);
router.post('/:id/decide', authorizeRoles('ADMIN', 'MANAGER'), decideFraudAlert);

export default router;
