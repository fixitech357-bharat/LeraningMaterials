import { Router } from 'express';
import { AuthController } from '@/controllers/AuthController';
import { authMiddleware, requireRole } from '@/utils/auth';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', authMiddleware, AuthController.getMe);

export default router;