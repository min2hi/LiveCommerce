import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import type { IOrderStore } from '../../domain/interfaces';

export class OrderController {
  constructor(private readonly orderStore: IOrderStore) {}

  getOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: User context missing' });
      return;
    }

    try {
      const orders = await this.orderStore.findByUserId(userId);
      res.json(orders);
    } catch (err) {
      console.error('[OrderController] Fetch orders error:', err);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  };
}
