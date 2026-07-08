import type { Channel } from 'amqplib';
import type { IOrderQueue } from '../../domain/interfaces';
import type { OrderPendingEvent } from '../../domain/entities';

import { traceStore } from '../../../shared/trace-context';
import { v4 as uuidv4 } from 'uuid';

import { rabbitmqMessagesTotal } from '../../infrastructure/metrics';

export class OrderQueue implements IOrderQueue {
  private readonly exchange = 'order.exchange';
  private readonly routingKey = 'order.pending';
  private readonly queueName = 'order.queue';

  constructor(private readonly channel: Channel) {}

  async publish(event: OrderPendingEvent): Promise<boolean> {
    const message = Buffer.from(JSON.stringify(event));
    try {
      const result = this.channel.publish(this.exchange, this.routingKey, message, {
        persistent: true,
        headers: {
          'x-trace-id': event.traceId,
        },
      });
      if (result) {
        rabbitmqMessagesTotal.inc({ queue: 'order.queue', action: 'publish' });
      }
      return result;
    } catch (err) {
      rabbitmqMessagesTotal.inc({ queue: 'order.queue', action: 'publish_error' });
      throw err;
    }
  }

  async consume(handler: (event: OrderPendingEvent) => Promise<void>): Promise<void> {
    await this.channel.consume(this.queueName, (msg) => {
      if (!msg) return;

      void (async (): Promise<void> => {
        const traceId = (msg.properties.headers?.['x-trace-id'] as string) || uuidv4();

        await traceStore.run(traceId, async () => {
          try {
            const content = JSON.parse(msg.content.toString()) as OrderPendingEvent;
            content.traceId = traceId;
            await handler(content);
            this.channel.ack(msg);
            rabbitmqMessagesTotal.inc({ queue: 'order.queue', action: 'consume_ack' });
          } catch (err) {
            console.error('[OrderQueue] Failed to process queue message:', err);
            // Reject message and do NOT requeue to trigger dead-lettering (DLX/DLQ)
            this.channel.nack(msg, false, false);
            rabbitmqMessagesTotal.inc({ queue: 'order.queue', action: 'consume_nack' });
          }
        });
      })();
    });
  }
}
