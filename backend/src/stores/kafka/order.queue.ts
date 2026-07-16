import { Kafka, Producer, Consumer, Partitioners } from 'kafkajs';
import type { IOrderQueue } from '../../domain/interfaces';
import type { OrderPendingEvent } from '../../domain/entities';
import { createLogger } from '../../../shared/logger';
import { config } from '../../config';

const logger = createLogger('KafkaOrderQueue');

export class KafkaOrderQueue implements IOrderQueue {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'livecommerce-backend',
      brokers: config.kafka.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
    
    // Use LegacyPartitioner to avoid deprecation warnings in Kafkajs
    this.producer = this.kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
    this.consumer = this.kafka.consumer({ groupId: config.kafka.groupId });
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    logger.info(`[Kafka] Producer connected to brokers: ${config.kafka.brokers.join(',')}`);
  }

  async connectConsumer(): Promise<void> {
    await this.consumer.connect();
    logger.info(`[Kafka] Consumer connected to brokers: ${config.kafka.brokers.join(',')}`);
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    await this.consumer.disconnect();
    logger.info('[Kafka] Disconnected');
  }

  async publish(event: OrderPendingEvent): Promise<boolean> {
    try {
      await this.producer.send({
        topic: config.kafka.topic,
        messages: [
          {
            key: event.shopId, // Partition by shopId to maintain strict ordering per shop
            value: JSON.stringify(event),
            headers: {
              traceId: event.traceId
            }
          }
        ]
      });
      return true;
    } catch (err) {
      logger.error('[Kafka] Publish error', { error: err instanceof Error ? err.message : String(err) });
      return false;
    }
  }

  async consume(handler: (event: OrderPendingEvent) => Promise<void>): Promise<void> {
    await this.consumer.subscribe({ topic: config.kafka.topic, fromBeginning: true });
    
    await this.consumer.run({
      eachMessage: async ({ message, partition }) => {
        if (!message.value) return;
        try {
          const event: OrderPendingEvent = JSON.parse(message.value.toString());
          await handler(event);
        } catch (err) {
          logger.error(`[Kafka] Error processing message on partition ${partition}`, { 
            error: err instanceof Error ? err.message : String(err) 
          });
          // DLQ logic would go here
        }
      }
    });
  }
}
