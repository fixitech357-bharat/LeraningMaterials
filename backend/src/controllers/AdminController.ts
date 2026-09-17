import { Request, Response } from 'express';
import { AdminService } from '@/services/AdminService';
import { UserService } from '@/services/UserService';

export class AdminController {
  static async getDashboard(req: Request, res: Response) {
    try {
      const stats = await AdminService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
    }
  }

  static async getUsers(req: Request, res: Response) {
    try {
      const filters = {
        search: req.query.search,
        role: req.query.role,
        status: req.query.status,
        sort: req.query.sort,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      };
      const result = await AdminService.getUsers(filters.page, filters.limit, filters);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const user = await AdminService.updateUser(req.params.id, req.body);
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getSettings(req: Request, res: Response) {
    try {
      const settings = await AdminService.getSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
  }

  static async updateSettings(req: Request, res: Response) {
    try {
      await AdminService.updateSettings(req.body);
      res.json({ success: true, message: 'Settings updated' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
  }

  static async getAnalytics(req: Request, res: Response) {
    try {
      const analytics = await AdminService.getAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
    }
  }
}