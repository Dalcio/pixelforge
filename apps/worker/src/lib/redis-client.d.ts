import Redis from "ioredis";
export declare const getRedisClient: () => Redis;
export declare const isRedisHealthy: () => Promise<boolean>;
export declare const disconnectRedis: () => Promise<void>;
//# sourceMappingURL=redis-client.d.ts.map