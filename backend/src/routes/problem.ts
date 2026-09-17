import { Router } from 'express';
import { CodingProblemController } from '@/controllers/CodingProblemController';
import { authMiddleware, requireRole } from '@/utils/auth';

const router = Router();

router.get('/', CodingProblemController.list);
router.get('/:slug', CodingProblemController.getBySlug);
router.post('/', authMiddleware, requireRole('instructor', 'admin'), CodingProblemController.create);
router.post('/:id/submit', authMiddleware, CodingProblemController.submit);
router.get('/me/submissions', authMiddleware, CodingProblemController.getMySubmissions);

export default router;