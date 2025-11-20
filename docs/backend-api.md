# Backend API Documentation

## Overview

The API service is built with Express and TypeScript, following strict SRP with dedicated modules for each responsibility.

## Project Structure

```
apps/api/
├── src/
│   ├── controllers/          # HTTP handlers only
│   │   ├── create-job-controller.ts
│   │   ├── get-job-controller.ts
│   │   └── list-jobs-controller.ts
│   ├── services/             # Business logic only
│   │   ├── job-service.ts
│   │   ├── job-query-service.ts
│   │   ├── job-list-service.ts
│   │   ├── firestore-service.ts
│   │   └── queue-service.ts
│   ├── validators/           # Validation only
│   │   ├── job-schema.ts
│   │   ├── job-validator.ts
│   │   └── url-reachability-checker.ts
│   ├── middlewares/          # Cross-cutting concerns
│   │   └── error-handler.ts
│   ├── routes/               # Route definitions only
│   │   └── job-routes.ts
│   ├── lib/                  # External integrations
│   │   ├── firebase-initializer.ts
│   │   ├── firestore-client.ts
│   │   ├── redis-client.ts
│   │   └── queue-client.ts
│   ├── app.ts                # Express app setup
│   └── server.ts             # Server entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## API Endpoints

### POST /api/jobs

Create a new image processing job.

**Request:**
```json
{
  "inputUrl": "https://example.com/image.jpg"
}
```

**Response (201):**
```json
{
  "id": "1699999999999-abc123def",
  "status": "pending"
}
```

**Response (400):**
```json
{
  "error": "URL is not reachable"
}
```

**Validation:**
- URL must be valid HTTP/HTTPS
- URL must be reachable (HEAD request check)

---

### GET /api/jobs/:id

Retrieve a specific job by ID.

**Response (200):**
```json
{
  "id": "1699999999999-abc123def",
  "inputUrl": "https://example.com/image.jpg",
  "outputUrl": "https://storage.googleapis.com/...",
  "status": "completed",
  "createdAt": "2025-11-14T10:30:00.000Z",
  "updatedAt": "2025-11-14T10:30:15.000Z",
  "processedAt": "2025-11-14T10:30:15.000Z"
}
```

**Response (404):**
```json
{
  "error": "Job not found"
}
```

---

### GET /api/jobs

List all jobs (most recent first, limit 100).

**Response (200):**
```json
{
  "jobs": [
    {
      "id": "1699999999999-abc123def",
      "inputUrl": "https://example.com/image.jpg",
      "status": "completed",
      "outputUrl": "https://storage.googleapis.com/...",
      "createdAt": "2025-11-14T10:30:00.000Z",
      "updatedAt": "2025-11-14T10:30:15.000Z"
    }
  ],
  "total": 1
}
```

## SRP Implementation Details

### Controllers (HTTP Layer)

Each controller handles **one endpoint only**:

```typescript
// create-job-controller.ts
// Responsibility: Handle job creation HTTP request
export const createJobController = async (req, res, next) => {
  // 1. Validate input
  // 2. Check URL reachability
  // 3. Call job service
  // 4. Return response
};
```

### Services (Business Logic)

Each service handles **one business operation**:

```typescript
// job-service.ts
// Responsibility: Orchestrate job creation
export const createJob = async (inputUrl: string) => {
  // 1. Generate ID
  // 2. Create Firestore document
  // 3. Enqueue to Redis
  // 4. Return job ID
};

// firestore-service.ts
// Responsibility: Firestore operations only
export const createJobDocument = async (id, inputUrl) => {
  // Create document in Firestore
};

// queue-service.ts
// Responsibility: Queue operations only
export const enqueueJob = async (jobId, inputUrl) => {
  // Add job to BullMQ queue
};
```

### Validators

Each validator has **one validation responsibility**:

```typescript
// job-validator.ts
// Responsibility: Schema validation only
export const validateCreateJob = (data) => {
  // Validate using Joi schema
};

// url-reachability-checker.ts
// Responsibility: Check URL is reachable only
export const checkUrlReachability = async (url) => {
  // HEAD request to verify URL
};
```

## Environment Variables

```bash
PORT=3000
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Running the API

```bash
# Install dependencies
pnpm install

# Development mode
pnpm api:dev

# Production build
pnpm build
pnpm start
```

## Error Handling

Centralized error handler catches all errors:

```typescript
// error-handler.ts
// Responsibility: Error formatting and logging only
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
};
```

## Dependencies

- **express**: Web framework
- **cors**: CORS middleware
- **firebase-admin**: Firestore + Storage access
- **bullmq**: Queue job enqueuing
- **ioredis**: Redis connection
- **joi**: Schema validation
- **dotenv**: Environment variables
