import { redis } from '../config/redis';
import { redisKeys } from '../utils/redisKeys';

export interface RedisStats {
  connected_clients: number;
  used_memory_human: string;
  keys: { cart: number; search: number };
}

export const cartRepository = {
  async getAll(userId: string): Promise<Record<string, string>> {
    return redis.hgetall(redisKeys.cart(userId)) ?? {};
  },

  async getItem(userId: string, productId: string): Promise<string | null> {
    return redis.hget(redisKeys.cart(userId), productId);
  },

  async setItem(userId: string, productId: string, quantity: number): Promise<void> {
    await redis.hset(redisKeys.cart(userId), productId, quantity);
  },

  async removeItem(userId: string, productId: string): Promise<void> {
    await redis.hdel(redisKeys.cart(userId), productId);
  },

  async clear(userId: string): Promise<void> {
    await redis.del(redisKeys.cart(userId));
  },

  async getRedisStats(): Promise<RedisStats> {
    const [clientsInfo, memoryInfo] = await Promise.all([
      redis.info('clients'),
      redis.info('memory'),
    ]);

    const connected_clients = parseInt(
      (clientsInfo.match(/connected_clients:(\d+)/) ?? [])[1] ?? '0', 10
    );
    const used_memory_human = (memoryInfo.match(/used_memory_human:(\S+)/) ?? [])[1] ?? 'N/A';

    const cartKeys: string[]   = [];
    const searchKeys: string[] = [];
    let cursor = '0';
    do {
      const [next, found] = await redis.scan(cursor, 'MATCH', 'cart:*', 'COUNT', 100);
      cursor = next;
      cartKeys.push(...found);
    } while (cursor !== '0');
    cursor = '0';
    do {
      const [next, found] = await redis.scan(cursor, 'MATCH', 'search:*', 'COUNT', 100);
      cursor = next;
      searchKeys.push(...found);
    } while (cursor !== '0');

    return {
      connected_clients,
      used_memory_human,
      keys: { cart: cartKeys.length, search: searchKeys.length },
    };
  },
};
