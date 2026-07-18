import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export function getUserRouter(controller: UserController): Router {
  const router = Router();

  // All user routes require authentication
  router.use(authMiddleware);

  // Profile
  router.get('/profile', controller.getProfile);

  // Addresses
  router.get('/addresses', controller.getAddresses);
  router.post('/addresses', controller.createAddress);
  router.put('/addresses/:id', controller.updateAddress);
  router.delete('/addresses/:id', controller.deleteAddress);

  return router;
}
