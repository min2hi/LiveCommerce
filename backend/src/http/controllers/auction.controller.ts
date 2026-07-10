import type { Request, Response } from 'express';
import type { IAuctionStore } from '../../domain/interfaces';
import { createLogger } from '../../../shared/logger';
import { pushEventToShop } from '../../sse/sse-manager';

const logger = createLogger('AuctionController');

export class AuctionController {
  constructor(private readonly store: IAuctionStore) {
    // Bind methods to ensure `this` context
    this.createAuction = this.createAuction.bind(this);
    this.getActiveAuction = this.getActiveAuction.bind(this);
    this.placeBid = this.placeBid.bind(this);
    this.getBids = this.getBids.bind(this);
    this.endAuction = this.endAuction.bind(this);
  }

  async createAuction(req: Request, res: Response): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shopId = (req as any).user?.shopId;
      if (!shopId) {
        res.status(403).json({ error: 'Only streamers can create auctions' });
        return;
      }

      const { title, startPrice, minIncrement, productId } = req.body;

      if (!title || startPrice === undefined || minIncrement === undefined) {
        res.status(400).json({ error: 'Missing required auction fields' });
        return;
      }

      // Check if there is already an active auction for this shop
      const activeAuction = await this.store.findActiveByShopId(shopId);
      if (activeAuction) {
        res.status(400).json({ error: 'An active auction already exists for this shop' });
        return;
      }

      const auction = await this.store.create({
        shopId,
        title,
        startPrice: Number(startPrice),
        currentPrice: Number(startPrice),
        minIncrement: Number(minIncrement),
        productId,
      });

      // Automatically activate it immediately
      await this.store.updateStatus(auction.id, 'ACTIVE');
      auction.status = 'ACTIVE';
      auction.startedAt = new Date();

      // Broadcast to all viewers in this shop's stream
      pushEventToShop(shopId, {
        id: crypto.randomUUID(),
        event: 'auction:started',
        data: { auction },
      });

      res.status(201).json(auction);
    } catch (err) {
      logger.error('Failed to create auction', { error: String(err) });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getActiveAuction(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.params.shopId as string;
      if (!shopId) {
        res.status(400).json({ error: 'Shop ID is required' });
        return;
      }

      const auction = await this.store.findActiveByShopId(shopId);
      if (!auction) {
        res.status(404).json({ error: 'No active auction found' });
        return;
      }

      res.json(auction);
    } catch (err) {
      logger.error('Failed to get active auction', { error: String(err) });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async placeBid(req: Request, res: Response): Promise<void> {
    try {
      const auctionId = req.params.auctionId as string;
      const { amount } = req.body;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (req as any).user;
      const userId = user?.id;
      const username = user?.username;

      if (!userId || !username) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!amount || typeof amount !== 'number') {
        res.status(400).json({ error: 'Valid bid amount is required' });
        return;
      }

      const bid = await this.store.placeBid(auctionId, userId, amount);
      const auction = await this.store.findById(auctionId);

      if (auction) {
        // Broadcast new bid to all viewers
        pushEventToShop(auction.shopId, {
          id: crypto.randomUUID(),
          event: 'auction:bid_placed',
          data: {
            auctionId,
            bidAmount: amount,
            userId,
            username,
          },
        });
      }

      res.json(bid);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Failed to place bid', { error: errorMessage });
      if (errorMessage.includes('must be at least') || errorMessage.includes('not active')) {
        res.status(400).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getBids(req: Request, res: Response): Promise<void> {
    try {
      const auctionId = req.params.auctionId as string;
      const bids = await this.store.getBids(auctionId, 10);
      res.json(bids);
    } catch (err) {
      logger.error('Failed to get bids', { error: String(err) });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async endAuction(req: Request, res: Response): Promise<void> {
    try {
      const auctionId = req.params.auctionId as string;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shopId = (req as any).user?.shopId;
      if (!shopId) {
        res.status(403).json({ error: 'Only streamers can end auctions' });
        return;
      }

      const auction = await this.store.findById(auctionId);
      if (!auction || auction.shopId !== shopId) {
        res.status(404).json({ error: 'Auction not found or unauthorized' });
        return;
      }

      const highestBid = await this.store.getHighestBid(auctionId);
      const winnerId = highestBid ? highestBid.userId : undefined;

      await this.store.endAuction(auctionId, winnerId);

      pushEventToShop(shopId, {
        id: crypto.randomUUID(),
        event: 'auction:ended',
        data: {
          auctionId,
          winnerId,
          winningBid: highestBid?.bidAmount,
        },
      });

      res.json({ success: true, winnerId });
    } catch (err) {
      logger.error('Failed to end auction', { error: String(err) });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
