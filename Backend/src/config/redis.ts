import IORedis from 'ioredis';
import { requireEnv } from '../utils/env';

export const redis = new IORedis(requireEnv('REDIS_URL'), {
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
