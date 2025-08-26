import bcryptjs from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';

import prisma from '../config/db';
import { TokenPayload } from '../types/types';
import AuthTokens from '../utils/token';

export const loginAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // 1. Find active admin
    const admin = await prisma.user.findFirst({
      where: { email, user_type: 'ADMIN', status: 'ACTIVE' },
    });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 2. Ensure password exists
    if (!admin.password) {
      return res.status(401).json({ message: 'This admin account has no password' });
    }

    // 3. Compare password
    const isMatch = await bcryptjs.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 4. Generate tokens (using helper)
    const payload: TokenPayload = { id: admin.id, role: admin.user_type };
    const { accessToken, refreshToken } = await AuthTokens.generateAccessAndRefreshToken(payload);

    // 5. Save refresh token in DB and fetch updated user
    await prisma.user.update({
      where: { id: admin.id },
      data: { refresh_token: refreshToken, last_login: new Date() },
    });

    // 6. Return consistent response
    return res.json({
      status: 'success',
      message: 'Admin logged in successfully',
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};
