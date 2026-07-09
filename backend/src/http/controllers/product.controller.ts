import type { Response } from 'express';
// eslint-disable-next-line no-restricted-imports
import type { Pool } from 'pg';
import type { IProductStore, IStockStore } from '../../domain/interfaces';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class ProductController {
  constructor(
    private readonly productStore: IProductStore,
    private readonly stockStore: IStockStore,
    private readonly db: Pool,
  ) {}

  list = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const products = await this.productStore.findAll();
      res.json(products);
    } catch (err) {
      console.error('[ProductController] Failed to list products:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  updateStock = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const productId = req.params.productId as string;
    const { stock } = req.body;

    if (!productId || stock === undefined || stock < 0) {
      res.status(400).json({ error: 'Invalid productId or stock count' });
      return;
    }

    try {
      // 1. Update in PG database
      await this.productStore.setStock(productId, stock);

      // 2. Sync to Redis for atomic fast checkout
      await this.stockStore.setStock(productId, stock);

      res.json({ message: 'Stock successfully synchronized', productId, stock });
    } catch (err) {
      console.error('[ProductController] Failed to update stock:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  toggleFlashSale = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const productId = req.params.productId as string;
    const { isFlashSale } = req.body;

    if (!productId || isFlashSale === undefined) {
      res.status(400).json({ error: 'Invalid productId or isFlashSale state' });
      return;
    }

    try {
      await this.productStore.setFlashSale(productId, isFlashSale);
      res.json({ message: 'Flash sale configuration updated', productId, isFlashSale });
    } catch (err) {
      console.error('[ProductController] Failed to toggle flash sale:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  getMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const shopId = req.user?.shopId;
    if (!shopId) {
      res.status(400).json({ error: 'Bad Request: User must have an associated shop' });
      return;
    }

    try {
      // 1. Fetch primary flash sale product
      const prodResult = await this.db.query(
        'SELECT id, name, price, stock FROM products WHERE shop_id = $1 ORDER BY is_flash_sale DESC, created_at DESC LIMIT 1',
        [shopId],
      );

      const product = prodResult.rows[0] || null;

      // 2. Fetch aggregated sales metrics
      const statsResult = await this.db.query(
        "SELECT COUNT(*) as total_orders, COALESCE(SUM(total_price), 0) as total_revenue FROM orders WHERE shop_id = $1 AND status = 'CONFIRMED'",
        [shopId],
      );

      // 3. Fetch recent order confirmations
      const recentOrdersResult = await this.db.query(
        `SELECT id, total_price as "totalPrice", created_at as "createdAt"
         FROM orders
         WHERE shop_id = $1 AND status = 'CONFIRMED'
         ORDER BY created_at DESC
         LIMIT 6`,
        [shopId],
      );

      // 4. Resolve current stock from Redis memory (source of truth)
      let currentStock = 0;
      if (product) {
        currentStock = await this.stockStore.getStock(product.id);
      }

      res.json({
        totalOrders: parseInt(statsResult.rows[0].total_orders, 10),
        totalRevenue: parseFloat(statsResult.rows[0].total_revenue),
        recentSales: recentOrdersResult.rows.map(
          (row: { id: string; totalPrice: string; createdAt: string }) => ({
            id: row.id,
            totalPrice: parseFloat(row.totalPrice),
            createdAt: row.createdAt,
          }),
        ),
        currentStock,
        product,
      });
    } catch (err) {
      console.error('[ProductController] Failed to compile metrics:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
