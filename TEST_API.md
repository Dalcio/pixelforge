# PixelForge API & Worker Testing Guide

Your service is live at: **https://pixelforge-smp3.onrender.com**

## Quick Test Commands

### 1. Health Check

```bash
curl https://pixelforge-smp3.onrender.com/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-11-21T03:01:24.000Z"
}
```

---

### 2. Create Image Processing Job

**Test with a sample image:**

```bash
curl -X POST https://pixelforge-smp3.onrender.com/api/jobs \
  -H "Content-Type: application/json" \
  -d "{
    \"inputUrl\": \"https://images.unsplash.com/photo-1506905925346-21bda4d32df4\",
    \"transformations\": {
      \"resize\": {
        \"width\": 800,
        \"height\": 600
      },
      \"format\": \"webp\",
      \"quality\": 85
    }
  }"
```

**Windows PowerShell version:**

```powershell
$body = @{
    inputUrl = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4"
    transformations = @{
        resize = @{
            width = 800
            height = 600
        }
        format = "webp"
        quality = 85
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://pixelforge-smp3.onrender.com/api/jobs" -Method Post -Body $body -ContentType "application/json"
```

Expected response:

```json
{
  "id": "job_abc123xyz",
  "status": "pending"
}
```

---

### 3. Check Job Status

Replace `{JOB_ID}` with the ID from step 2:

```bash
curl https://pixelforge-smp3.onrender.com/api/jobs/{JOB_ID}
```

**PowerShell:**

```powershell
Invoke-RestMethod -Uri "https://pixelforge-smp3.onrender.com/api/jobs/{JOB_ID}"
```

**Status progression:**

- `pending` → Job queued, waiting for Worker
- `processing` → Worker is processing the image
- `completed` → Success! Check `outputUrl` for the processed image
- `failed` → Check `error` field for details

Completed response example:

```json
{
  "id": "job_abc123xyz",
  "status": "completed",
  "inputUrl": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
  "outputUrl": "https://firebasestorage.googleapis.com/...",
  "transformations": {
    "resize": { "width": 800, "height": 600 },
    "format": "webp",
    "quality": 85
  },
  "createdAt": "2025-11-21T03:05:00.000Z",
  "updatedAt": "2025-11-21T03:05:03.000Z"
}
```

---

### 4. List All Jobs

```bash
curl https://pixelforge-smp3.onrender.com/api/jobs
```

**Filter by status:**

```bash
curl "https://pixelforge-smp3.onrender.com/api/jobs?status=completed"
curl "https://pixelforge-smp3.onrender.com/api/jobs?status=pending"
curl "https://pixelforge-smp3.onrender.com/api/jobs?status=failed"
```

**PowerShell:**

```powershell
Invoke-RestMethod -Uri "https://pixelforge-smp3.onrender.com/api/jobs?status=completed"
```

---

## Test Scenarios

### Scenario 1: Basic Resize

```bash
curl -X POST https://pixelforge-smp3.onrender.com/api/jobs \
  -H "Content-Type: application/json" \
  -d "{
    \"inputUrl\": \"https://picsum.photos/2000/1500\",
    \"transformations\": {
      \"resize\": {
        \"width\": 400,
        \"height\": 300
      }
    }
  }"
```

### Scenario 2: Format Conversion (PNG to WebP)

```bash
curl -X POST https://pixelforge-smp3.onrender.com/api/jobs \
  -H "Content-Type: application/json" \
  -d "{
    \"inputUrl\": \"https://via.placeholder.com/1000x800.png\",
    \"transformations\": {
      \"format\": \"webp\",
      \"quality\": 90
    }
  }"
```

### Scenario 3: Grayscale + Blur

```bash
curl -X POST https://pixelforge-smp3.onrender.com/api/jobs \
  -H "Content-Type: application/json" \
  -d "{
    \"inputUrl\": \"https://picsum.photos/1200/800\",
    \"transformations\": {
      \"grayscale\": true,
      \"blur\": 5
    }
  }"
```

### Scenario 4: Complex Transformation

