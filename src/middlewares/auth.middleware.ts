import { User } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import prisma from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authorization token not found' });
  }

  try {
    // 1️⃣ Verify token signature
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // 2️⃣ Find user in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token: user not found' });
    }

    // 3️⃣ Check if token matches stored token in user table
    if (user.access_token !== token) {
      return res.status(401).json({ error: 'Invalid or revoked token' });
    }

    // 4️⃣ Attach user to request
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
