import type { Channel } from 'amqplib';
import type { IOrderQueue } from '../../domain/interfaces';
import type { OrderPendingEvent } from '../../domain/entities';

export class OrderQueue implements IOrderQueue {
  private readonly exchange = 'order.exchange';
  private readonly routingKey = 'order.pending';
  private readonly queueName = 'order.queue';

  constructor(private readonly channel: Channel) {}

  async publish(event: OrderPendingEvent): Promise<boolean> {
    const message = Buffer.from(JSON.stringify(event));
    return this.channel.publish(this.exchange, this.routingKey, message, {
      persistent: true,
      headers: {
        'x-trace-id': event.traceId,
      },
    });
  }

  async consume(handler: (event: OrderPendingEvent) => Promise<void>): Promise<void> {
    await this.channel.consume(this.queueName, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString()) as OrderPendingEvent;
        await handler(content);
        this.channel.ack(msg);
      } catch (err) {
        console.error('[OrderQueue] Failed to process queue message:', err);
        // Reject message and do NOT requeue to trigger dead-lettering (DLX/DLQ)
        this.channel.nack(msg, false, false);
      }
    });
  }
}
