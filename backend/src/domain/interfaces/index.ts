/**
 * Repository Interfaces (Ports)
 * Define the CONTRACT between Service layer and Store implementations.
 * Service layer ONLY depends on these interfaces — never on pg/redis directly.
 *
 * Dependency Rule: Services → Interfaces ← Stores (implementations)
 */

import type {
  UserEntity,
  ProductEntity,
  OrderEntity,
  KnowledgeDocEntity,
  OrderPendingEvent,
  LivestreamEntity,
  ScheduledStreamEntity,
  AuctionEntity,
  AuctionBidEntity,
} from '../entities';

// ── User Store Interface ───────────────────────────────────────────────────

export interface IUserStore {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity>;
}

// ── Product Store Interface ───────────────────────────────────────────────

export interface IProductStore {
  findById(id: string): Promise<ProductEntity | null>;
  findByShopId(shopId: string): Promise<ProductEntity[]>;
  updateStock(id: string, delta: number): Promise<void>;
  findAll(): Promise<ProductEntity[]>;
  setStock(id: string, stock: number): Promise<void>;
  setFlashSale(id: string, isFlashSale: boolean): Promise<void>;
}

// ── Order Store Interface ─────────────────────────────────────────────────

export interface IOrderStore {
  create(event: OrderPendingEvent): Promise<OrderEntity>;
  findByIdempotencyKey(key: string): Promise<OrderEntity | null>;
  updateStatus(id: string, status: OrderEntity['status']): Promise<void>;
  findByUserId(userId: string): Promise<OrderEntity[]>;
}

// ── Stock Store Interface (Redis) ─────────────────────────────────────────

export interface IStockStore {
  /**
   * Atomically check stock, decrement, and record buyer.
   * @returns 'ok' | 'out_of_stock' | 'already_purchased'
   */
  atomicCheckout(
    productId: string,
    userId: string,
    quantity: number,
  ): Promise<'ok' | 'out_of_stock' | 'already_purchased'>;

  /** Compensation: undo a checkout (stock overflow protection) */
  rollback(productId: string, userId: string, quantity: number): Promise<void>;

  getStock(productId: string): Promise<number>;
  setStock(productId: string, quantity: number): Promise<void>;

  /** Publish confirmed order event to Redis channel for the shop */
  publishConfirmedOrder(shopId: string, payload: unknown): Promise<void>;
}

// ── Knowledge Store Interface (pgvector RAG) ──────────────────────────────

export interface IKnowledgeStore {
  insert(doc: Pick<KnowledgeDocEntity, 'shopId' | 'content'>, embedding: number[]): Promise<void>;

  /**
   * Similarity search — MUST filter by shopId for data isolation.
   * @returns Top K most similar documents for the given shop
   */
  similaritySearch(
    shopId: string,
    queryEmbedding: number[],
    topK: number,
  ): Promise<KnowledgeDocEntity[]>;
}

// ── Livestream Store Interface ─────────────────────────────────────────────

export interface ILivestreamStore {
  create(
    data: Omit<
      LivestreamEntity,
      'id' | 'createdAt' | 'updatedAt' | 'viewers' | 'status' | 'endedAt'
    >,
  ): Promise<LivestreamEntity>;
  findById(id: string): Promise<LivestreamEntity | null>;
  findByStreamKey(streamKey: string): Promise<LivestreamEntity | null>;
  findByShopId(shopId: string): Promise<LivestreamEntity[]>;
  findActive(): Promise<LivestreamEntity[]>;
  updateStatus(id: string, status: LivestreamEntity['status'], endedAt?: Date): Promise<void>;
  updateViewers(id: string, viewers: number): Promise<void>;
}

// ── Idempotency Store Interface (Redis) ──────────────────────────────────

export interface IIdempotencyStore {
  /** @returns true if key is NEW (first time), false if already exists */
  setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean>;
  get(key: string): Promise<string | null>;
}

// ── Order Queue Interface (RabbitMQ) ──────────────────────────────────────

export interface IOrderQueue {
  publish(event: OrderPendingEvent): Promise<boolean>;
  consume(handler: (event: OrderPendingEvent) => Promise<void>): Promise<void>;
}

// ── Scheduled Stream Store Interface ───────────────────────────────────────

export interface IScheduledStreamStore {
  create(
    data: Omit<ScheduledStreamEntity, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
  ): Promise<ScheduledStreamEntity>;
  findById(id: string): Promise<ScheduledStreamEntity | null>;
  findUpcoming(): Promise<ScheduledStreamEntity[]>;
  findByShopId(shopId: string): Promise<ScheduledStreamEntity[]>;
  addReminder(streamId: string, userId: string): Promise<void>;
  removeReminder(streamId: string, userId: string): Promise<void>;
  getReminders(streamId: string): Promise<string[]>; // returns userIds
  isReminderSet(streamId: string, userId: string): Promise<boolean>;
}

// ── Auction Store Interface ────────────────────────────────────────────────

export interface IAuctionStore {
  create(
    data: Omit<
      AuctionEntity,
      'id' | 'status' | 'startedAt' | 'endedAt' | 'winnerId' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<AuctionEntity>;
  findById(id: string): Promise<AuctionEntity | null>;
  findActiveByShopId(shopId: string): Promise<AuctionEntity | null>;
  updateStatus(id: string, status: AuctionEntity['status']): Promise<void>;
  placeBid(auctionId: string, userId: string, amount: number): Promise<AuctionBidEntity>;
  getHighestBid(auctionId: string): Promise<AuctionBidEntity | null>;
  getBids(auctionId: string, limit?: number): Promise<AuctionBidEntity[]>;
  endAuction(id: string, winnerId?: string): Promise<void>;
}
