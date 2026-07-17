import 'dotenv/config';
import { initializeTracing } from '../../src/infrastructure/tracing';
initializeTracing('livecommerce-api-server');

import http from 'http';
import path from 'path';
import express from 'express';
import { runner } from 'node-pg-migrate';
import { config } from '../../src/config';
import { getWriteDbPool, getReadDbPool, closeDbPool } from '../../src/infrastructure/database';
import { getRedisClient, closeRedisClient } from '../../src/infrastructure/cache';
import { getRabbitMQChannel, closeRabbitMQConnection } from '../../src/infrastructure/queue';
import { UserStore } from '../../src/stores/postgres/user.store';
import { ProductStore } from '../../src/stores/postgres/product.store';
import { OrderStore } from '../../src/stores/postgres/order.store';
import { StockStore } from '../../src/stores/redis/stock.store';
import { IdempotencyStore } from '../../src/stores/redis/idempotency.store';
import { OrderQueue } from '../../src/stores/rabbitmq/order.queue';
import { KafkaOrderQueue } from '../../src/stores/kafka/order.queue';
import type { IOrderQueue } from '../../src/domain/interfaces';
import { AuthController } from '../../src/http/controllers/auth.controller';
import { CheckoutController } from '../../src/http/controllers/checkout.controller';
import { SseController } from '../../src/http/controllers/sse.controller';
import { getAuthRouter } from '../../src/http/routes/auth.routes';
import { getCheckoutRouter } from '../../src/http/routes/checkout.routes';
import { getSseRouter } from '../../src/http/routes/sse.routes';
import { getAiRouter } from '../../src/http/routes/ai.routes';
import { getKnowledgeRouter } from '../../src/http/routes/knowledge.routes';
import { ProductController } from '../../src/http/controllers/product.controller';
import { getProductRouter } from '../../src/http/routes/product.routes';
import { AiController } from '../../src/http/controllers/ai.controller';
import { LivestreamStore } from '../../src/stores/postgres/livestream.store';
import { LivestreamController } from '../../src/http/controllers/livestream.controller';
import { getLivestreamRouter } from '../../src/http/routes/livestream.routes';
import { ScheduledStreamStore } from '../../src/stores/postgres/scheduled-stream.store';
import { ScheduledStreamController } from '../../src/http/controllers/scheduled-stream.controller';
import { getScheduledStreamRouter } from '../../src/http/routes/scheduled-stream.routes';
import { AuctionStore } from '../../src/stores/postgres/auction.store';
import { AuctionController } from '../../src/http/controllers/auction.controller';
import { getAuctionRouter } from '../../src/http/routes/auction.routes';
import { initializeChatSocket } from '../../src/infrastructure/chat-socket';
import { getChatRouter } from '../../src/http/routes/chat.routes';
import { OrderController } from '../../src/http/controllers/order.controller';
import { getOrderRouter } from '../../src/http/routes/order.routes';
import { MetricsController } from '../../src/http/controllers/metrics.controller';
import { getMetricsRouter } from '../../src/http/routes/metrics.routes';

import { broadcastShutdown, pushEventToShop, pushEventToBuyers } from '../../src/sse/sse-manager';
import { SystemMonitor } from '../../src/infrastructure/system-monitor';
import { createLogger } from '../../shared/logger';

import { traceStore } from '../../shared/trace-context';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('ApiServer');
const app = express();
app.use(express.json());

// Trace ID Middleware using AsyncLocalStorage
app.use((req, res, next) => {
  const traceId =
    (req.headers['x-trace-id'] as string) || (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('X-Trace-Id', traceId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (req as any).traceId = traceId;

  traceStore.run(traceId, () => {
    next();
  });
});

import {
  httpRequestsTotal,
  httpRequestDuration,
  metricsRegistry,
} from '../../src/infrastructure/metrics';

// Enable CORS for frontend clients
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With,Content-Type,Authorization,Idempotency-Key,X-Idempotency-Key,X-Trace-Id',
  );
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Prometheus HTTP Metrics Middleware
app.use((req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    if (req.path === '/metrics' || req.path === '/health') return;

    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;

    let route = req.route ? req.route.path : req.path;
    if (req.params) {
      for (const [key, value] of Object.entries(req.params)) {
        if (value) {
          route = route.replace(value, `:${key}`);
        }
      }
    }

    httpRequestsTotal.inc({
      method: req.method,
      route: route || req.path,
      status: res.statusCode.toString(),
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route: route || req.path,
      },
      durationInSeconds,
    );
  });

  next();
});

// Metrics Endpoint for Prometheus scraping
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

let server: http.Server;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisSubClient: any;
let orderQueue: IOrderQueue;

