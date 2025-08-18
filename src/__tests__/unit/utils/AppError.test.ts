import { jest } from '@jest/globals';
import AppError from '../../../utils/AppError';

// Mock Error.captureStackTrace
const mockCaptureStackTrace = jest.fn();
Object.defineProperty(Error, 'captureStackTrace', {
  value: mockCaptureStackTrace,
  writable: true,
});

describe('AppError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an AppError with basic properties', () => {
    const error = new AppError('Test error message', 400);

    expect(error.message).toBe('Test error message');
    expect(error.statusCode).toBe(400);
    expect(error.status).toBe('fail');
    expect(error.details).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it('should set status to "fail" for 4xx status codes', () => {
    const error400 = new AppError('Bad Request', 400);
    const error404 = new AppError('Not Found', 404);
    const error422 = new AppError('Unprocessable Entity', 422);

    expect(error400.status).toBe('fail');
    expect(error404.status).toBe('fail');
    expect(error422.status).toBe('fail');
  });

  it('should set status to "error" for 5xx status codes', () => {
    const error500 = new AppError('Internal Server Error', 500);
    const error502 = new AppError('Bad Gateway', 502);
    const error503 = new AppError('Service Unavailable', 503);

    expect(error500.status).toBe('error');
    expect(error502.status).toBe('error');
    expect(error503.status).toBe('error');
  });

  it('should accept custom details', () => {
    const details = { field: 'email', reason: 'Invalid format' };
    const error = new AppError('Validation error', 400, details);

    expect(error.details).toEqual(details);
  });

  it('should capture stack trace', () => {
    new AppError('Test error', 500);

    expect(mockCaptureStackTrace).toHaveBeenCalledTimes(1);
    expect(mockCaptureStackTrace).toHaveBeenCalledWith(expect.any(AppError), AppError);
  });

  it('should work with different status codes', () => {
    const statusCodes = [200, 201, 400, 401, 403, 404, 500, 502, 503];

    statusCodes.forEach((statusCode) => {
      const error = new AppError(`Error ${statusCode}`, statusCode);
      expect(error.statusCode).toBe(statusCode);
      expect(error.message).toBe(`Error ${statusCode}`);
    });
  });

  it('should handle empty message', () => {
    const error = new AppError('', 500);

    expect(error.message).toBe('');
    expect(error.statusCode).toBe(500);
    expect(error.status).toBe('error');
  });

  it('should handle null details explicitly', () => {
    const error = new AppError('Test error', 400, null);

    expect(error.details).toBeNull();
  });

  it('should handle complex details object', () => {
    const complexDetails = {
      validationErrors: [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too short' },
      ],
      timestamp: new Date().toISOString(),
      requestId: 'req-123',
    };

    const error = new AppError('Validation failed', 422, complexDetails);

    expect(error.details).toEqual(complexDetails);
  });
});
