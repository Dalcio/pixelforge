import dotenv from "dotenv";
import { initializeFirebase } from "./lib/firebase-initializer";
import { createWorker } from "./queue/worker-initializer";

dotenv.config();

// Global exception handlers - must be set up before any async code
process.on("uncaughtException", (error: Error) => {
  console.error("\n❌ [FATAL] Uncaught Exception:");
  console.error("Error:", error.message);
  console.error("Stack:", error.stack);
  console.error("\nShutting down worker due to uncaught exception...");

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

    console.error("\nShutting down worker due to unhandled rejection...");

    // Give time for logs to flush
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
);

initializeFirebase();

const worker = createWorker();

console.log("✓ Worker started and waiting for jobs...");

// Graceful shutdown handlers
process.on("SIGTERM", async () => {
  console.log("\n⚠ SIGTERM received, closing worker gracefully...");
  try {
    await worker.close();
    console.log("✓ Worker closed successfully");
    process.exit(0);
  } catch (error) {
    console.error("✗ Error closing worker:", error);
    process.exit(1);
  }
});

process.on("SIGINT", async () => {
  console.log("\n⚠ SIGINT received (Ctrl+C), closing worker gracefully...");
  try {
    await worker.close();
    console.log("✓ Worker closed successfully");
    process.exit(0);
  } catch (error) {
    console.error("✗ Error closing worker:", error);
    process.exit(1);
  }
});
