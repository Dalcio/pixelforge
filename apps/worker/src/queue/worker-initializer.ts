import { Worker } from "bullmq";
import { getRedisClient } from "../lib/redis-client";
import { processImageJob } from "../processors/image-processor";

export const createWorker = (): Worker => {
  const connection = getRedisClient();

  const worker = new Worker("image-processing", processImageJob, {
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

  return worker;
};
