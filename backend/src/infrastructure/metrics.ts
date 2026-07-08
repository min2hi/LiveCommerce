import client from 'prom-client';

// ── Initialize Prometheus Default Metrics Scraper ───────────────────────────
client.collectDefaultMetrics({ prefix: 'livecommerce_' });

// ── Custom Prometheus Metrics ────────────────────────────────────────────────

// 1. HTTP Metrics
export const httpRequestsTotal = new client.Counter({
  name: 'livecommerce_http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status'],
});

export const httpRequestDuration = new client.Histogram({
  name: 'livecommerce_http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10], // Tailored buckets for live-sale latency
});

// 2. Redis Metrics
export const redisOperationsTotal = new client.Counter({
  name: 'livecommerce_redis_operations_total',
  help: 'Total number of Redis operations performed',
  labelNames: ['operation', 'success'], // e.g. ['lua_checkout', 'true']
});

// 3. RabbitMQ Metrics
export const rabbitmqMessagesTotal = new client.Counter({
  name: 'livecommerce_rabbitmq_messages_total',
  help: 'Total number of RabbitMQ queue events',
  labelNames: ['queue', 'action'], // e.g. ['order.queue', 'publish'] or ['order.queue', 'consume_ack']
});

// ── Registry Exposer ────────────────────────────────────────────────────────
export const metricsRegistry = client.register;
