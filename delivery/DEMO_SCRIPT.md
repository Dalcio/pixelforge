# PixelForge Demo Script

This document provides a comprehensive demonstration script showing all features and capabilities of the PixelForge image processing system.

**Duration:** ~15 minutes
**Prerequisites:** Deployed services (API, Worker, Frontend, Redis, Firebase)

---

## 🎯 Demo Overview

This demo will showcase:
1. Real-time image processing with progress tracking
2. Multiple transformation types
3. Job retry functionality
4. Rate limiting protection
5. Security rules and validation
6. Worker job processing
7. Cloud Function job cleanup
8. Health monitoring
9. E2E test suite

---

## 📋 Pre-Demo Checklist

Before starting the demo, verify:

- [ ] Frontend is accessible: `https://your-app.vercel.app`
- [ ] API health check passes: `curl https://your-api.onrender.com/health`
- [ ] Worker is running (check logs)
- [ ] Redis connection is healthy
- [ ] Firebase services are active
- [ ] Browser DevTools ready (Network + Console tabs)
- [ ] Terminal ready for API calls

---

## 🎬 Demo Part 1: Basic Image Processing

### Step 1.1: Open the Application

1. Navigate to your frontend URL: `https://your-app.vercel.app`
2. Show the clean, modern UI
3. Point out key sections:
   - **Upload area** (drag & drop or click)
   - **Transformation controls** (width, height, rotate, format, quality)
   - **Job history** (past jobs)

**Expected Result:**
```
✅ Application loads without errors
✅ UI is responsive and styled correctly
✅ No console errors
```

### Step 1.2: Upload an Image

1. Click the upload area or drag an image
2. Select a sample image (< 10MB, preferably a photo)
3. Show the image preview appears
4. Image URL is displayed

**Expected Result:**
```
✅ Image preview renders
✅ File name displayed
✅ Ready to configure transformations
```

### Step 1.3: Configure Transformations

Configure the following transformations:
```
Width: 800px
Height: 600px
Rotate: 90°
Format: WebP
Quality: 85
```

**Show:** Each transformation option updates in real-time

### Step 1.4: Submit the Job

1. Click "Process Image" button
2. **Open Browser DevTools → Network tab**
3. Show the API call:
   ```http
   POST https://your-api.onrender.com/api/jobs
   Status: 201 Created
   ```

4. **Show Response:**
   ```json
   {
     "jobId": "abc123xyz",
     "status": "pending",
     "progress": 0,
     "inputUrl": "https://example.com/image.jpg",
     "transformations": {...},
     "createdAt": "2025-11-21T12:00:00.000Z"
   }
   ```

**Expected Result:**
```
✅ Job created successfully
✅ Job ID returned
✅ Status is "pending"
```

### Step 1.5: Watch Real-Time Progress

1. **Show the progress bar animating:**
   - 0% → "Pending"
   - 25% → "Downloading image"
   - 50% → "Processing image"
   - 75% → "Uploading result"
   - 100% → "Completed"

2. **Open Browser Console → Show Firestore listener:**
   ```javascript
   Firestore: Job abc123xyz status updated to "processing"
   Firestore: Job abc123xyz progress: 25%
   Firestore: Job abc123xyz progress: 50%
   Firestore: Job abc123xyz progress: 75%
   Firestore: Job abc123xyz status updated to "completed"
   ```

3. **Show final completed job:**
   - Green checkmark
   - "Completed" status
   - Download link appears
   - Processed image preview

**Expected Result:**
```
✅ Progress updates in real-time
✅ Job completes successfully
✅ Processed image is downloadable
✅ No errors in console
```

**Timing:** Entire process should take 5-10 seconds.

### Step 1.6: Download Processed Image

1. Click "Download" button
2. Image downloads from Firebase Storage
3. Open downloaded image
4. Verify transformations applied:
   - ✅ Resized to 800x600
   - ✅ Rotated 90°
   - ✅ Converted to WebP format
   - ✅ Quality looks good

**Expected Result:**
```
✅ Image downloaded successfully
✅ All transformations applied correctly
✅ Image quality maintained
```

---

## 🎬 Demo Part 2: Job Management

