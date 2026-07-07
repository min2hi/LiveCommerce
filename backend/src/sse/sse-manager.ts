/**
 * SSE Manager — Server-Sent Events Connection Lifecycle
 *
 * Manages active SSE connections from Streamers.
 * Handles: register, push event, cleanup on disconnect.
 *
 * Architecture:
 *   Map<shopId, Set<Response>> — one shop can have multiple dashboard tabs open
 *
 * Memory Leak Prevention:
 *   req.on('close') removes the response from the Map on disconnect.
 *   Use Set (not Array) so removal is O(1).
 */

import type { Request, Response } from 'express';
import { createLogger } from '../../shared/logger';

const log = createLogger('SseManager');

// shopId → Set of active SSE Response objects
const clients = new Map<string, Set<Response>>();

// Keep last N events per shop for reconnect replay
const EVENT_REPLAY_SIZE = 30;
const eventHistory = new Map<string, SseEvent[]>();

export interface SseEvent {
  id: string;
  event: string;
  data: Record<string, unknown>;
}

/**
 * Register a new SSE client for a shop.
 * Sets up SSE headers and attaches disconnect cleanup.
 */
export function registerSseClient(shopId: string, req: Request, res: Response): void {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Nginx: disable buffering
  res.flushHeaders();

  // Send initial connection confirmation
  res.write('event: connected\ndata: {"status":"ok"}\n\n');

  // Register in Map
  if (!clients.has(shopId)) {
    clients.set(shopId, new Set());
  }
  clients.get(shopId)!.add(res);
  log.info('Client connected', { shopId, total: clients.get(shopId)!.size });

  // Replay recent events for reconnecting clients
  const lastEventId = req.headers['last-event-id'] as string | undefined;
  if (lastEventId) {
    replayEvents(shopId, lastEventId, res);
  }

  // Cleanup on disconnect — CRITICAL to prevent memory leak
  req.on('close', () => {
    clients.get(shopId)?.delete(res);
    if (clients.get(shopId)?.size === 0) {
      clients.delete(shopId);
    }
    log.info('Client disconnected', { shopId, remaining: clients.get(shopId)?.size ?? 0 });
  });
}

/**
 * Push an event to all SSE clients of a shop.
 * Called by OrderWorker after successful DB insert.
 */
export function pushEventToShop(shopId: string, event: SseEvent): void {
  const shopClients = clients.get(shopId);
  if (!shopClients || shopClients.size === 0) return;

  const payload = `id: ${event.id}\nevent: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;

  // Push to all active connections for this shop
  shopClients.forEach((res) => {
    try {
      res.write(payload);
    } catch {
      shopClients.delete(res); // Remove dead connection
    }
  });

  // Store in history for reconnect replay
  if (!eventHistory.has(shopId)) {
    eventHistory.set(shopId, []);
  }
  const history = eventHistory.get(shopId)!;
  history.push(event);
  if (history.length > EVENT_REPLAY_SIZE) {
    history.shift(); // Remove oldest
  }

  log.info('Event pushed', { shopId, event: event.event, clients: shopClients.size });
}

/**
 * Broadcast shutdown notification to all connected clients.
 * Called during Graceful Shutdown.
 */
export function broadcastShutdown(): void {
  clients.forEach((shopClients) => {
    shopClients.forEach((res) => {
      try {
        res.write('event: shutdown\ndata: {"reason":"server_restart"}\n\n');
      } catch {
        /* ignore */
      }
    });
  });
  log.info('Shutdown broadcast sent', { totalShops: clients.size });
}

// ── Internal Helpers ──────────────────────────────────────────────────────

function replayEvents(shopId: string, lastEventId: string, res: Response): void {
  const history = eventHistory.get(shopId) ?? [];
  const idx = history.findIndex((e) => e.id === lastEventId);
  if (idx === -1) return;

  // Replay everything after lastEventId
  history.slice(idx + 1).forEach((event) => {
    res.write(`id: ${event.id}\nevent: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`);
  });
}
