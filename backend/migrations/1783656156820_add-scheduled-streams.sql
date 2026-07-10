-- Up Migration
CREATE TABLE IF NOT EXISTS scheduled_streams (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id        UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    title          VARCHAR(255) NOT NULL,
    description    TEXT,
    scheduled_time TIMESTAMPTZ NOT NULL,
    banner_url     VARCHAR(255),
    status         VARCHAR(20) NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'LIVE', 'COMPLETED')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stream_reminders (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id      UUID NOT NULL REFERENCES scheduled_streams(id) ON DELETE CASCADE,
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(stream_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_streams_shop_id ON scheduled_streams(shop_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_streams_status ON scheduled_streams(status);
CREATE INDEX IF NOT EXISTS idx_stream_reminders_stream_id ON stream_reminders(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_reminders_user_id ON stream_reminders(user_id);

CREATE TRIGGER set_updated_at_scheduled_streams
    BEFORE UPDATE ON scheduled_streams
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Down Migration
DROP TABLE IF EXISTS stream_reminders;
DROP TABLE IF EXISTS scheduled_streams;
