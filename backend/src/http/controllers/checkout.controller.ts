import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type {
  IProductStore,
  IOrderStore,
  IStockStore,
  IIdempotencyStore,
  IOrderQueue,
} from '../../domain/interfaces';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import type { OrderPendingEvent } from '../../domain/entities';

export class CheckoutController {
  constructor(
    private readonly productStore: IProductStore,
    private readonly orderStore: IOrderStore,
    private readonly stockStore: IStockStore,
    private readonly idempotencyStore: IIdempotencyStore,
    private readonly orderQueue: IOrderQueue,
  ) {}

  checkout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: User context missing' });
      return;
    }

    const { productId, quantity } = req.body;
    const idempotencyKey = (req.headers['x-idempotency-key'] as string) || req.body.idempotencyKey;
    const traceId = (req.headers['x-trace-id'] as string) || uuidv4();

    if (!productId || !quantity || quantity <= 0) {
      res.status(400).json({ error: 'Invalid checkout request details' });
      return;
    }

    if (!idempotencyKey) {
      res
        .status(400)
        .json({ error: 'X-Idempotency-Key header or idempotencyKey body is required' });
      return;
    }

    const dbIdempotencyKey = `${userId}:${idempotencyKey}`;

    try {
      // 1. Check Idempotency Key in Redis
      const isNewRequest = await this.idempotencyStore.setIfAbsent(
        `idem:${dbIdempotencyKey}`,
        'PROCESSING',
        86400, // 24 Hours TTL
      );

      if (!isNewRequest) {
        // Query Postgres in case it was already fully confirmed
        const existingOrder = await this.orderStore.findByIdempotencyKey(dbIdempotencyKey);
        if (existingOrder) {
          res.status(200).json({
            message: 'Order already processed',
            order: existingOrder,
          });
          return;
        }

        res
          .status(409)
          .json({ error: 'Conflict: This checkout request is already being processed' });
        return;
      }

      // 2. Fetch product info from DB (need shopId and price)
      const product = await this.productStore.findById(productId);
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      // 3. Atomically check stock and reserve on Redis
      const checkoutStatus = await this.stockStore.atomicCheckout(productId, userId, quantity);

      if (checkoutStatus === 'out_of_stock') {
        res.status(409).json({ error: 'Product is out of stock' });
        return;
      }

      if (checkoutStatus === 'already_purchased') {
        res.status(400).json({ error: 'Limit exceeded: You have already purchased this product' });
        return;
      }

      // 4. Construct Order Pending Event
      const totalPrice = product.price * quantity;
      const event: OrderPendingEvent = {
        userId,
        productId,
        shopId: product.shopId,
        quantity,
        totalPrice,
        idempotencyKey: dbIdempotencyKey,
        traceId,
      };

      // 5. Publish to RabbitMQ Queue
      const published = await this.orderQueue.publish(event);
      if (!published) {
        // Rollback Redis reservation if queue fails
        await this.stockStore.rollback(productId, userId, quantity);
        res.status(500).json({ error: 'Failed to queue order' });
        return;
      }

      res.status(202).json({
        message: 'Checkout request accepted',
        idempotencyKey,
        traceId,
      });
    } catch (err) {
      console.error('[CheckoutController] Checkout processing failed:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
