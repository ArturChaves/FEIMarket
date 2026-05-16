import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const redis = new IORedis(process.env['REDIS_URL'] as string, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

export async function checkRedis(): Promise<string> {
  try {
    await redis.ping();
    return 'connected';
  } catch {
    return 'disconnected';
  }
}