```bash
curl -X POST https://pixelforge-smp3.onrender.com/api/jobs \
  -H "Content-Type: application/json" \
  -d "{
    \"inputUrl\": \"https://images.unsplash.com/photo-1682687220742-aba13b6e50ba\",
    \"transformations\": {
      \"resize\": {
        \"width\": 600,
        \"height\": 400,
        \"fit\": \"cover\"
      },
      \"rotate\": 90,
      \"sharpen\": true,
      \"format\": \"jpeg\",
      \"quality\": 80
    }
  }"
```

---

## Monitoring Worker Logs

To see the Worker processing jobs in real-time:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on **pixelforge-api** service
3. Click **Logs** tab
4. Look for messages like:
   - `[Worker] Processing job: job_abc123xyz`
   - `[Worker] ✓ Job completed successfully`
   - `[Worker] ✗ Job failed:`

---

## Expected Processing Time

- **Small images (<1MB)**: 2-5 seconds
- **Medium images (1-5MB)**: 5-10 seconds
- **Large images (>5MB)**: 10-20 seconds

_Note: First job after deployment might take longer due to cold start._

---

## Error Handling Examples

### Invalid URL

```bash
curl -X POST https://pixelforge-smp3.onrender.com/api/jobs \
  -H "Content-Type: application/json" \
  -d "{
    \"inputUrl\": \"not-a-url\",
    \"transformations\": {}
  }"
```

Expected: `400 Bad Request` with validation error

### Unreachable URL

```bash
curl -X POST https://pixelforge-smp3.onrender.com/api/jobs \
  -H "Content-Type: application/json" \
  -d "{
    \"inputUrl\": \"https://this-domain-does-not-exist-xyz123.com/image.jpg\",
    \"transformations\": {}
  }"
```

Expected: `400 Bad Request` - "URL is not reachable"

---

## Troubleshooting

### Service returns 503

- **Cause**: Redis connection lost
- **Solution**: Check Render logs, verify `UPSTASH_REDIS_URL` is correct

### Job stuck in "pending"

- **Cause**: Worker not processing
- **Solution**: Check Render logs for Worker errors

### Job fails immediately

- **Cause**: Invalid image URL or unsupported format
- **Solution**: Verify URL is accessible and image is valid (JPEG, PNG, WebP, etc.)

---

## Full Workflow Test

```bash
# 1. Create job
RESPONSE=$(curl -s -X POST https://pixelforge-smp3.onrender.com/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"inputUrl":"https://picsum.photos/800/600","transformations":{"format":"webp"}}')

echo "Created job: $RESPONSE"

# 2. Extract job ID
JOB_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

echo "Job ID: $JOB_ID"

# 3. Wait 5 seconds
sleep 5

# 4. Check status
curl https://pixelforge-smp3.onrender.com/api/jobs/$JOB_ID
```

**PowerShell Full Test:**

```powershell
# 1. Create job
$response = Invoke-RestMethod -Uri "https://pixelforge-smp3.onrender.com/api/jobs" `
  -Method Post `
  -Body '{"inputUrl":"https://picsum.photos/800/600","transformations":{"format":"webp"}}' `
  -ContentType "application/json"

Write-Host "Created job:" $response.id

# 2. Wait 5 seconds
Start-Sleep -Seconds 5

# 3. Check status
$status = Invoke-RestMethod -Uri "https://pixelforge-smp3.onrender.com/api/jobs/$($response.id)"
$status | ConvertTo-Json -Depth 5
```

---

## Success Indicators

✅ **API Working**: Health endpoint returns `{"status":"ok"}`  
✅ **Worker Connected**: Render logs show `[Worker Redis] ✓ Connected and ready`  
✅ **Job Processing**: Job status changes from `pending` → `processing` → `completed`  
✅ **Output Available**: `outputUrl` in completed job response contains Firebase Storage URL  
✅ **Image Accessible**: Opening `outputUrl` displays the processed image

---

## Next Steps

1. **Test with your own images**: Replace `inputUrl` with your image URLs
2. **Try different transformations**: Experiment with resize, rotate, blur, etc.
3. **Monitor performance**: Check Render logs for processing times
4. **Set up frontend**: Connect your web app to this API

Enjoy using PixelForge! 🎨✨