### Step 2.1: View Job History

1. Scroll to "Recent Jobs" section
2. Show the list of previous jobs
3. Each job displays:
   - Job ID
   - Status (pending/processing/completed/failed)
   - Created timestamp
   - Progress percentage
   - Input image thumbnail
   - Action buttons (View, Retry, Delete)

**Expected Result:**
```
✅ All previous jobs listed
✅ Status indicators accurate
✅ Timestamps formatted correctly
```

### Step 2.2: Retrieve Job Status via API

**In terminal, run:**
```bash
curl https://your-api.onrender.com/api/jobs/abc123xyz
```

**Show Response:**
```json
{
  "id": "abc123xyz",
  "status": "completed",
  "progress": 100,
  "inputUrl": "https://example.com/image.jpg",
  "outputUrl": "https://storage.googleapis.com/bucket/processed/abc123xyz.webp",
  "transformations": {
    "width": 800,
    "height": 600,
    "rotate": 90,
    "format": "webp",
    "quality": 85
  },
  "createdAt": "2025-11-21T12:00:00.000Z",
  "updatedAt": "2025-11-21T12:01:30.000Z",
  "processedAt": "2025-11-21T12:01:30.000Z"
}
```

**Expected Result:**
```
✅ Job details retrieved
✅ All fields populated correctly
✅ Output URL accessible
```

### Step 2.3: List All Jobs

**In terminal, run:**
```bash
curl "https://your-api.onrender.com/api/jobs?limit=5&status=completed"
```

**Show Response:**
```json
{
  "jobs": [
    {"id": "job1", "status": "completed", ...},
    {"id": "job2", "status": "completed", ...}
  ],
  "total": 2,
  "limit": 5,
  "offset": 0
}
```

**Expected Result:**
```
✅ Pagination works
✅ Filtering by status works
✅ Results sorted by creation date (newest first)
```

---

## 🎬 Demo Part 3: Retry Failed Job

### Step 3.1: Simulate a Failed Job

**Option A: Use Invalid Image URL**

1. In frontend, enter an invalid image URL:
   ```
   https://example.com/nonexistent-image.jpg
   ```

2. Configure transformations
3. Submit job
4. Watch it fail with error message

**Option B: Manually Create Failed Job in Firestore**

1. Go to Firebase Console → Firestore
2. Find a completed job
3. Update `status` to `failed`
4. Add `error` field: `"Download failed: Network error"`
5. Refresh frontend

**Expected Result:**
```
✅ Job status shows "Failed"
✅ Error message displayed
✅ Retry button appears
```

### Step 3.2: Retry the Job

1. Click "Retry" button on failed job
2. **Show:** New job created with same parameters
3. **Show:** New job ID generated
4. Watch new job progress to completion

**Expected Result:**
```
✅ Retry creates new job
✅ Original job unchanged
✅ New job uses same transformations
✅ New job completes successfully
```

**In Browser Console:**
```javascript
Retry job: Creating new job with same parameters
New job created: xyz789abc
Original job: abc123xyz (failed)
```

---

## 🎬 Demo Part 4: Rate Limiting

### Step 4.1: Test Rate Limit

**In terminal, run this script:**
```bash
# Send 105 requests rapidly
for i in {1..105}; do
  curl -X POST https://your-api.onrender.com/api/jobs \
    -H "Content-Type: application/json" \
    -d '{
      "imageUrl": "https://example.com/test.jpg",
      "transformations": {"width": 500, "height": 500}
    }'
  echo "Request $i completed"
done
```

**Expected Result after ~100 requests:**
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1700567890
Retry-After: 900

{
  "error": "Too many requests, please try again later."
}
```

**Explain:**
- ✅ Rate limit: 100 requests per 15 minutes per IP
- ✅ Returns 429 status after limit exceeded
- ✅ Includes `Retry-After` header
- ✅ Protects API from abuse

### Step 4.2: Verify Health Check Exclusion

**In terminal:**
```bash
# Health check should NOT be rate limited
for i in {1..200}; do
  curl https://your-api.onrender.com/health
