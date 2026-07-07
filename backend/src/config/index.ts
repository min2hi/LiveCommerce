import 'dotenv/config';

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'livecommerce',
    password: process.env.POSTGRES_PASSWORD || 'secret',
    database: process.env.POSTGRES_DB || 'livecommerce',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://livecommerce:secret@localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'order.exchange',
    queue: process.env.RABBITMQ_QUEUE || 'order.queue',
    dlq: process.env.RABBITMQ_DLQ || 'order.dlq',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    llmModel: process.env.OPENAI_LLM_MODEL || 'gpt-4o-mini',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'changeme',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  rateLimit: {
    chatMax: parseInt(process.env.RATE_LIMIT_CHAT_MAX || '5', 10),
    checkoutMax: parseInt(process.env.RATE_LIMIT_CHECKOUT_MAX || '1', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '1000', 10),
  },
};
