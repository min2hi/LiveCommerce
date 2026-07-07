import { Pool } from 'pg';
import { config } from '../src/config/index';

async function verify() {
  console.log('--- VERIFYING POSTGRES DB ORDER COUNT ---');
  const pool = new Pool(config.postgres);

  try {
    const res = await pool.query('SELECT status, count(*) as count FROM orders GROUP BY status');
    console.log('Postgres Order Status Summary:');
    console.table(res.rows);

    const totalRes = await pool.query('SELECT count(*) as total FROM orders');
    console.log(`Total Orders in DB: ${totalRes.rows[0].total}`);
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await pool.end();
  }
}

verify().catch(console.error);
