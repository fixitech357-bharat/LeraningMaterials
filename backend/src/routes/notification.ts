import { Router } from 'express';
import { NotificationController } from '@/controllers/NotificationController';
import { authMiddleware } from '@/utils/auth';

const router = Router();

router.get('/', authMiddleware, NotificationController.list);
router.patch('/:id/read', authMiddleware, NotificationController.markRead);
router.patch('/read-all', authMiddleware, NotificationController.markAllRead);

export default router;