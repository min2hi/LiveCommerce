import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, RedisClientType } from 'redis';
import { StockStore } from '../../../src/stores/redis/stock.store';
import { config } from '../../../src/config';

describe('StockStore (Lua Script Integration)', () => {
  let redisClient: RedisClientType;
  let stockStore: StockStore;
  const testProductId = 'test-prod-123';
  const testUserId = 'test-user-456';

  beforeAll(async () => {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
    }) as RedisClientType;
    await redisClient.connect();
    stockStore = new StockStore(redisClient);
  });

  afterAll(async () => {
    if (redisClient) {
      await redisClient.quit();
    }
  });

  beforeEach(async () => {
    // Clean up keys before each test
    await redisClient.del(`product:stock:${testProductId}`);
    await redisClient.del(`product:buyers:${testProductId}`);
  });

  it('should return out_of_stock if stock key does not exist', async () => {
    const res = await stockStore.atomicCheckout(testProductId, testUserId);
    expect(res).toBe('out_of_stock');
  });

  it('should deduct stock and record buyer when stock is available', async () => {
    await stockStore.setStock(testProductId, 5);

    const res = await stockStore.atomicCheckout(testProductId, testUserId);
    expect(res).toBe('ok');

    const stock = await stockStore.getStock(testProductId);
    expect(stock).toBe(4);

    const isMember = await redisClient.sIsMember(`product:buyers:${testProductId}`, testUserId);
    expect(!!isMember).toBe(true);
  });

  it('should return out_of_stock if stock is 0', async () => {
    await stockStore.setStock(testProductId, 0);

    const res = await stockStore.atomicCheckout(testProductId, testUserId);
    expect(res).toBe('out_of_stock');
  });

  it('should prevent double purchase by the same user', async () => {
    await stockStore.setStock(testProductId, 5);

    const firstRes = await stockStore.atomicCheckout(testProductId, testUserId);
    expect(firstRes).toBe('ok');

    const secondRes = await stockStore.atomicCheckout(testProductId, testUserId);
    expect(secondRes).toBe('already_purchased');

    // Stock should only be decremented once
    const stock = await stockStore.getStock(testProductId);
    expect(stock).toBe(4);
  });

  it('should handle zero oversell under multiple concurrent checkouts', async () => {
    const stockQuantity = 3;
    await stockStore.setStock(testProductId, stockQuantity);

    // Simulate 5 different users buying concurrently
    const userIds = ['u1', 'u2', 'u3', 'u4', 'u5'];
    const results = await Promise.all(
      userIds.map((uid) => stockStore.atomicCheckout(testProductId, uid)),
    );

    // Exactly 3 purchases should be 'ok', and 2 should be 'out_of_stock'
    const okCount = results.filter((r) => r === 'ok').length;
    const oosCount = results.filter((r) => r === 'out_of_stock').length;

    expect(okCount).toBe(3);
    expect(oosCount).toBe(2);

    const finalStock = await stockStore.getStock(testProductId);
    expect(finalStock).toBe(0);
  });

  it('should rollback checkout correctly', async () => {
    await stockStore.setStock(testProductId, 2);

    await stockStore.atomicCheckout(testProductId, testUserId);
    let stock = await stockStore.getStock(testProductId);
    expect(stock).toBe(1);

    await stockStore.rollback(testProductId, testUserId);
    stock = await stockStore.getStock(testProductId);
    expect(stock).toBe(2);

    const isMember = await redisClient.sIsMember(`product:buyers:${testProductId}`, testUserId);
    expect(!!isMember).toBe(false);
  });
});
