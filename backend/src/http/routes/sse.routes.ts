import { Router } from 'express';
import type { SseController } from '../controllers/sse.controller';
import { authMiddleware, roleGuard } from '../middlewares/auth.middleware';

export function getSseRouter(sseController: SseController): Router {
  const router = Router();
  // Protected stream client connection accessible to authenticated STREAMERs and ADMINs
  router.get('/streamer', authMiddleware, roleGuard(['STREAMER', 'ADMIN']), sseController.connect);
  // Public buyer SSE — no auth required. Buyers receive stock_updated events.
  router.get('/buyer/:shopId', sseController.connectBuyer);
  return router;
}
