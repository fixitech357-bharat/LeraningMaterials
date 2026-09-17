import { Request, Response } from 'express';
import { AuthRequest } from '@/utils/auth';
import { UserService } from '@/services/UserService';

export class UserController {
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await UserService.getUserById(req.user!._id, true);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const { firstName, lastName, displayName, bio, avatar, socialLinks, preferences } = req.body;
      const updateData: any = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (displayName) updateData.displayName = displayName;
      if (bio !== undefined) updateData.bio = bio;
      if (avatar) updateData.avatar = avatar;
      if (socialLinks) updateData.socialLinks = socialLinks;
      if (preferences) updateData.preferences = preferences;

      const user = await UserService.updateUser(req.user!._id, updateData);
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getStats(req: AuthRequest, res: Response) {
    try {
      const stats = await UserService.getUserStats(req.user!._id);
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
  }

  static async getBookmarks(req: AuthRequest, res: Response) {
    try {
      const user = await User.findById(req.user!._id).populate({
        path: 'bookmarks',
        populate: { path: 'author', select: 'displayName' },
      });
      res.json({ success: true, data: user?.bookmarks });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch bookmarks' });
    }
  }

  static async addBookmark(req: AuthRequest, res: Response) {
    try {
      const { tutorialId } = req.body;
      await UserService.addBookmark(req.user!._id, tutorialId);
      res.json({ success: true, message: 'Bookmark added' });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  }

  static async removeBookmark(req: AuthRequest, res: Response) {
    try {
      const { tutorialId } = req.params;
      await UserService.removeBookmark(req.user!._id, tutorialId);
      res.json({ success: true, message: 'Bookmark removed' });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  }

  static async follow(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.body;
      await UserService.followUser(req.user!._id, userId);
      res.json({ success: true, message: 'Followed' });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  }

  static async unfollow(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.body;
      await UserService.unfollowUser(req.user!._id, userId);
      res.json({ success: true, message: 'Unfollowed' });
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message });
    }
  }

  static async getLeaderboard(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await UserService.getLeaderboard(limit);
      res.json({ success: true, data: leaderboard });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
    }
  }
}

import { User } from '@/models/User';