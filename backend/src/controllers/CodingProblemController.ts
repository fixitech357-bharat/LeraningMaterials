import { Request, Response } from 'express';
import { CodingProblemService } from '@/services/CodingProblemService';
import { AuthRequest } from '@/utils/auth';

export class CodingProblemController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const problem = await CodingProblemService.createProblem(req.user!._id, req.body);
      res.status(201).json({ success: true, data: problem });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const filters = {
        difficulty: req.query.difficulty,
        category: req.query.category,
        tags: req.query.tags,
        search: req.query.search,
        sort: req.query.sort,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };
      const result = await CodingProblemService.getProblems(filters, filters.page, filters.limit);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch problems' });
    }
  }

  static async getBySlug(req: Request, res: Response) {
    try {
      const problem = await CodingProblemService.getProblemBySlug(req.params.slug);
      if (!problem) {
        res.status(404).json({ success: false, message: 'Problem not found' });
        return;
      }
      res.json({ success: true, data: problem });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch problem' });
    }
  }

  static async submit(req: AuthRequest, res: Response) {
    try {
      const { language, code } = req.body;
      const submission = await CodingProblemService.submitProblem(req.user!._id, req.params.id, language, code);
      res.status(201).json({ success: true, data: submission });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getMySubmissions(req: AuthRequest, res: Response) {
    try {
      const problemId = req.query.problemId as string;
      const submissions = await CodingProblemService.getUserSubmissions(req.user!._id, problemId);
      res.json({ success: true, data: submissions });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
    }
  }
}