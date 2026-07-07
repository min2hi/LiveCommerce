import type { RedisClientType } from 'redis';
import type { IIdempotencyStore } from '../../domain/interfaces';

export class IdempotencyStore implements IIdempotencyStore {
  constructor(private readonly redis: RedisClientType) {}

  async setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.redis.set(key, value, {
      NX: true,
      EX: ttlSeconds,
    });
    return result === 'OK';
  }

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }
}
