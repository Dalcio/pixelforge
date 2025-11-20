import { Queue } from "bullmq";
import { getRedisClient } from "./redis-client";

let queue: Queue | null = null;

export const getQueue = (): Queue => {
  if (queue) {
    return queue;
  }

  const connection = getRedisClient();

  queue = new Queue("image-processing", {
    connection,
  });

  // Queue event handlers
  queue.on("error", (err: Error) => {
    console.error("[API Queue] Error:", err.message);
  });

  return queue;
};
