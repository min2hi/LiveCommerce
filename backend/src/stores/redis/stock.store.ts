import type { RedisClientType } from 'redis';
import type { IStockStore } from '../../domain/interfaces';

import { redisOperationsTotal } from '../../infrastructure/metrics';

export class StockStore implements IStockStore {
  private readonly LUA_CHECKOUT = `
    local stockKey = KEYS[1]
    local buyersKey = KEYS[2]
    local userId = ARGV[1]
    local quantity = tonumber(ARGV[2]) or 1

    -- 1. Check if user already purchased
    if redis.call("sismember", buyersKey, userId) == 1 then
      return -1
    end

    -- 2. Check if stock exists
    local stock = redis.call("get", stockKey)
    if not stock then
      return -2
    end

    -- 3. Check if stock is out or insufficient
    local stockNum = tonumber(stock)
    if stockNum < quantity then
      return 0
    end

    -- 4. Deduct stock and record buyer
    redis.call("decrby", stockKey, quantity)
    redis.call("sadd", buyersKey, userId)
    return 1
  `;

  constructor(private readonly redis: RedisClientType) {}

  private getStockKey(productId: string): string {
    return `product:stock:${productId}`;
  }

  private getBuyersKey(productId: string): string {
    return `product:buyers:${productId}`;
  }

  async atomicCheckout(
    productId: string,
    userId: string,
    quantity: number = 1,
  ): Promise<'ok' | 'out_of_stock' | 'already_purchased'> {
    const stockKey = this.getStockKey(productId);
    const buyersKey = this.getBuyersKey(productId);

    try {
      // Run the Lua script
      const result = await this.redis.eval(this.LUA_CHECKOUT, {
        keys: [stockKey, buyersKey],
        arguments: [userId, quantity.toString()],
      });

      const status = Number(result);
      redisOperationsTotal.inc({ operation: 'lua_checkout', success: 'true' });

      if (status === 1) return 'ok';
      if (status === -1) return 'already_purchased';
      if (status === 0 || status === -2) return 'out_of_stock';

      return 'out_of_stock';
    } catch (err) {
      redisOperationsTotal.inc({ operation: 'lua_checkout', success: 'false' });
      throw err;
    }
  }

  async rollback(productId: string, userId: string, quantity: number = 1): Promise<void> {
    const stockKey = this.getStockKey(productId);
    const buyersKey = this.getBuyersKey(productId);

    try {
      // Multi transaction to ensure atomic rollback
      await this.redis.multi().incrBy(stockKey, quantity).sRem(buyersKey, userId).exec();
      redisOperationsTotal.inc({ operation: 'rollback', success: 'true' });
    } catch (err) {
      redisOperationsTotal.inc({ operation: 'rollback', success: 'false' });
      throw err;
    }
  }

  async getStock(productId: string): Promise<number> {
    const stockKey = this.getStockKey(productId);
    const stock = await this.redis.get(stockKey);
    if (!stock) return 0;
    return parseInt(stock, 10);
  }

  async setStock(productId: string, quantity: number): Promise<void> {
    const stockKey = this.getStockKey(productId);
    const buyersKey = this.getBuyersKey(productId);

    // Clear old buyers and set new stock
    await this.redis.multi().set(stockKey, quantity.toString()).del(buyersKey).exec();
  }

  async publishConfirmedOrder(shopId: string, payload: unknown): Promise<void> {
    const channel = `shop:orders:${shopId}`;
    await this.redis.publish(channel, JSON.stringify(payload));
  }
}