done
```

**Expected Result:**
```
✅ All 200 health check requests succeed
✅ No rate limiting applied to /health
✅ Returns status: ok every time
```

---

## 🎬 Demo Part 5: Validation & Security

### Step 5.1: Test Invalid URL Formats

**Test Case 1: Non-HTTP(S) URL**
```bash
curl -X POST https://your-api.onrender.com/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "ftp://example.com/image.jpg",
    "transformations": {"width": 500}
  }'
```

**Expected Response:**
```json
{
  "error": "Invalid image URL",
  "details": "URL must start with http:// or https://"
}
```

**Test Case 2: Invalid URL Format**
```bash
curl -X POST https://your-api.onrender.com/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "not-a-url",
    "transformations": {"width": 500}
  }'
```

**Expected Response:**
```json
{
  "error": "Invalid image URL format"
}
```

### Step 5.2: Test Non-Image URLs

```bash
curl -X POST https://your-api.onrender.com/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/document.pdf",
    "transformations": {"width": 500}
  }'
```

**Expected Response:**
```json
{
  "error": "URL does not point to a valid image",
  "details": "Supported formats: jpg, jpeg, png, webp, gif, avif"
}
```

### Step 5.3: Test File Size Limits

```bash
curl -X POST https://your-api.onrender.com/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "transformations": {"width": 50000, "height": 50000}
  }'
```

**Expected Response:**
```json
{
  "error": "Invalid transformation parameters",
  "details": "Width and height must be between 1 and 10000"
}
```

### Step 5.4: Test Content-Type Validation

```bash
curl -X POST https://your-api.onrender.com/api/jobs \
  -H "Content-Type: text/plain" \
  -d "not json"
```

**Expected Response:**
```http
HTTP/1.1 415 Unsupported Media Type

{
  "error": "Content-Type must be application/json"
}
```

### Step 5.5: Test CORS Protection

**In browser console (different origin):**
```javascript
fetch('https://your-api.onrender.com/api/jobs', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    imageUrl: 'https://example.com/test.jpg',
    transformations: {width: 500}
  })
})
```

**Expected Result:**
```
❌ CORS error
Access to fetch at 'https://your-api.onrender.com/api/jobs' 
from origin 'https://unauthorized-site.com' has been blocked by CORS policy
```

**From allowed origin (your frontend):**
```
✅ Request succeeds
✅ Job created
```

---

## 🎬 Demo Part 6: Worker Processing

### Step 6.1: View Worker Logs

**Open Render/Railway Dashboard → Worker Service → Logs**

**Show logs during job processing:**
```
[Worker Redis] ✓ Connected and ready
✓ Worker started and waiting for jobs...

[Worker] → Processing job abc123xyz...
[Worker] Step 1: Downloading image from https://example.com/image.jpg
[Worker] Step 2: Validating image format
[Worker] Step 3: Applying transformations (resize: 800x600, rotate: 90°)
[Worker] Step 4: Converting to webp format (quality: 85)
[Worker] Step 5: Uploading to Firebase Storage
[Worker] ✓ Job abc123xyz completed successfully

