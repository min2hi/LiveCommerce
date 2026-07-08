-- Drop Triggers
DROP TRIGGER IF EXISTS set_updated_at_knowledge_docs ON knowledge_docs;
DROP TRIGGER IF EXISTS set_updated_at_orders ON orders;
DROP TRIGGER IF EXISTS set_updated_at_products ON products;
DROP TRIGGER IF EXISTS set_updated_at_shops ON shops;
DROP TRIGGER IF EXISTS set_updated_at_users ON users;

-- Drop Trigger Function
DROP FUNCTION IF EXISTS trigger_set_updated_at();

-- Drop Indexes
DROP INDEX IF EXISTS hnsw_idx_knowledge_docs_embedding;
DROP INDEX IF EXISTS idx_knowledge_docs_shop_id;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_idempotency_key;
DROP INDEX IF EXISTS idx_orders_product_id;
DROP INDEX IF EXISTS idx_orders_shop_id;
DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_products_flash_sale;
DROP INDEX IF EXISTS idx_products_shop_id;

-- Drop Tables (in dependency-respecting reverse order)
DROP TABLE IF EXISTS knowledge_docs CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop Extensions (optional, but clean)
DROP EXTENSION IF EXISTS vector CASCADE;
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
