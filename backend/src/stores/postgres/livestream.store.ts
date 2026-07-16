import { Pool } from 'pg';
import type { ILivestreamStore } from '../../domain/interfaces';
import type { LivestreamEntity } from '../../domain/entities';

export class LivestreamStore implements ILivestreamStore {
  constructor(private readonly writeDb: Pool, private readonly readDb: Pool = writeDb) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToEntity(row: any): LivestreamEntity {
    return {
      id: row.id,
      shopId: row.shop_id,
      title: row.title,
      streamKey: row.stream_key,
      status: row.status as LivestreamEntity['status'],
      viewers: parseInt(row.viewers, 10) || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      endedAt: row.ended_at ? new Date(row.ended_at) : undefined,
      shopName: row.shop_name || undefined,
    };
  }

  async create(
    data: Omit<
      LivestreamEntity,
      'id' | 'createdAt' | 'updatedAt' | 'viewers' | 'status' | 'endedAt'
    >,
  ): Promise<LivestreamEntity> {
    const query = `
      INSERT INTO livestreams (shop_id, title, stream_key, status, viewers)
      VALUES ($1, $2, $3, 'PENDING', 0)
      RETURNING id, shop_id, title, stream_key, status, viewers, created_at, updated_at, ended_at
    `;
    const { rows } = await this.writeDb.query(query, [data.shopId, data.title, data.streamKey]);
    return this.mapRowToEntity(rows[0]);
  }

  async findById(id: string): Promise<LivestreamEntity | null> {
    const query = `
      SELECT l.id, l.shop_id, l.title, l.stream_key, l.status, l.viewers, l.created_at, l.updated_at, l.ended_at, s.name as shop_name
      FROM livestreams l
      JOIN shops s ON l.shop_id = s.id
      WHERE l.id = $1
    `;
    const { rows } = await this.readDb.query(query, [id]);
    if (rows.length === 0) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async findByStreamKey(streamKey: string): Promise<LivestreamEntity | null> {
    const query = `
      SELECT id, shop_id, title, stream_key, status, viewers, created_at, updated_at, ended_at
      FROM livestreams
      WHERE stream_key = $1
    `;
    const { rows } = await this.readDb.query(query, [streamKey]);
    if (rows.length === 0) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async findByShopId(shopId: string): Promise<LivestreamEntity[]> {
    const query = `
      SELECT id, shop_id, title, stream_key, status, viewers, created_at, updated_at, ended_at
      FROM livestreams
      WHERE shop_id = $1
      ORDER BY created_at DESC
    `;
    const { rows } = await this.readDb.query(query, [shopId]);
    return rows.map((row) => this.mapRowToEntity(row));
  }

  async findActive(): Promise<LivestreamEntity[]> {
    const query = `
      SELECT l.id, l.shop_id, l.title, l.stream_key, l.status, l.viewers, l.created_at, l.updated_at, l.ended_at, s.name as shop_name
      FROM livestreams l
      JOIN shops s ON l.shop_id = s.id
      WHERE l.status = 'LIVE'
      ORDER BY l.created_at DESC
    `;
    const { rows } = await this.readDb.query(query);
    return rows.map((row) => this.mapRowToEntity(row));
  }

  async updateStatus(
    id: string,
    status: LivestreamEntity['status'],
    endedAt?: Date,
  ): Promise<void> {
    const query = `
      UPDATE livestreams
      SET status = $2, ended_at = $3
      WHERE id = $1
    `;
    await this.writeDb.query(query, [id, status, endedAt || null]);
  }

  async updateViewers(id: string, viewers: number): Promise<void> {
    const query = `
      UPDATE livestreams
      SET viewers = $2
      WHERE id = $1
    `;
    await this.writeDb.query(query, [id, viewers]);
  }
}
