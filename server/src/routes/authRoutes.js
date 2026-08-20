import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/authController.js';

const router = Router();

// Public user registration disabled for enterprise security (Admin user management used)
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
