import type { RedisClientType } from 'redis';
import type { IStockStore } from '../../domain/interfaces';

import { redisOperationsTotal } from '../../infrastructure/metrics';

export class StockStore implements IStockStore {
  private readonly NUM_SHARDS = 10;

  private readonly LUA_CHECKOUT = `
    local buyersKey = KEYS[11]
    local userId = ARGV[1]
    local quantity = tonumber(ARGV[2]) or 1

    -- 1. Check if user already purchased
    if redis.call("sismember", buyersKey, userId) == 1 then
      return -1
    end

    -- 2. Try to deduct from any of the 10 shards
    for i = 1, 10 do
      local stockKey = KEYS[i]
      local stock = redis.call("get", stockKey)
      if stock then
        local stockNum = tonumber(stock)
        if stockNum >= quantity then
          redis.call("decrby", stockKey, quantity)
          redis.call("sadd", buyersKey, userId)
          return i -- return the shard index (1-indexed) that succeeded
        end
      end
    end

    return 0 -- out of stock
  `;

  constructor(private readonly redis: RedisClientType) {}

  private getStockKey(productId: string, shardId: number): string {
    return `product:stock:${productId}:${shardId}`;
  }

  private getBuyersKey(productId: string): string {
    return `product:buyers:${productId}`;
  }

  async atomicCheckout(
    productId: string,
    userId: string,
    quantity: number = 1,
  ): Promise<'ok' | 'out_of_stock' | 'already_purchased'> {
    // Generate all 10 stock shard keys
    const stockKeys = Array.from({ length: this.NUM_SHARDS }, (_, i) => this.getStockKey(productId, i));
    
    // Shuffle the array to distribute load across shards and avoid hot-keying shard 0
    const shuffledStockKeys = [...stockKeys].sort(() => Math.random() - 0.5);
    
    const buyersKey = this.getBuyersKey(productId);
    const allKeys = [...shuffledStockKeys, buyersKey]; // 11 keys total

    try {
      // Run the Lua script
      const result = await this.redis.eval(this.LUA_CHECKOUT, {
        keys: allKeys,
        arguments: [userId, quantity.toString()],
      });

      const status = Number(result);
      redisOperationsTotal.inc({ operation: 'lua_checkout', success: 'true' });

      if (status > 0) return 'ok'; // > 0 means the shard index that succeeded
      if (status === -1) return 'already_purchased';

      return 'out_of_stock'; // 0
    } catch (err) {
      redisOperationsTotal.inc({ operation: 'lua_checkout', success: 'false' });
      throw err;
    }
  }

  async rollback(productId: string, userId: string, quantity: number = 1): Promise<void> {
    // Increment a random shard since any shard can receive the returned stock
    const randomShard = Math.floor(Math.random() * this.NUM_SHARDS);
    const stockKey = this.getStockKey(productId, randomShard);
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
    const stockKeys = Array.from({ length: this.NUM_SHARDS }, (_, i) => this.getStockKey(productId, i));
    const stocks = await this.redis.mGet(stockKeys);
    
    let total = 0;
    for (const stock of stocks) {
      if (stock) total += parseInt(stock, 10);
    }
    return total;
  }

  async setStock(productId: string, quantity: number): Promise<void> {
    const buyersKey = this.getBuyersKey(productId);
    const multi = this.redis.multi();

    const baseQuantity = Math.floor(quantity / this.NUM_SHARDS);
    const remainder = quantity % this.NUM_SHARDS;

    // Distribute stock across shards
    for (let i = 0; i < this.NUM_SHARDS; i++) {
      const stockKey = this.getStockKey(productId, i);
      const shardQuantity = i === 0 ? baseQuantity + remainder : baseQuantity;
      multi.set(stockKey, shardQuantity.toString());
    }

    // Clear old buyers and execute
    await multi.del(buyersKey).exec();
  }

  async publishConfirmedOrder(shopId: string, payload: unknown): Promise<void> {
    const channel = `shop:orders:${shopId}`;
    await this.redis.publish(channel, JSON.stringify(payload));
  }
}
