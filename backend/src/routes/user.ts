import { Router } from 'express';
import { UserController } from '@/controllers/UserController';
import { authMiddleware } from '@/utils/auth';

const router = Router();

router.get('/profile', authMiddleware, UserController.getProfile);
router.put('/profile', authMiddleware, UserController.updateProfile);
router.get('/stats', authMiddleware, UserController.getStats);
router.get('/bookmarks', authMiddleware, UserController.getBookmarks);
router.post('/bookmarks', authMiddleware, UserController.addBookmark);
router.delete('/bookmarks/:tutorialId', authMiddleware, UserController.removeBookmark);
router.post('/follow', authMiddleware, UserController.follow);
router.post('/unfollow', authMiddleware, UserController.unfollow);
router.get('/leaderboard', UserController.getLeaderboard);

export default router;