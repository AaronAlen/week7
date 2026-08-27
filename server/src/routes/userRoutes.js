import { Router } from 'express';
import { getUsers, createUser, getProfile } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authenticateToken);

router.get('/profile', getProfile);
router.get('/', authorizeRoles('ADMIN', 'MANAGER'), getUsers);
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), createUser);

export default router;
