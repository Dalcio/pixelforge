# Job Cleanup Function - Deployment Guide

## Overview

The job cleanup function automatically deletes jobs older than 30 days from Firestore and optionally archives them to Cloud Storage before deletion. This helps maintain database hygiene and control costs.

## Features

- ✅ **Scheduled Execution**: Runs daily at 2 AM via Cloud Scheduler
- ✅ **Configurable Retention**: Default 30 days, customizable via environment variable
- ✅ **Optional Archiving**: Archive jobs to Cloud Storage before deletion
- ✅ **Image Cleanup**: Automatically deletes processed images from Storage
- ✅ **Structured Logging**: Detailed logs with statistics
- ✅ **Manual Trigger**: HTTP endpoint for on-demand cleanup (with API key auth)
- ✅ **Batch Processing**: Efficient batch operations to avoid timeouts

## Prerequisites

1. **Firebase CLI** installed:

   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Project** with:

   - Firestore enabled
   - Cloud Storage enabled
   - Billing enabled (required for Cloud Functions)

3. **Firebase initialized** in project root:
   ```bash
   firebase init
   ```
   - Select: Functions, Firestore
   - Choose JavaScript (we'll use TypeScript)
   - Install dependencies

## Configuration

### Environment Variables

Set these in Firebase Functions config:

```bash
# Enable job archiving before deletion (optional)
firebase functions:config:set cleanup.archive_enabled=true

# Set retention period in days (default: 30)
firebase functions:config:set cleanup.retention_days=30

# API key for manual cleanup endpoint (generate a secure random string)
firebase functions:config:set cleanup.api_key="your-secure-random-key-here"
```

### Generate Secure API Key

```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Verify Configuration

```bash
firebase functions:config:get
```

Expected output:

```json
{
  "cleanup": {
    "archive_enabled": "true",
    "retention_days": "30",
    "api_key": "your-api-key"
  }
}
```

## Installation

### 1. Install Dependencies

```bash
cd functions
npm install
```

or with pnpm:

```bash
cd functions
pnpm install
```

### 2. Build TypeScript

```bash
cd functions
npm run build
```

### 3. Test Locally (Optional)

```bash
firebase emulators:start --only functions
```

## Deployment

### Deploy Function Only

```bash
firebase deploy --only functions
```

### Deploy with Specific Region

Edit `functions/src/index.ts` and change region:

```typescript
export const cleanupOldJobs = functions
  .region("us-central1") // Change to your region
  .pubsub
  .schedule("0 2 * * *")
  ...
```

Available regions:

- `us-central1` (Iowa)
- `us-east1` (South Carolina)
- `europe-west1` (Belgium)
- `asia-northeast1` (Tokyo)

Then deploy:

```bash
firebase deploy --only functions
```

### Verify Deployment

```bash
firebase functions:list
```

You should see:

- `cleanupOldJobs` (scheduled)
- `manualCleanup` (http)

## Schedule Configuration

The function runs daily at 2 AM by default. Modify schedule in `functions/src/index.ts`:

```typescript
.pubsub
.schedule("0 2 * * *") // Cron format: minute hour day month weekday
.timeZone("America/New_York") // Change timezone
```

### Common Schedules

```typescript
// Every day at 2 AM
"0 2 * * *";

// Every day at midnight
"0 0 * * *";

// Every 6 hours
"0 */6 * * *";

// Every Sunday at 3 AM
"0 3 * * 0";

// First day of month at midnight
"0 0 1 * *";
```

Reference: [Cron format](https://crontab.guru/)

## Manual Cleanup (Testing)

### Using HTTP Endpoint

```bash
curl -X GET \
  "https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/manualCleanup?days=30&archive=true" \
  -H "X-API-Key: your-api-key"
```

### Query Parameters

- `days` (optional): Retention period in days (default: 30)
- `archive` (optional): Set to `true` to archive before deletion (default: false)

### Example Response

```json
{
  "success": true,
  "message": "Manual cleanup completed",
  "stats": {
    "totalScanned": 45,
    "totalDeleted": 45,
    "totalArchived": 45,
    "errors": 0,
    "deletedJobs": ["job-id-1", "job-id-2", "..."]
  }
}
```

### Using Firebase Console

1. Go to Firebase Console → Functions
2. Find `manualCleanup` function
3. Click "..." → "View in Cloud Console"
4. Click "Testing" tab
5. Add request headers: `X-API-Key: your-api-key`
6. Click "Test the function"

## Monitoring

### View Logs

```bash
# Stream logs in real-time
firebase functions:log --only cleanupOldJobs

# View specific time range
firebase functions:log --only cleanupOldJobs --since 2d

# View manual cleanup logs
firebase functions:log --only manualCleanup
```

### Log Format

Successful execution:

```
INFO: Starting scheduled job cleanup...
INFO: Configuration: { archiveEnabled: true, retentionDays: 30, cutoffDate: "2024-10-21T02:00:00.000Z" }
INFO: Found 45 jobs older than 30 days
INFO: Archiving jobs before deletion...
INFO: Archived job abc123 to archives/jobs/2024/abc123.json
INFO: Deleted processed image for job abc123
INFO: Job cleanup completed { totalScanned: 45, totalDeleted: 45, totalArchived: 45, errors: 0, durationMs: 12450 }
```

### Set Up Alerts

1. Go to Cloud Console → Monitoring → Alerting
2. Create Policy:
   - **Condition**: Function execution count = 0 for 2 days
   - **Notification**: Email your team
3. Create Policy:
   - **Condition**: Function error rate > 10%
   - **Notification**: Email + SMS

## Archive Structure

When archiving is enabled, jobs are stored in:

```
gs://YOUR-PROJECT.appspot.com/
  archives/
    jobs/
      2024/
        job-id-1.json
        job-id-2.json
      2023/
        job-id-3.json
```

### Archive Format

```json
{
  "id": "abc123",
  "inputUrl": "https://example.com/image.jpg",
  "outputUrl": "https://storage.googleapis.com/...",
  "status": "completed",
  "progress": 100,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:31:20.000Z",
  "processedAt": "2024-01-15T10:31:20.000Z"
}
```

## Cost Estimation

### Cloud Functions

- **Invocations**: 1/day = ~30/month (free tier: 2M/month)
- **Compute time**: ~10-30 seconds per run
- **Memory**: 256MB default

**Estimated cost**: $0.00 (well within free tier)

### Cloud Storage (if archiving enabled)

- **Storage**: ~5KB per job × 1000 jobs = 5MB
- **Cost**: $0.026/GB/month = $0.0001/month

**Estimated cost**: Negligible

### Total Monthly Cost

**~$0.00** (assuming < 10,000 jobs/month)

## Troubleshooting

### Function Not Running

**Check Schedule**:

```bash
firebase functions:list
```

**Check Logs**:

```bash
firebase functions:log --only cleanupOldJobs --since 7d
```

**Verify Cloud Scheduler**:

1. Go to Cloud Console → Cloud Scheduler
2. Find job: `firebase-schedule-cleanupOldJobs-us-central1`
3. Check "Last run" and "Next run"

### Permission Errors

**Error**: "Missing or insufficient permissions"

**Solution**: Ensure function has proper IAM roles:

```bash
gcloud projects add-iam-policy-binding YOUR-PROJECT-ID \
  --member serviceAccount:YOUR-PROJECT@appspot.gserviceaccount.com \
  --role roles/datastore.user

gcloud projects add-iam-policy-binding YOUR-PROJECT-ID \
  --member serviceAccount:YOUR-PROJECT@appspot.gserviceaccount.com \
  --role roles/storage.objectAdmin
```

### Timeout Errors

**Error**: "Function execution took longer than 60s"

**Solution 1**: Increase batch limit in code:

```typescript
.limit(500) // Reduce to 100 or 200
```

**Solution 2**: Increase function timeout:

```typescript
export const cleanupOldJobs = functions
  .runWith({ timeoutSeconds: 540 }) // 9 minutes (max)
  .pubsub.schedule("0 2 * * *");
```

### Archive Failures

**Error**: "Failed to archive job"

**Check bucket access**:

```bash
gsutil iam get gs://YOUR-PROJECT.appspot.com
```

**Solution**: Grant Storage Object Creator role to function service account

## Security Best Practices

### 1. Disable Manual Cleanup in Production

Remove or comment out the `manualCleanup` function:

```typescript
// export const manualCleanup = functions...
```

### 2. Use VPC Service Controls

Restrict function access to specific networks

### 3. Enable Audit Logging

Track all job deletions in Cloud Logging

### 4. Implement Soft Deletes (Alternative)

Instead of hard deletion, add a `deletedAt` field:

```typescript
await batch.update(jobRef, {
  deletedAt: new Date().toISOString(),
});
```

Then filter deleted jobs in queries.

## Rollback

### Restore from Archives

If you need to restore deleted jobs:

```bash
# Download archives
gsutil -m cp -r gs://YOUR-PROJECT.appspot.com/archives/jobs/2024 ./restored-jobs/

# Restore to Firestore using script
node restore-jobs.js
```

### Disable Function

```bash
# Remove function
firebase functions:delete cleanupOldJobs

# Or update schedule to never run
.schedule("0 0 1 1 2099") // January 1, 2099
```

## Testing Checklist

- [ ] Deploy function to test project
- [ ] Set retention to 1 day for testing
- [ ] Create test jobs with old dates
- [ ] Trigger manual cleanup
- [ ] Verify jobs are deleted
- [ ] Verify archives are created (if enabled)
- [ ] Verify processed images are deleted
- [ ] Check function logs for errors
- [ ] Test with large batch (500+ jobs)
- [ ] Verify costs in billing dashboard

## Summary

The job cleanup function automates database maintenance with:

- **Zero-cost** operation (within free tiers)
- **Configurable** retention and archiving
- **Safe** batch processing with error handling
- **Observable** with structured logging
- **Flexible** manual trigger for testing

For questions or issues, check logs first:

```bash
firebase functions:log --only cleanupOldJobs
```
