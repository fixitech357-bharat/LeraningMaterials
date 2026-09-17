import { Router } from 'express';
import { AdminController } from '@/controllers/AdminController';
import { authMiddleware, requireRole } from '@/utils/auth';

const router = Router();

router.get('/dashboard', authMiddleware, requireRole('admin', 'moderator'), AdminController.getDashboard);
router.get('/users', authMiddleware, requireRole('admin'), AdminController.getUsers);
router.put('/users/:id', authMiddleware, requireRole('admin'), AdminController.updateUser);
router.get('/settings', authMiddleware, requireRole('admin'), AdminController.getSettings);
router.put('/settings', authMiddleware, requireRole('admin'), AdminController.updateSettings);
router.get('/analytics', authMiddleware, requireRole('admin'), AdminController.getAnalytics);

export default router;