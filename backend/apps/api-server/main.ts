import 'dotenv/config';
import express from 'express';
import { config } from '../../src/config';
import { getDbPool, closeDbPool } from '../../src/infrastructure/database';
import { getRedisClient, closeRedisClient } from '../../src/infrastructure/cache';
import { getRabbitMQChannel, closeRabbitMQConnection } from '../../src/infrastructure/queue';
import { UserStore } from '../../src/stores/postgres/user.store';
import { ProductStore } from '../../src/stores/postgres/product.store';
import { OrderStore } from '../../src/stores/postgres/order.store';
import { StockStore } from '../../src/stores/redis/stock.store';
import { IdempotencyStore } from '../../src/stores/redis/idempotency.store';
import { OrderQueue } from '../../src/stores/rabbitmq/order.queue';
import { AuthController } from '../../src/http/controllers/auth.controller';
import { CheckoutController } from '../../src/http/controllers/checkout.controller';
import { SseController } from '../../src/http/controllers/sse.controller';
import { getAuthRouter } from '../../src/http/routes/auth.routes';
import { getCheckoutRouter } from '../../src/http/routes/checkout.routes';
import { getSseRouter } from '../../src/http/routes/sse.routes';
import { broadcastShutdown } from '../../src/sse/sse-manager';
import { createLogger } from '../../shared/logger';

const logger = createLogger('ApiServer');
const app = express();
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

let server: any;

async function bootstrap() {
  logger.info('Initializing API Server dependencies...');

  // Connect to Infra singleton instances
  const dbPool = getDbPool();
  const redisClient = await getRedisClient();
  const rabbitChannel = await getRabbitMQChannel();

  // Instantiate Stores
  const userStore = new UserStore(dbPool);
  const productStore = new ProductStore(dbPool);
  const orderStore = new OrderStore(dbPool);
  const stockStore = new StockStore(redisClient);
  const idempotencyStore = new IdempotencyStore(redisClient);
  const orderQueue = new OrderQueue(rabbitChannel);

  // Instantiate Controllers
  const authController = new AuthController(userStore, dbPool);
  const checkoutController = new CheckoutController(
    productStore,
    orderStore,
    stockStore,
    idempotencyStore,
    orderQueue,
  );
  const sseController = new SseController();

  // Register Routes
  app.use('/api/auth', getAuthRouter(authController));
  app.use('/api/checkout', getCheckoutRouter(checkoutController));
  app.use('/api/sse', getSseRouter(sseController));

  server = app.listen(config.server.port, () => {
    logger.info(`[API] Server running on port ${config.server.port} (${config.server.nodeEnv})`);
  });
}

// Graceful Shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`[API] ${signal} received. Shutting down gracefully...`);

  // Broadcast shutdown message to all connected SSE clients (Streamers)
  broadcastShutdown();

  if (server) {
    server.close(async () => {
      logger.info('[API] HTTP server closed.');
      try {
        await closeRabbitMQConnection();
        await closeRedisClient();
        await closeDbPool();
        logger.info('[API] Shutdown complete.');
        process.exit(0);
      } catch (err) {
        logger.error('[API] Error during resource cleanup:', {
          error: err instanceof Error ? err.message : String(err),
        });
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }

  // Force shutdown if cleanup takes too long
  setTimeout(() => {
    logger.error('[API] Force shutdown triggered after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void gracefulShutdown('SIGINT');
});

bootstrap().catch((err) => {
  logger.error('[API] Fatal error during bootstrap:', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
