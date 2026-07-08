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
}

// ── Order Store Interface ─────────────────────────────────────────────────

export interface IOrderStore {
  create(event: OrderPendingEvent): Promise<OrderEntity>;
  findByIdempotencyKey(key: string): Promise<OrderEntity | null>;
  updateStatus(id: string, status: OrderEntity['status']): Promise<void>;
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
  ): Promise<'ok' | 'out_of_stock' | 'already_purchased'>;

  /** Compensation: undo a checkout (stock overflow protection) */
  rollback(productId: string, userId: string): Promise<void>;

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
