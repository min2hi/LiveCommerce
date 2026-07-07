import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: 'BUYER' | 'STREAMER';
    shopId?: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      username: string;
      role: 'BUYER' | 'STREAMER';
      shopId?: string;
    };

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: Token is expired or invalid' });
  }
}

export function roleGuard(roles: Array<'BUYER' | 'STREAMER'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
      return;
    }
    next();
  };
}
