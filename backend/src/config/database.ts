import mongoose from 'mongoose';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

let isConnecting = false;
let connectionPromise: Promise<typeof mongoose> | null = null;

export const connectDB = async (): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (connectionPromise) return connectionPromise;

  isConnecting = true;
  connectionPromise = (async () => {
    try {
      await mongoose.connect(env.mongoUri, {
        maxPoolSize: 10,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
      });
      logger.info(`MongoDB connected: ${env.mongoUri}`);
    } catch (error) {
      logger.error('MongoDB connection failed', { error });
      process.exit(1);
    } finally {
      isConnecting = false;
      connectionPromise = null;
    }
    return mongoose;
  })();

  return connectionPromise;
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', { error: err });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});