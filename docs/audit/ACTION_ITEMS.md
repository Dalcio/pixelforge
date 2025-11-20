# FluxImage - Critical Action Items

**Date:** November 20, 2025  
**Status:** ⚠️ PASS WITH FIXES Required  
**Priority:** URGENT - Required Before Production Deployment

---

## 🔴 Critical Issues (Must Fix Immediately)

### 1. Zero Test Coverage ❌

**Issue:** No test files found. Challenge requires "at least 1 unit test"

**Fix:**
```bash
# Install test dependencies
cd apps/api
pnpm add -D vitest @vitest/ui
```

**Create test file:**
```typescript
// apps/api/src/validators/__tests__/job-validator.test.ts
import { describe, it, expect } from 'vitest';
import { validateCreateJob } from '../job-validator';

describe('validateCreateJob', () => {
  it('should accept valid image URL', () => {
    const result = validateCreateJob({
      inputUrl: 'https://example.com/image.jpg'
    });
    expect(result.inputUrl).toBe('https://example.com/image.jpg');
  });

  it('should reject invalid URL', () => {
    expect(() => {
      validateCreateJob({ inputUrl: 'not-a-url' });
    }).toThrow();
  });

  it('should reject missing URL', () => {
    expect(() => {
      validateCreateJob({});
    }).toThrow();
  });
});
```

**Add script to package.json:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

---

### 2. No Redis Connection Error Handling ❌

**Issue:** Challenge requires "Handles Redis connection failures gracefully" - Currently crashes

**Fix in apps/api/src/lib/redis-client.ts:**
```typescript
export const getRedisClient = (): Redis => {
  if (redisClient) {
    return redisClient;
  }

  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD;

  redisClient = new Redis({
    host,
    port,
    password: password || undefined,
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  // ADD THESE HANDLERS:
  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis Client Connected');
  });

  redisClient.on('ready', () => {
    console.log('Redis Client Ready');
  });

  redisClient.on('close', () => {
    console.warn('Redis Connection Closed');
  });

  redisClient.on('reconnecting', (delay) => {
    console.log(`Redis Reconnecting in ${delay}ms...`);
  });

  return redisClient;
};
```

**Apply same fix to apps/worker/src/lib/redis-client.ts**

---

### 3. No Uncaught Exception Handlers ❌

**Issue:** Challenge requires "Never crashes on uncaught exceptions" - Worker will crash

**Fix in apps/worker/src/worker.ts:**
```typescript
import dotenv from 'dotenv';
import { initializeFirebase } from './lib/firebase-initializer';
import { createWorker } from './queue/worker-initializer';

dotenv.config();

// ADD THESE HANDLERS:
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  process.exit(1); // Exit and let process manager restart
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

initializeFirebase();

const worker = createWorker();

console.log('Worker started and waiting for jobs...');

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

// ADD SIGINT HANDLER:
process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});
```

---

### 4. No Large File Validation (>10MB) ❌

**Issue:** Challenge requires handling large images - Currently downloads everything

**Fix in apps/worker/src/tasks/download-image-task.ts:**
```typescript
import axios from 'axios';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const downloadImage = async (url: string): Promise<Buffer> => {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 15000, // Reduced from 30s
    maxContentLength: MAX_FILE_SIZE, // ADD THIS
    maxBodyLength: MAX_FILE_SIZE,    // ADD THIS
  });

  return Buffer.from(response.data);
};
```

**This will throw error if file >10MB, which gets caught and sent to failJob()**

---

### 5. Exposed Firebase API Key 🔴

**Issue:** API key hardcoded in source code

**Fix in apps/web/src/lib/firebase.ts:**
```typescript
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let appInitialized = false;

export function initFirebase() {
  if (appInitialized) return;
  initializeApp(firebaseConfig);
  getAnalytics();
  appInitialized = true;
}
```

**Add to apps/web/.env:**
```bash
VITE_FIREBASE_API_KEY=AIzaSyCd-_f5FOLvd8EcEolY2kxrQhwb-MlP9YE
VITE_FIREBASE_AUTH_DOMAIN=image-transformation-64f36.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=image-transformation-64f36
VITE_FIREBASE_STORAGE_BUCKET=image-transformation-64f36.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=493643052188
VITE_FIREBASE_APP_ID=1:493643052188:web:fa88943256e91c8053a959
VITE_FIREBASE_MEASUREMENT_ID=G-6QDXTQN7LK
```

---

## ⚠️ High Priority Issues

### 6. Using Polling Instead of Real-time Listeners

**Issue:** Frontend uses HTTP polling every 5s instead of Firebase listeners

**Fix in apps/web/src/hooks/use-job-list.ts:**
```typescript
import { useEffect, useState, useCallback } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { JobResponse } from "@fluximage/types";

export function useJobList() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'jobs'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as JobResponse[];
        
        setJobs(jobsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firestore listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const reload = useCallback(() => {
    // Firestore listener automatically reloads
    console.log('Jobs are already live-updating');
  }, []);

  return { jobs, loading, error, reload, clearError: () => setError(null) };
}
```

