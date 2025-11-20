import { Job } from "bullmq";
import { QueueJob, JobStatus } from "@fluximage/types";
import { updateJobStatus } from "../tasks/update-status-task";
import { downloadImage, DownloadError } from "../tasks/download-image-task";
import { validateImage } from "../tasks/validate-image-task";
import { processImage, ProcessingError } from "../tasks/process-image-task";
import { uploadImage } from "../tasks/upload-image-task";
import { completeJob } from "../tasks/complete-job-task";
import { failJob } from "../tasks/fail-job-task";

interface JobError {
  message: string;
  step: string;
  url: string;
  jobId: string;
  timestamp: string;
}

export const processImageJob = async (job: Job<QueueJob>): Promise<void> => {
  const { jobId, inputUrl, transformations } = job.data;
  const timestamp = new Date().toISOString();

  try {
    await updateJobStatus(jobId, JobStatus.PROCESSING);

    let imageBuffer: Buffer;
    try {
      imageBuffer = await downloadImage(inputUrl);
    } catch (error) {
      if (error instanceof DownloadError) {
        const jobError: JobError = {
          message: error.message,
          step: 'download',
          url: inputUrl,
          jobId,
          timestamp,
        };
        await failJob(jobId, `Download failed: ${error.message}`);
        throw new Error(JSON.stringify(jobError));
      }
      throw error;
    }

    let isValid: boolean;
    try {
      isValid = await validateImage(imageBuffer);
    } catch (error) {
      const jobError: JobError = {
        message: error instanceof Error ? error.message : 'Validation failed',
        step: 'validate',
        url: inputUrl,
        jobId,
        timestamp,
      };
      await failJob(jobId, `Validation failed: ${jobError.message}`);
      throw new Error(JSON.stringify(jobError));
    }

    if (!isValid) {
      const jobError: JobError = {
        message: 'Invalid image format or corrupted image data',
        step: 'validate',
        url: inputUrl,
        jobId,
        timestamp,
      };
      await failJob(jobId, jobError.message);
      throw new Error(JSON.stringify(jobError));
    }

    let processedBuffer: Buffer;
    try {
      processedBuffer = await processImage(imageBuffer, transformations);
    } catch (error) {
      if (error instanceof ProcessingError) {
        const jobError: JobError = {
          message: error.message,
          step: `processing:${error.step}`,
          url: inputUrl,
          jobId,
          timestamp,
        };
        await failJob(jobId, `Processing failed: ${error.message}`);
        throw new Error(JSON.stringify(jobError));
      }
      throw error;
    }

    let outputUrl: string;
    try {
      outputUrl = await uploadImage(jobId, processedBuffer);
    } catch (error) {
      const jobError: JobError = {
        message: error instanceof Error ? error.message : 'Upload failed',
        step: 'upload',
        url: inputUrl,
        jobId,
        timestamp,
      };
      await failJob(jobId, `Upload failed: ${jobError.message}`);
      throw new Error(JSON.stringify(jobError));
    }

    await completeJob(jobId, outputUrl);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    
    // If it's already a formatted error, re-throw
    try {
      JSON.parse(errorMessage);
      throw error;
    } catch {
      // Not JSON, create a generic error
      const jobError: JobError = {
        message: errorMessage,
        step: 'unknown',
        url: inputUrl,
        jobId,
        timestamp,
      };
      throw new Error(JSON.stringify(jobError));
    }
  }
};
