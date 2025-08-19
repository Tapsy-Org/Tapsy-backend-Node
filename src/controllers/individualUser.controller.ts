import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { individualUserService } from '../services/individualUser.service';
import AppError from '../utils/AppError';

const userService = new individualUserService();

export default class IndividualUserController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken, firebase_token, device_id, username } = req.body as {
        idToken?: string;
        firebase_token?: string;
        device_id?: string;
        username?: string;
      };

      if (!idToken || !firebase_token) {
        throw new AppError('idToken and firebase_token are required', 400);
      }

      const user = await userService.registerWithFirebase({
        idToken,
        firebase_token,
        device_id,
        username,
      });

      const accessToken = jwt.sign(
        {
          userId: user.id,
          mobile_number: user.mobile_number,
          type: 'individual',
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' },
      );

      return res.created({ user, accessToken }, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken, firebase_token, device_id } = req.body as {
        idToken?: string;
        firebase_token?: string;
        device_id?: string;
        username?: string;
      };

      if (!idToken || !firebase_token) {
        throw new AppError('idToken and firebase_token are required', 400);
      }

      const user = await userService.loginWithFirebase({
        idToken,
        firebase_token,
        device_id,
      });

      const accessToken = jwt.sign(
        {
          userId: user.id,
          mobile_number: user.mobile_number,
          type: 'individual',
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' },
      );

      return res.success({ user, accessToken }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      if (!id) {
        return res.fail('User id is required', 400);
      }
      const user = await userService.findById(id);
      return res.success({ user }, 'User fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      if (!id) {
        return res.fail('User id is required', 400);
      }

      const allowed: Array<keyof Parameters<typeof userService.update>[1]> = [
        'username',
        'mobile_number',
        'firebase_token',
        'otp_verified',
        'refresh_token',
        'device_id',
        'status',
        'last_login',
      ];

      const payload = req.body as Record<string, unknown>;

      type AllowedKeys = (typeof allowed)[number];
      type UpdateData = Parameters<typeof userService.update>[1];

      const data = Object.keys(payload)
        .filter((key): key is AllowedKeys => allowed.includes(key as AllowedKeys))
        .reduce((acc, key) => {
          if (payload[key] !== undefined) {
            (acc as Record<string, unknown>)[key] = payload[key];
          }
          return acc;
        }, {} as UpdateData);

      if (Object.keys(data).length === 0) {
        return res.fail('No updatable fields provided', 400);
      }

      const user = await userService.update(id, data);
      return res.success({ user }, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async softDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      if (!id) {
        return res.fail('User id is required', 400);
      }
      const user = await userService.softDelete(id);
      return res.success({ user }, 'User deactivated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      if (!id) {
        return res.fail('User id is required', 400);
      }
      const user = await userService.restore(id);
      return res.success({ user }, 'User restored successfully');
    } catch (error) {
      next(error);
    }
  }
}
