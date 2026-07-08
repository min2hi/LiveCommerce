const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  });

  await client.connect();
  console.log('Connected to PG. Dropping tables...');

  await client.query(`
    DROP TRIGGER IF EXISTS set_updated_at_knowledge_docs ON knowledge_docs;
    DROP TRIGGER IF EXISTS set_updated_at_orders ON orders;
    DROP TRIGGER IF EXISTS set_updated_at_products ON products;
    DROP TRIGGER IF EXISTS set_updated_at_shops ON shops;
    DROP TRIGGER IF EXISTS set_updated_at_users ON users;
    DROP FUNCTION IF EXISTS trigger_set_updated_at();

    DROP TABLE IF EXISTS knowledge_docs CASCADE;
    DROP TABLE IF EXISTS orders CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
    DROP TABLE IF EXISTS shops CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS pgmigrations CASCADE;

    DROP EXTENSION IF EXISTS vector CASCADE;
    DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
  `);

  console.log('Database dropped clean!');
  await client.end();
}

main().catch(console.error);
