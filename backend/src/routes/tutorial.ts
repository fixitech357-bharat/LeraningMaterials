import { Router } from 'express';
import { TutorialController } from '@/controllers/TutorialController';
import { authMiddleware, requireRole, requirePermission } from '@/utils/auth';

const router = Router();

router.get('/', TutorialController.list);
router.get('/trending', TutorialController.trending);
router.get('/related/:id', TutorialController.getRelated);
router.get('/:slug', TutorialController.getBySlug);
router.post('/', authMiddleware, requireRole('instructor', 'admin', 'moderator'), TutorialController.create);
router.put('/:id', authMiddleware, TutorialController.update);
router.delete('/:id', authMiddleware, TutorialController.delete);
router.post('/:id/like', authMiddleware, TutorialController.like);
router.post('/:id/comment', authMiddleware, TutorialController.addComment);
router.get('/:id/comments', TutorialController.getComments);

export default router;