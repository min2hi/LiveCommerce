import type { Request, Response } from 'express';
import { registerSseClient, registerBuyerClient } from '../../sse/sse-manager';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class SseController {
  /**
   * Streamer/Admin SSE endpoint (authenticated).
   * Receives full telemetry: order_confirmed, revenue, etc.
   */
  connect = (req: AuthenticatedRequest, res: Response): void => {
    const shopId = req.user?.shopId;
    if (!shopId) {
      res.status(400).json({ error: 'Bad Request: Streamer must have an associated shop' });
      return;
    }

    registerSseClient(shopId, req, res);
  };

  /**
   * Buyer SSE endpoint (public, no auth required).
   * Receives lightweight stock_updated events only.
   */
  connectBuyer = (req: Request, res: Response): void => {
    const shopId = req.params.shopId;
    if (!shopId) {
      res.status(400).json({ error: 'Bad Request: shopId parameter is required' });
      return;
    }

    registerBuyerClient(shopId as string, req, res);
  };
}