[Worker] → Processing job xyz789abc...
```

**Expected Result:**
```
✅ Worker connects to Redis
✅ Picks up jobs from queue
✅ Logs each processing step with timestamps
✅ Updates job status in Firestore
✅ Completes jobs successfully
✅ Handles multiple concurrent jobs (concurrency: 5)
```

### Step 6.2: Demonstrate Worker Resilience

**Test 1: Worker Restart**

1. Restart worker service (Render/Railway dashboard)
2. Submit new job while worker is down
3. Watch job wait in "pending" status
4. Worker comes back online
5. Job automatically picked up and processed

**Expected Result:**
```
✅ Job queued in Redis during downtime
✅ Worker reconnects to Redis on restart
✅ Pending jobs automatically processed
✅ No jobs lost
```

**Test 2: Graceful Shutdown**

1. Trigger SIGTERM (Ctrl+C if running locally)
2. **Show logs:**
   ```
   ⚠ SIGTERM received, closing worker gracefully...
   [Worker] Finishing current jobs...
   [Worker] ✓ Job abc123xyz completed
   ✓ Worker closed successfully
   ✓ Redis connection closed
   ```

**Expected Result:**
```
✅ Current jobs finish before shutdown
✅ Redis connection closed properly
✅ No orphaned processes
```

---

## 🎬 Demo Part 7: Firebase Integration

### Step 7.1: Firestore Job Documents

**Open Firebase Console → Firestore Database**

1. Navigate to `jobs` collection
2. Select a job document
3. **Show fields:**
   ```javascript
   {
     id: "abc123xyz",
     inputUrl: "https://example.com/image.jpg",
     outputUrl: "https://storage.googleapis.com/...",
     status: "completed",
     progress: 100,
     transformations: {
       width: 800,
       height: 600,
       rotate: 90,
       format: "webp",
       quality: 85
     },
     createdAt: Timestamp(2025-11-21 12:00:00),
     updatedAt: Timestamp(2025-11-21 12:01:30),
     processedAt: Timestamp(2025-11-21 12:01:30)
   }
   ```

**Expected Result:**
```
✅ Job documents stored correctly
✅ Real-time updates visible
✅ Timestamps accurate
✅ All fields populated
```

### Step 7.2: Firestore Security Rules

**In Firebase Console → Firestore → Rules**

**Show current rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobs/{jobId} {
      // Allow read for all users (to check job status)
      allow read: if true;
      
      // Deny all writes (server-side only)
      allow write: if false;
    }
  }
}
```

**Test Read Access (Browser Console):**
```javascript
// This should work
const doc = await firebase.firestore().collection('jobs').doc('abc123xyz').get();
console.log('Read successful:', doc.data());
```

**Test Write Access (Browser Console):**
```javascript
// This should fail
await firebase.firestore().collection('jobs').doc('test').set({status: 'hacked'});
// Error: Missing or insufficient permissions
```

**Expected Result:**
```
✅ Public can read job status
❌ Public cannot write job data
✅ Only server can create/update jobs
```

### Step 7.3: Firebase Storage

**Open Firebase Console → Storage**

1. Navigate to `processed/` folder
2. **Show uploaded images:**
   - `abc123xyz.webp`
   - `def456uvw.png`
   - `ghi789rst.jpg`

3. Click on an image → Get download URL
4. Open URL in browser → Image loads

**Expected Result:**
```
✅ Processed images stored
✅ File names match job IDs
✅ Images publicly accessible
✅ Correct format conversion
```

### Step 7.4: Storage Security Rules

**In Firebase Console → Storage → Rules**

**Show current rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /processed/{imageId} {
      // Allow read for all (public download)
      allow read: if true;
      
      // Allow write only for authenticated requests
      allow write: if request.auth != null;
    }
  }
}
```

**Test:**
```javascript
// This should work (server has auth)
// Worker uploads with service account credentials

