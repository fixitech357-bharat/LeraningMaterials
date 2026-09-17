import { Request, Response } from 'express';
import { QuizService } from '@/services/QuizService';
import { AuthRequest } from '@/utils/auth';

export class QuizController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const quiz = await QuizService.createQuiz(req.user!._id, req.body);
      res.status(201).json({ success: true, data: quiz });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async addQuestion(req: AuthRequest, res: Response) {
    try {
      const question = await QuizService.addQuestion(req.params.quizId, req.body);
      res.status(201).json({ success: true, data: question });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getBySlug(req: Request, res: Response) {
    try {
      const quiz = await QuizService.getQuizBySlug(req.params.slug);
      if (!quiz) {
        res.status(404).json({ success: false, message: 'Quiz not found' });
        return;
      }
      res.json({ success: true, data: quiz });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch quiz' });
    }
  }

  static async submit(req: AuthRequest, res: Response) {
    try {
      const { answers, timeTaken } = req.body;
      const attempt = await QuizService.submitQuiz(req.params.id, req.user!._id, answers, timeTaken);
      res.status(201).json({ success: true, data: attempt });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getMyAttempts(req: AuthRequest, res: Response) {
    try {
      const quizId = req.query.quizId as string;
      const attempts = await QuizService.getUserQuizAttempts(req.user!._id, quizId);
      res.json({ success: true, data: attempts });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch attempts' });
    }
  }

  static async getLeaderboard(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await QuizService.getQuizLeaderboard(req.params.id, limit);
      res.json({ success: true, data: leaderboard });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
    }
  }
}