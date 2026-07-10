import { Request, Response } from 'express';
import type { IScheduledStreamStore } from '../../domain/interfaces';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('ScheduledStreamController');

export class ScheduledStreamController {
  constructor(private readonly store: IScheduledStreamStore) {
    this.getUpcomingStreams = this.getUpcomingStreams.bind(this);
    this.createScheduledStream = this.createScheduledStream.bind(this);
    this.addReminder = this.addReminder.bind(this);
    this.removeReminder = this.removeReminder.bind(this);
    this.checkReminder = this.checkReminder.bind(this);
  }

  async getUpcomingStreams(req: Request, res: Response): Promise<void> {
    try {
      const streams = await this.store.findUpcoming();
      res.json(streams);
    } catch (err) {
      logger.error('Failed to get upcoming streams', { error: String(err) });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createScheduledStream(req: Request, res: Response): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shopId = (req as any).user?.shopId;
      if (!shopId) {
        res.status(403).json({ error: 'Only streamers with a shop can schedule streams' });
        return;
      }

      const { title, description, scheduledTime, bannerUrl } = req.body;
      if (!title || !scheduledTime) {
        res.status(400).json({ error: 'Title and scheduledTime are required' });
        return;
      }

      const parsedTime = new Date(scheduledTime);
      if (isNaN(parsedTime.getTime())) {
        res.status(400).json({ error: 'Invalid scheduledTime format' });
        return;
      }

      const stream = await this.store.create({
        shopId,
        title,
        description,
        scheduledTime: parsedTime,
        bannerUrl,
      });

      res.status(201).json(stream);
    } catch (err) {
      logger.error('Failed to create scheduled stream', { error: String(err) });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async addReminder(req: Request, res: Response): Promise<void> {
    try {
      const streamId = req.params.streamId as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = (req as any).user?.id;

      if (!streamId) {
        res.status(400).json({ error: 'Stream ID is required' });
        return;
      }
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.store.addReminder(streamId, userId);
      res.json({ success: true, message: 'Reminder set successfully' });
    } catch (err) {
      logger.error('Failed to add reminder', { error: String(err) });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async removeReminder(req: Request, res: Response): Promise<void> {
    try {
      const streamId = req.params.streamId as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = (req as any).user?.id;

      if (!streamId) {
        res.status(400).json({ error: 'Stream ID is required' });
        return;
      }
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.store.removeReminder(streamId, userId);
      res.json({ success: true, message: 'Reminder removed successfully' });
    } catch (err) {
      logger.error('Failed to remove reminder', { error: String(err) });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async checkReminder(req: Request, res: Response): Promise<void> {
    try {
      const streamId = req.params.streamId as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = (req as any).user?.id;

      if (!streamId) {
        res.status(400).json({ error: 'Stream ID is required' });
        return;
      }
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const isSet = await this.store.isReminderSet(streamId, userId);
      res.json({ isReminderSet: isSet });
    } catch (err) {
      logger.error('Failed to check reminder', { error: String(err) });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
