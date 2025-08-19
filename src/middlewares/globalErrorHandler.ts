import { NextFunction, Request, Response } from 'express';

import AppError from '../utils/AppError';

const handleAppError = (err: AppError, res: Response) => {
  console.error('[AppError]', {
    status: err.status,
    statusCode: err.statusCode,
    message: err.message,
    details: err.details,
  });
  res.status(err.statusCode).json({
    status: err.status,
    statusCode: err.statusCode,
    message: err.message,
    details: err.details || null,
  });
};

const handleGenericError = (err: Error, res: Response) => {
  console.error('[GenericError]', { message: err.message, stack: err.stack });
  res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: 'Something went wrong',
    details: err.message,
  });
};

const globalErrorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return handleAppError(err, res);
  }

  if (err instanceof Error) {
    return handleGenericError(err, res);
  }

  res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: 'An unexpected error occurred',
    details: null,
  });
};

export default globalErrorHandler;
