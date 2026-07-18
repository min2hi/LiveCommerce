import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface IAddress {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  street: string;
  city: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export class AddressStore {
  constructor(
    private writePool: Pool,
    private readPool: Pool,
  ) {}

  async getAddressesByUserId(userId: string): Promise<IAddress[]> {
    const result = await this.readPool.query(
      `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  async getAddressById(id: string, userId: string): Promise<IAddress | null> {
    const result = await this.readPool.query(
      `SELECT * FROM addresses WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    return result.rows[0] || null;
  }

  async createAddress(
    userId: string,
    fullName: string,
    phone: string,
    street: string,
    city: string,
    isDefault: boolean,
  ): Promise<IAddress> {
    const client = await this.writePool.connect();
    try {
      await client.query('BEGIN');

      // If isDefault is true, unset default for other addresses
      if (isDefault) {
        await client.query(`UPDATE addresses SET is_default = false WHERE user_id = $1`, [userId]);
      }

      // Check if user has no addresses, if so, make this one default
      if (!isDefault) {
        const countRes = await client.query(`SELECT COUNT(*) FROM addresses WHERE user_id = $1`, [
          userId,
        ]);
        if (parseInt(countRes.rows[0].count) === 0) {
          isDefault = true;
        }
      }

      const id = uuidv4();
      const result = await client.query(
        `INSERT INTO addresses (id, user_id, full_name, phone, street, city, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [id, userId, fullName, phone, street, city, isDefault],
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateAddress(
    id: string,
    userId: string,
    fullName: string,
    phone: string,
    street: string,
    city: string,
    isDefault: boolean,
  ): Promise<IAddress | null> {
    const client = await this.writePool.connect();
    try {
      await client.query('BEGIN');

      if (isDefault) {
        await client.query(
          `UPDATE addresses SET is_default = false WHERE user_id = $1 AND id != $2`,
          [userId, id],
        );
      } else {
        // Cannot unset default if it's the only default address,
        // unless they are deleting it or we enforce always having one default.
        // For MVP, we will allow it, or just let DB throw error if they try to unset when it's required (but our DB index only enforces unique true, not required true).
      }

      const result = await client.query(
        `UPDATE addresses 
         SET full_name = $1, phone = $2, street = $3, city = $4, is_default = $5, updated_at = NOW()
         WHERE id = $6 AND user_id = $7
         RETURNING *`,
        [fullName, phone, street, city, isDefault, id, userId],
      );

      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteAddress(id: string, userId: string): Promise<boolean> {
    const result = await this.writePool.query(
      `DELETE FROM addresses WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}
