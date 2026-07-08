import { Router } from 'express';
import type { AiController } from '../controllers/ai.controller';

export function getKnowledgeRouter(aiController: AiController): Router {
  const router = Router();
  router.post('/ingest', aiController.ingest);
  return router;
}
