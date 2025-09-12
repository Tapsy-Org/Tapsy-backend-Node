import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

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

const handleMulterError = (err: multer.MulterError, res: Response) => {
  console.error('[MulterError]', { message: err.message, code: err.code });

  let message = 'File upload error';
  let statusCode = 400;

  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      message = 'File too large. Maximum size is 100MB';
      break;
    case 'LIMIT_FILE_COUNT':
      message = 'Too many files uploaded';
      break;
    case 'LIMIT_UNEXPECTED_FILE':
      message = 'Unexpected field name. Expected field name: video';
      break;
    default:
      message = err.message;
  }

  res.status(statusCode).json({
    status: 'fail',
    statusCode,
    message,
    details: null,
  });
};

const globalErrorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return handleAppError(err, res);
  }

  if (err instanceof Error && 'code' in err && err.code === 'LIMIT_UNEXPECTED_FILE') {
    return handleMulterError(err as multer.MulterError, res);
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
