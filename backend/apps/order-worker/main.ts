import 'dotenv/config';
import { getRabbitMQChannel, closeRabbitMQConnection } from '../../src/infrastructure/queue';
import { config } from '../../src/config';

// TODO: Import OrderService, CompensationService — Phase 2 (Pillar 2 Worker)

async function startWorker(): Promise<void> {
  console.log('[Worker] Order Worker starting...');

  const channel = await getRabbitMQChannel();

  await channel.consume(
    config.rabbitmq.queue,
    (msg) => {
      if (!msg) return;

      const traceId = msg.properties.headers?.['x-trace-id'] ?? 'unknown';
      console.log(`[Worker][TraceId:${traceId}] Received OrderPendingEvent`);

      try {
        // TODO: Parse msg → call OrderService.processOrder()
        // SUCCESS → channel.ack(msg)
        // FAIL    → CompensationService.rollback() → channel.nack(msg, false, false)
        channel.ack(msg); // placeholder
      } catch (err) {
        console.error(`[Worker][TraceId:${traceId}] Fatal error:`, err);
        channel.nack(msg, false, false); // → DLQ
      }
    },
    { noAck: false }, // Manual Ack mode — CRITICAL
  );

  console.log(`[Worker] Listening on queue: ${config.rabbitmq.queue}`);
}

// Graceful Shutdown
async function shutdown(signal: string): Promise<void> {
  console.log(`\n[Worker] ${signal} received. Finishing current message...`);
  await closeRabbitMQConnection();
  console.log('[Worker] Shutdown complete.');
  process.exit(0);
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

startWorker().catch((err) => {
  console.error('[Worker] Failed to start:', err);
  process.exit(1);
});
