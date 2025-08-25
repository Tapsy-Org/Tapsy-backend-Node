import { NextFunction, Response } from 'express';

import prisma from '../config/db';
import { AuthRequest } from '../types/express';
import AppError from '../utils/AppError';
import AuthTokens from '../utils/token';

export const requireAuth = (role?: 'ADMIN' | 'BUSINESS' | 'INDIVIDUAL') => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new AppError('Authorization token required', 401);
      }

      const token = authHeader.split(' ')[1];
      const decoded = AuthTokens.verifyAccessToken(token);

      if (typeof decoded === 'string') {
        throw new AppError('Invalid access token', 401);
      }

      // Check user in DB
      const user = await prisma.user.findUnique({
        where: { id: decoded.id, status: 'ACTIVE' },
        select: { id: true, user_type: true, status: true },
      });

      if (!user) {
        throw new AppError('User not found or inactive', 401);
      }

      // If role is specified, enforce it
      if (role && user.user_type !== role) {
        throw new AppError('Access denied: insufficient permissions', 403);
      }

      req.user = { userId: user.id, user_type: user.user_type, status: user.status };
      next();
    } catch (error) {
      next(error);
    }
  };
};
