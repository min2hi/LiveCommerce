import { Router } from 'express';
import type { AuthController } from '../controllers/auth.controller';

export function getAuthRouter(authController: AuthController): Router {
  const router = Router();
  router.post('/register', authController.register);
  router.post('/login', authController.login);
  return router;
}
