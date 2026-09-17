import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-redis';
import Redis from 'ioredis';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

let redisClient: Redis.Redis | null = null;

export const getRedisClient = (): Redis.Redis | null => {
  if (redisClient) return redisClient;
  try {
    redisClient = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
    });
    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => logger.error('Redis connection error', { error: err }));
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

export const createRateLimiter = (windowMs: number = env.rateLimit.windowMs, max: number = env.rateLimit.max) => {
  const client = getRedisClient();
  if (!client) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }
  return new RateLimiterRedis({
    storeClient: client,
    keyPrefix: 'rl:',
    windowMs,
    max,
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
    },
  });
};

export default getRedisClient;