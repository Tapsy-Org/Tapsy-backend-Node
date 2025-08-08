import jwt from 'jsonwebtoken';

import { UserType } from '../../generated/prisma';
import prisma from '../config/db';
import AppError from '../utils/AppError';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key';

export const createUser = async (userType: UserType) => {
  const user = await prisma.user.create({
    data: { userType, lastCompletedStep: 1 },
  });
  return user;
};

export const updateUser = async (id: string, updates: Record<string, unknown>) => {
  try {
    return await prisma.user.update({
      where: { id },
      data: updates,
      include: { businessDetails: true },
    });
  } catch (error) {
    throw new AppError('Failed to update user', 500, { originalError: error });
  }
};

export const login = async (loginId: string, deviceId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: loginId }, { mobileNumber: loginId }],
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.deviceId && user.deviceId !== deviceId) {
    // In a real app, you might want to notify the user
    // that a new device has logged in.
    console.log(
      `User ${user.id} logged in from a new device. Old device ID: ${user.deviceId}, New device ID: ${deviceId}`,
    );
  }

  const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken,
      deviceId,
      lastLogin: new Date(),
    },
  });

  return { accessToken, refreshToken, user };
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id }, include: { businessDetails: true } });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

export const verifyEmailOtp = async (userId: string, otp: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.otp !== otp) {
    throw new AppError('Invalid OTP', 400);
  }

  if (user.otpExpires && user.otpExpires < new Date()) {
    throw new AppError('OTP has expired', 400);
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      status: 'VERIFIED',
      otpVerified: true,
      otp: null,
      otpExpires: null,
    },
  });
};
