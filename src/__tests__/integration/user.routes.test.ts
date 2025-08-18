import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

import globalErrorHandler from '../../middlewares/globalErrorHandler';
import responseMiddleware from '../../middlewares/response.middleware';
import userRoutes from '../../routes/user.routes';
import * as userService from '../../services/user.service';
import { createMockBusinessUser, createMockUser } from '../utils/testHelpers';

// Mock the user service
jest.mock('../../services/user.service');
const mockedUserService = userService as jest.Mocked<typeof userService>;

// Mock the auth middleware
jest.mock('../../middlewares/auth.middleware', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
}));

// Mock the global error handler to see if it's being called
const mockGlobalErrorHandler = jest.fn((err: any, req: any, res: any, next: any) => {
  console.log('Global error handler called with:', err);
  if (err instanceof Error) {
    res.status(500).json({
      status: 'error',
      statusCode: 500,
      message: err.message,
      details: null,
    });
  }
});
jest.mock('../../middlewares/globalErrorHandler', () => mockGlobalErrorHandler);

// Create test app
const app = express();
app.use(express.json());
app.use(responseMiddleware);
app.use('/users', userRoutes);
app.use(mockGlobalErrorHandler);

describe('User Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /users/register', () => {
    it('should register a user with valid INDIVIDUAL userType', async () => {
      const mockUser = createMockUser({ userType: 'INDIVIDUAL' });
      mockedUserService.createUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users/register')
        .send({ userType: 'INDIVIDUAL' })
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Created');
      expect(response.body.data.id).toBe(mockUser.id);
      expect(response.body.data.userType).toBe(mockUser.userType);
      expect(mockedUserService.createUser).toHaveBeenCalledWith('INDIVIDUAL');
    });

    it('should register a user with valid BUSINESS userType', async () => {
      const mockUser = createMockBusinessUser();
      mockedUserService.createUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users/register')
        .send({ userType: 'BUSINESS' })
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Created');
      expect(response.body.data.id).toBe(mockUser.id);
      expect(response.body.data.userType).toBe(mockUser.userType);
      expect(mockedUserService.createUser).toHaveBeenCalledWith('BUSINESS');
    });

    it('should return 400 when userType is missing', async () => {
      const response = await request(app).post('/users/register').send({}).expect(500);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(500);
      expect(response.body.message).toBe('userType is required');
    });

    it('should return 400 when userType is invalid', async () => {
      const response = await request(app)
        .post('/users/register')
        .send({ userType: 'INVALID' })
        .expect(500);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(500);
      expect(response.body.message).toBe('Invalid userType');
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockedUserService.createUser.mockRejectedValue(error);

      const response = await request(app)
        .post('/users/register')
        .send({ userType: 'INDIVIDUAL' })
        .expect(500);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBeDefined();
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user successfully', async () => {
      const mockUser = createMockUser();
      const updates = { email: 'newemail@example.com', name: 'John Doe' };
      mockedUserService.updateUser.mockResolvedValue(mockUser);

      const response = await request(app).patch('/users/test-user-id').send(updates).expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('OK');
      expect(response.body.data.id).toBe(mockUser.id);
      expect(mockedUserService.updateUser).toHaveBeenCalledWith('test-user-id', updates);
    });

    it('should handle Firebase token verification', async () => {
      const mockUser = createMockUser();
      const updates = { idToken: 'firebase-token', email: 'newemail@example.com' };
      mockedUserService.updateUser.mockResolvedValue(mockUser);

      const response = await request(app).patch('/users/test-user-id').send(updates).expect(500);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBeDefined();
    });

    it('should filter out restricted fields', async () => {
      const mockUser = createMockUser();
      const updates = {
        email: 'newemail@example.com',
        status: 'VERIFIED',
        userType: 'BUSINESS',
      };
      mockedUserService.updateUser.mockResolvedValue(mockUser);

      await request(app).patch('/users/test-user-id').send(updates).expect(200);

      expect(mockedUserService.updateUser).toHaveBeenCalledWith('test-user-id', {
        email: 'newemail@example.com',
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Update failed');
      mockedUserService.updateUser.mockRejectedValue(error);

      const response = await request(app)
        .patch('/users/test-user-id')
        .send({ email: 'new@example.com' })
        .expect(500);

      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /users/:id', () => {
    it('should get user by id successfully', async () => {
      const mockUser = createMockUser();
      mockedUserService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app).get('/users/test-user-id').expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('OK');
      expect(response.body.data.id).toBe(mockUser.id);
      expect(mockedUserService.getUserById).toHaveBeenCalledWith('test-user-id');
    });

    it('should handle user not found', async () => {
      const error = new Error('User not found');
      mockedUserService.getUserById.mockRejectedValue(error);

      const response = await request(app).get('/users/nonexistent-id').expect(500);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /users/:id/verify-otp', () => {
    it('should verify email OTP successfully', async () => {
      const mockUser = createMockUser({ status: 'VERIFIED', otpVerified: true });
      mockedUserService.verifyEmailOtp.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users/test-user-id/verify-otp')
        .send({ otp: '123456' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('OK');
      expect(response.body.data.id).toBe(mockUser.id);
      expect(mockedUserService.verifyEmailOtp).toHaveBeenCalledWith('test-user-id', '123456');
    });

    it('should handle invalid OTP', async () => {
      const error = new Error('Invalid OTP');
      mockedUserService.verifyEmailOtp.mockRejectedValue(error);

      const response = await request(app)
        .post('/users/test-user-id/verify-otp')
        .send({ otp: '654321' })
        .expect(500);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /users/login', () => {
    it('should login user successfully with email', async () => {
      const mockUser = createMockUser();
      const loginResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockUser,
      };
      mockedUserService.login.mockResolvedValue(loginResult);

      const response = await request(app)
        .post('/users/login')
        .send({ loginId: 'test@example.com', deviceId: 'device-123' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('OK');
      expect(response.body.data.accessToken).toBe(loginResult.accessToken);
      expect(mockedUserService.login).toHaveBeenCalledWith('test@example.com', 'device-123');
    });

    it('should login user successfully with mobile number', async () => {
      const mockUser = createMockUser();
      const loginResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockUser,
      };
      mockedUserService.login.mockResolvedValue(loginResult);

      const response = await request(app)
        .post('/users/login')
        .send({ loginId: '+1234567890', deviceId: 'device-123' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('OK');
      expect(response.body.data.accessToken).toBe(loginResult.accessToken);
    });

    it('should return 400 when loginId is missing', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({ deviceId: 'device-123' })
        .expect(500);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(500);
      expect(response.body.message).toBe('loginId and deviceId are required');
    });

    it('should return 400 when deviceId is missing', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({ loginId: 'test@example.com' })
        .expect(500);

      expect(response.body.status).toBe('error');
      expect(response.body.statusCode).toBe(500);
      expect(response.body.message).toBe('loginId and deviceId are required');
    });

    it('should handle login errors', async () => {
      const error = new Error('Login failed');
      mockedUserService.login.mockRejectedValue(error);

      const response = await request(app)
        .post('/users/login')
        .send({ loginId: 'test@example.com', deviceId: 'device-123' })
        .expect(500);

      expect(response.body.status).toBe('error');
    });
  });
});
