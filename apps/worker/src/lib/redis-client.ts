import Redis from 'ioredis';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (redisClient) {
    return redisClient;
  }

  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD;

  redisClient = new Redis({
    host,
    port,
    password: password || undefined,
    maxRetriesPerRequest: null,
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      console.log(`[Worker Redis] Retry attempt ${times}, waiting ${delay}ms...`);
      return delay;
    },
    reconnectOnError(err: Error) {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  });

  // Connection event handlers
  redisClient.on('connect', () => {
    console.log('[Worker Redis] Connecting to Redis server...');
  });

  redisClient.on('ready', () => {
    console.log('[Worker Redis] ✓ Connected and ready');
  });

  redisClient.on('error', (err: Error) => {
    console.error('[Worker Redis] ✗ Connection error:', err.message);
  });

  redisClient.on('close', () => {
    console.warn('[Worker Redis] Connection closed');
  });

  redisClient.on('reconnecting', (delay: number) => {
    console.log(`[Worker Redis] Reconnecting in ${delay}ms...`);
  });

  redisClient.on('end', () => {
    console.warn('[Worker Redis] Connection ended');
  });

  return redisClient;
};

export const isRedisHealthy = async (): Promise<boolean> => {
  try {
    if (!redisClient) {
      return false;
    }
    await redisClient.ping();
    return true;
  } catch (error) {
    return false;
  }
};
