import { Pool } from 'pg';
import type { IScheduledStreamStore } from '../../domain/interfaces';
import type { ScheduledStreamEntity } from '../../domain/entities';

export class ScheduledStreamStore implements IScheduledStreamStore {
  constructor(private readonly db: Pool) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToEntity(row: any): ScheduledStreamEntity {
    return {
      id: row.id,
      shopId: row.shop_id,
      title: row.title,
      description: row.description || undefined,
      scheduledTime: new Date(row.scheduled_time),
      bannerUrl: row.banner_url || undefined,
      status: row.status as ScheduledStreamEntity['status'],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      shopName: row.shop_name || undefined,
    };
  }

  async create(
    data: Omit<ScheduledStreamEntity, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
  ): Promise<ScheduledStreamEntity> {
    const query = `
      INSERT INTO scheduled_streams (shop_id, title, description, scheduled_time, banner_url, status)
      VALUES ($1, $2, $3, $4, $5, 'UPCOMING')
      RETURNING id, shop_id, title, description, scheduled_time, banner_url, status, created_at, updated_at
    `;
    const { rows } = await this.db.query(query, [
      data.shopId,
      data.title,
      data.description || null,
      data.scheduledTime,
      data.bannerUrl || null,
    ]);
    return this.mapRowToEntity(rows[0]);
  }

  async findById(id: string): Promise<ScheduledStreamEntity | null> {
    const query = `
      SELECT ss.id, ss.shop_id, ss.title, ss.description, ss.scheduled_time, ss.banner_url, ss.status, ss.created_at, ss.updated_at, s.name as shop_name
      FROM scheduled_streams ss
      JOIN shops s ON ss.shop_id = s.id
      WHERE ss.id = $1
    `;
    const { rows } = await this.db.query(query, [id]);
    if (rows.length === 0) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async findUpcoming(): Promise<ScheduledStreamEntity[]> {
    const query = `
      SELECT ss.id, ss.shop_id, ss.title, ss.description, ss.scheduled_time, ss.banner_url, ss.status, ss.created_at, ss.updated_at, s.name as shop_name
      FROM scheduled_streams ss
      JOIN shops s ON ss.shop_id = s.id
      WHERE ss.status = 'UPCOMING' AND ss.scheduled_time > NOW()
      ORDER BY ss.scheduled_time ASC
    `;
    const { rows } = await this.db.query(query);
    return rows.map((row) => this.mapRowToEntity(row));
  }

  async findByShopId(shopId: string): Promise<ScheduledStreamEntity[]> {
    const query = `
      SELECT ss.id, ss.shop_id, ss.title, ss.description, ss.scheduled_time, ss.banner_url, ss.status, ss.created_at, ss.updated_at, s.name as shop_name
      FROM scheduled_streams ss
      JOIN shops s ON ss.shop_id = s.id
      WHERE ss.shop_id = $1
      ORDER BY ss.scheduled_time ASC
    `;
    const { rows } = await this.db.query(query, [shopId]);
    return rows.map((row) => this.mapRowToEntity(row));
  }

  async addReminder(streamId: string, userId: string): Promise<void> {
    const query = `
      INSERT INTO stream_reminders (stream_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (stream_id, user_id) DO NOTHING
    `;
    await this.db.query(query, [streamId, userId]);
  }

  async removeReminder(streamId: string, userId: string): Promise<void> {
    const query = `
      DELETE FROM stream_reminders
      WHERE stream_id = $1 AND user_id = $2
    `;
    await this.db.query(query, [streamId, userId]);
  }

  async getReminders(streamId: string): Promise<string[]> {
    const query = `
      SELECT user_id
      FROM stream_reminders
      WHERE stream_id = $1
    `;
    const { rows } = await this.db.query(query, [streamId]);
    return rows.map((row) => row.user_id);
  }

  async isReminderSet(streamId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT 1
      FROM stream_reminders
      WHERE stream_id = $1 AND user_id = $2
    `;
    const { rows } = await this.db.query(query, [streamId, userId]);
    return rows.length > 0;
  }
}
