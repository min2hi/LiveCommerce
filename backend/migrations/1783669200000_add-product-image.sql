-- Up Migration
ALTER TABLE products ADD COLUMN image_url VARCHAR(255);

-- Down Migration
ALTER TABLE products DROP COLUMN image_url;
