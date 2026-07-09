import { Router } from 'express';
import type { ProductController } from '../controllers/product.controller';
import { authMiddleware, roleGuard } from '../middlewares/auth.middleware';

export function getProductRouter(productController: ProductController): Router {
  const router = Router();

  // Open list products route (accessible by buyer/admin/streamer)
  router.get('/', productController.list);

  // Protected streamer/admin endpoints
  router.get(
    '/shop-metrics',
    authMiddleware,
    roleGuard(['STREAMER']),
    productController.getMetrics,
  );
  router.post(
    '/:productId/stock',
    authMiddleware,
    roleGuard(['STREAMER']),
    productController.updateStock,
  );
  router.post(
    '/:productId/flash-sale',
    authMiddleware,
    roleGuard(['STREAMER']),
    productController.toggleFlashSale,
  );

  return router;
}
