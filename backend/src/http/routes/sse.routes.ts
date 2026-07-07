import { Router } from 'express';
import type { SseController } from '../controllers/sse.controller';
import { authMiddleware, roleGuard } from '../middlewares/auth.middleware';

export function getSseRouter(sseController: SseController): Router {
  const router = Router();
  // Protected stream client connection only accessible to authenticated STREAMERs
  router.get('/streamer', authMiddleware, roleGuard(['STREAMER']), sseController.connect);
  return router;
}
