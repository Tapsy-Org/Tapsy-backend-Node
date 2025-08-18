import { jest } from '@jest/globals';

import {
  getUser,
  login,
  registerUser,
  updateUser,
  verifyEmailOtp,
} from '../../../controllers/user.controller';
import * as userService from '../../../services/user.service';
import AppError from '../../../utils/AppError';
import { verifyFirebaseToken } from '../../../utils/firebase';
import {
  createMockBusinessUser,
  createMockNext,
  createMockRequest,
  createMockResponse,
  createMockUser,
} from '../../utils/testHelpers';

// Mock the user service
jest.mock('../../../services/user.service');
jest.mock('../../../utils/firebase');

const mockedUserService = userService as jest.Mocked<typeof userService>;
const mockedVerifyFirebaseToken = verifyFirebaseToken as jest.MockedFunction<
  typeof verifyFirebaseToken
>;

describe('User Controller', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a user with valid INDIVIDUAL userType', async () => {
      const mockUser = createMockUser({ userType: 'INDIVIDUAL' });
      req.body = { userType: 'INDIVIDUAL' };
      mockedUserService.createUser.mockResolvedValue(mockUser);

      await registerUser(req, res, next);

      expect(mockedUserService.createUser).toHaveBeenCalledWith('INDIVIDUAL');
      expect(res.created).toHaveBeenCalledWith(mockUser);
      expect(next).not.toHaveBeenCalled();
    });

    it('should register a user with valid BUSINESS userType', async () => {
      const mockUser = createMockBusinessUser();
      req.body = { userType: 'BUSINESS' };
      mockedUserService.createUser.mockResolvedValue(mockUser);

      await registerUser(req, res, next);

      expect(mockedUserService.createUser).toHaveBeenCalledWith('BUSINESS');
      expect(res.created).toHaveBeenCalledWith(mockUser);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return error when userType is missing', async () => {
      req.body = {};

      await registerUser(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('userType is required');
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should return error when userType is invalid', async () => {
      req.body = { userType: 'INVALID' };

      await registerUser(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Invalid userType');
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      req.body = { userType: 'INDIVIDUAL' };
      mockedUserService.createUser.mockRejectedValue(error);

      await registerUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const mockUser = createMockUser();
      req.params = { id: 'test-user-id' };
      req.body = { email: 'newemail@example.com', name: 'John Doe' };
      mockedUserService.updateUser.mockResolvedValue(mockUser);

      await updateUser(req, res, next);

      expect(mockedUserService.updateUser).toHaveBeenCalledWith('test-user-id', {
        email: 'newemail@example.com',
        name: 'John Doe',
      });
      expect(res.success).toHaveBeenCalledWith(mockUser);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle Firebase token verification', async () => {
      const mockUser = createMockUser();
      const mockFirebaseToken = { phone_number: '+1234567890' };
      req.params = { id: 'test-user-id' };
      req.body = { idToken: 'firebase-token', email: 'newemail@example.com' };
      mockedVerifyFirebaseToken.mockResolvedValue(mockFirebaseToken as any);
      mockedUserService.updateUser.mockResolvedValue(mockUser);

      await updateUser(req, res, next);

      expect(mockedVerifyFirebaseToken).toHaveBeenCalledWith('firebase-token');
      expect(mockedUserService.updateUser).toHaveBeenCalledWith('test-user-id', {
        email: 'newemail@example.com',
        mobileNumber: '+1234567890',
        otpVerified: true,
      });
      expect(res.success).toHaveBeenCalledWith(mockUser);
    });

    it('should return error for invalid Firebase token', async () => {
      req.params = { id: 'test-user-id' };
      req.body = { idToken: 'invalid-token' };
      mockedVerifyFirebaseToken.mockResolvedValue({} as any);

      await updateUser(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Invalid Firebase token');
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should filter out restricted fields', async () => {
      const mockUser = createMockUser();
      req.params = { id: 'test-user-id' };
      req.body = {
        email: 'newemail@example.com',
        status: 'VERIFIED',
        userType: 'BUSINESS',
      };
      mockedUserService.updateUser.mockResolvedValue(mockUser);

      await updateUser(req, res, next);

      expect(mockedUserService.updateUser).toHaveBeenCalledWith('test-user-id', {
        email: 'newemail@example.com',
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Update failed');
      req.params = { id: 'test-user-id' };
      req.body = { email: 'newemail@example.com' };
      mockedUserService.updateUser.mockRejectedValue(error);

      await updateUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getUser', () => {
    it('should get user by id successfully', async () => {
      const mockUser = createMockUser();
      req.params = { id: 'test-user-id' };
      mockedUserService.getUserById.mockResolvedValue(mockUser);

      await getUser(req, res, next);

      expect(mockedUserService.getUserById).toHaveBeenCalledWith('test-user-id');
      expect(res.success).toHaveBeenCalledWith(mockUser);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const error = new Error('User not found');
      req.params = { id: 'test-user-id' };
      mockedUserService.getUserById.mockRejectedValue(error);

      await getUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('verifyEmailOtp', () => {
    it('should verify email OTP successfully', async () => {
      const mockUser = createMockUser({ status: 'VERIFIED', otpVerified: true });
      req.params = { id: 'test-user-id' };
      req.body = { otp: '123456' };
      mockedUserService.verifyEmailOtp.mockResolvedValue(mockUser);

      await verifyEmailOtp(req, res, next);

      expect(mockedUserService.verifyEmailOtp).toHaveBeenCalledWith('test-user-id', '123456');
      expect(res.success).toHaveBeenCalledWith(mockUser);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const error = new Error('Invalid OTP');
      req.params = { id: 'test-user-id' };
      req.body = { otp: '123456' };
      mockedUserService.verifyEmailOtp.mockRejectedValue(error);

      await verifyEmailOtp(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should login user successfully with email', async () => {
      const mockUser = createMockUser();
      const loginResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockUser,
      };
      req.body = { loginId: 'test@example.com', deviceId: 'device-123' };
      mockedUserService.login.mockResolvedValue(loginResult);

      await login(req, res, next);

      expect(mockedUserService.login).toHaveBeenCalledWith('test@example.com', 'device-123');
      expect(res.success).toHaveBeenCalledWith(loginResult);
      expect(next).not.toHaveBeenCalled();
    });

    it('should login user successfully with mobile number', async () => {
      const mockUser = createMockUser();
      const loginResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockUser,
      };
      req.body = { loginId: '+1234567890', deviceId: 'device-123' };
      mockedUserService.login.mockResolvedValue(loginResult);

      await login(req, res, next);

      expect(mockedUserService.login).toHaveBeenCalledWith('+1234567890', 'device-123');
      expect(res.success).toHaveBeenCalledWith(loginResult);
    });

    it('should return error when loginId is missing', async () => {
      req.body = { deviceId: 'device-123' };

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('loginId and deviceId are required');
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should return error when deviceId is missing', async () => {
      req.body = { loginId: 'test@example.com' };

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('loginId and deviceId are required');
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should handle service errors', async () => {
      const error = new Error('Login failed');
      req.body = { loginId: 'test@example.com', deviceId: 'device-123' };
      mockedUserService.login.mockRejectedValue(error);

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
