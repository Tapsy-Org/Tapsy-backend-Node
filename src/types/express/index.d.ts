import type { Request, Response as ExpressResponse } from 'express';

export interface AuthenticatedUser {
  userId: string;
  user_type: 'INDIVIDUAL' | 'BUSINESS' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED' | 'PENDING';
}

// 🔹 Declare module augmentation for Express
declare global {
  namespace Express {
    interface Response {
      success: (data?: unknown, message?: string, statusCode?: number) => ExpressResponse;
      created: (data?: unknown, message?: string) => ExpressResponse;
      fail: (message: string, statusCode?: number, details?: unknown) => ExpressResponse;
      unauthorized: (message?: string, details?: unknown) => ExpressResponse;
    }

    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// 🔹 Export custom typed Request for use in middlewares
export type AuthRequest = Request & { user?: AuthenticatedUser };
