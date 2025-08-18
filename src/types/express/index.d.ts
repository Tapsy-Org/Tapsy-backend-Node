import type { Response as ExpressResponse } from 'express';

declare global {
  namespace Express {
    interface Response {
      success: (data?: unknown, message?: string, statusCode?: number) => ExpressResponse;
      created: (data?: unknown, message?: string) => ExpressResponse;
      fail: (message: string, statusCode?: number, details?: unknown) => ExpressResponse;
    }
  }
}

export {};
