import { Router } from 'express';
import { MetricsController } from '../controllers/metrics.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export function getMetricsRouter(controller: MetricsController): Router {
  const router = Router();

  // Protect all metrics routes
  router.use(authMiddleware);

  router.get('/admin', controller.getAdminMetrics);
  router.get('/streamer', controller.getStreamerMetrics);
  router.get('/users', controller.getUsers);

  return router;
}
