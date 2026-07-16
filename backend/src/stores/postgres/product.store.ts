import { Pool } from 'pg';
import type { IProductStore } from '../../domain/interfaces';
import type { ProductEntity } from '../../domain/entities';

export class ProductStore implements IProductStore {
  constructor(private readonly writeDb: Pool, private readonly readDb: Pool = writeDb) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToEntity(row: any): ProductEntity {
    return {
      id: row.id,
      shopId: row.shop_id,
      name: row.name,
      description: row.description || undefined,
      price: parseFloat(row.price),
      stock: parseInt(row.stock, 10),
      isFlashSale: row.is_flash_sale,
      flashSaleEndTime: row.flash_sale_end_time ? new Date(row.flash_sale_end_time) : undefined,
      imageUrl: row.image_url || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async findById(id: string): Promise<ProductEntity | null> {
    const query = `
      SELECT id, shop_id, name, description, price, stock, is_flash_sale, image_url, created_at, updated_at
      FROM products
      WHERE id = $1
    `;
    const { rows } = await this.readDb.query(query, [id]);
    if (rows.length === 0) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async findByShopId(shopId: string): Promise<ProductEntity[]> {
    const query = `
      SELECT id, shop_id, name, description, price, stock, is_flash_sale, image_url, created_at, updated_at
      FROM products
      WHERE shop_id = $1
      ORDER BY created_at DESC
    `;
    const { rows } = await this.readDb.query(query, [shopId]);
    return rows.map((row) => this.mapRowToEntity(row));
  }

  async updateStock(id: string, delta: number): Promise<void> {
    const query = `
      UPDATE products
      SET stock = stock + $2
      WHERE id = $1
    `;
    await this.writeDb.query(query, [id, delta]);
  }

  async findAll(): Promise<ProductEntity[]> {
    const query = `
      SELECT id, shop_id, name, description, price, stock, is_flash_sale, image_url, created_at, updated_at
      FROM products
      ORDER BY created_at DESC
    `;
    const { rows } = await this.readDb.query(query);
    return rows.map((row) => this.mapRowToEntity(row));
  }

  async setStock(id: string, stock: number): Promise<void> {
    const query = `
      UPDATE products
      SET stock = $2
      WHERE id = $1
    `;
    await this.writeDb.query(query, [id, stock]);
  }

  async setFlashSale(id: string, isFlashSale: boolean): Promise<void> {
    const query = `
      UPDATE products
      SET is_flash_sale = $2
      WHERE id = $1
    `;
    await this.writeDb.query(query, [id, isFlashSale]);
  }
}
