import Redis from 'ioredis';
import { logger } from '@utils/logger';

/**
 * Redis Configuration
 * Configures Redis client for caching and session management
 */

const {
  REDIS_HOST = 'localhost',
  REDIS_PORT = '6379',
  REDIS_PASSWORD = '',
  REDIS_DB = '0',
} = process.env;

export const redis = new Redis({
  host: REDIS_HOST,
  port: parseInt(REDIS_PORT, 10),
  password: REDIS_PASSWORD || undefined,
  db: parseInt(REDIS_DB, 10),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('error', (error: Error) => {
  logger.error('Redis client error:', error);
});

redis.on('ready', () => {
  logger.info('Redis client ready');
});

/**
 * Connect to Redis
 */
export async function connectRedis(): Promise<void> {
  try {
    await redis.ping();
    logger.info('Redis connection established successfully');
  } catch (error) {
    logger.error('Unable to connect to Redis:', error);
    throw error;
  }
}

/**
 * Close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  try {
    await redis.quit();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
    throw error;
  }
}

export default redis;