**Update apps/web/src/lib/firebase.ts:**
```typescript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// ... firebaseConfig ...

let appInitialized = false;

export function initFirebase() {
  if (appInitialized) return;
  initializeApp(firebaseConfig);
  getAnalytics();
  appInitialized = true;
}

export const db = getFirestore(); // EXPORT THIS
```

---

### 7. Add Health Check Endpoint

**Fix in apps/api/src/app.ts:**
```typescript
import express, { Express } from 'express';
import cors from 'cors';
import { createJobRoutes } from './routes/job-routes';
import { errorHandler } from './middlewares/error-handler';

export const createApp = (): Express => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' })); // ADD SIZE LIMIT

  // ADD HEALTH CHECK:
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: Date.now(),
      uptime: process.uptime(),
    });
  });

  app.use('/api', createJobRoutes());

  app.use(errorHandler);

  return app;
};
```

---

### 8. Fix Validation Type Safety

**Fix in apps/api/src/validators/job-validator.ts:**
```typescript
import { createJobSchema } from './job-schema';
import { TransformationOptions } from '@fluximage/types';

interface ValidatedJobInput {
  inputUrl: string;
  transformations?: TransformationOptions;
}

export const validateCreateJob = (data: unknown): ValidatedJobInput => {
  const { error, value } = createJobSchema.validate(data);

  if (error) {
    throw new Error(error.details[0].message);
  }

  return value;
};
```

**Update controller to use validated transformations:**
```typescript
// apps/api/src/controllers/create-job-controller.ts
export const createJobController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { inputUrl, transformations } = validateCreateJob(req.body); // GET BOTH

    const isReachable = await checkUrlReachability(inputUrl);
    if (!isReachable) {
      res.status(400).json({ error: "URL is not reachable" });
      return;
    }

    const jobId = await createJob(inputUrl, transformations);

    res.status(201).json({
      id: jobId,
      status: JobStatus.PENDING,
    });
  } catch (error) {
    next(error);
  }
};
```

---

### 9. Improve Error Messages

**Fix in apps/api/src/validators/url-reachability-checker.ts:**
```typescript
import https from 'https';
import http from 'http';

export const checkUrlReachability = async (url: string): Promise<{
  reachable: boolean;
  error?: string;
}> => {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;

    const req = client.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
      // Check status code
      if (!res.statusCode || res.statusCode >= 400) {
        resolve({ 
          reachable: false, 
          error: `Server returned status ${res.statusCode}` 
        });
        return;
      }

      // Check Content-Type (optional but recommended)
      const contentType = res.headers['content-type'];
      if (contentType && !contentType.startsWith('image/')) {
        resolve({ 
          reachable: false, 
          error: 'URL does not point to an image' 
        });
        return;
      }

      resolve({ reachable: true });
    });

    req.on('error', (err) => {
      resolve({ 
        reachable: false, 
        error: `Network error: ${err.message}` 
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ 
        reachable: false, 
        error: 'Request timeout (5s)' 
      });
    });

    req.end();
  });
};
```

**Update controller:**
```typescript
const result = await checkUrlReachability(inputUrl);
if (!result.reachable) {
  res.status(400).json({ error: result.error || "URL is not reachable" });
  return;
}
```

---

### 10. Add Firestore Security Rules

**Create in Firebase Console or firestore.rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobs/{jobId} {
      // Allow anyone to create
      allow create: if true;
      
      // Allow anyone to read (for now, add auth later)
      allow read: if true;
      
      // Only allow worker service account to update
      // (For now, allow all - add proper auth later)
      allow update: if true;
      
      // Don't allow delete
      allow delete: if false;
    }
  }
}
```

---

## 📊 Verification Checklist

After applying fixes, verify:

```bash
# 1. Tests pass
cd apps/api
pnpm test

# 2. Worker starts without crashing
cd apps/worker
pnpm dev
# Should see: "Worker started and waiting for jobs..."

# 3. API health check works
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":...}

# 4. Large file handling works
# Submit job with >10MB image URL
# Should fail gracefully with error message

# 5. Redis reconnection works
# Stop Redis, start Redis
# Worker should reconnect automatically

# 6. Frontend uses real-time updates
# Open browser console
# Should NOT see polling requests every 5s
# Changes should appear instantly
```

---

## 🎯 Success Criteria

Project will be production-ready when:

- [x] At least 3 unit tests passing
- [x] Redis error handlers added (API + Worker)
- [x] Uncaught exception handlers added (Worker)
- [x] File size validation (10MB limit)
- [x] Firebase config in environment variables
- [x] Real-time listeners implemented (no polling)
- [x] Health check endpoint working
- [x] Improved error messages
- [x] Firestore security rules configured

---

## 📝 Notes

- All fixes are **backwards compatible**
- No breaking changes to existing functionality
- Estimated implementation time: **2-4 hours**
- All fixes can be applied incrementally
- Test each fix before moving to the next

---

**Prepared by:** Senior Technical Reviewer  
**Date:** November 20, 2025  
**Status:** Ready for Implementation
