import 'dotenv/config';
import { getRabbitMQChannel, closeRabbitMQConnection } from '../../src/infrastructure/queue';
import { getDbPool, closeDbPool } from '../../src/infrastructure/database';
import { getRedisClient, closeRedisClient } from '../../src/infrastructure/cache';
import { OrderStore } from '../../src/stores/postgres/order.store';
import { ProductStore } from '../../src/stores/postgres/product.store';
import { StockStore } from '../../src/stores/redis/stock.store';
import { OrderQueue } from '../../src/stores/rabbitmq/order.queue';
import { OrderWorkerService } from '../../src/services/order-worker.service';
import { createLogger } from '../../shared/logger';

const logger = createLogger('OrderWorkerApp');

async function startWorker(): Promise<void> {
  logger.info('[Worker] Starting Order Worker process...');

  // Initialize DB, Redis and RabbitMQ connections
  const dbPool = getDbPool();
  const redisClient = await getRedisClient();
  const channel = await getRabbitMQChannel();

  // Instantiate Stores
  const orderStore = new OrderStore(dbPool);
  const productStore = new ProductStore(dbPool);
  const stockStore = new StockStore(redisClient);
  const orderQueue = new OrderQueue(channel);

  // Instantiate Saga Worker Service
  const workerService = new OrderWorkerService(orderStore, productStore, stockStore);

  // Consume queue messages
  await orderQueue.consume(async (event) => {
    await workerService.handleOrderPending(event);
  });

  logger.info(`[Worker] Listening for order events on queue: order.queue`);
}

// Graceful Shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`[Worker] ${signal} received. Closing all connections...`);
  try {
    await closeRabbitMQConnection();
    await closeDbPool();
    await closeRedisClient();
    logger.info('[Worker] Shutdown complete.');
    process.exit(0);
  } catch (err) {
    logger.error('[Worker] Error during graceful shutdown:', {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

startWorker().catch((err) => {
  logger.error('[Worker] Fatal error starting worker:', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
