import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from './error-handler';

describe('errorHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let consoleErrorSpy: any;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn() as unknown as NextFunction;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should respond with 500 status code', () => {
    const error = new Error('Test error');

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
  });

  it('should respond with error message in JSON', () => {
    const error = new Error('Test error message');

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Test error message',
    });
  });

  it('should log the error to console', () => {
    const error = new Error('Test error');

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
  });

  it('should handle error without message', () => {
    const error = new Error();

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
  });

  it('should handle error with empty message', () => {
    const error = new Error('');

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
  });

  it('should handle custom error messages', () => {
    const customError = new Error('Custom validation failed');

    errorHandler(
      customError,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Custom validation failed',
    });
  });

  it('should handle errors with special characters in message', () => {
    const error = new Error('Error with "quotes" and \'apostrophes\'');

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Error with "quotes" and \'apostrophes\'',
    });
  });

  it('should handle errors with multiline messages', () => {
    const error = new Error('Line 1\nLine 2\nLine 3');

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Line 1\nLine 2\nLine 3',
    });
  });

  it('should not call next function', () => {
    const error = new Error('Test error');

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle error objects with additional properties', () => {
    const error = new Error('Database connection failed') as Error & {
      code: string;
      statusCode: number;
    };
    error.code = 'ECONNREFUSED';
    error.statusCode = 503;

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Should still return 500 and the error message (not custom status)
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Database connection failed',
    });
  });

  it('should handle TypeError', () => {
    const error = new TypeError('Cannot read property of undefined');

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Cannot read property of undefined',
    });
  });

  it('should handle ReferenceError', () => {
    const error = new ReferenceError('Variable is not defined');

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Variable is not defined',
    });
  });
});
