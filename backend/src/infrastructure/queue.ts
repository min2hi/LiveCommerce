import amqplib, { ChannelModel, Channel } from 'amqplib';
import { config } from '../config';

let connection: ChannelModel;
let channel: Channel;

export async function getRabbitMQChannel(): Promise<Channel> {
  if (!channel) {
    connection = await amqplib.connect(config.rabbitmq.url);
    channel = await connection.createChannel();

    connection.on('error', (err: Error) => console.error('[RabbitMQ] Connection error:', err));
    connection.on('close', () => console.warn('[RabbitMQ] Connection closed.'));

    // prefetch(1): Worker processes one message at a time — enforces Manual Ack safety
    await channel.prefetch(1);
    console.log('[RabbitMQ] Connected. Channel ready.');
  }
  return channel;
}

export async function closeRabbitMQConnection(): Promise<void> {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log('[RabbitMQ] Connection closed cleanly.');
  } catch (err) {
    console.error('[RabbitMQ] Error during close:', err);
  }
}
