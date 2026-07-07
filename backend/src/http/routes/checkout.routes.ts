import { Router } from 'express';
import type { CheckoutController } from '../controllers/checkout.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkoutRateLimit } from '../middlewares/rate-limiter.middleware';

export function getCheckoutRouter(checkoutController: CheckoutController): Router {
  const router = Router();
  // Protect with auth check and Redis sliding window rate limiting
  router.post('/', authMiddleware, checkoutRateLimit, checkoutController.checkout);
  return router;
}
