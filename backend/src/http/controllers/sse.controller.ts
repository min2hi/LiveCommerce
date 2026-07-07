import type { Response } from 'express';
import { registerSseClient } from '../../sse/sse-manager';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class SseController {
  connect = (req: AuthenticatedRequest, res: Response): void => {
    const shopId = req.user?.shopId;
    if (!shopId) {
      res.status(400).json({ error: 'Bad Request: Streamer must have an associated shop' });
      return;
    }

    registerSseClient(shopId, req, res);
  };
}
