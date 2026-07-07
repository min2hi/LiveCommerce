import type { IOrderStore, IProductStore, IStockStore } from '../domain/interfaces';
import type { OrderPendingEvent } from '../domain/entities';
import { createLogger } from '../../shared/logger';

const logger = createLogger('OrderWorker');

export class OrderWorkerService {
  constructor(
    private readonly orderStore: IOrderStore,
    private readonly productStore: IProductStore,
    private readonly stockStore: IStockStore,
  ) {}

  async handleOrderPending(event: OrderPendingEvent): Promise<void> {
    logger.info(`[OrderWorker] Processing order: ${event.idempotencyKey}`, {
      traceId: event.traceId,
    });

    // 1. Check idempotency: Has this order already been processed?
    const existingOrder = await this.orderStore.findByIdempotencyKey(event.idempotencyKey);
    if (existingOrder) {
      logger.warn(`[OrderWorker] Duplicate order detected: ${event.idempotencyKey}. Skipping.`, {
        traceId: event.traceId,
      });
      return;
    }

    let orderId: string | undefined;

    try {
      // 2. Insert order with PENDING status
      const order = await this.orderStore.create(event);
      orderId = order.id;

      // 3. Update physical stock in PostgreSQL
      await this.productStore.updateStock(event.productId, -event.quantity);

      // 4. Confirm the order
      await this.orderStore.updateStatus(order.id, 'CONFIRMED');

      logger.info(`[OrderWorker] Order successfully confirmed: ${order.id}`, {
        traceId: event.traceId,
      });
    } catch (err) {
      logger.error(
        `[OrderWorker] Processing failed for order ${event.idempotencyKey}. Initializing Saga rollback...`,
        {
          error: err instanceof Error ? err.message : String(err),
          traceId: event.traceId,
        },
      );

      // Update Postgres order status to FAILED if it was created
      if (orderId) {
        try {
          await this.orderStore.updateStatus(orderId, 'FAILED');
        } catch (dbErr) {
          logger.error(`[OrderWorker] Failed to mark order ${orderId} as FAILED`, {
            error: dbErr instanceof Error ? dbErr.message : String(dbErr),
            traceId: event.traceId,
          });
        }
      }

      // 5. Saga Compensation: Rollback Redis reservation
      try {
        await this.stockStore.rollback(event.productId, event.userId);
        logger.info(
          `[OrderWorker] Redis stock rollback succeeded for product ${event.productId}, user ${event.userId}`,
          {
            traceId: event.traceId,
          },
        );
      } catch (redisErr) {
        logger.error(
          `[OrderWorker] CRITICAL: Redis rollback failed for product ${event.productId}, user ${event.userId}`,
          {
            error: redisErr instanceof Error ? redisErr.message : String(redisErr),
            traceId: event.traceId,
          },
        );
      }

      // Rethrow to trigger RabbitMQ DLQ
      throw err;
    }
  }
}
