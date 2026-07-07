/**
 * Sliding Window Log Rate Limiter (Redis-backed, Distributed)
 *
 * Algorithm: Stores timestamps of each request in a Redis Sorted Set.
 * On each request:
 *   1. Remove entries older than (now - windowMs)
 *   2. Count remaining entries
 *   3. If count >= limit → REJECT (429)
 *   4. Else → ADD current timestamp, allow request
 *
 * More accurate than Fixed Window — no burst spike at boundary.
 *
 * Usage:
 *   const limiter = new SlidingWindowRateLimiter(redisClient, 5, 1000);
 *   const allowed = await limiter.check('chat:ip:192.168.1.1');
 */

import { RedisClientType } from 'redis';

export class SlidingWindowRateLimiter {
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(
    private readonly redis: RedisClientType,
    limit: number, // max requests per window
    windowMs: number, // window size in milliseconds
  ) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  /**
   * @param key - Unique key per (endpoint, identifier). e.g. "chat:ip:1.2.3.4"
   * @returns true if request is ALLOWED, false if RATE LIMITED
   */
  async check(key: string): Promise<boolean> {
    const now = Date.now();
    const window = now - this.windowMs;

    // Atomic pipeline: remove old entries, count, add current
    const results = await this.redis
      .multi()
      .zRemRangeByScore(key, '-inf', String(window)) // remove expired
      .zCard(key) // count remaining
      .zAdd(key, { score: now, value: String(now) }) // add this request
      .expire(key, Math.ceil(this.windowMs / 1000) + 1) // TTL cleanup
      .exec();

    const currentCount = (results?.[1] as number) ?? 0;

    // currentCount is BEFORE adding the current request
    return currentCount < this.limit;
  }
}

// ── Convenience keys ──────────────────────────────────────────────────────

/** Rate limit key for Chat API (by IP) */
export const chatRateLimitKey = (ip: string): string => `rl:chat:${ip}`;

/** Rate limit key for Checkout API (by UserID) */
export const checkoutRateLimitKey = (userId: string): string => `rl:checkout:${userId}`;
