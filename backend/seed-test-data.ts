import { Pool } from 'pg';
import { createClient } from 'redis';
import crypto from 'crypto';
import { config } from './src/config/index';

function hashPassword(password: string): string {
  const salt = 'livecommerce-salt';
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

async function seed() {
  console.log('--- Start Seeding Test Data ---');
  const pool = new Pool(config.postgres);
  const redis = createClient({ url: `redis://${config.redis.host}:${config.redis.port}` });
  await redis.connect();

  try {
    // 1. Create Streamer User
    const streamerUsername = 'streamer1';
    const streamerEmail = 'streamer1@livecommerce.com';
    const passwordHash = hashPassword('password123');

    let streamerId: string;
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [streamerEmail]);

    if (userCheck.rows.length > 0) {
      streamerId = userCheck.rows[0].id;
      console.log(`✅ Streamer user already exists: ${streamerId}`);
    } else {
      const userRes = await pool.query(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [streamerUsername, streamerEmail, passwordHash, 'streamer'],
      );
      streamerId = userRes.rows[0].id;
      console.log(`✅ Created Streamer user: ${streamerId}`);
    }

    // 2. Create Shop for Streamer
    let shopId: string;
    const shopCheck = await pool.query('SELECT id FROM shops WHERE owner_id = $1', [streamerId]);

    if (shopCheck.rows.length > 0) {
      shopId = shopCheck.rows[0].id;
      console.log(`✅ Shop already exists: ${shopId}`);
    } else {
      const shopRes = await pool.query(
        `INSERT INTO shops (owner_id, name, description)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [streamerId, "Streamer1's Tech Shop", 'Premium gadgets and flash sales!'],
      );
      shopId = shopRes.rows[0].id;
      console.log(`✅ Created Shop: ${shopId}`);
    }

    // 3. Create Product for Flash Sale
    // Match the target product ID in the k6 test script: d3b4a9cf-5a5d-47b0-b332-e6a7ea5af782
    const targetProductId = 'd3b4a9cf-5a5d-47b0-b332-e6a7ea5af782';
    const prodCheck = await pool.query('SELECT id FROM products WHERE id = $1', [targetProductId]);

    if (prodCheck.rows.length > 0) {
      await pool.query(
        'UPDATE products SET stock = 100, is_flash_sale = TRUE, price = 299.00 WHERE id = $1',
        [targetProductId],
      );
      console.log(`✅ Updated existing Product stock to 100: ${targetProductId}`);
    } else {
      await pool.query(
        `INSERT INTO products (id, shop_id, name, description, price, stock, is_flash_sale)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          targetProductId,
          shopId,
          'Sony WH-1000XM5',
          'Industry leading noise canceling headphones',
          299.0,
          100,
          true,
        ],
      );
      console.log(`✅ Created Product: ${targetProductId}`);
    }

    // 4. Initialize Redis Stock
    const stockKey = `product:stock:${targetProductId}`;
    const buyersKey = `product:buyers:${targetProductId}`;

    await redis.set(stockKey, '100');
    await redis.del(buyersKey);
    console.log(`✅ Redis stock initialized to 100 for key: ${stockKey}`);
    console.log(`✅ Redis buyers set cleared for key: ${buyersKey}`);

    // 5. Seed Scheduled Streams
    await pool.query('DELETE FROM scheduled_streams');
    const scheduledStreams = [
      {
        title: 'Tech Talk Live: Next-Gen Smart Home Setup',
        description:
          'Discover the latest automation gadgets and premium home integration with 20% off!',
        scheduled_time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        banner_url: 'https://picsum.photos/seed/smarthome/600/400',
      },
      {
        title: 'Beauty Hacks with Linda: Glow Skin Secret Deals',
        description: 'Linda showcases organic skincare products and exclusive bundle packages.',
        scheduled_time: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
        banner_url: 'https://picsum.photos/seed/beauty/600/400',
      },
      {
        title: 'Unboxing RTX 5090 Showcase & Benchmarks',
        description: 'Live testing, gaming benchmarks, and flash sales for limited RTX cards.',
        scheduled_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        banner_url: 'https://picsum.photos/seed/rtx5090/600/400',
      },
      {
        title: 'Mechanical Keyboard Build with KeyCrafters',
        description: 'Building custom typing sound profiles and giving away stabilizers.',
        scheduled_time: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days from now
        banner_url: 'https://picsum.photos/seed/keyboard/600/400',
      },
      {
        title: 'Premium Audio Show: Headphone Shootout!',
        description: 'Comparing Sony WH-1000XM5, Bose Ultra, and Apple AirPods Max live.',
        scheduled_time: new Date(Date.now() + 72 * 60 * 60 * 1000), // 3 days from now
        banner_url: 'https://picsum.photos/seed/headphones/600/400',
      },
    ];

    for (const s of scheduledStreams) {
      await pool.query(
        `INSERT INTO scheduled_streams (shop_id, title, description, scheduled_time, banner_url, status)
         VALUES ($1, $2, $3, $4, $5, 'UPCOMING')`,
        [shopId, s.title, s.description, s.scheduled_time, s.banner_url],
      );
    }
    console.log('✅ Seeded 5 upcoming scheduled streams');

    console.log('\n🎉 Seed completed successfully!');
    console.log(`Use Product ID: ${targetProductId}`);
  } catch (err: any) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await pool.end();
    await redis.disconnect();
  }
}

seed().catch(console.error);
