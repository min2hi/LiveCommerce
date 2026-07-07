import 'dotenv/config';
import express from 'express';
import { config } from '../../src/config';
import { getDbPool, closeDbPool } from '../../src/infrastructure/database';
import { getRedisClient, closeRedisClient } from '../../src/infrastructure/cache';

const app = express();
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// TODO: Register routes (Pillar 1, 2, 3, 4) — Phase 2

const server = app.listen(config.server.port, () => {
  console.log(`[API] Server running on port ${config.server.port} (${config.server.nodeEnv})`);
  getRedisClient().catch((err) => {
    console.error('[API] Redis connection failed:', err);
  });
  getDbPool();
});

// ──────────────────────────────────────────
// Graceful Shutdown
// ──────────────────────────────────────────
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n[API] ${signal} received. Shutting down gracefully...`);

  server.close(() => {
    console.log('[API] HTTP server closed.');
    Promise.all([closeRedisClient(), closeDbPool()])
      .then(() => {
        console.log('[API] Shutdown complete.');
        process.exit(0);
      })
      .catch((err) => {
        console.error('[API] Error during resource cleanup:', err);
        process.exit(1);
      });
  });

  setTimeout(() => {
    console.error('[API] Forced shutdown after timeout.');
    process.exit(1);
  }, 15000);
}

process.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void gracefulShutdown('SIGINT');
});
