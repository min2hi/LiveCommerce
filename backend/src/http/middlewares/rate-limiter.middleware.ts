import type { Response, NextFunction } from 'express';
import {
  SlidingWindowRateLimiter,
  checkoutRateLimitKey,
  chatRateLimitKey,
} from '../../../shared/rate-limiter';
import { config } from '../../config';
import { getRedisClient } from '../../infrastructure/cache';
import type { AuthenticatedRequest } from './auth.middleware';

let checkoutLimiter: SlidingWindowRateLimiter;
let chatLimiter: SlidingWindowRateLimiter;

async function getLimiters(): Promise<{
  checkoutLimiter: SlidingWindowRateLimiter;
  chatLimiter: SlidingWindowRateLimiter;
}> {
  const redis = await getRedisClient();
  if (!checkoutLimiter) {
    checkoutLimiter = new SlidingWindowRateLimiter(
      redis,
      config.rateLimit.checkoutMax,
      config.rateLimit.windowMs,
    );
  }
  if (!chatLimiter) {
    chatLimiter = new SlidingWindowRateLimiter(
      redis,
      config.rateLimit.chatMax,
      config.rateLimit.windowMs,
    );
  }
  return { checkoutLimiter, chatLimiter };
}

export async function checkoutRateLimit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: User context required for rate limiting' });
    return;
  }

  try {
    const { checkoutLimiter } = await getLimiters();
    const key = checkoutRateLimitKey(userId);
    const allowed = await checkoutLimiter.check(key);

    if (!allowed) {
      res.status(429).json({ error: 'Too Many Requests: Please slow down your checkouts' });
      return;
    }
    next();
  } catch (err) {
    console.error('[RateLimiter] Error checking checkout rate limit:', err);
    res.status(500).json({ error: 'Internal Server Error: Rate limit verification failed' });
  }
}

export async function chatRateLimit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const { chatLimiter } = await getLimiters();
    const key = chatRateLimitKey(ip);
    const allowed = await chatLimiter.check(key);

    if (!allowed) {
      res.status(429).json({ error: 'Too Many Requests: Chat rate limit exceeded' });
      return;
    }
    next();
  } catch (err) {
    console.error('[RateLimiter] Error checking chat rate limit:', err);
    res.status(503).json({ error: 'Service Unavailable: Rate limit service down' });
  }
}
