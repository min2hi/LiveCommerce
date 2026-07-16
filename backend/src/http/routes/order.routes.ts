import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import type { OrderController } from '../controllers/order.controller';

export function getOrderRouter(orderController: OrderController): Router {
  const router = Router();
  router.get('/', authMiddleware, orderController.getOrders);
  return router;
}
