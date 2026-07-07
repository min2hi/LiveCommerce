import { Pool } from 'pg';
import { createClient } from 'redis';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { config } from '../src/config/index';

function hashPassword(password: string): string {
  const salt = 'livecommerce-salt';
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

async function seed() {
  console.log('--- ADVANCED SEEDING FOR K6 CONCURRENCY TEST ---');

  const pool = new Pool(config.postgres);
  const redis = createClient({ url: `redis://${config.redis.host}:${config.redis.port}` });
  await redis.connect();

  try {
    // 1. Create Streamer & Shop if not exists
    let streamerId: string;
    const streamerRes = await pool.query('SELECT id FROM users WHERE email = $1', [
      'k6_streamer@example.com',
    ]);
    if (streamerRes.rows.length > 0) {
      streamerId = streamerRes.rows[0].id;
    } else {
      const insertStreamer = `
        INSERT INTO users (username, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      const res = await pool.query(insertStreamer, [
        'k6_streamer',
        'k6_streamer@example.com',
        hashPassword('secret'),
        'streamer',
      ]);
      streamerId = res.rows[0].id;
    }

    let shopId: string;
    const shopRes = await pool.query('SELECT id FROM shops WHERE owner_id = $1', [streamerId]);
    if (shopRes.rows.length > 0) {
      shopId = shopRes.rows[0].id;
    } else {
      const insertShop = `
        INSERT INTO shops (owner_id, name, description)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      const res = await pool.query(insertShop, [streamerId, 'K6 Test Shop', 'Shop description']);
      shopId = res.rows[0].id;
    }
    console.log(`Streamer and Shop ready. Shop ID: ${shopId}`);

    // 2. Bulk Insert 500 Buyer Users
    console.log('Bulk inserting 500 buyer users...');
    const passHash = hashPassword('secret');
    const bulkInsertQuery = `
      INSERT INTO users (username, email, password_hash, role)
      SELECT 
        'k6_buyer_' || i, 
        'k6_buyer_' || i || '@example.com', 
        $1, 
        'buyer'
      FROM generate_series(1, 500) AS i
      ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
      RETURNING id, username, email;
    `;
    const buyerResult = await pool.query(bulkInsertQuery, [passHash]);
    const buyers = buyerResult.rows;
    console.log(`Inserted/Updated ${buyers.length} buyer users.`);

    // 3. Create Flash Sale Product
    const productId = 'd3b4a9cf-5a5d-47b0-b332-e6a7ea5af782';
    const productRes = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
    if (productRes.rows.length > 0) {
      await pool.query(
        'UPDATE products SET stock = 100, price = 10.00, is_flash_sale = true WHERE id = $1',
        [productId],
      );
    } else {
      const insertProduct = `
        INSERT INTO products (id, shop_id, name, description, price, stock, is_flash_sale)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await pool.query(insertProduct, [
        productId,
        shopId,
        'iPhone 15 Flash Sale',
        'Limited flash sale product',
        10.0,
        100,
        true,
      ]);
    }
    console.log(`Flash Sale Product ready. ID: ${productId}`);

    // 4. Reset Redis Stock
    const stockKey = `product:stock:${productId}`;
    const buyersKey = `product:buyers:${productId}`;
    await redis.multi().set(stockKey, '100').del(buyersKey).exec();
    console.log(`Redis stock reset to 100.`);

    // 5. Generate and sign 500 JWTs
    console.log('Generating 500 JWT tokens...');
    const tokens: string[] = [];
    for (const buyer of buyers) {
      const token = jwt.sign(
        {
          id: buyer.id,
          username: buyer.username,
          role: 'BUYER',
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] },
      );
      tokens.push(token);
    }

    // Save tokens to tests/load/tokens.json
    const tokensFilePath = path.join(__dirname, '../../tests/load/tokens.json');
    fs.writeFileSync(tokensFilePath, JSON.stringify(tokens, null, 2));
    console.log(`Saved 500 JWT tokens to ${tokensFilePath}`);

    console.log('\n==================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log(`PRODUCT_ID: ${productId}`);
    console.log('==================================================\n');
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await pool.end();
    await redis.disconnect();
  }
}

seed().catch(console.error);
