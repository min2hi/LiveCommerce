-- Up Migration
CREATE TABLE IF NOT EXISTS livestreams (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    stream_key  VARCHAR(100) UNIQUE NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'LIVE', 'ENDED')),
    viewers     INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_livestreams_shop_id ON livestreams(shop_id);
CREATE INDEX IF NOT EXISTS idx_livestreams_status ON livestreams(status);

CREATE TRIGGER set_updated_at_livestreams
    BEFORE UPDATE ON livestreams
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Down Migration
DROP TABLE IF EXISTS livestreams;