import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

import prisma from '../../../config/db';
import {
  createUser,
  getUserById,
  login,
  updateUser,
  verifyEmailOtp,
} from '../../../services/user.service';
import AppError from '../../../utils/AppError';
import { createMockBusinessUser, createMockUser } from '../../utils/testHelpers';

// Mock Prisma client
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

// Mock JWT
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const mockUser = createMockUser();
      mockedPrisma.user.create.mockResolvedValue(mockUser);

      const result = await createUser('INDIVIDUAL');

      expect(mockedPrisma.user.create).toHaveBeenCalledWith({
        data: { userType: 'INDIVIDUAL', lastCompletedStep: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it('should create a business user successfully', async () => {
      const mockUser = createMockBusinessUser();
      mockedPrisma.user.create.mockResolvedValue(mockUser);

      const result = await createUser('BUSINESS');

      expect(mockedPrisma.user.create).toHaveBeenCalledWith({
        data: { userType: 'BUSINESS', lastCompletedStep: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockedPrisma.user.create.mockRejectedValue(error);

      await expect(createUser('INDIVIDUAL')).rejects.toThrow('Database connection failed');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const mockUser = createMockUser();
      const updates = { email: 'newemail@example.com', name: 'John Doe' };
      mockedPrisma.user.update.mockResolvedValue(mockUser);

      const result = await updateUser('test-user-id', updates);

      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: updates,
        include: { businessDetails: true },
      });
      expect(result).toEqual(mockUser);
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      mockedPrisma.user.update.mockRejectedValue(error);

      await expect(updateUser('test-user-id', { email: 'new@example.com' })).rejects.toThrow(
        'Failed to update user',
      );
    });

    it('should include business details in response', async () => {
      const mockUser = createMockBusinessUser();
      mockedPrisma.user.update.mockResolvedValue(mockUser);

      const result = await updateUser('test-user-id', { email: 'new@example.com' });

      expect(result.businessDetails).toBeDefined();
      expect(result.businessDetails?.companyName).toBe('Test Business');
    });
  });

  describe('login', () => {
    it('should login user with email successfully', async () => {
      const mockUser = createMockUser();
      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';

      mockedPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockedPrisma.user.update.mockResolvedValue(mockUser);
      (mockedJwt.sign as any)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      const result = await login('test@example.com', 'device-123');

      expect(mockedPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: 'test@example.com' }, { mobileNumber: 'test@example.com' }],
        },
      });
      expect(mockedJwt.sign).toHaveBeenCalledWith({ userId: mockUser.id }, 'test-jwt-secret', {
        expiresIn: '15m',
      });
      expect(mockedJwt.sign).toHaveBeenCalledWith({ userId: mockUser.id }, 'test-refresh-secret', {
        expiresIn: '7d',
      });
      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          refreshToken: mockRefreshToken,
          deviceId: 'device-123',
          lastLogin: expect.any(Date),
        },
      });
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        user: mockUser,
      });
    });

    it('should login user with mobile number successfully', async () => {
      const mockUser = createMockUser();
      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';

      mockedPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockedPrisma.user.update.mockResolvedValue(mockUser);
      (mockedJwt.sign as any)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      const result = await login('+1234567890', 'device-123');

      expect(mockedPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: '+1234567890' }, { mobileNumber: '+1234567890' }],
        },
      });
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        user: mockUser,
      });
    });

    it('should handle new device login', async () => {
      const mockUser = createMockUser({ deviceId: 'old-device' });
      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';

      mockedPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockedPrisma.user.update.mockResolvedValue(mockUser);
      (mockedJwt.sign as any)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      const result = await login('test@example.com', 'new-device');

      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          refreshToken: mockRefreshToken,
          deviceId: 'new-device',
          lastLogin: expect.any(Date),
        },
      });
      expect(result).toBeDefined();
    });

    it('should throw error when user not found', async () => {
      mockedPrisma.user.findFirst.mockResolvedValue(null);

      await expect(login('nonexistent@example.com', 'device-123')).rejects.toThrow(
        'User not found',
      );
      expect(mockedPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: 'nonexistent@example.com' }, { mobileNumber: 'nonexistent@example.com' }],
        },
      });
    });
  });

  describe('getUserById', () => {
    it('should get user by id successfully', async () => {
      const mockUser = createMockUser();
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await getUserById('test-user-id');

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        include: { businessDetails: true },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw error when user not found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      await expect(getUserById('nonexistent-id')).rejects.toThrow('User not found');
    });

    it('should include business details when available', async () => {
      const mockUser = createMockBusinessUser();
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await getUserById('test-user-id');

      expect(result.businessDetails).toBeDefined();
      expect(result.businessDetails?.companyName).toBe('Test Business');
    });
  });

  describe('verifyEmailOtp', () => {
    it('should verify email OTP successfully', async () => {
      const mockUser = createMockUser({
        otp: '123456',
        otpExpires: new Date(Date.now() + 60000), // 1 minute from now
      });
      const updatedUser = createMockUser({
        status: 'VERIFIED',
        otpVerified: true,
        otp: null,
        otpExpires: null,
      });

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await verifyEmailOtp('test-user-id', '123456');

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
      });
      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: {
          status: 'VERIFIED',
          otpVerified: true,
          otp: null,
          otpExpires: null,
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw error when user not found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      await expect(verifyEmailOtp('nonexistent-id', '123456')).rejects.toThrow('User not found');
    });

    it('should throw error when OTP is invalid', async () => {
      const mockUser = createMockUser({
        otp: '123456',
        otpExpires: new Date(Date.now() + 60000),
      });

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(verifyEmailOtp('test-user-id', '654321')).rejects.toThrow('Invalid OTP');
    });

    it('should throw error when OTP has expired', async () => {
      const mockUser = createMockUser({
        otp: '123456',
        otpExpires: new Date(Date.now() - 60000), // 1 minute ago
      });

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(verifyEmailOtp('test-user-id', '123456')).rejects.toThrow('OTP has expired');
    });

    it('should throw error when OTP is null', async () => {
      const mockUser = createMockUser({
        otp: null,
        otpExpires: new Date(Date.now() + 60000),
      });

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(verifyEmailOtp('test-user-id', '123456')).rejects.toThrow('Invalid OTP');
    });
  });
});
