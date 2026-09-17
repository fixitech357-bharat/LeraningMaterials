import { Router } from 'express';
import { CourseController } from '@/controllers/CourseController';
import { authMiddleware, requireRole } from '@/utils/auth';

const router = Router();

router.get('/', CourseController.list);
router.get('/:slug', CourseController.getBySlug);
router.post('/', authMiddleware, requireRole('instructor', 'admin'), CourseController.create);
router.post('/:courseId/chapters', authMiddleware, CourseController.addChapter);
router.post('/:id/enroll', authMiddleware, CourseController.enroll);
router.put('/:id/progress', authMiddleware, CourseController.updateProgress);
router.post('/:id/review', authMiddleware, CourseController.addReview);
router.get('/enrolled/me', authMiddleware, CourseController.getEnrolled);

export default router;