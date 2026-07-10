import { Router } from 'express';
import type { ScheduledStreamController } from '../controllers/scheduled-stream.controller';
import { authMiddleware, roleGuard } from '../middlewares/auth.middleware';

export function getScheduledStreamRouter(controller: ScheduledStreamController): Router {
  const router = Router();

  // Public: Get all upcoming streams
  router.get('/upcoming', controller.getUpcomingStreams);

  // Protected: Create a scheduled stream (only STREAMER)
  router.post('/', authMiddleware, roleGuard(['STREAMER']), controller.createScheduledStream);

  // Protected: Add reminder
  router.post('/:streamId/remind', authMiddleware, controller.addReminder);

  // Protected: Remove reminder
  router.delete('/:streamId/remind', authMiddleware, controller.removeReminder);

  // Protected: Check reminder status
  router.get('/:streamId/remind/check', authMiddleware, controller.checkReminder);

  return router;
}
