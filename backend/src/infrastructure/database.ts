import { Pool } from 'pg';
import { config } from '../config';

let writePool: Pool;
let readPool: Pool;

export function getWriteDbPool(): Pool {
  if (!writePool) {
    writePool = new Pool({
      host: config.postgres.host,
      port: config.postgres.port,
      user: config.postgres.user,
      password: config.postgres.password,
      database: config.postgres.database,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    writePool.on('error', (err) => {
      console.error('[PostgreSQL] Unexpected write pool error:', err);
    });
  }
  return writePool;
}

export function getReadDbPool(): Pool {
  if (!readPool) {
    readPool = new Pool({
      // Use POSTGRES_READ_HOST if provided, otherwise fallback to primary host
      host: process.env.POSTGRES_READ_HOST || config.postgres.host,
      port: config.postgres.port,
      user: config.postgres.user,
      password: config.postgres.password,
      database: config.postgres.database,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    readPool.on('error', (err) => {
      console.error('[PostgreSQL] Unexpected read pool error:', err);
    });
  }
  return readPool;
}

export function getDbPool(): Pool {
  // Backward compatibility alias, maps to write pool
  return getWriteDbPool();
}

export async function closeDbPool(): Promise<void> {
  if (writePool) {
    await writePool.end();
  }
  if (readPool) {
    await readPool.end();
  }
  console.log('[PostgreSQL] Pools closed cleanly.');
}
