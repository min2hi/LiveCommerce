import { Pool } from 'pg';
import type { IAuctionStore } from '../../domain/interfaces';
import type { AuctionEntity, AuctionBidEntity } from '../../domain/entities';

export class AuctionStore implements IAuctionStore {
  constructor(private readonly writeDb: Pool, private readonly readDb: Pool = writeDb) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRowToEntity(row: any): AuctionEntity {
    return {
      id: row.id,
      shopId: row.shop_id,
      productId: row.product_id || undefined,
      title: row.title,
      startPrice: parseFloat(row.start_price),
      currentPrice: parseFloat(row.current_price),
      minIncrement: parseFloat(row.min_increment),
      status: row.status as AuctionEntity['status'],
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      endedAt: row.ended_at ? new Date(row.ended_at) : undefined,
      winnerId: row.winner_id || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapBidRowToEntity(row: any): AuctionBidEntity {
    return {
      id: row.id,
      auctionId: row.auction_id,
      userId: row.user_id,
      bidAmount: parseFloat(row.bid_amount),
      createdAt: new Date(row.created_at),
    };
  }

  async create(
    data: Omit<
      AuctionEntity,
      'id' | 'status' | 'startedAt' | 'endedAt' | 'winnerId' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<AuctionEntity> {
    const query = `
      INSERT INTO auctions (shop_id, product_id, title, start_price, current_price, min_increment, status)
      VALUES ($1, $2, $3, $4, $4, $5, 'PENDING')
      RETURNING *
    `;
    const { rows } = await this.writeDb.query(query, [
      data.shopId,
      data.productId || null,
      data.title,
      data.startPrice,
      data.minIncrement,
    ]);
    return this.mapRowToEntity(rows[0]);
  }

  async findById(id: string): Promise<AuctionEntity | null> {
    const query = `SELECT * FROM auctions WHERE id = $1`;
    const { rows } = await this.readDb.query(query, [id]);
    if (rows.length === 0) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async findActiveByShopId(shopId: string): Promise<AuctionEntity | null> {
    const query = `
      SELECT * FROM auctions
      WHERE shop_id = $1 AND status = 'ACTIVE'
      ORDER BY started_at DESC
      LIMIT 1
    `;
    const { rows } = await this.readDb.query(query, [shopId]);
    if (rows.length === 0) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async updateStatus(id: string, status: AuctionEntity['status']): Promise<void> {
    const query = `
      UPDATE auctions
      SET status = $2,
          started_at = CASE WHEN $2 = 'ACTIVE' THEN NOW() ELSE started_at END
      WHERE id = $1
    `;
    await this.writeDb.query(query, [id, status]);
  }

  async placeBid(auctionId: string, userId: string, amount: number): Promise<AuctionBidEntity> {
    const client = await this.writeDb.connect();
    try {
      await client.query('BEGIN');

      // 1. Lock the auction row for update to prevent race conditions
      const auctionQuery = `SELECT current_price, min_increment, status FROM auctions WHERE id = $1 FOR UPDATE`;
      const { rows } = await client.query(auctionQuery, [auctionId]);

      if (rows.length === 0) throw new Error('Auction not found');
      const auction = rows[0];

      if (auction.status !== 'ACTIVE') {
        throw new Error('Auction is not active');
      }

      const currentPrice = parseFloat(auction.current_price);
      const minIncrement = parseFloat(auction.min_increment);

      if (amount < currentPrice + minIncrement) {
        throw new Error(`Bid amount must be at least ${currentPrice + minIncrement}`);
      }

      // 2. Insert the bid
      const insertBidQuery = `
        INSERT INTO auction_bids (auction_id, user_id, bid_amount)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const bidRes = await client.query(insertBidQuery, [auctionId, userId, amount]);

      // 3. Update the auction current_price
      const updateAuctionQuery = `UPDATE auctions SET current_price = $2 WHERE id = $1`;
      await client.query(updateAuctionQuery, [auctionId, amount]);

      await client.query('COMMIT');
      return this.mapBidRowToEntity(bidRes.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getHighestBid(auctionId: string): Promise<AuctionBidEntity | null> {
    const query = `
      SELECT * FROM auction_bids
      WHERE auction_id = $1
      ORDER BY bid_amount DESC
      LIMIT 1
    `;
    const { rows } = await this.readDb.query(query, [auctionId]);
    if (rows.length === 0) return null;
    return this.mapBidRowToEntity(rows[0]);
  }

  async getBids(auctionId: string, limit: number = 10): Promise<AuctionBidEntity[]> {
    const query = `
      SELECT * FROM auction_bids
      WHERE auction_id = $1
      ORDER BY bid_amount DESC, created_at DESC
      LIMIT $2
    `;
    const { rows } = await this.readDb.query(query, [auctionId, limit]);
    return rows.map((row) => this.mapBidRowToEntity(row));
  }

  async endAuction(id: string, winnerId?: string): Promise<void> {
    const query = `
      UPDATE auctions
      SET status = 'COMPLETED', ended_at = NOW(), winner_id = $2
      WHERE id = $1
    `;
    await this.writeDb.query(query, [id, winnerId || null]);
  }
}
