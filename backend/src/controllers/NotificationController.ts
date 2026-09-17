import { Request, Response } from 'express';
import { NotificationService } from '@/services/NotificationService';
import { AuthRequest } from '@/utils/auth';

export class NotificationController {
  static async list(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const unreadOnly = req.query.unreleased === 'true';
      const result = await NotificationService.getUserNotifications(req.user!._id, page, limit, unreadOnly);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
  }

  static async markRead(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await NotificationService.markAsRead(req.user!._id, id);
      res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to mark as read' });
    }
  }

  static async markAllRead(req: AuthRequest, res: Response) {
    try {
      await NotificationService.markAsRead(req.user!._id);
      res.json({ success: true, message: 'All marked as read' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to mark all as read' });
    }
  }
}