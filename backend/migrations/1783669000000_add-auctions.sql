-- Up Migration
CREATE TABLE IF NOT EXISTS auctions (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id        UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    product_id     UUID REFERENCES products(id) ON DELETE SET NULL,
    title          VARCHAR(255) NOT NULL,
    start_price    DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    current_price  DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    min_increment  DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    status         VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    started_at     TIMESTAMPTZ,
    ended_at       TIMESTAMPTZ,
    winner_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auction_bids (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id     UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bid_amount     DECIMAL(10, 2) NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auctions_shop_id ON auctions(shop_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id ON auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_user_id ON auction_bids(user_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_amount ON auction_bids(bid_amount DESC);

CREATE TRIGGER set_updated_at_auctions
    BEFORE UPDATE ON auctions
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Down Migration
DROP TABLE IF EXISTS auction_bids;
DROP TABLE IF EXISTS auctions;
