import { Pool } from 'pg';
import type { IOrderStore } from '../../domain/interfaces';
import type { OrderEntity } from '../../domain/entities';
import type { OrderPendingEvent } from '../../domain/entities';

export class OrderStore implements IOrderStore {
  constructor(
    private readonly writeDb: Pool,
    private readonly readDb: Pool = writeDb,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToEntity(row: any): OrderEntity {
    return {
      id: row.id,
      userId: row.user_id,
      productId: row.product_id,
      shopId: row.shop_id,
      quantity: parseInt(row.quantity, 10),
      totalPrice: parseFloat(row.total_price),
      status: row.status,
      idempotencyKey: row.idempotency_key,
      traceId: row.trace_id || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      productName: row.product_name,
      productImage: row.product_image,
      shopName: row.shop_name,
    };
  }

  async create(event: OrderPendingEvent): Promise<OrderEntity> {
    const query = `
      INSERT INTO orders (user_id, product_id, shop_id, quantity, total_price, status, idempotency_key, trace_id)
      VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, $7)
      RETURNING id, user_id, product_id, shop_id, quantity, total_price, status, idempotency_key, trace_id, created_at, updated_at
    `;
    const values = [
      event.userId,
      event.productId,
      event.shopId,
      event.quantity,
      event.totalPrice,
      event.idempotencyKey,
      event.traceId,
    ];
    const { rows } = await this.writeDb.query(query, values);
    return this.mapRowToEntity(rows[0]);
  }

  async findByIdempotencyKey(key: string): Promise<OrderEntity | null> {
    const query = `
      SELECT id, user_id, product_id, shop_id, quantity, total_price, status, idempotency_key, trace_id, created_at, updated_at
      FROM orders
      WHERE idempotency_key = $1
    `;
    const { rows } = await this.readDb.query(query, [key]);
    if (rows.length === 0) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async updateStatus(id: string, status: OrderEntity['status']): Promise<void> {
    const query = `
      UPDATE orders
      SET status = $2, updated_at = NOW()
      WHERE id = $1
    `;
    await this.writeDb.query(query, [id, status]);
  }

  async findByUserId(userId: string): Promise<OrderEntity[]> {
    const query = `
      SELECT o.id, o.user_id, o.product_id, o.shop_id, o.quantity, o.total_price, o.status, o.idempotency_key, o.trace_id, o.created_at, o.updated_at,
             p.name AS product_name, p.image_url AS product_image, s.name AS shop_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN shops s ON o.shop_id = s.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `;
    const { rows } = await this.readDb.query(query, [userId]);
    return rows.map((row) => this.mapRowToEntity(row));
  }
}
