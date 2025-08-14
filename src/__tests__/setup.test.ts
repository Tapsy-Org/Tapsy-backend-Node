import { jest } from '@jest/globals';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Prisma client
jest.mock('../config/db', () => ({
  __esModule: true,
  default: {
    user: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    businessDetails: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

// Mock Firebase
jest.mock('../utils/firebase', () => ({
  verifyFirebaseToken: jest.fn(),
}));

// Mock nodemailer
jest.mock('../utils/mailer', () => ({
  sendEmail: jest.fn(),
}));

// Global test timeout
jest.setTimeout(10000);

describe('Setup', () => {
  it('should be configured correctly', () => {
    expect(true).toBe(true);
  });
});
