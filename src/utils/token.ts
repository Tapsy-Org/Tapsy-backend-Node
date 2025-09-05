import { PrismaClient } from '@prisma/client';
import type { JwtPayload, SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';

import type { TokenPayload } from '../types/types';
import AppError from './AppError';

const prisma = new PrismaClient();

export default class AuthTokens {
  //* Generate Access Token
  static generateAccessToken(payload: TokenPayload) {
    const options: SignOptions = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as any,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, options);

    return { accessToken };
  }

  //* Generate Refresh Token and Save in DB
  static async generateRefreshToken(payload: TokenPayload) {
    const options: SignOptions = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: (process.env.JWT_REFRESH_EXPIRES || '7d') as any,
    };

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, options);

    await prisma.user.update({
      where: { id: payload.id },
      data: { refresh_token: refreshToken },
    });

    return { refreshToken };
  }

  //* Generate Both Tokens
  static async generateAccessAndRefreshToken(payload: TokenPayload) {
    const { accessToken } = this.generateAccessToken(payload); // ✅ both use payload
    const { refreshToken } = await this.generateRefreshToken(payload);
    return { accessToken, refreshToken };
  }

  //* Verify Access Token
  static verifyAccessToken(token: string): JwtPayload | string {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string);
    } catch {
      throw new AppError('Invalid or expired access token', 401);
    }
  }

  //* Verify Refresh Token
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as TokenPayload;
      return decoded;
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  //* Revoke Refresh Token (logout)
  static async revokeRefreshToken(id: string) {
    await prisma.user.update({
      where: { id },
      data: { refresh_token: null },
    });
    return true;
  }
}