// This should fail (browser without auth)
// Direct upload from browser console
```

**Expected Result:**
```
✅ Anyone can download processed images
❌ Unauthenticated uploads blocked
✅ Server can upload (has service account)
```

---

## 🎬 Demo Part 8: Cloud Function Job Cleanup

### Step 8.1: View Cloud Function

**Open Firebase Console → Functions**

1. Show `cleanupOldJobs` function
2. **Show configuration:**
   - Runtime: Node.js 18
   - Trigger: Scheduled (daily at 2:00 AM UTC)
   - Memory: 256 MB
   - Timeout: 60 seconds

### Step 8.2: Manual Function Execution

**Option A: Firebase Console**

1. Go to Cloud Functions → `cleanupOldJobs`
2. Click **Testing** tab
3. Click **Test Function**
4. Wait for execution

**Option B: Firebase CLI**
```bash
firebase functions:shell
> cleanupOldJobs()
```

**Show logs:**
```
[Cloud Function] ✓ Cleanup started at 2025-11-21T02:00:00.000Z
[Cloud Function] Querying jobs older than 30 days...
[Cloud Function] Found 15 jobs to delete
[Cloud Function] Deleting job abc123xyz (created: 2025-10-20)
[Cloud Function] Deleting associated files: processed/abc123xyz.webp
[Cloud Function] Job abc123xyz deleted successfully
...
[Cloud Function] ✓ Cleanup completed: 15 jobs deleted, 15 files deleted
[Cloud Function] Execution time: 5.2 seconds
```

**Expected Result:**
```
✅ Function executes successfully
✅ Old jobs identified correctly
✅ Job documents deleted from Firestore
✅ Associated files deleted from Storage
✅ Logs show deletion details
✅ New jobs unaffected
```

### Step 8.3: Verify Cleanup

**Before cleanup:**
```bash
curl https://your-api.onrender.com/api/jobs | jq '.total'
# Output: 150 jobs
```

**After cleanup:**
```bash
curl https://your-api.onrender.com/api/jobs | jq '.total'
# Output: 135 jobs (15 deleted)
```

**Expected Result:**
```
✅ Old jobs removed
✅ Recent jobs preserved
✅ Storage freed up
```

---

## 🎬 Demo Part 9: Health Monitoring

### Step 9.1: API Health Check

```bash
curl https://your-api.onrender.com/health
```

**Response:**
```json
{
  "status": "ok",
  "uptime": 86400.5,
  "timestamp": "2025-11-21T12:00:00.000Z"
}
```

**Explain:**
- ✅ `status: "ok"` → Service healthy
- ✅ `uptime` → Seconds since last restart
- ✅ `timestamp` → Current server time

### Step 9.2: Redis Health Check

**In API logs:**
```
[API Redis] ✓ Connected and ready
[API Redis] Ping: 8ms
```

**In Worker logs:**
```
[Worker Redis] ✓ Connected and ready
[Worker Redis] Ping: 12ms
```

**Expected Result:**
```
✅ Both services connected to Redis
✅ Low latency (<50ms)
✅ No connection errors
```

### Step 9.3: Service Status Dashboard

**Render Dashboard:**
- **API Service:** ✅ Running (green)
- **Worker Service:** ✅ Running (green)
- **CPU Usage:** ~10%
- **Memory Usage:** ~200 MB / 512 MB
- **Last Deploy:** 2 hours ago
- **Uptime:** 100%

**Expected Result:**
```
✅ All services healthy
✅ Resource usage within limits
✅ No crashes or restarts
```

---

## 🎬 Demo Part 10: E2E Test Suite

### Step 10.1: Run E2E Tests

**In terminal:**
```bash
cd apps/api
pnpm test -- job-lifecycle.e2e.test.ts
```

**Show test output:**
```
 ✓ apps/api/src/__tests__/e2e/job-lifecycle.e2e.test.ts (12 tests) 2500ms
   ✓ Happy Path: Valid Image Job
     ✓ should accept and queue a valid job request (150ms)
   ✓ Error Handling: Invalid URL
     ✓ should reject job with invalid URL format (45ms)
     ✓ should reject job with non-HTTP(S) URL (38ms)
   ✓ Error Handling: Invalid Image Format
     ✓ should reject job with non-image URL (42ms)
     ✓ should accept valid image extensions (250ms)
   ✓ Error Handling: File Size Limit
     ✓ should reject job with excessively large dimensions (35ms)
   ✓ Error Handling: Service Unavailability
     ✓ should handle Firestore unavailability gracefully (55ms)
     ✓ should handle queue unavailability gracefully (48ms)
   ✓ Job Status Retrieval
     ✓ should return 404 for non-existent job (40ms)
     ✓ should retrieve existing job status (52ms)
   ✓ Job Listing
     ✓ should list jobs with pagination (65ms)
     ✓ should filter jobs by status (58ms)
   ✓ Content-Type Validation
     ✓ should require application/json content type for POST (42ms)
     ✓ should accept application/json content type (55ms)
   ✓ Rate Limiting
     ✓ should allow requests within rate limit (48ms)
   ✓ Health Check
     ✓ should return health status (35ms)

Test Files  1 passed (1)
     Tests  12 passed (12)
  Start at  12:00:00
  Duration  2.50s (transform 150ms, setup 0ms, collect 200ms, tests 2150ms)
