import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mocked } from 'vitest';
import { LivestreamController } from '../../../src/http/controllers/livestream.controller';
import type { ILivestreamStore } from '../../../src/domain/interfaces';
import type { Response, Request } from 'express';

describe('LivestreamController', () => {
  let mockLivestreamStore: Mocked<ILivestreamStore>;
  let controller: LivestreamController;

  let req: Partial<Request>;
  let res: Partial<Response>;
  let resJson: any;
  let resStatus: any;

  beforeEach(() => {
    mockLivestreamStore = {
      create: vi.fn(),
      findById: vi.fn(),
      findByStreamKey: vi.fn(),
      findByShopId: vi.fn(),
      findActive: vi.fn(),
      updateStatus: vi.fn(),
      updateViewers: vi.fn(),
    } as unknown as Mocked<ILivestreamStore>;

    controller = new LivestreamController(mockLivestreamStore);

    resJson = vi.fn();
    resStatus = vi.fn().mockReturnValue({ json: resJson });
    res = {
      status: resStatus,
      json: resJson,
    };

    req = {
      user: {
        id: 'user-streamer-1',
        username: 'streamer1',
        role: 'STREAMER',
        shopId: 'shop-streamer-1',
      },
      body: {
        title: 'Custom Mech Keyboard Build',
      },
      params: {},
    } as any;
  });

  describe('startStream', () => {
    it('should return 403 if req.user context is missing or not a streamer', async () => {
      (req as any).user = undefined;
      await controller.startStream(req as Request, res as Response);
      expect(resStatus).toHaveBeenCalledWith(403);
    });

    it('should return 400 if title is missing', async () => {
      req.body.title = undefined;
      await controller.startStream(req as Request, res as Response);
      expect(resStatus).toHaveBeenCalledWith(400);
    });

    it('should create stream session and return 201 on success', async () => {
      const mockStream = {
        id: 'stream-123',
        shopId: 'shop-streamer-1',
        title: 'Custom Mech Keyboard Build',
        streamKey: 'live_abcdef123',
        status: 'PENDING',
        viewers: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockLivestreamStore.create.mockResolvedValue(mockStream as any);

      await controller.startStream(req as Request, res as Response);

      expect(mockLivestreamStore.create).toHaveBeenCalledWith(
        expect.objectContaining({
          shopId: 'shop-streamer-1',
          title: 'Custom Mech Keyboard Build',
          streamKey: expect.stringMatching(/^live_/),
        }),
      );
      expect(mockLivestreamStore.updateStatus).toHaveBeenCalledWith('stream-123', 'LIVE');
      expect(resStatus).toHaveBeenCalledWith(201);
      expect(resJson).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'stream-123',
          status: 'LIVE',
        }),
      );
    });
  });

  describe('endStream', () => {
    it('should return 404 if stream session is not found', async () => {
      req.params = { id: 'stream-not-found' };
      mockLivestreamStore.findById.mockResolvedValue(null);

      await controller.endStream(req as Request, res as Response);

      expect(resStatus).toHaveBeenCalledWith(404);
    });

    it('should return 403 if user is not the owner of the shop stream', async () => {
      req.params = { id: 'stream-123' };

      (req as any).user = {
        role: 'STREAMER',
        shopId: 'different-shop-id',
      };
      mockLivestreamStore.findById.mockResolvedValue({
        id: 'stream-123',
        shopId: 'shop-streamer-1',
      } as any);

      await controller.endStream(req as Request, res as Response);

      expect(resStatus).toHaveBeenCalledWith(403);
    });

    it('should update status to ENDED and return 200 on success', async () => {
      req.params = { id: 'stream-123' };
      mockLivestreamStore.findById.mockResolvedValue({
        id: 'stream-123',
        shopId: 'shop-streamer-1',
      } as any);

      await controller.endStream(req as Request, res as Response);

      expect(mockLivestreamStore.updateStatus).toHaveBeenCalledWith(
        'stream-123',
        'ENDED',
        expect.any(Date),
      );
      expect(resJson).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Livestream ended successfully' }),
      );
    });
  });

  describe('getActiveStreams', () => {
    it('should return active streams list', async () => {
      const mockActive = [{ id: 'stream-1' }, { id: 'stream-2' }];
      mockLivestreamStore.findActive.mockResolvedValue(mockActive as any);

      await controller.getActiveStreams(req as Request, res as Response);

      expect(resJson).toHaveBeenCalledWith(mockActive);
    });
  });

  describe('updateViewers', () => {
    it('should return 400 if viewers count is not a number or negative', async () => {
      req.params = { id: 'stream-123' };
      req.body = { viewers: -10 };

      await controller.updateViewers(req as Request, res as Response);

      expect(resStatus).toHaveBeenCalledWith(400);
    });

    it('should call store and return 200 on success', async () => {
      req.params = { id: 'stream-123' };
      req.body = { viewers: 150 };

      await controller.updateViewers(req as Request, res as Response);

      expect(mockLivestreamStore.updateViewers).toHaveBeenCalledWith('stream-123', 150);
      expect(resJson).toHaveBeenCalledWith(expect.objectContaining({ viewers: 150 }));
    });
  });
});
