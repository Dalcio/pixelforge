# PixelForge Deployment Guide

This guide provides step-by-step instructions for deploying all PixelForge services using **free-tier** platforms.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Deploy Redis (Upstash)](#1-deploy-redis-upstash)
4. [Deploy API Service](#2-deploy-api-service)
5. [Deploy Worker Service](#3-deploy-worker-service)
6. [Deploy Frontend](#4-deploy-frontend)
7. [Verify Deployment](#5-verify-deployment)
8. [Environment Variables Reference](#environment-variables-reference)
9. [Troubleshooting](#troubleshooting)
10. [Monitoring & Logs](#monitoring--logs)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account (for code hosting)
- ✅ Firebase project created with:
  - Firestore enabled
  - Storage enabled
  - Cloud Functions deployed
  - Security rules deployed
- ✅ Service account credentials from Firebase
- ✅ Accounts on deployment platforms:
  - [Upstash](https://upstash.com/) (Redis)
  - [Render](https://render.com/) or [Railway](https://railway.app/) (API & Worker)
  - [Vercel](https://vercel.com/) (Frontend)

---

## Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│     API      │────▶│  Firestore   │
│   (Vercel)   │     │  (Render)    │     │  (Firebase)  │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────▼────────┐
                     │     Redis     │
                     │   (Upstash)   │
                     └──────┬────────┘
                            │
                     ┌──────▼────────┐     ┌──────────────┐
                     │    Worker     │────▶│   Storage    │
                     │   (Render)    │     │  (Firebase)  │
                     └───────────────┘     └──────────────┘
```

---

## 1. Deploy Redis (Upstash)

### Step 1.1: Create Upstash Account

1. Go to [https://upstash.com/](https://upstash.com/)
2. Sign up or log in
3. Navigate to **Redis** tab

### Step 1.2: Create Redis Database

1. Click **Create Database**
2. Configure:
   - **Name**: `pixelforge-redis`
   - **Type**: Regional (recommended) or Global
   - **Region**: Choose closest to your API/Worker deployment
   - **Eviction**: No eviction
   - **TLS**: Enabled (default)
3. Click **Create**

### Step 1.3: Get Connection URL

1. After creation, click on your database
2. Copy the **REST URL** or **Redis URL** (format: `rediss://...`)
3. Save this URL as `UPSTASH_REDIS_URL` (you'll need it later)

**Example URL format:**

```
rediss://:AbCdEf123456@us1-example-12345.upstash.io:6379
```

### Step 1.4: Verify Free Tier Limits

Upstash Free Tier includes:

- ✅ 10,000 commands/day
- ✅ 256 MB storage
- ✅ TLS encryption
- ✅ Global replication (optional)

---

## 2. Deploy API Service

You can deploy the API service on **Render** (recommended) or **Railway**. Choose one:

### Option A: Deploy on Render

#### Step 2.1: Connect Repository

1. Go to [https://render.com/](https://render.com/)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Select the `pixelforge` repository

#### Step 2.2: Configure Service

- **Name**: `pixelforge-api`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: Leave empty (monorepo handled by build command)
- **Build Command**:
  ```bash
  npm install -g pnpm && pnpm install --frozen-lockfile && bash scripts/build-api.sh
  ```
- **Start Command**:
  ```bash
  cd apps/api && node dist/server.js
  ```
- **Plan**: Free

#### Step 2.3: Add Environment Variables

Click **Environment** → **Add Environment Variable**

| Variable                | Value                     | Example                                            |
| ----------------------- | ------------------------- | -------------------------------------------------- |
| `NODE_ENV`              | `production`              | `production`                                       |
| `PORT`                  | `10000`                   | `10000`                                            |
| `ALLOWED_ORIGINS`       | Your frontend URL         | `https://pixelforge.vercel.app`                    |
| `FIREBASE_PROJECT_ID`   | From Firebase console     | `image-transform-12345`                            |
| `FIREBASE_CLIENT_EMAIL` | From service account JSON | `firebase-adminsdk-...@...iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY`  | From service account JSON | `-----BEGIN PRIVATE KEY-----\n...`                 |
| `UPSTASH_REDIS_URL`     | From Upstash dashboard    | `rediss://:password@endpoint.upstash.io:6379`      |

**Important for FIREBASE_PRIVATE_KEY:**

- Include the full key with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep `\n` characters in the key
- Wrap in quotes if it contains special characters

#### Step 2.4: Deploy

1. Click **Create Web Service**
2. Wait for build to complete (5-10 minutes)
3. Note your API URL: `https://pixelforge-api.onrender.com`

#### Step 2.5: Configure Health Check

1. Go to **Settings** → **Health Check**
2. Set **Health Check Path**: `/health`
3. Save changes

### Option B: Deploy on Railway

#### Step 2.1: Create Project

1. Go to [https://railway.app/](https://railway.app/)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `pixelforge` repository

#### Step 2.2: Configure Service

1. Railway will detect your `apps/api/railway.json`
2. Set **Service Name**: `api`
3. Configure:
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

#### Step 2.3: Add Environment Variables

Go to **Variables** tab and add:

```env
NODE_ENV=production
PORT=$PORT
ALLOWED_ORIGINS=https://your-frontend.vercel.app
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
UPSTASH_REDIS_URL=rediss://:password@endpoint.upstash.io:6379
```

Railway automatically provides `$PORT` variable.

#### Step 2.4: Deploy

1. Click **Deploy**
2. Wait for deployment (5-10 minutes)
3. Enable **Public Networking** to get a URL
4. Note your API URL: `https://api-production-xxxx.up.railway.app`

---

## 3. Deploy Worker Service

The Worker service runs continuously to process image jobs.

### Option A: Deploy on Render

#### Step 3.1: Create Background Worker

1. Go to Render dashboard
2. Click **New +** → **Background Worker**
3. Connect to same GitHub repository

#### Step 3.2: Configure Worker

- **Name**: `pixelforge-worker`
- **Environment**: `Node`
- **Region**: Same as API (important for low latency)
- **Branch**: `main`
- **Build Command**:
  ```bash
  npm install -g pnpm && pnpm install --frozen-lockfile && bash scripts/build-worker.sh
  ```
- **Start Command**:
  ```bash
  cd apps/worker && node dist/worker.js
  ```
- **Plan**: Free

#### Step 3.3: Add Environment Variables

| Variable                  | Value                      |
| ------------------------- | -------------------------- |
| `NODE_ENV`                | `production`               |
| `FIREBASE_PROJECT_ID`     | Same as API                |
| `FIREBASE_CLIENT_EMAIL`   | Same as API                |
| `FIREBASE_PRIVATE_KEY`    | Same as API                |
| `FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `UPSTASH_REDIS_URL`       | Same as API                |

**Critical:** Use the **exact same** `UPSTASH_REDIS_URL` as the API service.

#### Step 3.4: Deploy

1. Click **Create Background Worker**
2. Wait for build to complete
3. Worker will start automatically and wait for jobs

### Option B: Deploy on Railway

#### Step 3.1: Add Worker Service

1. In your Railway project, click **New Service**
2. Select **GitHub Repo** → Same repository
3. Set **Service Name**: `worker`

#### Step 3.2: Configure Worker

- **Root Directory**: `apps/worker`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

#### Step 3.3: Add Environment Variables

```env
NODE_ENV=production
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
UPSTASH_REDIS_URL=rediss://:password@endpoint.upstash.io:6379
```

**Note:** Worker does NOT need a public URL (no external access required).

---

## 4. Deploy Frontend

### Step 4.1: Deploy to Vercel

1. Go to [https://vercel.com/](https://vercel.com/)
2. Click **Add New** → **Project**
3. Import your GitHub repository

### Step 4.2: Configure Project

- **Framework Preset**: Vite
- **Root Directory**: `apps/web`
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install -g pnpm && pnpm install`

**Override settings:**

1. Click **Edit** next to Root Directory
2. Set to `apps/web`

### Step 4.3: Add Environment Variables

Click **Environment Variables** and add:

| Variable                            | Value                            | Example                               |
| ----------------------------------- | -------------------------------- | ------------------------------------- |
| `VITE_API_BASE`                     | Your API URL                     | `https://pixelforge-api.onrender.com` |
| `VITE_FIREBASE_API_KEY`             | From Firebase console            | `AIzaSyC...`                          |
| `VITE_FIREBASE_AUTH_DOMAIN`         | From Firebase console            | `project.firebaseapp.com`             |
| `VITE_FIREBASE_PROJECT_ID`          | From Firebase console            | `project-id`                          |
| `VITE_FIREBASE_STORAGE_BUCKET`      | From Firebase console            | `project.appspot.com`                 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | From Firebase console            | `123456789`                           |
| `VITE_FIREBASE_APP_ID`              | From Firebase console            | `1:123:web:abc`                       |
| `VITE_FIREBASE_MEASUREMENT_ID`      | From Firebase console (optional) | `G-XXXXXXXXXX`                        |

**Important:** All environment variables MUST be prefixed with `VITE_` for Vite to include them in the build.

### Step 4.4: Deploy

1. Click **Deploy**
2. Wait for build (3-5 minutes)
3. Note your Frontend URL: `https://pixelforge.vercel.app`

### Step 4.5: Update CORS Configuration

**Critical Step:** Update your API's `ALLOWED_ORIGINS` environment variable:

1. Go back to Render/Railway API settings
2. Update `ALLOWED_ORIGINS` to include your Vercel URL:
   ```
   https://pixelforge.vercel.app,https://pixelforge-preview.vercel.app
   ```
3. Redeploy API service

---

## 5. Verify Deployment

### Step 5.1: Test API Health

```bash
curl https://your-api-url.onrender.com/health
```

**Expected response:**

```json
{
  "status": "ok",
  "uptime": 123.456,
  "timestamp": "2025-11-21T12:00:00.000Z"
}
```

### Step 5.2: Check Worker Logs

1. Go to Render/Railway dashboard
2. Open Worker service
3. View logs
4. Should see: `✓ Worker started and waiting for jobs...`

### Step 5.3: Test Frontend

1. Open your Vercel URL in browser
2. Should see PixelForge UI
3. Check browser console for errors

### Step 5.4: Submit Test Job

1. Upload a test image (< 10MB)
2. Add transformations (resize, rotate, etc.)
3. Submit job
4. Watch progress bar update in real-time
5. Verify completed image appears

### Step 5.5: Verify Redis Connection

Check API logs for:

```
[API Redis] ✓ Connected and ready
```

Check Worker logs for:

```
[Worker Redis] ✓ Connected and ready
```

---

## Environment Variables Reference

### API Service Environment Variables

```env
NODE_ENV=production
PORT=10000
ALLOWED_ORIGINS=https://your-frontend.vercel.app
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----\n"
UPSTASH_REDIS_URL=rediss://:password@endpoint.upstash.io:6379
```

### Worker Service Environment Variables

```env
NODE_ENV=production
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
UPSTASH_REDIS_URL=rediss://:password@endpoint.upstash.io:6379
```

### Frontend Environment Variables

```env
VITE_API_BASE=https://your-api.onrender.com
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-id
VITE_FIREBASE_STORAGE_BUCKET=project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## Troubleshooting

### API won't start

**Symptoms:**

- Service crashes on startup
- Health check fails

**Solutions:**

1. **Check Redis connection:**

   ```bash
   # Test Redis URL locally
   redis-cli -u "rediss://:password@endpoint.upstash.io:6379" PING
   ```

2. **Verify Firebase credentials:**

   - Ensure `FIREBASE_PRIVATE_KEY` includes `\n` characters
   - Wrap private key in double quotes
   - Verify service account has Firestore and Storage permissions

3. **Check logs:**
   - Look for `[API Redis] ✗ Connection error`
   - Look for Firebase initialization errors

### Worker not processing jobs

**Symptoms:**

- Jobs stuck in `pending` status
- Worker logs show no activity

**Solutions:**

1. **Verify Redis connection:**

   - Worker and API must use same `UPSTASH_REDIS_URL`
   - Check for `[Worker Redis] ✓ Connected and ready`

2. **Check Firebase Storage access:**

   - Verify `FIREBASE_STORAGE_BUCKET` is correct
   - Ensure service account has Storage Admin role

3. **Restart worker:**
   - Render: Manual Deploy → Clear build cache & deploy
   - Railway: Redeploy service

### CORS errors in frontend

**Symptoms:**

- Browser console shows CORS errors
- API requests fail with 403

**Solutions:**

1. **Update ALLOWED_ORIGINS:**

   ```env
   ALLOWED_ORIGINS=https://your-actual-frontend.vercel.app
   ```

2. **Include all Vercel preview URLs:**

   ```env
   ALLOWED_ORIGINS=https://pixelforge.vercel.app,https://pixelforge-*.vercel.app
   ```

3. **Redeploy API** after changing CORS settings

### Rate limit issues

**Symptoms:**

- API returns 429 Too Many Requests
- Testing blocked

**Solutions:**

1. **Temporary fix for testing:**

   - Wait for rate limit window to reset (15 minutes)
   - Use different IP address

2. **Permanent fix:**
   - Adjust rate limit in `apps/api/src/middlewares/rate-limiter.ts`
   - Redeploy API

### Build failures

**Symptoms:**

- Deployment fails during build
- TypeScript compilation errors

**Solutions:**

1. **Clear cache and rebuild:**

   - Render: Manual Deploy → Clear build cache & deploy
   - Railway: Settings → Reset build cache
   - Vercel: Deployments → Redeploy

2. **Check build logs:**

   - Look for missing dependencies
   - Verify pnpm workspace structure

3. **Test build locally:**
   ```bash
   pnpm install
   pnpm build
   ```

### Upstash Redis free tier limits exceeded

**Symptoms:**

- Redis commands fail
- Error: `Daily command limit exceeded`

**Solutions:**

1. **Check usage:**

   - Upstash dashboard → Database → Metrics
   - Monitor daily commands

2. **Optimize Redis usage:**

   - Reduce job status update frequency
   - Implement caching strategy

3. **Upgrade plan:**
   - Consider paid tier if consistently exceeding limits

---

## Monitoring & Logs

### Render Logs

**View API logs:**

1. Go to Render dashboard
2. Select `pixelforge-api` service
3. Click **Logs** tab
4. Filter by log level (Info, Error, etc.)

**View Worker logs:**

1. Select `pixelforge-worker` service
2. Click **Logs** tab
3. Look for job processing messages

### Railway Logs

**View logs:**

1. Go to Railway project
2. Select service (API or Worker)
3. Click **Logs** tab
4. Use search to filter logs

### Vercel Logs

**View deployment logs:**

1. Go to Vercel project
2. Click **Deployments**
3. Select deployment
4. View **Function Logs** (if using serverless functions)

### Upstash Monitoring

**Monitor Redis:**

1. Go to Upstash dashboard
2. Select your database
3. View:
   - Commands/day usage
   - Storage usage
   - Connection count
   - Response times

### Firebase Monitoring

**Monitor Firestore:**

1. Firebase console → Firestore → Usage
2. Check:
   - Document reads/writes
   - Storage size
   - Index usage

**Monitor Storage:**

1. Firebase console → Storage → Usage
2. Check:
   - Total storage
   - Download bandwidth
   - Upload operations

---

## Cost Breakdown (Free Tier)

| Service                | Free Tier Limits                | Estimated Usage              | Status  |
| ---------------------- | ------------------------------- | ---------------------------- | ------- |
| **Render API**         | 750 hours/month                 | 720 hours/month              | ✅ Free |
| **Render Worker**      | 750 hours/month                 | 720 hours/month              | ✅ Free |
| **Vercel**             | 100 GB bandwidth                | < 10 GB/month                | ✅ Free |
| **Upstash Redis**      | 10K commands/day                | ~5K/day                      | ✅ Free |
| **Firebase Firestore** | 50K reads, 20K writes/day       | ~10K reads, 5K writes/day    | ✅ Free |
| **Firebase Storage**   | 5 GB storage, 1 GB/day download | ~500 MB storage, ~200 MB/day | ✅ Free |
| **Firebase Functions** | 2M invocations/month            | ~100K/month                  | ✅ Free |

**Total monthly cost:** $0

---

## Scaling Considerations

### When to upgrade from free tier:

1. **Upstash Redis:**

   - Exceeding 10K commands/day
   - Need more than 256 MB storage
   - Consider: Pay-as-you-go plan ($0.20 per 100K commands)

2. **Render:**

   - API needs more than 512 MB RAM
   - Worker needs more compute power
   - Consider: Starter plan ($7/month per service)

3. **Firebase:**

   - Exceeding daily read/write limits
   - Need more storage space
   - Consider: Blaze (pay-as-you-go) plan

4. **Vercel:**
   - Exceeding bandwidth limits
   - Need custom domains
   - Consider: Pro plan ($20/month)

---

## Deployment Checklist

Use this checklist to verify your deployment:

- [ ] Upstash Redis created and URL obtained
- [ ] API service deployed on Render/Railway
- [ ] API environment variables configured
- [ ] API health check endpoint returns 200 OK
- [ ] Worker service deployed on Render/Railway
- [ ] Worker environment variables configured
- [ ] Worker logs show "waiting for jobs"
- [ ] Frontend deployed on Vercel
- [ ] Frontend environment variables configured (all VITE\_ prefixed)
- [ ] Frontend loads without console errors
- [ ] CORS configured with correct frontend URL
- [ ] Test job submitted successfully
- [ ] Job progresses from pending → processing → completed
- [ ] Processed image accessible in browser
- [ ] Worker logs show job completion
- [ ] Firestore contains job documents
- [ ] Firebase Storage contains processed images
- [ ] Rate limiting works (test with multiple requests)
- [ ] Health check endpoint accessible
- [ ] Redis connection healthy in both API and Worker

---

## Next Steps

After successful deployment:

1. **Set up monitoring alerts:**

   - Upstash: Configure alerts for command limits
   - Render: Enable crash notifications
   - Firebase: Set up budget alerts

2. **Configure custom domain (optional):**

   - Vercel: Add custom domain in project settings
   - Render: Add custom domain in service settings

3. **Enable analytics:**

   - Firebase Analytics
   - Vercel Analytics

4. **Set up CI/CD:**

   - Automatic deployments on git push
   - Preview deployments for PRs

5. **Review security:**
   - Firestore security rules
   - Storage security rules
   - API rate limiting
   - CORS configuration

---

## Support

**Documentation:**

- Architecture: `docs/architecture.md`
- API: `docs/backend-api.md`
- Frontend: `docs/frontend.md`
- Security: `docs/security.md`

**Deployment Issues:**

- Check service logs first
- Verify environment variables
- Test each service independently
- Review this troubleshooting section

**Platform-specific help:**

- Render: https://render.com/docs
- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- Upstash: https://docs.upstash.com

---

## Deployment Complete! 🎉

Your PixelForge application is now live and ready to process images!

**Quick links:**

- API: `https://your-api.onrender.com`
- Frontend: `https://your-app.vercel.app`
- Health: `https://your-api.onrender.com/health`

**Test the system:**

1. Open frontend URL
2. Upload an image
3. Add transformations
4. Submit and watch real-time progress
5. Download processed image

Enjoy your fully deployed image processing system! 🚀
