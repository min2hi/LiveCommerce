import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: 'BUYER' | 'STREAMER' | 'ADMIN';
    shopId?: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      username: string;
      role: string;
      shopId?: string;
    };

    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role.toUpperCase() as 'BUYER' | 'STREAMER' | 'ADMIN',
      shopId: decoded.shopId,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: Token is expired or invalid' });
  }
}

export function roleGuard(roles: Array<'BUYER' | 'STREAMER' | 'ADMIN'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
      return;
    }
    next();
  };
}
