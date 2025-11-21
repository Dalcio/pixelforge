# Combined API + Worker Deployment on Render

Your API now includes the Worker, running both in a single service!

## What Changed

✅ **API server** - Handles HTTP requests on port 10000  
✅ **Worker process** - Runs in same process, processes jobs from Redis  
✅ **Single deployment** - No separate worker service needed  

## Current Render Setup

Your existing `pixelforge-api` service on Render now runs both:
- Express API server
- BullMQ worker for image processing

## Required Environment Variable

Add this new variable to your Render service:

**Go to:** Render Dashboard → pixelforge-api → Environment

**Add:**
```
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

## Existing Environment Variables

Make sure these are already set:
- ✅ `NODE_ENV=production`
- ✅ `PORT=10000`
- ✅ `ALLOWED_ORIGINS=https://your-frontend.vercel.app`
- ✅ `FIREBASE_PROJECT_ID=your-project-id`
- ✅ `FIREBASE_CLIENT_EMAIL=your-client-email`
- ✅ `FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n`
- ✅ `UPSTASH_REDIS_URL=rediss://:password@endpoint.upstash.io:6379`

## Deployment

Render should **auto-deploy** from the latest GitHub commit.

If not, manually deploy:
1. Go to Render Dashboard
2. Select `pixelforge-api` service
3. Click **Manual Deploy** → **Deploy latest commit**

## What to Expect in Logs

After deployment, you should see:
```
✓ API server running on port 10000
✓ Worker started and waiting for jobs...
```

## Delete Old Worker Service (If Exists)

If you previously had a separate worker service:
1. Go to Render Dashboard
2. Find `pixelforge-worker` service
3. Settings → Delete Service

This saves your free tier slots!

## Testing

1. **Test API:**
   ```bash
   curl https://pixelforge-smp3.onrender.com/health
   ```

2. **Submit a test job** from your frontend

3. **Check logs** - You should see both:
   - API request logs
   - Worker job processing logs

## Benefits

✅ **Uses only 1 service** - Stays within free tier  
✅ **Shared Redis connection** - More efficient  
✅ **Simpler management** - One service to monitor  
✅ **No extra costs** - Single service deployment  

## Your Service is Ready! 🚀

URL: `https://pixelforge-smp3.onrender.com`

The service will:
1. Accept API requests for creating jobs
2. Process those jobs in the background
3. Update Firebase with results
4. All in one deployment!
