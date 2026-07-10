import { Router } from 'express';
import { AuctionController } from '../controllers/auction.controller';
import { authMiddleware, roleGuard } from '../middlewares/auth.middleware';

export function getAuctionRouter(controller: AuctionController): Router {
  const router = Router();

  // Public: Get active auction for a shop
  router.get('/active/:shopId', controller.getActiveAuction);

  // Public (Authenticated Viewer): Place a bid
  router.post('/:auctionId/bid', authMiddleware, controller.placeBid);

  // Public: Get recent bids
  router.get('/:auctionId/bids', controller.getBids);

  // Protected (Streamer only): Create an auction
  router.post('/', authMiddleware, roleGuard(['STREAMER']), controller.createAuction);

  // Protected (Streamer only): End an auction
  router.post('/:auctionId/end', authMiddleware, roleGuard(['STREAMER']), controller.endAuction);

  return router;
}
