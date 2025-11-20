import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkUrlReachability } from './url-reachability-checker';
import http from 'http';
import https from 'https';

// Mock http and https modules
vi.mock('http');
vi.mock('https');

describe('checkUrlReachability', () => {
  let mockRequest: {
    end: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRequest = {
      end: vi.fn(),
      on: vi.fn(),
      destroy: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return true for reachable HTTP URL with 200 status', async () => {
    const mockHttpRequest = vi.fn((_url, _options, callback) => {
      // Simulate successful response
      setTimeout(() => {
        callback({ statusCode: 200 });
      }, 0);
      return mockRequest;
    });

    vi.mocked(http.request).mockImplementation(mockHttpRequest as any);

    const result = await checkUrlReachability('http://example.com/image.jpg');
    expect(result).toBe(true);
    expect(http.request).toHaveBeenCalledWith(
      'http://example.com/image.jpg',
      { method: 'HEAD', timeout: 5000 },
      expect.any(Function)
    );
  });

  it('should return true for reachable HTTPS URL with 200 status', async () => {
    const mockHttpsRequest = vi.fn((_url, _options, callback) => {
      setTimeout(() => {
        callback({ statusCode: 200 });
      }, 0);
      return mockRequest;
    });

    vi.mocked(https.request).mockImplementation(mockHttpsRequest as any);

    const result = await checkUrlReachability('https://example.com/image.jpg');
    expect(result).toBe(true);
    expect(https.request).toHaveBeenCalled();
  });

  it('should return true for 3xx redirect status codes', async () => {
    const mockHttpRequest = vi.fn((_url, _options, callback) => {
      setTimeout(() => {
        callback({ statusCode: 301 });
      }, 0);
      return mockRequest;
    });

    vi.mocked(http.request).mockImplementation(mockHttpRequest as any);

    const result = await checkUrlReachability('http://example.com/image.jpg');
    expect(result).toBe(true);
  });

  it('should return false for 404 status code', async () => {
    const mockHttpRequest = vi.fn((_url, _options, callback) => {
      setTimeout(() => {
        callback({ statusCode: 404 });
      }, 0);
      return mockRequest;
    });

    vi.mocked(http.request).mockImplementation(mockHttpRequest as any);

    const result = await checkUrlReachability('http://example.com/not-found.jpg');
    expect(result).toBe(false);
  });

  it('should return false for 500 server error', async () => {
    const mockHttpRequest = vi.fn((_url, _options, callback) => {
      setTimeout(() => {
        callback({ statusCode: 500 });
      }, 0);
      return mockRequest;
    });

    vi.mocked(http.request).mockImplementation(mockHttpRequest as any);

    const result = await checkUrlReachability('http://example.com/error.jpg');
    expect(result).toBe(false);
  });

  it('should return false on network error', async () => {
    let errorHandler: (error: Error) => void;

    const mockHttpRequest = vi.fn((_url, _options, _callback) => {
      mockRequest.on.mockImplementation((event: string, handler: any) => {
        if (event === 'error') {
          errorHandler = handler;
          setTimeout(() => errorHandler(new Error('Network error')), 0);
        }
        return mockRequest;
      });
      return mockRequest;
    });

    vi.mocked(http.request).mockImplementation(mockHttpRequest as any);

    const result = await checkUrlReachability('http://unreachable.example.com');
    expect(result).toBe(false);
  });

  it('should return false on timeout', async () => {
    let timeoutHandler: () => void;

    const mockHttpRequest = vi.fn((_url, _options, _callback) => {
      mockRequest.on.mockImplementation((event: string, handler: any) => {
        if (event === 'timeout') {
          timeoutHandler = handler;
          setTimeout(() => timeoutHandler(), 0);
        }
        return mockRequest;
      });
      return mockRequest;
    });

    vi.mocked(http.request).mockImplementation(mockHttpRequest as any);

    const result = await checkUrlReachability('http://slow.example.com/image.jpg');
    expect(result).toBe(false);
    expect(mockRequest.destroy).toHaveBeenCalled();
  });

  it('should handle undefined status code', async () => {
    const mockHttpRequest = vi.fn((_url, _options, callback) => {
      setTimeout(() => {
        callback({ statusCode: undefined });
      }, 0);
      return mockRequest;
    });

    vi.mocked(http.request).mockImplementation(mockHttpRequest as any);

    const result = await checkUrlReachability('http://example.com/image.jpg');
    expect(result).toBe(false);
  });
});
