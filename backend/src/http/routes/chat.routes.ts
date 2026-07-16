import { Router } from 'express';
import { getRedisClient } from '../../infrastructure/cache';

export function getChatRouter(): Router {
  const router = Router();

  router.get('/history/:shopId', async (req, res) => {
    try {
      const { shopId } = req.params;
      const redis = await getRedisClient();
      const history = await redis.lRange(`chat:history:${shopId}`, 0, -1);
      const parsed = history.map((item: string) => JSON.parse(item));
      res.json(parsed);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch chat history' });
    }
  });

  return router;
}
