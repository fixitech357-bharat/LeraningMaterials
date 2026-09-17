import { Request, Response } from 'express';
import { TutorialService } from '@/services/TutorialService';
import { AuthRequest } from '@/utils/auth';

export class TutorialController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const tutorial = await TutorialService.createTutorial(req.user!._id, req.body);
      res.status(201).json({ success: true, data: tutorial });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const tutorial = await TutorialService.updateTutorial(req.params.id, req.body, req.user!._id, req.user!.role);
      res.json({ success: true, data: tutorial });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const filters = {
        category: req.query.category,
        author: req.query.author,
        difficulty: req.query.difficulty,
        language: req.query.language,
        isPremium: req.query.isPremium,
        search: req.query.search,
        sort: req.query.sort,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };
      const skip = (filters.page - 1) * filters.limit;
      const result = await TutorialService.getTutorials(filters, filters.page, filters.limit);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch tutorials' });
    }
  }

  static async getBySlug(req: Request, res: Response) {
    try {
      const tutorial = await TutorialService.getTutorialBySlug(req.params.slug);
      if (!tutorial) {
        res.status(404).json({ success: false, message: 'Tutorial not found' });
        return;
      }
      res.json({ success: true, data: tutorial });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch tutorial' });
    }
  }

  static async like(req: AuthRequest, res: Response) {
    try {
      const result = await TutorialService.likeTutorial(req.user!._id, req.params.id);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async addComment(req: AuthRequest, res: Response) {
    try {
      const { content, parentId } = req.body;
      const comment = await TutorialService.addComment(req.params.id, req.user!._id, content, parentId);
      res.status(201).json({ success: true, data: comment });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getComments(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await TutorialService.getComments(req.params.id, page, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch comments' });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      await TutorialService.deleteTutorial(req.params.id);
      res.json({ success: true, message: 'Tutorial deleted' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getRelated(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const related = await TutorialService.getRelated(req.params.id, limit);
      res.json({ success: true, data: related });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch related tutorials' });
    }
  }

  static async trending(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const trending = await TutorialService.getTrending(limit);
      res.json({ success: true, data: trending });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch trending' });
    }
  }
}