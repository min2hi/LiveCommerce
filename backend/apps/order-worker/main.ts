import 'dotenv/config';
import { initializeTracing } from '../../src/infrastructure/tracing';
initializeTracing('livecommerce-order-worker');

import { getRabbitMQChannel, closeRabbitMQConnection } from '../../src/infrastructure/queue';
import { getWriteDbPool, getReadDbPool, closeDbPool } from '../../src/infrastructure/database';
import { getRedisClient, closeRedisClient } from '../../src/infrastructure/cache';
import { OrderStore } from '../../src/stores/postgres/order.store';
import { ProductStore } from '../../src/stores/postgres/product.store';
import { StockStore } from '../../src/stores/redis/stock.store';
import { OrderQueue } from '../../src/stores/rabbitmq/order.queue';
import { KafkaOrderQueue } from '../../src/stores/kafka/order.queue';
import type { IOrderQueue } from '../../src/domain/interfaces';
import { OrderWorkerService } from '../../src/services/order-worker.service';
import { createLogger } from '../../shared/logger';

const logger = createLogger('OrderWorkerApp');

async function startWorker(): Promise<void> {
  logger.info('[Worker] Starting Order Worker process...');

  // Initialize DB, Redis and RabbitMQ connections
  const writeDbPool = getWriteDbPool();
  const readDbPool = getReadDbPool();
  const redisClient = await getRedisClient();
  
  let orderQueue: IOrderQueue;
  if (process.env.USE_KAFKA === 'true') {
    const kafkaQueue = new KafkaOrderQueue();
    await kafkaQueue.connectConsumer();
    orderQueue = kafkaQueue;
    logger.info(`[Worker] Using Kafka KRaft for event streaming`);
  } else {
    const channel = await getRabbitMQChannel();
    orderQueue = new OrderQueue(channel);
    logger.info(`[Worker] Using RabbitMQ for event streaming`);
  }

  // Instantiate Stores
  const orderStore = new OrderStore(writeDbPool, readDbPool);
  const productStore = new ProductStore(writeDbPool, readDbPool);
  const stockStore = new StockStore(redisClient);

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
    if (process.env.USE_KAFKA === 'true') {
      // Need a global ref for this ideally, but process exit handles it gracefully usually
    } else {
      await closeRabbitMQConnection();
    }
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
