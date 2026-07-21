import { Request, Response } from 'express';
// eslint-disable-next-line no-restricted-imports
import { Pool } from 'pg';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('MetricsController');

export class MetricsController {
  constructor(private readonly db: Pool) {}

  getAdminMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { rows: revenueRows } = await this.db.query(
        "SELECT SUM(total_price) as total_revenue, COUNT(id) as total_orders FROM orders WHERE status = 'CONFIRMED'",
      );
      const { rows: userRows } = await this.db.query('SELECT COUNT(id) as total_users FROM users');
      const { rows: activeStreams } = await this.db.query(
        "SELECT SUM(viewers) as total_viewers FROM livestreams WHERE status = 'LIVE'",
      );

      res.json({
        totalRevenue: parseFloat(revenueRows[0].total_revenue || '0'),
        totalOrders: parseInt(revenueRows[0].total_orders || '0', 10),
        totalUsers: parseInt(userRows[0].total_users || '0', 10),
        activeViewers: parseInt(activeStreams[0].total_viewers || '0', 10),
      });
    } catch (err) {
      logger.error('Error fetching admin metrics', { error: String(err) });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  getStreamerMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (req as any).user;
      if (!user || !user.shopId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const { rows: revenueRows } = await this.db.query(
        "SELECT SUM(total_price) as total_revenue, COUNT(id) as total_orders FROM orders WHERE status = 'CONFIRMED' AND shop_id = $1",
        [user.shopId],
      );
      const { rows: activeStreams } = await this.db.query(
        "SELECT viewers FROM livestreams WHERE status = 'LIVE' AND shop_id = $1 ORDER BY created_at DESC LIMIT 1",
        [user.shopId],
      );

      res.json({
        totalRevenue: parseFloat(revenueRows[0]?.total_revenue || '0'),
        totalOrders: parseInt(revenueRows[0]?.total_orders || '0', 10),
        activeViewers: parseInt(activeStreams[0]?.viewers || '0', 10),
      });
    } catch (err) {
      logger.error('Error fetching streamer metrics', { error: String(err) });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { rows } = await this.db.query(
        'SELECT id, username, email, role FROM users ORDER BY created_at DESC LIMIT 50',
      );
      res.json(
        rows.map((r) => ({
          id: r.id,
          user: r.username,
          email: r.email,
          role: r.role,
          status: 'Active', // Mock
          color: r.role === 'ADMIN' ? 'bg-emerald-400' : 'bg-blue-400',
        })),
      );
    } catch (err) {
      logger.error('Error fetching users', { error: String(err) });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  getPublicMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { rows: activeStreams } = await this.db.query(
        "SELECT COUNT(*) as total_streams, SUM(viewers) as total_viewers FROM livestreams WHERE status = 'LIVE'",
      );
      const { rows: deals } = await this.db.query(
        "SELECT COUNT(*) as total_deals FROM orders WHERE status = 'CONFIRMED'",
      );

      res.json({
        totalStreams: parseInt(activeStreams[0].total_streams || '0', 10),
        totalViewers: parseInt(activeStreams[0].total_viewers || '0', 10),
        totalDeals: parseInt(deals[0].total_deals || '0', 10),
      });
    } catch (err) {
      logger.error('Error fetching public metrics', { error: String(err) });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
