import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { ILivestreamStore } from '../../domain/interfaces';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('LivestreamController');

export class LivestreamController {
  constructor(private readonly livestreamStore: ILivestreamStore) {}

  startStream = async (req: Request, res: Response): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (req as any).user;
      if (!user || user.role !== 'STREAMER' || !user.shopId) {
        res
          .status(403)
          .json({ error: 'Forbidden: Only streamers with an associated shop can stream' });
        return;
      }

      const { title } = req.body;
      if (!title || typeof title !== 'string') {
        res.status(400).json({ error: 'Bad Request: Title is required and must be a string' });
        return;
      }

      // Generate secure unique stream key
      const streamKey = `live_${uuidv4().replace(/-/g, '')}`;

      const stream = await this.livestreamStore.create({
        shopId: user.shopId,
        title,
        streamKey,
      });

      // Update status to LIVE immediately
      await this.livestreamStore.updateStatus(stream.id, 'LIVE');
      stream.status = 'LIVE';

      logger.info('Livestream session started:', { streamId: stream.id, shopId: user.shopId });
      res.status(201).json(stream);
    } catch (err) {
      logger.error('Failed to start livestream:', {
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  endStream = async (req: Request, res: Response): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (req as any).user;
      const id = req.params.id as string;

      const stream = await this.livestreamStore.findById(id);
      if (!stream) {
        res.status(404).json({ error: 'Not Found: Livestream session not found' });
        return;
      }

      if (stream.shopId !== user?.shopId && user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Forbidden: You do not own this stream session' });
        return;
      }

      await this.livestreamStore.updateStatus(id, 'ENDED', new Date());
      logger.info('Livestream session ended:', { streamId: id });
      res.json({ message: 'Livestream ended successfully' });
    } catch (err) {
      logger.error('Failed to end livestream:', {
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  getActiveStreams = async (_req: Request, res: Response): Promise<void> => {
    try {
      const activeStreams = await this.livestreamStore.findActive();
      res.json(activeStreams);
    } catch (err) {
      logger.error('Failed to get active livestreams:', {
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  updateViewers = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { viewers } = req.body;

      if (typeof viewers !== 'number' || viewers < 0) {
        res.status(400).json({ error: 'Bad Request: viewers count must be a non-negative number' });
        return;
      }

      await this.livestreamStore.updateViewers(id, viewers);
      res.json({ message: 'Viewers count updated successfully', viewers });
    } catch (err) {
      logger.error('Failed to update viewers count:', {
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
