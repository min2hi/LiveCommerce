import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mocked } from 'vitest';
import { OrderWorkerService } from '../../../src/services/order-worker.service';
import type { IOrderStore, IProductStore, IStockStore } from '../../../src/domain/interfaces';
import type { OrderPendingEvent, OrderEntity } from '../../../src/domain/entities';

describe('OrderWorkerService (Saga & Asynchronous Worker)', () => {
  let mockOrderStore: Mocked<IOrderStore>;
  let mockProductStore: Mocked<IProductStore>;
  let mockStockStore: Mocked<IStockStore>;
  let workerService: OrderWorkerService;

  const testEvent: OrderPendingEvent = {
    userId: 'user-123',
    productId: 'product-456',
    shopId: 'shop-789',
    quantity: 2,
    totalPrice: 100.0,
    idempotencyKey: 'idemp-key-xyz',
    traceId: 'trace-1234',
  };

  const testOrder: OrderEntity = {
    id: 'order-uuid',
    userId: testEvent.userId,
    productId: testEvent.productId,
    shopId: testEvent.shopId,
    quantity: testEvent.quantity,
    totalPrice: testEvent.totalPrice,
    status: 'PENDING',
    idempotencyKey: testEvent.idempotencyKey,
    traceId: testEvent.traceId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockOrderStore = {
      create: vi.fn(),
      findByIdempotencyKey: vi.fn(),
      updateStatus: vi.fn(),
    } as unknown as Mocked<IOrderStore>;

    mockProductStore = {
      findById: vi.fn(),
      findByShopId: vi.fn(),
      updateStock: vi.fn(),
    } as unknown as Mocked<IProductStore>;

    mockStockStore = {
      atomicCheckout: vi.fn(),
      rollback: vi.fn(),
      getStock: vi.fn(),
      setStock: vi.fn(),
    } as unknown as Mocked<IStockStore>;

    workerService = new OrderWorkerService(mockOrderStore, mockProductStore, mockStockStore);
  });

  it('should skip processing if the order already exists (Idempotency check)', async () => {
    mockOrderStore.findByIdempotencyKey.mockResolvedValue(testOrder);

    await workerService.handleOrderPending(testEvent);

    expect(mockOrderStore.findByIdempotencyKey).toHaveBeenCalledWith(testEvent.idempotencyKey);
    expect(mockOrderStore.create).not.toHaveBeenCalled();
    expect(mockProductStore.updateStock).not.toHaveBeenCalled();
    expect(mockStockStore.rollback).not.toHaveBeenCalled();
  });

  it('should successfully create order and update product stock in Postgres', async () => {
    mockOrderStore.findByIdempotencyKey.mockResolvedValue(null);
    mockOrderStore.create.mockResolvedValue(testOrder);

    await workerService.handleOrderPending(testEvent);

    expect(mockOrderStore.create).toHaveBeenCalledWith(testEvent);
    expect(mockProductStore.updateStock).toHaveBeenCalledWith(
      testEvent.productId,
      -testEvent.quantity,
    );
    expect(mockOrderStore.updateStatus).toHaveBeenCalledWith(testOrder.id, 'CONFIRMED');
    expect(mockStockStore.rollback).not.toHaveBeenCalled();
  });

  it('should trigger Saga rollback on Redis if order creation in DB fails', async () => {
    mockOrderStore.findByIdempotencyKey.mockResolvedValue(null);
    mockOrderStore.create.mockRejectedValue(new Error('Postgres insertion timeout'));

    await expect(workerService.handleOrderPending(testEvent)).rejects.toThrow(
      'Postgres insertion timeout',
    );

    expect(mockOrderStore.create).toHaveBeenCalledWith(testEvent);
    expect(mockProductStore.updateStock).not.toHaveBeenCalled();
    expect(mockOrderStore.updateStatus).not.toHaveBeenCalled();
    expect(mockStockStore.rollback).toHaveBeenCalledWith(testEvent.productId, testEvent.userId);
  });

  it('should mark order as FAILED and trigger Saga rollback if updating stock fails', async () => {
    mockOrderStore.findByIdempotencyKey.mockResolvedValue(null);
    mockOrderStore.create.mockResolvedValue(testOrder);
    mockProductStore.updateStock.mockRejectedValue(
      new Error('Postgres foreign key constraint error'),
    );

    await expect(workerService.handleOrderPending(testEvent)).rejects.toThrow(
      'Postgres foreign key constraint error',
    );

    expect(mockOrderStore.create).toHaveBeenCalledWith(testEvent);
    expect(mockProductStore.updateStock).toHaveBeenCalledWith(
      testEvent.productId,
      -testEvent.quantity,
    );
    expect(mockOrderStore.updateStatus).toHaveBeenCalledWith(testOrder.id, 'FAILED');
    expect(mockStockStore.rollback).toHaveBeenCalledWith(testEvent.productId, testEvent.userId);
  });
});
