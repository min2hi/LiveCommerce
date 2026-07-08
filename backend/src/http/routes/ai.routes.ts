import { Router } from 'express';
import type { AiController } from '../controllers/ai.controller';

export function getAiRouter(aiController: AiController): Router {
  const router = Router();
  router.post('/chat', aiController.chat);
  return router;
}
