import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis | null => {
  if (redisClient) return redisClient;
  try {
    redisClient = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      retryStrategy: (times: number) => {
        if (times > 10) return null;
        return Math.min(times * 100, 3000);
      },
    });
    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err: Error) => logger.error('Redis connection error', { error: err }));
    redisClient.on('close', () => logger.warn('Redis connection closed'));
    return redisClient;
  } catch (error) {
    logger.error('Redis initialization failed', { error });
    return null;
  }
};

export const cacheGet = async (key: string): Promise<string | null> => {
  const client = getRedisClient();
  if (!client) return null;
  try {
    return await client.get(key);
  } catch (error) {
    logger.error('Cache get failed', { key, error });
    return null;
  }
};

export const cacheSet = async (key: string, value: string, ttl: number = 3600): Promise<void> => {
  const client = getRedisClient();
  if (!client) return;
  try {
    await client.setex(key, ttl, value);
  } catch (error) {
    logger.error('Cache set failed', { key, error });
  }
};

export const cacheDel = async (...keys: string[]): Promise<void> => {
  const client = getRedisClient();
  if (!client) return;
  try {
    await client.del(...keys);
  } catch (error) {
    logger.error('Cache delete failed', { keys, error });
  }
};

export const cacheDelPattern = async (pattern: string): Promise<void> => {
  const client = getRedisClient();
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) await client.del(...keys);
  } catch (error) {
    logger.error('Cache delete pattern failed', { pattern, error });
  }
};

export const createRateLimiter = (_windowMs: number = env.rateLimit.windowMs, _max: number = env.rateLimit.max) => {
  return (_req: Request, _res: Response, next: NextFunction) => next();
};

export default getRedisClient;
