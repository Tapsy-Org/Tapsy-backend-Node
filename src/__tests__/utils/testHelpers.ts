import { NextFunction, Request, Response } from 'express';
import { UserType } from '../../../generated/prisma';

export interface MockRequest extends Partial<Request> {
  body?: any;
  params?: any;
  query?: any;
  headers?: any;
  user?: any;
}

export interface MockResponse extends Partial<Response> {
  status: jest.MockedFunction<Response['status']>;
  json: jest.MockedFunction<Response['json']>;
  success?: jest.MockedFunction<any>;
  created?: jest.MockedFunction<any>;
  fail?: jest.MockedFunction<any>;
}

export interface MockNextFunction extends NextFunction {
  mockClear(): void;
}

export const createMockRequest = (overrides: MockRequest = {}): MockRequest => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  ...overrides,
});

export const createMockResponse = (): MockResponse => {
  const res: MockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    success: jest.fn().mockReturnThis(),
    created: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
  };
  return res;
};

export const createMockNext = (): MockNextFunction => {
  return jest.fn() as MockNextFunction;
};

export const createMockUser = (overrides: any = {}) => ({
  id: 'test-user-id',
  userType: 'INDIVIDUAL' as UserType,
  email: 'test@example.com',
  mobileNumber: '+1234567890',
  status: 'PENDING',
  otpVerified: false,
  lastCompletedStep: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockBusinessUser = (overrides: any = {}) => ({
  id: 'test-business-user-id',
  userType: 'BUSINESS' as UserType,
  email: 'business@example.com',
  mobileNumber: '+1234567890',
  status: 'PENDING',
  otpVerified: false,
  lastCompletedStep: 1,
  businessDetails: {
    id: 'test-business-details-id',
    companyName: 'Test Business',
    businessType: 'RESTAURANT',
    address: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    country: 'Test Country',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockJwtPayload = (overrides: any = {}) => ({
  userId: 'test-user-id',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes
  ...overrides,
});

export const createMockFirebaseToken = (overrides: any = {}) => ({
  uid: 'test-firebase-uid',
  phone_number: '+1234567890',
  email: 'test@example.com',
  email_verified: true,
  ...overrides,
});
