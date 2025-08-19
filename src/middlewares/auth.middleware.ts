import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { IndividualUser } from '../../generated/prisma';
import prisma from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  individualUser?: IndividualUser;
}
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authorization token not found' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const individualUser = await prisma.individualUser.findUnique({
      where: { id: decoded.userId },
    });

    if (!individualUser) {
      return res.status(401).json({ error: 'Invalid token: user not found' });
    }

    req.individualUser = individualUser;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
