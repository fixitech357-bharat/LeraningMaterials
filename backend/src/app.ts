import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '@/config/env';
import { connectDB } from '@/config/database';
import { logger } from '@/utils/logger';
import { createRateLimiter } from '@/utils/redis';
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/user';
import tutorialRoutes from '@/routes/tutorial';
import courseRoutes from '@/routes/course';
import quizRoutes from '@/routes/quiz';
import problemRoutes from '@/routes/problem';
import paymentRoutes from '@/routes/payment';
import notificationRoutes from '@/routes/notification';
import adminRoutes from '@/routes/admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.middleware();
    this.routes();
    this.errorHandler();
  }

  private middleware() {
    this.app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }));

    this.app.use(cors({
      origin: [env.frontendUrl, env.adminUrl],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    }));

    this.app.use(morgan('combined', {
      stream: { write: (message: string) => logger.info(message.trim()) },
    }));

    this.app.use(compression());
    this.app.use(cookieParser());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    const limiter = createRateLimiter(env.rateLimit.windowMs, env.rateLimit.max);
    this.app.use('/api/', limiter);

    this.app.use(mongoSanitize());

    this.app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
  }

  private routes() {
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    const apiRouter = express.Router();
    apiRouter.use('/auth', authRoutes);
    apiRouter.use('/users', userRoutes);
    apiRouter.use('/tutorials', tutorialRoutes);
    apiRouter.use('/courses', courseRoutes);
    apiRouter.use('/quizzes', quizRoutes);
    apiRouter.use('/problems', problemRoutes);
    apiRouter.use('/payments', paymentRoutes);
    apiRouter.use('/notifications', notificationRoutes);
    apiRouter.use('/admin', adminRoutes);

    this.app.use('/api/v1', apiRouter);

    this.app.use('**', (_req: Request, res: Response) => {
      res.status(404).json({ success: false, message: 'Route not found' });
    });
  }

  private errorHandler() {
    this.app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
      logger.error('Unhandled error', { error });
      res.status(500).json({ success: false, message: 'Internal server error' });
    });
  }

  public async start(port: number = env.port): Promise<void> {
    try {
      await connectDB();
      this.app.listen(port, () => {
        logger.info(`Server running on port ${port} in ${env.node} mode`);
      });
    } catch (error) {
      logger.error('Failed to start server', { error });
      process.exit(1);
    }
  }
}
