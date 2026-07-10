import { getDbPool } from './src/infrastructure/database';

async function seedAuction(): Promise<void> {
  const db = getDbPool();

  try {
    const shopId = 'a8762ee1-42d5-4c63-9a11-03e3e2875d92'; // Mock shop id from seed-test-data.ts

    // Clear old auctions for this shop
    await db.query('DELETE FROM auctions WHERE shop_id = $1', [shopId]);

    // Insert active auction
    const query = `
      INSERT INTO auctions (id, shop_id, title, start_price, current_price, min_increment, status, started_at)
      VALUES (uuid_generate_v4(), $1, 'Sony WH-1000XM5 Special Edition', 250.00, 250.00, 5.00, 'ACTIVE', NOW())
      RETURNING *
    `;
    const { rows } = await db.query(query, [shopId]);
    console.log('✅ Created Active Auction:', rows[0].id);
  } catch (err) {
    console.error('Failed to seed auction:', err);
  } finally {
    process.exit(0);
  }
}

void seedAuction();
