# Worker Service Documentation

## Overview

The worker service processes image jobs from the Redis queue using BullMQ with strict task-based architecture following SRP.

## Project Structure

```
apps/worker/
├── src/
│   ├── processors/           # Job orchestration only
│   │   └── image-processor.ts
│   ├── tasks/                # Atomic operations only
│   │   ├── update-status-task.ts
│   │   ├── download-image-task.ts
│   │   ├── validate-image-task.ts
│   │   ├── process-image-task.ts
│   │   ├── upload-image-task.ts
│   │   ├── complete-job-task.ts
│   │   └── fail-job-task.ts
│   ├── queue/                # Queue management only
│   │   └── worker-initializer.ts
│   ├── lib/                  # External integrations
│   │   ├── firebase-initializer.ts
│   │   ├── firestore-client.ts
│   │   ├── storage-client.ts
│   │   └── redis-client.ts
│   └── worker.ts             # Entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## Processing Pipeline

Each step is an **isolated task module** with one responsibility:

```
1. update-status-task      → Set status to "processing"
2. download-image-task     → Fetch image from URL
3. validate-image-task     → Verify valid image format
4. process-image-task      → Resize/optimize with Sharp
5. upload-image-task       → Upload to Firebase Storage
6. complete-job-task       → Update status to "completed"
7. fail-job-task           → Handle errors (if any)
```

## Task Modules (SRP)

### 1. Update Status Task

**Responsibility**: Update job status in Firestore only

```typescript
// update-status-task.ts
export const updateJobStatus = async (
  jobId: string, 
  status: JobStatus
): Promise<void> => {
  const db = getFirestore();
  await db.collection('jobs').doc(jobId).update({
    status,
    updatedAt: formatDate(new Date()),
  });
};
```

### 2. Download Image Task

**Responsibility**: Download image buffer from URL only

```typescript
// download-image-task.ts
export const downloadImage = async (url: string): Promise<Buffer> => {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
  });
  return Buffer.from(response.data);
};
```

### 3. Validate Image Task

**Responsibility**: Check if buffer is a valid image only

```typescript
// validate-image-task.ts
export const validateImage = async (buffer: Buffer): Promise<boolean> => {
  try {
    const metadata = await sharp(buffer).metadata();
    return metadata.width !== undefined && metadata.height !== undefined;
  } catch {
    return false;
  }
};
```

### 4. Process Image Task

**Responsibility**: Transform image with Sharp only

```typescript
// process-image-task.ts
export const processImage = async (buffer: Buffer): Promise<Buffer> => {
  return sharp(buffer)
    .resize(800, 800, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({
      quality: 85,
      progressive: true,
    })
    .toBuffer();
};
```

**Processing Options:**
- Max dimensions: 800x800px
- Format: JPEG (progressive)
- Quality: 85%
- Preserve aspect ratio
- No upscaling

### 5. Upload Image Task

**Responsibility**: Upload to Firebase Storage only

```typescript
// upload-image-task.ts
export const uploadImage = async (
  jobId: string, 
  buffer: Buffer
): Promise<string> => {
  const storage = getStorage();
  const bucket = storage.bucket();
  const fileName = `processed/${jobId}.jpg`;
  const file = bucket.file(fileName);

  await file.save(buffer, {
    metadata: { contentType: 'image/jpeg' },
  });

  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
};
```

### 6. Complete Job Task

**Responsibility**: Mark job as completed in Firestore only

```typescript
// complete-job-task.ts
export const completeJob = async (
  jobId: string, 
  outputUrl: string
): Promise<void> => {
  const db = getFirestore();
  await db.collection('jobs').doc(jobId).update({
    status: JobStatus.COMPLETED,
    outputUrl,
    processedAt: formatDate(new Date()),
    updatedAt: formatDate(new Date()),
  });
};
```

### 7. Fail Job Task

**Responsibility**: Mark job as failed in Firestore only

```typescript
// fail-job-task.ts
export const failJob = async (
  jobId: string, 
  error: string
): Promise<void> => {
  const db = getFirestore();
  await db.collection('jobs').doc(jobId).update({
    status: JobStatus.FAILED,
    error,
    updatedAt: formatDate(new Date()),
  });
};
```

## Processor (Orchestration)

**Responsibility**: Execute tasks in sequence only

```typescript
// image-processor.ts
export const processImageJob = async (job: Job<QueueJob>): Promise<void> => {
  const { jobId, inputUrl } = job.data;

  try {
    await updateJobStatus(jobId, JobStatus.PROCESSING);
    const imageBuffer = await downloadImage(inputUrl);
    const isValid = await validateImage(imageBuffer);
    
    if (!isValid) {
      throw new Error('Invalid image format');
    }

    const processedBuffer = await processImage(imageBuffer);
    const outputUrl = await uploadImage(jobId, processedBuffer);
    await completeJob(jobId, outputUrl);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await failJob(jobId, errorMessage);
    throw error;
  }
};
```

## Queue Configuration

```typescript
// worker-initializer.ts
export const createWorker = (): Worker => {
  const connection = getRedisClient();

  const worker = new Worker('image-processing', processImageJob, {
    connection,
    concurrency: 5,  // Process 5 jobs simultaneously
  });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  return worker;
};
```

## Retry Strategy

BullMQ automatically retries failed jobs:

- **Attempts**: 3 retries
- **Backoff**: Exponential (2s, 4s, 8s)
- **Configuration**: Set in API when enqueuing

## Environment Variables

```bash
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Running the Worker

```bash
# Install dependencies
pnpm install

# Development mode
pnpm worker:dev

# Production build
pnpm build
pnpm start
```

## Graceful Shutdown

```typescript
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});
```

## Performance Characteristics

- **Concurrency**: 5 jobs per worker instance
- **Timeout**: 30s for image download
- **Max Image Size**: Limited by Sharp (handles up to ~16k x 16k)
- **Processing Time**: ~1-3 seconds per image
- **Throughput**: ~100-150 images/minute per worker

## Scaling Workers

To handle more load, deploy multiple worker instances:

```bash
# Each worker processes 5 concurrent jobs
# 3 workers = 15 concurrent jobs
```

All workers connect to the same Redis queue and coordinate automatically via BullMQ.

## Dependencies

- **bullmq**: Queue worker
- **ioredis**: Redis connection
- **firebase-admin**: Firestore + Storage
- **sharp**: Image processing
- **axios**: HTTP client for downloads
- **dotenv**: Environment variables
