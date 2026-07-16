-- Up Migration
ALTER TABLE products ADD COLUMN flash_sale_end_time TIMESTAMP;

-- Down Migration
ALTER TABLE products DROP COLUMN flash_sale_end_time;
