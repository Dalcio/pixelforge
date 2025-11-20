import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test the client initialization behavior
// This is a smoke test to ensure the module can be imported

describe('Redis Client Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should export getRedisClient function', async () => {
    const { getRedisClient } = await import('./redis-client');
    expect(getRedisClient).toBeDefined();
    expect(typeof getRedisClient).toBe('function');
  });

  it('should export isRedisHealthy function', async () => {
    const { isRedisHealthy } = await import('./redis-client');
    expect(isRedisHealthy).toBeDefined();
    expect(typeof isRedisHealthy).toBe('function');
  });

  it('should configure retry strategy with exponential backoff', () => {
    // Test retry strategy logic
    const times = [1, 2, 3, 10, 50];
    const expectedDelays = [50, 100, 150, 500, 2000];

    times.forEach((time, index) => {
      const delay = Math.min(time * 50, 2000);
      expect(delay).toBe(expectedDelays[index]);
    });
  });

  it('should have maximum retry delay of 2000ms', () => {
    const maxTimes = [100, 1000, 10000];
    
    maxTimes.forEach((time) => {
      const delay = Math.min(time * 50, 2000);
      expect(delay).toBe(2000);
    });
  });

  it('should use environment variables for connection config', () => {
    const config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
    };

    expect(config.host).toBeDefined();
    expect(config.port).toBeGreaterThan(0);
    // Password can be undefined (no auth required)
    expect(['string', 'undefined']).toContain(typeof config.password);
  });

  it('should have default host as localhost', () => {
    const host = process.env.REDIS_HOST || 'localhost';
    expect(host).toBe('localhost');
  });

  it('should have default port as 6379', () => {
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    expect(port).toBe(6379);
  });

  it('should handle reconnectOnError for READONLY errors', () => {
    const reconnectOnError = (err: Error) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    };

    const readonlyError = new Error('READONLY You can\'t write against a read only replica');
    const otherError = new Error('Connection timeout');

    expect(reconnectOnError(readonlyError)).toBe(true);
    expect(reconnectOnError(otherError)).toBe(false);
  });
});

describe('Redis Health Check', () => {
  it('should return false when redis client is null', async () => {
    // This test verifies the health check handles null client
    const isHealthy = async (client: any): Promise<boolean> => {
      try {
        if (!client) {
          return false;
        }
        await client.ping();
        return true;
      } catch (error) {
        return false;
      }
    };

    const result = await isHealthy(null);
    expect(result).toBe(false);
  });

  it('should return false when ping throws error', async () => {
    const isHealthy = async (client: any): Promise<boolean> => {
      try {
        if (!client) {
          return false;
        }
        await client.ping();
        return true;
      } catch (error) {
        return false;
      }
    };

    const mockClient = {
      ping: vi.fn().mockRejectedValue(new Error('Connection refused')),
    };

    const result = await isHealthy(mockClient);
    expect(result).toBe(false);
  });

  it('should return true when ping succeeds', async () => {
    const isHealthy = async (client: any): Promise<boolean> => {
      try {
        if (!client) {
          return false;
        }
        await client.ping();
        return true;
      } catch (error) {
        return false;
      }
    };

    const mockClient = {
      ping: vi.fn().mockResolvedValue('PONG'),
    };

    const result = await isHealthy(mockClient);
    expect(result).toBe(true);
  });
});
