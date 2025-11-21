import { Job } from "bullmq";
import { QueueJob, JobStatus } from "@fluximage/types";
import axios from "axios";
import sharp from "sharp";
import { getFirestore } from "../lib/firestore-client";
import * as admin from "firebase-admin";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Main worker function - processes image transformation jobs
 * Runs in the same process as the API server
 */
export const processImageJob = async (job: Job<QueueJob>): Promise<void> => {
  const { jobId, inputUrl, transformations } = job.data;

  try {
    // Update status to processing
    await updateJobInFirestore(jobId, {
      status: JobStatus.PROCESSING,
      progress: 0,
    });

    // Step 1: Download image (20%)
    await updateJobInFirestore(jobId, { progress: 20 });
    const imageBuffer = await downloadImage(inputUrl);

    // Step 2: Validate image (40%)
    await updateJobInFirestore(jobId, { progress: 40 });
    const isValid = await validateImage(imageBuffer);
    if (!isValid) {
      throw new Error("Invalid image format or corrupted image data");
    }

    // Step 3: Process transformations (60%)
    await updateJobInFirestore(jobId, { progress: 60 });
    const processedBuffer = await transformImage(imageBuffer, transformations);

    // Step 4: Upload to Firebase Storage (80%)
    await updateJobInFirestore(jobId, { progress: 80 });
    const outputUrl = await uploadToStorage(jobId, processedBuffer);

    // Step 5: Complete job (100%)
    await updateJobInFirestore(jobId, {
      status: JobStatus.COMPLETED,
      progress: 100,
      outputUrl,
      updatedAt: new Date(),
    });

    process.stdout.write(`[Worker] ✓ Job ${jobId} completed successfully\n`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    process.stderr.write(`[Worker] ✗ Job ${jobId} failed: ${errorMessage}\n`);

    await updateJobInFirestore(jobId, {
      status: JobStatus.FAILED,
      error: errorMessage,
      updatedAt: new Date(),
    });

    throw error;
  }
};

/**
 * Download image from URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 30000,
    maxContentLength: MAX_FILE_SIZE,
    maxBodyLength: MAX_FILE_SIZE,
  });

  return Buffer.from(response.data);
}

/**
 * Validate image buffer
 */
async function validateImage(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();
    return !!(metadata.width && metadata.height);
  } catch {
    return false;
  }
}

/**
 * Apply transformations to image
 */
async function transformImage(
  buffer: Buffer,
  transformations?: QueueJob["transformations"]
): Promise<Buffer> {
  let pipeline = sharp(buffer);

  if (!transformations) {
    // No transformations, just optimize
    return pipeline.jpeg({ quality: 80 }).toBuffer();
  }

  // Resize
  if (transformations.width || transformations.height) {
    pipeline = pipeline.resize({
      width: transformations.width,
      height: transformations.height,
      fit: "cover",
    });
  }

  // Rotate
  if (transformations.rotate) {
    pipeline = pipeline.rotate(transformations.rotate);
  }

  // Flip
  if (transformations.flip) {
    pipeline = pipeline.flip();
  }

  // Flop
  if (transformations.flop) {
    pipeline = pipeline.flop();
  }

  // Grayscale
  if (transformations.grayscale) {
    pipeline = pipeline.grayscale();
  }

  // Blur
  if (transformations.blur) {
    pipeline = pipeline.blur(transformations.blur);
  }

  // Sharpen
  if (transformations.sharpen) {
    pipeline = pipeline.sharpen();
  }

  // Quality
  const quality = transformations.quality || 80;

  // Always output as JPEG for consistency
  pipeline = pipeline.jpeg({ quality });

  return pipeline.toBuffer();
}

/**
 * Upload processed image to Firebase Storage
 */
async function uploadToStorage(jobId: string, buffer: Buffer): Promise<string> {
  const bucket = admin.storage().bucket();
  const fileName = `processed/${jobId}.jpg`;
  const file = bucket.file(fileName);

  await file.save(buffer, {
    metadata: {
      contentType: "image/jpeg",
    },
  });

  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

/**
 * Update job in Firestore
 */
async function updateJobInFirestore(
  jobId: string,
  updates: Partial<{
    status: JobStatus;
    progress: number;
    outputUrl: string;
    error: string;
    updatedAt: Date;
  }>
): Promise<void> {
  const db = getFirestore();
  await db
    .collection("jobs")
    .doc(jobId)
    .update({
      ...updates,
      updatedAt: new Date(),
    });
}
