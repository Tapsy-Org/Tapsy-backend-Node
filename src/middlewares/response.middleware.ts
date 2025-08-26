import type { NextFunction, Request, Response as ExpressResponse } from 'express';

type ResponseWithHelpers = ExpressResponse & {
  success: (data?: unknown, message?: string, statusCode?: number) => ExpressResponse;
  created: (data?: unknown, message?: string) => ExpressResponse;
  fail: (message: string, statusCode?: number, details?: unknown) => ExpressResponse;
  unauthorized: (message?: string, details?: unknown) => ExpressResponse; // ✅ add 401
};

const responseMiddleware = (_req: Request, res: ExpressResponse, next: NextFunction) => {
  const r = res as ResponseWithHelpers;

  r.success = (data?: unknown, message = 'OK', statusCode = 200) => {
    return res.status(statusCode).json({ status: 'success', message, data });
  };

  r.created = (data?: unknown, message = 'Created') => {
    return res.status(201).json({ status: 'success', message, data });
  };

  r.fail = (message: string, statusCode = 400, details?: unknown) => {
    return res
      .status(statusCode)
      .json({ status: 'fail', statusCode, message, details: details ?? null });
  };

  r.unauthorized = (message = 'Unauthorized', details?: unknown) => {
    return res
      .status(401)
      .json({ status: 'fail', statusCode: 401, message, details: details ?? null });
  };

  next();
};

export default responseMiddleware;
