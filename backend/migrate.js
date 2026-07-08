const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB } = process.env;
process.env.DATABASE_URL = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;

// Import the hoisted node-pg-migrate executable script
import('../node_modules/node-pg-migrate/bin/node-pg-migrate.js');
