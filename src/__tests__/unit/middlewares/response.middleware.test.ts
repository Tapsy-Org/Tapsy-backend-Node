import { jest } from '@jest/globals';
import { Request, Response } from 'express';

import responseMiddleware from '../../../middlewares/response.middleware';

describe('Response Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<any>;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
    next = jest.fn();
  });

  it('should add success method to response object', () => {
    responseMiddleware(req as Request, res as Response, next);

    expect(res.success).toBeDefined();
    expect(typeof res.success).toBe('function');
  });

  it('should add created method to response object', () => {
    responseMiddleware(req as Request, res as Response, next);

    expect(res.created).toBeDefined();
    expect(typeof res.created).toBe('function');
  });

  it('should add fail method to response object', () => {
    responseMiddleware(req as Request, res as Response, next);

    expect(res.fail).toBeDefined();
    expect(typeof res.fail).toBe('function');
  });

  it('should call next function', () => {
    responseMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  describe('success method', () => {
    it('should return success response with default values', () => {
      responseMiddleware(req as Request, res as Response, next);

      res.success!();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'OK',
        data: undefined,
      });
    });

    it('should return success response with custom data', () => {
      const testData = { id: 1, name: 'Test' };
      responseMiddleware(req as Request, res as Response, next);

      res.success!(testData);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'OK',
        data: testData,
      });
    });

    it('should return success response with custom message', () => {
      responseMiddleware(req as Request, res as Response, next);

      res.success!(undefined, 'Custom message');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Custom message',
        data: undefined,
      });
    });

    it('should return success response with custom status code', () => {
      responseMiddleware(req as Request, res as Response, next);

      res.success!(undefined, 'OK', 201);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'OK',
        data: undefined,
      });
    });
  });

  describe('created method', () => {
    it('should return created response with default values', () => {
      responseMiddleware(req as Request, res as Response, next);

      res.created!();

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Created',
        data: undefined,
      });
    });

    it('should return created response with custom data', () => {
      const testData = { id: 1, name: 'Test' };
      responseMiddleware(req as Request, res as Response, next);

      res.created!(testData);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Created',
        data: testData,
      });
    });

    it('should return created response with custom message', () => {
      responseMiddleware(req as Request, res as Response, next);

      res.created!(undefined, 'User created successfully');

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'User created successfully',
        data: undefined,
      });
    });
  });

  describe('fail method', () => {
    it('should return fail response with default values', () => {
      responseMiddleware(req as Request, res as Response, next);

      res.fail!('Error message');

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        statusCode: 400,
        message: 'Error message',
        details: null,
      });
    });

    it('should return fail response with custom status code', () => {
      responseMiddleware(req as Request, res as Response, next);

      res.fail!('Not found', 404);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        statusCode: 404,
        message: 'Not found',
        details: null,
      });
    });

    it('should return fail response with custom details', () => {
      const errorDetails = { field: 'email', reason: 'Invalid format' };
      responseMiddleware(req as Request, res as Response, next);

      res.fail!('Validation error', 400, errorDetails);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        statusCode: 400,
        message: 'Validation error',
        details: errorDetails,
      });
    });
  });
});
