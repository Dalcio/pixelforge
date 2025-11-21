import Redis from "ioredis";

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (redisClient) {
    return redisClient;
  }

  // Support Upstash Redis URL format or individual host/port/password
  const upstashUrl = process.env.UPSTASH_REDIS_URL;

  if (upstashUrl) {
    // Use Upstash URL with TLS support
    redisClient = new Redis(upstashUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        console.log(
          `[API Redis] Retry attempt ${times}, waiting ${delay}ms...`
        );
        return delay;
      },
      reconnectOnError(err: Error) {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });
  } else {
    // Use individual configuration for local development
    const host = process.env.REDIS_HOST || "localhost";
    const port = parseInt(process.env.REDIS_PORT || "6379", 10);
    const password = process.env.REDIS_PASSWORD;

    redisClient = new Redis({
      host,
      port,
      password: password || undefined,
      maxRetriesPerRequest: null,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        console.log(
          `[API Redis] Retry attempt ${times}, waiting ${delay}ms...`
        );
        return delay;
      },
      reconnectOnError(err: Error) {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });
  }

  // Connection event handlers
  redisClient.on("connect", () => {
    console.log("[API Redis] Connecting to Redis server...");
  });

  redisClient.on("ready", () => {
    console.log("[API Redis] ✓ Connected and ready");
  });

  redisClient.on("error", (err: Error) => {
    console.error("[API Redis] ✗ Connection error:", err.message);
  });

  redisClient.on("close", () => {
    console.warn("[API Redis] Connection closed");
  });

  redisClient.on("reconnecting", (delay: number) => {
    console.log(`[API Redis] Reconnecting in ${delay}ms...`);
  });

  redisClient.on("end", () => {
    console.warn("[API Redis] Connection ended");
  });

  return redisClient;
};

export const isRedisHealthy = async (): Promise<boolean> => {
  try {
    if (!redisClient) {
      // Initialize Redis client if not yet created
      getRedisClient();
      // Give it a moment to connect
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!redisClient) {
      return false;
    }
    await redisClient.ping();
    return true;
  } catch (error) {
    return false;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    const client = redisClient;
    redisClient = null;
    try {
      await client.quit();
    } catch (error) {
      console.error("[API Redis] Error during disconnect:", error);
      // Force disconnect if quit fails
      client.disconnect();
    }
  }
};
