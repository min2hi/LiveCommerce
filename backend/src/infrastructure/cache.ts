import { createClient, RedisClientType } from 'redis';
import { config } from '../config';

let client: RedisClientType;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!client) {
    client = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
      },
    }) as RedisClientType;

    client.on('error', (err) => console.error('[Redis] Client error:', err));
    client.on('ready', () => console.log('[Redis] Connected.'));

    await client.connect();
  }
  return client;
}

export async function closeRedisClient(): Promise<void> {
  if (client) {
    await client.quit();
    console.log('[Redis] Connection closed cleanly.');
  }
}
