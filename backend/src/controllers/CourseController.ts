import { Request, Response } from 'express';
import { CourseService } from '@/services/CourseService';
import { AuthRequest } from '@/utils/auth';

export class CourseController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const course = await CourseService.createCourse(req.user!._id, req.body);
      res.status(201).json({ success: true, data: course });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async addChapter(req: AuthRequest, res: Response) {
    try {
      const chapter = await CourseService.addChapter(req.params.courseId, req.body);
      res.status(201).json({ success: true, data: chapter });
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
        isPremium: req.query.isPremium,
        search: req.query.search,
        sort: req.query.sort,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };
      const result = await CourseService.getCourses(filters, filters.page, filters.limit);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch courses' });
    }
  }

  static async getBySlug(req: Request, res: Response) {
    try {
      const course = await CourseService.getCourseBySlug(req.params.slug);
      if (!course) {
        res.status(404).json({ success: false, message: 'Course not found' });
        return;
      }
      res.json({ success: true, data: course });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch course' });
    }
  }

  static async enroll(req: AuthRequest, res: Response) {
    try {
      const enrollment = await CourseService.enroll(req.params.id, req.user!._id);
      res.status(201).json({ success: true, data: enrollment });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateProgress(req: AuthRequest, res: Response) {
    try {
      const { chapterId, completed } = req.body;
      const enrollment = await CourseService.updateProgress(req.params.id, req.user!._id, chapterId, completed);
      res.json({ success: true, data: enrollment });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async addReview(req: AuthRequest, res: Response) {
    try {
      const { rating, comment, title } = req.body;
      const review = await CourseService.addReview(req.params.id, req.user!._id, rating, comment, title);
      res.status(201).json({ success: true, data: review });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getEnrolled(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await CourseService.getEnrolledCourses(req.user!._id, page, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch enrolled courses' });
    }
  }
}