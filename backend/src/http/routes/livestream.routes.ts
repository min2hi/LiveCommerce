import { Router } from 'express';
import type { LivestreamController } from '../controllers/livestream.controller';
import { authMiddleware, roleGuard } from '../middlewares/auth.middleware';

export function getLivestreamRouter(livestreamController: LivestreamController): Router {
  const router = Router();

  // Public: Get list of active livestreams
  router.get('/active', livestreamController.getActiveStreams);

  // Protected: Start a livestream session (only STREAMER)
  router.post('/start', authMiddleware, roleGuard(['STREAMER']), livestreamController.startStream);

  // Protected: End a livestream session (only STREAMER or ADMIN)
  router.post(
    '/:id/end',
    authMiddleware,
    roleGuard(['STREAMER', 'ADMIN']),
    livestreamController.endStream,
  );

  // Protected: Update viewer count
  router.post(
    '/:id/viewers',
    authMiddleware,
    roleGuard(['STREAMER', 'ADMIN']),
    livestreamController.updateViewers,
  );

  return router;
}
