import { Server } from 'socket.io';
import { createServer } from 'http';
import { logger } from '@/utils/logger';
import { getRedisClient } from '@/utils/redis';

let io: Server | null = null;

export const initializeSocket = (httpServer: any): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.info('Socket connected', { socketId: socket.id });

    socket.on('join', (userId: string) => {
      socket.join(`user:${userId}`);
      logger.info('User joined room', { userId, socketId: socket.id });
    });

    socket.on('leave', (userId: string) => {
      socket.leave(`user:${userId}`);
    });

    socket.on('comment:new', (data: { tutorialId: string; comment: any }) => {
      socket.to(`tutorial:${data.tutorialId}`).emit('comment:added', data.comment);
    });

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { socketId: socket.id });
    });
  });

  return io;
};

export const getSocketIO = (): Server | null => io;

export const emitToUser = (userId: string, event: string, data: any) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

export const emitToTutorial = (tutorialId: string, event: string, data: any) => {
  if (!io) return;
  io.to(`tutorial:${tutorialId}`).emit(event, data);
};