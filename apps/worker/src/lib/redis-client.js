"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectRedis = exports.isRedisHealthy = exports.getRedisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
let redisClient = null;
const getRedisClient = () => {
    if (redisClient) {
        return redisClient;
    }
    const upstashUrl = process.env.UPSTASH_REDIS_URL;
    if (upstashUrl) {
        redisClient = new ioredis_1.default(upstashUrl, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                console.log(`[Worker Redis] Retry attempt ${times}, waiting ${delay}ms...`);
                return delay;
            },
            reconnectOnError(err) {
                const targetError = "READONLY";
                if (err.message.includes(targetError)) {
                    return true;
                }
                return false;
            },
        });
    }
    else {
        const host = process.env.REDIS_HOST || "localhost";
        const port = parseInt(process.env.REDIS_PORT || "6379", 10);
        const password = process.env.REDIS_PASSWORD;
        redisClient = new ioredis_1.default({
            host,
            port,
            password: password || undefined,
            maxRetriesPerRequest: null,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                console.log(`[Worker Redis] Retry attempt ${times}, waiting ${delay}ms...`);
                return delay;
            },
            reconnectOnError(err) {
                const targetError = "READONLY";
                if (err.message.includes(targetError)) {
                    return true;
                }
                return false;
            },
        });
    }
    redisClient.on("connect", () => {
        console.log("[Worker Redis] Connecting to Redis server...");
    });
    redisClient.on("ready", () => {
        console.log("[Worker Redis] ✓ Connected and ready");
    });
    redisClient.on("error", (err) => {
        console.error("[Worker Redis] ✗ Connection error:", err.message);
    });
    redisClient.on("close", () => {
        console.warn("[Worker Redis] Connection closed");
    });
    redisClient.on("reconnecting", (delay) => {
        console.log(`[Worker Redis] Reconnecting in ${delay}ms...`);
    });
    redisClient.on("end", () => {
        console.warn("[Worker Redis] Connection ended");
    });
    return redisClient;
};
exports.getRedisClient = getRedisClient;
const isRedisHealthy = async () => {
    try {
        if (!redisClient) {
            return false;
        }
        await redisClient.ping();
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.isRedisHealthy = isRedisHealthy;
const disconnectRedis = async () => {
    if (redisClient) {
        const client = redisClient;
        redisClient = null;
        try {
            await client.quit();
        }
        catch (error) {
            console.error("[Worker Redis] Error during disconnect:", error);
            client.disconnect();
        }
    }
};
exports.disconnectRedis = disconnectRedis;
//# sourceMappingURL=redis-client.js.map