async function bootstrap(): Promise<void> {
  logger.info('Initializing API Server dependencies...');
  
  SystemMonitor.start(5000); // 5 second sampling rate

  // Connect to Infra singleton instances
  const writeDbPool = getWriteDbPool();
  const readDbPool = getReadDbPool();

  // Run pending database migrations
  try {
    logger.info('Running pending database migrations...');
    await runner({
      // @ts-expect-error - node-pg-migrate expects a specific pg client type that conflicts in this monorepo
      dbClient: writeDbPool,
      direction: 'up',
      dir: path.join(process.cwd(), 'migrations'),
      migrationsTable: 'pgmigrations',
      verbose: true,
    });
    logger.info('Database migrations completed successfully.');
  } catch (err) {
    logger.error('Failed to run database migrations:', {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }

  const redisClient = await getRedisClient();
  
  if (process.env.USE_KAFKA === 'true') {
    const kafkaQueue = new KafkaOrderQueue();
    await kafkaQueue.connect();
    orderQueue = kafkaQueue;
  } else {
    const rabbitChannel = await getRabbitMQChannel();
    orderQueue = new OrderQueue(rabbitChannel);
  }

  // Instantiate Stores
  const userStore = new UserStore(writeDbPool, readDbPool);
  const productStore = new ProductStore(writeDbPool, readDbPool);
  const orderStore = new OrderStore(writeDbPool, readDbPool);
  const stockStore = new StockStore(redisClient);
  const idempotencyStore = new IdempotencyStore(redisClient);
  const livestreamStore = new LivestreamStore(writeDbPool, readDbPool);
  const scheduledStreamStore = new ScheduledStreamStore(writeDbPool, readDbPool);
  const auctionStore = new AuctionStore(writeDbPool, readDbPool);

  // Instantiate Controllers
  const authController = new AuthController(userStore, writeDbPool);
  const checkoutController = new CheckoutController(
    productStore,
    orderStore,
    stockStore,
    idempotencyStore,
    orderQueue,
  );
  const orderController = new OrderController(orderStore);
  const sseController = new SseController();
  const aiController = new AiController();
  const productController = new ProductController(productStore, stockStore, writeDbPool);
  const livestreamController = new LivestreamController(livestreamStore);
  const scheduledStreamController = new ScheduledStreamController(scheduledStreamStore);
  const auctionController = new AuctionController(auctionStore);
  const metricsController = new MetricsController(readDbPool);

  // Register Routes
  app.use('/api/auth', getAuthRouter(authController));
  app.use('/api/orders', getOrderRouter(orderController));
  app.use('/api/checkout', getCheckoutRouter(checkoutController));
  app.use('/api/sse', getSseRouter(sseController));
  app.use('/api/ai', getAiRouter(aiController));
  app.use('/api/knowledge', getKnowledgeRouter(aiController));
  app.use('/api/products', getProductRouter(productController));
  app.use('/api/livestreams', getLivestreamRouter(livestreamController));
  app.use('/api/scheduled-streams', getScheduledStreamRouter(scheduledStreamController));
  app.use('/api/auctions', getAuctionRouter(auctionController));
  app.use('/api/chat', getChatRouter());
  app.use('/api/metrics', getMetricsRouter(metricsController));

  // Establish Redis Pub/Sub Subscriber for SSE events
  redisSubClient = redisClient.duplicate();
  await redisSubClient.connect();

  await redisSubClient.pSubscribe('shop:orders:*', (message: string, channel: string) => {
    try {
      const channelParts = channel.split(':');
      const shopId = channelParts[channelParts.length - 1];
      if (!shopId) return;

      const eventPayload = JSON.parse(message);

      // Push full telemetry to Streamer/Admin dashboards
      pushEventToShop(shopId, eventPayload);

      // Push lightweight stock_updated event to all public Buyer viewers
      if (eventPayload.event === 'order_confirmed' && eventPayload.data) {
        pushEventToBuyers(shopId, {
          id: `buyer-${eventPayload.id || Date.now()}`,
          event: 'stock_updated',
          data: {
            productId: eventPayload.data.productId,
            quantity: eventPayload.data.quantity,
          },
        });
      }
    } catch (err) {
      logger.error('[API] Error parsing/forwarding Redis Pub/Sub message:', {
        error: err instanceof Error ? err.message : String(err),
        channel,
      });
    }
  });
  logger.info('[API] Redis Pub/Sub Subscriber initialized on channel "shop:orders:*"');

  server = app.listen(config.server.port, () => {
    logger.info(`[API] Server running on port ${config.server.port} (${config.server.nodeEnv})`);
  });

  initializeChatSocket(server);
}

// Graceful Shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`[API] ${signal} received. Shutting down gracefully...`);
  
  SystemMonitor.stop();

  // Broadcast shutdown message to all connected SSE clients (Streamers)
  broadcastShutdown();

  if (server) {
    server.close(() => {
      logger.info('[API] HTTP server closed.');
      void (async (): Promise<void> => {
        try {
          if (redisSubClient) {
            await redisSubClient.quit();
            logger.info('[API] Redis Pub/Sub Subscriber closed.');
          }
          if (process.env.USE_KAFKA === 'true') {
            await (orderQueue as unknown as { disconnect: () => Promise<void> }).disconnect();
          } else {
            await closeRabbitMQConnection();
          }
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
      })();
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
