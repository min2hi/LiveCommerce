import { Request, Response } from 'express';
import { AddressStore } from '../../stores/postgres/address.store';
import { UserStore } from '../../stores/postgres/user.store';

interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string; shopId?: string };
}

export class UserController {
  constructor(
    private addressStore: AddressStore,
    private userStore: UserStore,
  ) {}

  public getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const user = await this.userStore.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      });
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  public getAddresses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const addresses = await this.addressStore.getAddressesByUserId(userId);
      res.json(addresses);
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  public createAddress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { fullName, phone, street, city, isDefault } = req.body;

      if (!fullName || !phone || !street || !city) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const address = await this.addressStore.createAddress(
        userId,
        fullName,
        phone,
        street,
        city,
        !!isDefault,
      );
      res.status(201).json(address);
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  public updateAddress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { id } = req.params;
      const { fullName, phone, street, city, isDefault } = req.body;

      if (!fullName || !phone || !street || !city) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const address = await this.addressStore.updateAddress(
        id as string,
        userId,
        fullName,
        phone,
        street,
        city,
        !!isDefault,
      );

      if (!address) {
        res.status(404).json({ error: 'Address not found' });
        return;
      }
      res.json(address);
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  public deleteAddress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { id } = req.params;

      const success = await this.addressStore.deleteAddress(id as string, userId);
      if (!success) {
        res.status(404).json({ error: 'Address not found' });
        return;
      }
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
