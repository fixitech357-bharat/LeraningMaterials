import { Router } from 'express';
import { QuizController } from '@/controllers/QuizController';
import { authMiddleware, requireRole } from '@/utils/auth';

const router = Router();

router.get('/:slug', QuizController.getBySlug);
router.post('/', authMiddleware, requireRole('instructor', 'admin'), QuizController.create);
router.post('/:quizId/questions', authMiddleware, QuizController.addQuestion);
router.post('/:id/submit', authMiddleware, QuizController.submit);
router.get('/me/attempts', authMiddleware, QuizController.getMyAttempts);
router.get('/:id/leaderboard', QuizController.getLeaderboard);

export default router;