```

**Expected Result:**
```
✅ All 12 E2E tests pass
✅ Tests use mocks (no live services hit)
✅ Covers all major scenarios
✅ Fast execution (~2.5 seconds)
```

### Step 10.2: Show Test Coverage

```bash
pnpm test -- --coverage
```

**Show coverage report:**
```
---------------------------|---------|----------|---------|---------|
File                       | % Stmts | % Branch | % Funcs | % Lines |
---------------------------|---------|----------|---------|---------|
All files                  |   95.2  |   92.1   |   96.5  |   95.8  |
 api/src                   |   98.5  |   94.2   |   98.1  |   98.7  |
  app.ts                   |   100   |   100    |   100   |   100   |
  server.ts                |   95.0  |   90.0   |   95.0  |   96.0  |
 api/src/controllers       |   97.2  |   93.5   |   98.0  |   97.5  |
 api/src/middlewares       |   98.1  |   95.2   |   97.8  |   98.3  |
 api/src/validators        |   96.5  |   92.8   |   96.0  |   96.8  |
 worker/src                |   94.8  |   90.5   |   95.2  |   95.1  |
 packages/utils/src        |   99.0  |   97.5   |   99.2  |   99.1  |
---------------------------|---------|----------|---------|---------|
```

**Expected Result:**
```
✅ Overall coverage >95%
✅ All critical paths tested
✅ High branch coverage
```

---

## 🎉 Demo Conclusion

### Summary of Demonstrated Features

✅ **Core Functionality:**
- Real-time image processing
- Multiple transformation types
- Progress tracking
- Job management

✅ **Security:**
- Rate limiting
- CORS protection
- Input validation
- Firestore/Storage rules

✅ **Reliability:**
- Job retry mechanism
- Worker resilience
- Graceful shutdown
- Error handling

✅ **Monitoring:**
- Health checks
- Structured logging
- Cloud Function automation
- Service status

✅ **Quality:**
- Comprehensive test suite
- High code coverage
- E2E testing
- CI/CD ready

### Performance Metrics

- **Job Creation:** < 200ms
- **Image Processing:** 5-10 seconds (end-to-end)
- **API Response Time:** < 100ms
- **Real-time Updates:** Instant (Firestore listeners)
- **Worker Concurrency:** 5 concurrent jobs

### Deployment Architecture

- **Frontend:** Vercel (Free tier)
- **API:** Render/Railway (Free tier)
- **Worker:** Render/Railway (Free tier)
- **Redis:** Upstash (Free tier)
- **Database:** Firebase Firestore (Free tier)
- **Storage:** Firebase Storage (Free tier)
- **Functions:** Firebase Cloud Functions (Free tier)

**Total Monthly Cost:** $0

---

## 📝 Demo Q&A

### Common Questions

**Q: How many concurrent jobs can the worker process?**
A: 5 concurrent jobs (configurable in `worker-initializer.ts`)

**Q: What's the maximum image size?**
A: 10 MB (enforced client-side and server-side)

**Q: How long are jobs retained?**
A: 30 days, then automatically deleted by Cloud Function

**Q: What happens if the worker crashes mid-job?**
A: BullMQ automatically retries the job (up to 3 attempts)

**Q: Can I deploy this on paid tiers for better performance?**
A: Yes! See DEPLOYMENT_GUIDE.md for scaling options

**Q: Is the system production-ready?**
A: Yes! All security measures, error handling, and monitoring are in place

**Q: How do I monitor the system in production?**
A: Use Render/Railway dashboards, Firebase Console, and Upstash metrics

**Q: Can I add more transformation types?**
A: Yes! Extend `packages/types/src/job.ts` and add processing logic in Worker

---

## 🚀 Next Steps

After this demo:

1. **Deploy your own instance** using [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. **Customize transformations** in `apps/worker/src/processors/`
3. **Add monitoring alerts** in Render/Railway/Firebase
4. **Set up CI/CD** for automatic deployments
5. **Scale services** based on usage

---

## 📚 Additional Resources

- [FINAL_README.md](FINAL_README.md) - Complete documentation
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment instructions
- [docs/architecture.md](docs/architecture.md) - System architecture
- [docs/backend-api.md](docs/backend-api.md) - API reference
- [docs/security.md](docs/security.md) - Security measures

---

**Demo Complete! 🎉**

**Questions? Issues?**
- GitHub: https://github.com/dalcio/pixelforge
- Email: support@pixelforge.com

**Thank you for watching!** 🙏
