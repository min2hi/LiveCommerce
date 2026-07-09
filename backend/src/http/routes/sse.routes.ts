import { Router } from 'express';
import type { SseController } from '../controllers/sse.controller';
import { authMiddleware, roleGuard } from '../middlewares/auth.middleware';

export function getSseRouter(sseController: SseController): Router {
  const router = Router();
  // Protected stream client connection accessible to authenticated STREAMERs and ADMINs
  router.get('/streamer', authMiddleware, roleGuard(['STREAMER', 'ADMIN']), sseController.connect);
  return router;
}
