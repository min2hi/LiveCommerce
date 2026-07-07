import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
// eslint-disable-next-line no-restricted-imports
import type { Pool } from 'pg';
import type { IUserStore } from '../../domain/interfaces';
import type { UserRole } from '../../domain/entities';
import { config } from '../../config';

export class AuthController {
  constructor(
    private readonly userStore: IUserStore,
    private readonly db: Pool,
  ) {}

  private hashPassword(password: string): string {
    const salt = 'livecommerce-salt';
    return crypto.scryptSync(password, salt, 64).toString('hex');
  }

  register = async (req: Request, res: Response): Promise<void> => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      res.status(400).json({ error: 'Missing required fields: username, email, password, role' });
      return;
    }

    const normalizedRole = role.toLowerCase();
    if (normalizedRole !== 'buyer' && normalizedRole !== 'streamer') {
      res.status(400).json({ error: 'Role must be either BUYER or STREAMER' });
      return;
    }

    try {
      const existingUser = await this.userStore.findByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }

      const passwordHash = this.hashPassword(password);
      const user = await this.userStore.create({
        username,
        email,
        passwordHash,
        role: normalizedRole as UserRole,
      });

      let shopId: string | undefined;
      if (normalizedRole === 'streamer') {
        // Automatically create a shop for the streamer
        const shopQuery = `
          INSERT INTO shops (owner_id, name, description)
          VALUES ($1, $2, $3)
          RETURNING id
        `;
        const shopResult = await this.db.query(shopQuery, [
          user.id,
          `${username}'s Shop`,
          `Welcome to ${username}'s streaming shop!`,
        ]);
        shopId = shopResult.rows[0].id;
      }

      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        shopId,
      });
    } catch (err) {
      console.error('[AuthController] Registration failed:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Missing email or password' });
      return;
    }

    try {
      const user = await this.userStore.findByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const passwordHash = this.hashPassword(password);
      if (user.passwordHash !== passwordHash) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Query shopId if the user is a streamer
      let shopId: string | undefined;
      if (user.role === 'streamer') {
        const shopQuery = 'SELECT id FROM shops WHERE owner_id = $1';
        const shopResult = await this.db.query(shopQuery, [user.id]);
        if (shopResult.rows.length > 0) {
          shopId = shopResult.rows[0].id;
        }
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
          shopId,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] },
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          shopId,
        },
      });
    } catch (err) {
      console.error('[AuthController] Login failed:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
