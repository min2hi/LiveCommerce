import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mocked } from 'vitest';
import { CheckoutController } from '../../../src/http/controllers/checkout.controller';
import type {
  IProductStore,
  IOrderStore,
  IStockStore,
  IIdempotencyStore,
  IOrderQueue,
} from '../../../src/domain/interfaces';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../../src/http/middlewares/auth.middleware';

describe('CheckoutController', () => {
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
      findById: vi.fn(),
      findByShopId: vi.fn(),
      updateStock: vi.fn(),
    } as unknown as Mocked<IProductStore>;

    mockOrderStore = {
      create: vi.fn(),
      findByIdempotencyKey: vi.fn(),
      updateStatus: vi.fn(),
    } as unknown as Mocked<IOrderStore>;

    mockStockStore = {
      atomicCheckout: vi.fn(),
      rollback: vi.fn(),
      getStock: vi.fn(),
      setStock: vi.fn(),
    } as unknown as Mocked<IStockStore>;

    mockIdempotencyStore = {
      setIfAbsent: vi.fn(),
      get: vi.fn(),
    } as unknown as Mocked<IIdempotencyStore>;

    mockOrderQueue = {
      publish: vi.fn(),
      consume: vi.fn(),
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
      user: {
        id: 'user-123',
        username: 'buyer1',
        role: 'BUYER',
      },
      body: {
        productId: 'product-456',
        quantity: 1,
      },
      headers: {
        'x-idempotency-key': 'idemp-key-789',
      },
    };
  });

  it('should return 401 if req.user context is missing', async () => {
    req.user = undefined;
    await controller.checkout(req as AuthenticatedRequest, res as Response);
    expect(resStatus).toHaveBeenCalledWith(401);
  });

  it('should return 400 if productId or quantity is missing', async () => {
    req.body.productId = undefined;
    await controller.checkout(req as AuthenticatedRequest, res as Response);
    expect(resStatus).toHaveBeenCalledWith(400);
  });

  it('should return 400 if idempotency key is missing', async () => {
    req.headers = {};
    req.body.idempotencyKey = undefined;
    await controller.checkout(req as AuthenticatedRequest, res as Response);
    expect(resStatus).toHaveBeenCalledWith(400);
  });

  it('should return 200 with existing order if idempotency key is already processed', async () => {
    mockIdempotencyStore.setIfAbsent.mockResolvedValue(false);
    const mockOrder = { id: 'order-123' } as any;
    mockOrderStore.findByIdempotencyKey.mockResolvedValue(mockOrder);

    await controller.checkout(req as AuthenticatedRequest, res as Response);

    expect(mockOrderStore.findByIdempotencyKey).toHaveBeenCalledWith('user-123:idemp-key-789');
    expect(resStatus).toHaveBeenCalledWith(200);
    expect(resJson).toHaveBeenCalledWith({
      message: 'Order already processed',
      order: mockOrder,
    });
  });

  it('should return 409 if idempotency key setIfAbsent returns false and order is not in DB', async () => {
    mockIdempotencyStore.setIfAbsent.mockResolvedValue(false);
    mockOrderStore.findByIdempotencyKey.mockResolvedValue(null);

    await controller.checkout(req as AuthenticatedRequest, res as Response);

    expect(resStatus).toHaveBeenCalledWith(409);
  });

  it('should return 404 if product does not exist', async () => {
    mockIdempotencyStore.setIfAbsent.mockResolvedValue(true);
    mockProductStore.findById.mockResolvedValue(null);

    await controller.checkout(req as AuthenticatedRequest, res as Response);

    expect(resStatus).toHaveBeenCalledWith(404);
  });

  it('should return 409 if product is out of stock in Redis', async () => {
    mockIdempotencyStore.setIfAbsent.mockResolvedValue(true);
    mockProductStore.findById.mockResolvedValue({
      id: 'product-456',
      price: 10,
      shopId: 'shop-abc',
    } as any);
    mockStockStore.atomicCheckout.mockResolvedValue('out_of_stock');

    await controller.checkout(req as AuthenticatedRequest, res as Response);

    expect(resStatus).toHaveBeenCalledWith(409);
    expect(resJson).toHaveBeenCalledWith({ error: 'Product is out of stock' });
  });

  it('should queue order and return 202 if checkout is successful', async () => {
    mockIdempotencyStore.setIfAbsent.mockResolvedValue(true);
    mockProductStore.findById.mockResolvedValue({
      id: 'product-456',
      price: 10,
      shopId: 'shop-abc',
    } as any);
    mockStockStore.atomicCheckout.mockResolvedValue('ok');
    mockOrderQueue.publish.mockResolvedValue(true);

    await controller.checkout(req as AuthenticatedRequest, res as Response);

    expect(mockOrderQueue.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        productId: 'product-456',
        quantity: 1,
        totalPrice: 10,
        idempotencyKey: 'user-123:idemp-key-789',
      }),
    );
    expect(resStatus).toHaveBeenCalledWith(202);
  });
});
