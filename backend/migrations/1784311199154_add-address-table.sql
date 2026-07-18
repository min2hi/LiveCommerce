-- Up Migration

CREATE TABLE IF NOT EXISTS addresses (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name   VARCHAR(100) NOT NULL,
    phone       VARCHAR(20) NOT NULL,
    street      VARCHAR(255) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    is_default  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure only one default address per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_default_user_id ON addresses(user_id) WHERE is_default = TRUE;

-- Index for querying user's addresses fast
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- Trigger to auto-update 'updated_at'
CREATE TRIGGER set_updated_at_addresses
    BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Add shipping address reference to orders
ALTER TABLE orders ADD COLUMN shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL;