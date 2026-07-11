import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mocked } from 'vitest';
import { CheckoutController } from '../../../src/http/controllers/checkout.controller';
import { AuctionController } from '../../../src/http/controllers/auction.controller';
import type {
  IProductStore,
  IOrderStore,
  IStockStore,
  IIdempotencyStore,
  IOrderQueue,
  IAuctionStore,
} from '../../../src/domain/interfaces';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../../src/http/middlewares/auth.middleware';

describe('Security Loophole Regression Tests', () => {
  describe('Checkout: Quantity Mismatch (Overselling)', () => {
    let mockProductStore: Mocked<IProductStore>;
    let mockOrderStore: Mocked<IOrderStore>;
    let mockStockStore: Mocked<IStockStore>;
    let mockIdempotencyStore: Mocked<IIdempotencyStore>;
    let mockOrderQueue: Mocked<IOrderQueue>;
    let controller: CheckoutController;

    let req: Partial<AuthenticatedRequest>;
    let res: Partial<Response>;
    let resJson: any;
    let resStatus: any;

    beforeEach(() => {
      mockProductStore = {
        findById: vi.fn().mockResolvedValue({ id: 'prod-123', price: 100, shopId: 'shop-456' }),
      } as unknown as Mocked<IProductStore>;

      mockOrderStore = {
        findByIdempotencyKey: vi.fn().mockResolvedValue(null),
      } as unknown as Mocked<IOrderStore>;

      mockStockStore = {
        atomicCheckout: vi.fn().mockResolvedValue('ok'),
        rollback: vi.fn(),
      } as unknown as Mocked<IStockStore>;

      mockIdempotencyStore = {
        setIfAbsent: vi.fn().mockResolvedValue(true),
      } as unknown as Mocked<IIdempotencyStore>;

      mockOrderQueue = {
        publish: vi.fn().mockResolvedValue(true),
      } as unknown as Mocked<IOrderQueue>;

      controller = new CheckoutController(
        mockProductStore,
        mockOrderStore,
        mockStockStore,
        mockIdempotencyStore,
        mockOrderQueue,
      );

      resJson = vi.fn();
      resStatus = vi.fn().mockReturnValue({ json: resJson });
      res = {
        status: resStatus,
        json: resJson,
      };

      req = {
        user: { id: 'user-123', username: 'buyer1', role: 'BUYER' },
        body: { productId: 'prod-123', quantity: 5 }, // Requesting quantity of 5!
        headers: { 'x-idempotency-key': 'idem-789' },
      };
    });

    it('should verify that quantity > 1 correctly passes quantity to stock reservation', async () => {
      await controller.checkout(req as AuthenticatedRequest, res as Response);

      // 1. Controller should return 202 accepted
      expect(resStatus).toHaveBeenCalledWith(202);

      // 2. Verified fix: StockStore.atomicCheckout is called WITH the quantity parameter (5)!
      expect(mockStockStore.atomicCheckout).toHaveBeenCalledWith('prod-123', 'user-123', 5);

      // 3. RabbitMQ event contains quantity = 5
      expect(mockOrderQueue.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 5,
          totalPrice: 500, // 5 * 100
        }),
      );
    });
  });

  describe('Auction: Decimal & Negative Bids Check', () => {
    let mockAuctionStore: Mocked<IAuctionStore>;
    let controller: AuctionController;

    let req: Partial<AuthenticatedRequest>;
    let res: Partial<Response>;
    let resJson: any;
    let resStatus: any;

    beforeEach(() => {
      mockAuctionStore = {
        findById: vi.fn().mockResolvedValue({
          id: 'auc-123',
          shopId: 'shop-456',
          title: 'Test Auction',
          startPrice: 200,
          currentPrice: 200,
          minIncrement: 10,
          status: 'ACTIVE',
        }),
        placeBid: vi.fn(),
      } as unknown as Mocked<IAuctionStore>;

      controller = new AuctionController(mockAuctionStore);

      resJson = vi.fn();
      resStatus = vi.fn().mockReturnValue({ json: resJson });
      res = {
        status: resStatus,
        json: resJson,
      };

      req = {
        user: { id: 'user-123', username: 'buyer1', role: 'BUYER' },
        params: { auctionId: 'auc-123' },
        body: { amount: -50 }, // Negative bid!
      };
    });

    it('should reject negative bids at the Controller level and prevent DB call', async () => {
      await controller.placeBid(req as AuthenticatedRequest, res as Response);

      // Verified fix: The controller input validation rejects the request early and does not call the DB!
      expect(mockAuctionStore.placeBid).not.toHaveBeenCalled();
      expect(resStatus).toHaveBeenCalledWith(400);
      expect(resJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Valid positive bid amount is required',
        }),
      );
    });
  });
});
