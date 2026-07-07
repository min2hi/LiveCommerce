import { Pool } from 'pg';
import type { IUserStore } from '../../domain/interfaces';
import type { UserEntity } from '../../domain/entities';

export class UserStore implements IUserStore {
  constructor(private readonly db: Pool) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToEntity(row: any): UserEntity {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async findById(id: string): Promise<UserEntity | null> {
    const query = `
      SELECT id, username, email, password_hash, role, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
    const { rows } = await this.db.query(query, [id]);
    if (rows.length === 0) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const query = `
      SELECT id, username, email, password_hash, role, created_at, updated_at
      FROM users
      WHERE email = $1
    `;
    const { rows } = await this.db.query(query, [email]);
    if (rows.length === 0) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async create(data: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity> {
    const query = `
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, password_hash, role, created_at, updated_at
    `;
    const values = [data.username, data.email, data.passwordHash, data.role];
    const { rows } = await this.db.query(query, values);
    return this.mapRowToEntity(rows[0]);
  }
}
