import { Job } from "bullmq";
import { QueueJob, JobStatus } from "@fluximage/types";
import { updateJobStatus } from "../tasks/update-status-task";
import { downloadImage } from "../tasks/download-image-task";
import { validateImage } from "../tasks/validate-image-task";
import { processImage } from "../tasks/process-image-task";
import { uploadImage } from "../tasks/upload-image-task";
import { completeJob } from "../tasks/complete-job-task";
import { failJob } from "../tasks/fail-job-task";

export const processImageJob = async (job: Job<QueueJob>): Promise<void> => {
  const { jobId, inputUrl, transformations } = job.data;

  try {
    await updateJobStatus(jobId, JobStatus.PROCESSING);

    const imageBuffer = await downloadImage(inputUrl);

    const isValid = await validateImage(imageBuffer);
    if (!isValid) {
      throw new Error("Invalid image format");
    }

    const processedBuffer = await processImage(imageBuffer, transformations);

    const outputUrl = await uploadImage(jobId, processedBuffer);

    await completeJob(jobId, outputUrl);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await failJob(jobId, errorMessage);
    throw error;
  }
};
