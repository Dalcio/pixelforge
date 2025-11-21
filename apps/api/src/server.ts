import dotenv from "dotenv";
import { createApp } from "./app";
import { initializeFirebase } from "./lib/firebase-initializer";
import { disconnectRedis } from "./lib/redis-client";
import { Server } from "http";
import { Worker } from "bullmq";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_STORAGE_BUCKET",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  process.stderr.write(
    `\n❌ [FATAL] Missing required environment variables:\n${missingVars
      .map((v) => `  - ${v}`)
      .join("\n")}\n\nPlease check your .env file and try again.\n\n`
  );
  process.exit(1);
}

if (!process.env.UPSTASH_REDIS_URL && !process.env.REDIS_HOST) {
  process.stderr.write(
    "\n⚠️  [WARNING] No Redis configuration found. Either UPSTASH_REDIS_URL or REDIS_HOST must be set.\n\n"
  );
}

// Global exception handlers - must be set up before any async code
process.on("uncaughtException", (error: Error) => {
  process.stderr.write(
    `\n❌ [FATAL] Uncaught Exception:\nError: ${error.message}\nStack: ${error.stack}\n\nShutting down server due to uncaught exception...\n`
  );

  // Give time for logs to flush
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    const errorMessage =
      reason instanceof Error ? reason.message : String(reason);
    const errorStack = reason instanceof Error ? reason.stack : "";

    process.stderr.write(
      `\n❌ [FATAL] Unhandled Promise Rejection:\nReason: ${errorMessage}\n${
        errorStack ? `Stack: ${errorStack}\n` : ""
      }\nShutting down server due to unhandled rejection...\n`
    );

    // Give time for logs to flush
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
);

initializeFirebase();

const app = createApp();
const port = process.env.PORT || 3000;

const server: Server = app.listen(port, () => {
  process.stdout.write(`✓ API server running on port ${port}\n`);
});

// Start Worker alongside API
let worker: Worker | null = null;

async function startWorker() {
  try {
    const { Worker } = await import("bullmq");
    const { getRedisClient } = await import("./lib/redis-client");
    const { processImageJob } = await import("./worker/image-processor");

    const connection = getRedisClient();

    worker = new Worker("image-processing", processImageJob, {
      connection,
      concurrency: 5,
    });

    worker.on("completed", (job) => {
      process.stdout.write(`[Worker] ✓ Job ${job.id} completed successfully\n`);
    });

    worker.on("failed", (job, err) => {
      process.stderr.write(
        `[Worker] ✗ Job ${job?.id} failed: ${err.message}\n`
      );
    });

    worker.on("error", (err) => {
      process.stderr.write(`[Worker] Worker error: ${err.message}\n`);
    });

    worker.on("active", (job) => {
      process.stdout.write(`[Worker] → Processing job ${job.id}...\n`);
    });

    process.stdout.write("✓ Worker started and waiting for jobs...\n");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    process.stderr.write(`✗ Failed to start worker: ${errorMsg}\n`);
    // Don't exit - API can still work without worker
  }
}

// Start worker immediately
startWorker();

// Graceful shutdown handlers
process.on("SIGTERM", async () => {
  process.stdout.write("\n⚠ SIGTERM received, closing server gracefully...\n");

  // Close worker first
  if (worker) {
    try {
      await worker.close();
      process.stdout.write("✓ Worker closed successfully\n");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`✗ Error closing worker: ${errorMsg}\n`);
    }
  }

  server.close(async (err) => {
    if (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`✗ Error closing server: ${errorMsg}\n`);
      await disconnectRedis();
      process.exit(1);
    }

    process.stdout.write("✓ Server closed successfully\n");
    await disconnectRedis();
    process.stdout.write("✓ Redis connection closed\n");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(async () => {
    process.stderr.write("⚠ Forcefully shutting down after timeout\n");
    await disconnectRedis();
    process.exit(1);
  }, 10000);
});

process.on("SIGINT", async () => {
  process.stdout.write(
    "\n⚠ SIGINT received (Ctrl+C), closing server gracefully...\n"
  );

  // Close worker first
  if (worker) {
    try {
      await worker.close();
      process.stdout.write("✓ Worker closed successfully\n");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`✗ Error closing worker: ${errorMsg}\n`);
    }
  }

  server.close(async (err) => {
    if (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`✗ Error closing server: ${errorMsg}\n`);
      await disconnectRedis();
      process.exit(1);
    }

    process.stdout.write("✓ Server closed successfully\n");
    await disconnectRedis();
    process.stdout.write("✓ Redis connection closed\n");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(async () => {
    process.stderr.write("⚠ Forcefully shutting down after timeout\n");
    await disconnectRedis();
    process.exit(1);
  }, 10000);
});
