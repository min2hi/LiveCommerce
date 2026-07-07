-- ============================================================
-- LiveCommerce Core - Database Initialization Script
-- PostgreSQL 16 + pgvector extension
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────
-- USERS
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username      VARCHAR(100) UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'streamer', 'admin')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- SHOPS
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shops (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- PRODUCTS
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id        UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name           VARCHAR(255) NOT NULL,
    description    TEXT,
    price          NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    stock          INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_flash_sale  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- ORDERS
-- idempotency_key: UNIQUE constraint prevents duplicate order rows
-- even if worker retries the DB insert
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    product_id       UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    shop_id          UUID NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    quantity         INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    total_price      NUMERIC(12, 2) NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                         CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED', 'COMPENSATED')),
    idempotency_key  VARCHAR(255) UNIQUE NOT NULL,  -- Edge Case 1: duplicate prevention
    trace_id         VARCHAR(100),                  -- Pillar 4: distributed tracing
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- KNOWLEDGE DOCS (AI RAG - pgvector)
-- shop_id is mandatory for multi-tenant data isolation
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_docs (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id    UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,  -- Isolation key
    content    TEXT NOT NULL,
    embedding  vector(1536),   -- OpenAI text-embedding-3-small dimension
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Products
CREATE INDEX IF NOT EXISTS idx_products_shop_id        ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_flash_sale      ON products(shop_id, is_flash_sale) WHERE is_flash_sale = TRUE;

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id           ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id           ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id        ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key   ON orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_orders_status            ON orders(status);

-- Knowledge Docs
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_shop_id   ON knowledge_docs(shop_id);

-- HNSW Vector Index (Pillar 3: sub-millisecond similarity search)
-- vector_cosine_ops = cosine distance, best for normalized OpenAI embeddings
CREATE INDEX IF NOT EXISTS hnsw_idx_knowledge_docs_embedding
    ON knowledge_docs
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ============================================================
-- UPDATED_AT trigger helper
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_shops
    BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_products
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_orders
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_knowledge_docs
    BEFORE UPDATE ON knowledge_docs
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
