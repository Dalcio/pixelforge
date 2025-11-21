import dotenv from "dotenv";
import { createApp } from "./app";
import { initializeFirebase } from "./lib/firebase-initializer";
import { disconnectRedis } from "./lib/redis-client";
import { Server } from "http";
import { Worker } from "bullmq";

dotenv.config();

// Global exception handlers - must be set up before any async code
process.on("uncaughtException", (error: Error) => {
  console.error("\n❌ [FATAL] Uncaught Exception:");
  console.error("Error:", error.message);
  console.error("Stack:", error.stack);
  console.error("\nShutting down server due to uncaught exception...");

  // Give time for logs to flush
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    console.error("\n❌ [FATAL] Unhandled Promise Rejection:");
    console.error("Promise:", promise);
    console.error("Reason:", reason);

    if (reason instanceof Error) {
      console.error("Stack:", reason.stack);
    }

    console.error("\nShutting down server due to unhandled rejection...");

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
  console.log(`✓ API server running on port ${port}`);
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
      console.log(`[Worker] ✓ Job ${job.id} completed successfully`);
    });

    worker.on("failed", (job, err) => {
      console.error(`[Worker] ✗ Job ${job?.id} failed:`, err.message);
    });

    worker.on("error", (err) => {
      console.error("[Worker] Worker error:", err.message);
    });

    worker.on("active", (job) => {
      console.log(`[Worker] → Processing job ${job.id}...`);
    });

    console.log("✓ Worker started and waiting for jobs...");
  } catch (error) {
    console.error("✗ Failed to start worker:", error);
    // Don't exit - API can still work without worker
  }
}

// Start worker immediately
startWorker();

// Graceful shutdown handlers
process.on("SIGTERM", async () => {
  console.log("\n⚠ SIGTERM received, closing server gracefully...");

  // Close worker first
  if (worker) {
    try {
      await worker.close();
      console.log("✓ Worker closed successfully");
    } catch (err) {
      console.error("✗ Error closing worker:", err);
    }
  }

  server.close(async (err) => {
    if (err) {
      console.error("✗ Error closing server:", err);
      await disconnectRedis();
      process.exit(1);
    }

    console.log("✓ Server closed successfully");
    await disconnectRedis();
    console.log("✓ Redis connection closed");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(async () => {
    console.error("⚠ Forcefully shutting down after timeout");
    await disconnectRedis();
    process.exit(1);
  }, 10000);
});

process.on("SIGINT", async () => {
  console.log("\n⚠ SIGINT received (Ctrl+C), closing server gracefully...");

  // Close worker first
  if (worker) {
    try {
      await worker.close();
      console.log("✓ Worker closed successfully");
    } catch (err) {
      console.error("✗ Error closing worker:", err);
    }
  }

  server.close(async (err) => {
    if (err) {
      console.error("✗ Error closing server:", err);
      await disconnectRedis();
      process.exit(1);
    }

    console.log("✓ Server closed successfully");
    await disconnectRedis();
    console.log("✓ Redis connection closed");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(async () => {
    console.error("⚠ Forcefully shutting down after timeout");
    await disconnectRedis();
    process.exit(1);
  }, 10000);
});
