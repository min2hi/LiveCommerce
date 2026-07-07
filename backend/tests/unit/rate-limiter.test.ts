import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SlidingWindowRateLimiter,
  chatRateLimitKey,
  checkoutRateLimitKey,
} from '../../shared/rate-limiter';

describe('SlidingWindowRateLimiter', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      multi: vi.fn().mockReturnThis(),
      zRemRangeByScore: vi.fn().mockReturnThis(),
      zCard: vi.fn().mockReturnThis(),
      zAdd: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn(),
    };
  });

  it('allows request if under limit', async () => {
    // exec returns array of results: [zRemRangeCount, zCardCount, zAddCount, expireSuccess]
    mockRedis.exec.mockResolvedValue([0, 2, 1, 1]); // zCard returns 2, limit is 5

    const limiter = new SlidingWindowRateLimiter(mockRedis, 5, 1000);
    const result = await limiter.check('test-key');

    expect(result).toBe(true);
    expect(mockRedis.zRemRangeByScore).toHaveBeenCalledWith('test-key', '-inf', expect.any(String));
    expect(mockRedis.zCard).toHaveBeenCalledWith('test-key');
  });

  it('blocks request if over limit', async () => {
    mockRedis.exec.mockResolvedValue([0, 5, 1, 1]); // zCard returns 5, limit is 5

    const limiter = new SlidingWindowRateLimiter(mockRedis, 5, 1000);
    const result = await limiter.check('test-key');

    expect(result).toBe(false);
  });

  it('handles null/undefined redis execution results gracefully', async () => {
    mockRedis.exec.mockResolvedValue(null); // exec returns null on failed txn

    const limiter = new SlidingWindowRateLimiter(mockRedis, 5, 1000);
    const result = await limiter.check('test-key');

    expect(result).toBe(true); // defaults count to 0, which is under limit
  });

  describe('Convenience Keys', () => {
    it('should generate correct chat rate limit key', () => {
      expect(chatRateLimitKey('127.0.0.1')).toBe('rl:chat:127.0.0.1');
    });

    it('should generate correct checkout rate limit key', () => {
      expect(checkoutRateLimitKey('user-123')).toBe('rl:checkout:user-123');
    });
  });
});
