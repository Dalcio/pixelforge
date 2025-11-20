import { QueueJob, TransformationOptions } from "@fluximage/types";
import { getQueue } from "../lib/queue-client";

export const enqueueJob = async (
  jobId: string,
  inputUrl: string,
  transformations?: TransformationOptions
): Promise<void> => {
  const queue = getQueue();

  const jobData: QueueJob = {
    jobId,
    inputUrl,
    transformations,
  };

  await queue.add("process-image", jobData, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });
};
