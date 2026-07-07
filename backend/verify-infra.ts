import { Pool } from 'pg';
import { createClient } from 'redis';
import amqp from 'amqplib';
import { config } from './src/config/index';

async function verify() {
  console.log('--- Bắt đầu kiểm tra hạ tầng (Infrastructure) ---');
  let allGood = true;

  // 1. Kiểm tra Postgres
  try {
    const pool = new Pool(config.postgres);
    const res = await pool.query(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = $1',
      ['public'],
    );
    const tables = res.rows.map((r) => r.table_name);
    console.log('✅ Postgres: Kết nối thành công!');
    console.log(`   Các bảng hiện có: [${tables.join(', ')}]`);
    if (tables.length === 0) {
      console.log('   ⚠️ Cảnh báo: Chưa có bảng nào được tạo. Có thể init.sql chưa chạy.');
      allGood = false;
    }
    await pool.end();
  } catch (err: any) {
    console.error('❌ Postgres: Kết nối thất bại!', err.message);
    allGood = false;
  }

  // 2. Kiểm tra Redis
  try {
    const client = createClient({ url: `redis://${config.redis.host}:${config.redis.port}` });
    await client.connect();
    const ping = await client.ping();
    console.log(`✅ Redis: Kết nối thành công! (PING -> ${ping})`);
    await client.disconnect();
  } catch (err: any) {
    console.error('❌ Redis: Kết nối thất bại!', err.message);
    allGood = false;
  }

  // 3. Kiểm tra RabbitMQ
  try {
    const conn = await amqp.connect(config.rabbitmq.url);
    console.log('✅ RabbitMQ: Kết nối thành công!');
    await conn.close();
  } catch (err: any) {
    console.error('❌ RabbitMQ: Kết nối thất bại!', err.message);
    allGood = false;
  }

  console.log('--------------------------------------------------');
  if (allGood) {
    console.log('🎉 TẤT CẢ HẠ TẦNG ĐÃ SẴN SÀNG CHO VIỆC LẬP TRÌNH!');
  } else {
    console.log('⚠️ Cần sửa lỗi hạ tầng trước khi viết code.');
  }
}

verify().catch(console.error);
