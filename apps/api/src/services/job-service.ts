import { generateId } from "@fluximage/utils";
import type { TransformationOptions } from "@fluximage/types";
import { createJobDocument } from "./firestore-service";
import { enqueueJob } from "./queue-service";

export const createJob = async (
  inputUrl: string,
  transformations?: TransformationOptions
): Promise<string> => {
  const jobId = generateId();

  await createJobDocument(jobId, inputUrl, transformations);
  await enqueueJob(jobId, inputUrl, transformations);

  return jobId;
};
