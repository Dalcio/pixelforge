# Deployment Guide

## Overview

This guide covers deploying FluxImage's three services to production using modern cloud platforms.

## Architecture Overview

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Web App   │      │   API       │      │   Worker    │
│  (Netlify/  │─────▶│  (Render/   │─────▶│  (Render/   │
│   Vercel)   │      │   Railway)  │      │   Railway)  │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │                    │
       │                    ├────────────────────┤
       │                    │                    │
       ↓                    ↓                    ↓
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Firebase   │      │   Redis     │      │  Firebase   │
│  Firestore  │      │  (Upstash)  │      │   Storage   │
└─────────────┘      └─────────────┘      └─────────────┘
```

## Prerequisites

- [ ] Firebase project configured
- [ ] Redis instance (Upstash recommended)
- [ ] GitHub repository with code
- [ ] Environment variables ready

## Deployment Strategy

### Service Dependencies

1. **Firebase & Redis**: Set up first (data layer)
2. **Worker**: Deploy second (processing layer)
3. **API**: Deploy third (interface layer)
4. **Web**: Deploy last (presentation layer)

---

## Part 1: API Deployment

### Option A: Render (Recommended)

**Why Render?**
- Free tier available
- Automatic deployments
- Built-in SSL
- Environment variables
- Health checks

#### Steps

1. **Create Render Account**
   - Go to [render.com](https://render.com/)
   - Sign up with GitHub

2. **Create New Web Service**
   - Click **New** → **Web Service**
   - Connect GitHub repository
   - Select `fluximage` repo

3. **Configure Service**
   
   ```
   Name: fluximage-api
   Region: Choose closest to users
   Branch: main
   Root Directory: apps/api
   Runtime: Node
   Build Command: pnpm install && pnpm build
   Start Command: pnpm start
   ```

4. **Set Environment Variables**

   Add all variables from `apps/api/.env.example`:

   ```
   PORT=3000
   NODE_ENV=production
   
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-email
   FIREBASE_PRIVATE_KEY=your-key
   
   REDIS_HOST=your-redis-host
   REDIS_PORT=6379
   REDIS_PASSWORD=your-password
   REDIS_TLS=true
   ```

5. **Configure Build**

   Create `apps/api/package.json` with:
   ```json
   {
     "scripts": {
       "build": "tsc",
       "start": "node dist/server.js"
     }
   }
   ```

6. **Deploy**
   - Click **Create Web Service**
   - Wait for build to complete
   - Note the URL: `https://fluximage-api.onrender.com`

#### Health Check

Test the API:
```bash
curl https://fluximage-api.onrender.com/api/jobs
```

### Option B: Railway

1. Go to [railway.app](https://railway.app/)
2. New Project → Deploy from GitHub
3. Select repository
4. Configure:
   ```
   Root: apps/api
   Build: pnpm install && pnpm build
   Start: pnpm start
   ```
5. Add environment variables
6. Deploy

### Option C: Google Cloud Run

1. **Build Container**

   Create `apps/api/Dockerfile`:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install -g pnpm
   RUN pnpm install
   COPY . .
   RUN pnpm build
   EXPOSE 3000
   CMD ["pnpm", "start"]
   ```

2. **Deploy**
   ```bash
   gcloud run deploy fluximage-api \
     --source apps/api \
     --region us-central1 \
     --allow-unauthenticated
   ```

---

## Part 2: Worker Deployment

### Option A: Render (Recommended)

#### Steps

1. **Create New Background Worker**
   - Click **New** → **Background Worker**
   - Connect same GitHub repo

2. **Configure Worker**
   
   ```
   Name: fluximage-worker
   Region: Same as API
   Branch: main
   Root Directory: apps/worker
   Runtime: Node
   Build Command: pnpm install && pnpm build
   Start Command: pnpm start
   ```

3. **Set Environment Variables**

   Add all variables from `apps/worker/.env.example`:

   ```
   NODE_ENV=production
   
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-email
   FIREBASE_PRIVATE_KEY=your-key
   FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
   
   REDIS_HOST=your-redis-host
   REDIS_PORT=6379
   REDIS_PASSWORD=your-password
   REDIS_TLS=true
   ```

4. **Deploy**
   - Click **Create Background Worker**
   - Monitor logs for "Worker started"

#### Scaling Workers

To handle more load:
- Go to worker settings
- Increase instance count
- Each instance processes 5 concurrent jobs

### Option B: Railway

Same process as API, but select "Worker" type instead of "Web Service".

### Option C: Cloud Run Jobs

```bash
gcloud run jobs create fluximage-worker \
  --source apps/worker \
  --region us-central1 \
  --execute-now
```

---

## Part 3: Web Frontend Deployment

### Option A: Netlify (Recommended)

**Why Netlify?**
- Free tier with SSL
- Automatic builds
- CDN
- Perfect for React/Vite

#### Steps

1. **Create Netlify Account**
   - Go to [netlify.com](https://netlify.com/)
   - Sign up with GitHub

2. **Create New Site**
   - Click **Add new site** → **Import from Git**
   - Select GitHub
   - Choose `fluximage` repository

3. **Configure Build Settings**

   ```
   Base directory: apps/web
   Build command: pnpm install && pnpm build
   Publish directory: apps/web/dist
   ```

4. **Set Environment Variables**

   Go to **Site settings** → **Environment variables**

   Add all `VITE_*` variables:

   ```
   VITE_API_URL=https://fluximage-api.onrender.com/api
   
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

5. **Deploy**
   - Click **Deploy site**
   - Wait for build
   - Note URL: `https://fluximage.netlify.app`

6. **Custom Domain (Optional)**
   - Go to **Domain settings**
   - Add custom domain
   - Update DNS records

### Option B: Vercel

1. Go to [vercel.com](https://vercel.com/)
2. Import from GitHub
3. Configure:
   ```
   Framework: Vite
   Root: apps/web
   Build: pnpm build
   Output: dist
   ```
4. Add environment variables
5. Deploy

### Option C: Firebase Hosting

```bash
cd apps/web
pnpm build
firebase init hosting
firebase deploy --only hosting
```

---

## Part 4: CORS Configuration

### Update API CORS

In `apps/api/src/app.ts`:

```typescript
app.use(cors({
  origin: [
    'https://fluximage.netlify.app',
    'https://yourdomain.com',
  ],
  credentials: true,
}));
```

Redeploy API after changing CORS.

---

## Part 5: Monitoring & Logging

### API Monitoring

**Render:**
- Dashboard → Logs tab
- Set up log drains (optional)

**Additional Tools:**
- [Sentry](https://sentry.io/) for error tracking
- [LogRocket](https://logrocket.com/) for session replay

### Worker Monitoring

Monitor worker logs for:
- Jobs processed
- Failed jobs
- Processing time

### Redis Monitoring

**Upstash Dashboard:**
- Commands/sec
- Memory usage
- Queue depth

### Firebase Monitoring

**Firebase Console:**
- Firestore reads/writes
- Storage downloads
- Quota usage

---

## Part 6: CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm --filter @fluximage/api build
      # Deploy step depends on platform

  deploy-worker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm --filter @fluximage/worker build
      # Deploy step depends on platform
```

---

## Part 7: Production Checklist

### Security

- [ ] Environment variables set correctly
- [ ] No secrets in code
- [ ] Firebase security rules updated
- [ ] CORS configured properly
- [ ] HTTPS enabled (automatic on all platforms)

### Performance

- [ ] API response caching (optional)
- [ ] CDN for frontend (automatic on Netlify/Vercel)
- [ ] Database indexes created
- [ ] Image optimization enabled

### Reliability

- [ ] Error tracking configured
- [ ] Logging enabled
- [ ] Health checks configured
- [ ] Retry logic tested
- [ ] Backup strategy defined

### Monitoring

- [ ] Uptime monitoring (UptimeRobot, etc.)
- [ ] Error alerts configured
- [ ] Performance monitoring
- [ ] Cost alerts set

---

## Cost Estimation

### Free Tier Usage

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| **Render API** | 750 hrs/month | $0 |
| **Render Worker** | 750 hrs/month | $0 |
| **Netlify** | 100 GB bandwidth | $0 |
| **Upstash Redis** | 10K commands/day | $0 |
| **Firebase Firestore** | 50K reads/day | $0 |
| **Firebase Storage** | 1 GB storage, 1 GB/day download | $0 |

**Total**: $0/month for low-moderate traffic

### Paid Tier (High Traffic)

| Service | Usage | Est. Cost |
|---------|-------|-----------|
| **Render API** | 1 instance | $7/month |
| **Render Worker** | 2 instances | $14/month |
| **Netlify** | Pro plan | $0 (if under 100GB) |
| **Upstash** | 1M commands/month | $10/month |
| **Firebase** | 1M reads, 10GB storage | $5/month |

**Total**: ~$36/month for high traffic

---

## Troubleshooting

### API Not Starting

**Check:**
- Environment variables set
- Build completed successfully
- Port configuration correct

**Logs:**
```bash
# Render dashboard → Logs tab
```

### Worker Not Processing Jobs

**Check:**
- Redis connection successful
- Worker started message in logs
- Queue has jobs

**Debug:**
```bash
# Check queue length
redis-cli -h your-host -p your-port -a your-password
> LLEN bull:image-processing:wait
```

### Frontend Not Loading

**Check:**
- Build successful
- Environment variables correct
- API URL correct
- CORS configured

**Debug:**
- Open browser console
- Check network tab
- Verify API endpoint

---

## Scaling Strategies

### Horizontal Scaling

**Workers:**
- Add more worker instances
- Each processes 5 concurrent jobs
- BullMQ handles coordination

**API:**
- Add more API instances
- Load balancer automatic (Render/Railway)

### Vertical Scaling

Upgrade instance size:
- Render: Increase memory/CPU
- Railway: Adjust resources

### Database Scaling

**Firestore:**
- Auto-scales
- Optimize queries
- Add composite indexes

**Redis:**
- Upstash scales automatically
- Increase plan if needed

---

## Rollback Strategy

### Quick Rollback

**Render:**
- Dashboard → Deploys
- Click previous deploy
- Restore

**Netlify:**
- Deploys tab
- Click previous deploy
- Publish

### Git Revert

```bash
git revert HEAD
git push origin main
```

Auto-deploys will trigger.

---

## Summary

FluxImage is now production-ready with:

✓ Scalable API on Render/Railway  
✓ Resilient worker processing  
✓ Fast frontend on Netlify/Vercel  
✓ Real-time updates via Firebase  
✓ Reliable queue with Redis  
✓ Monitoring and logging  
✓ CI/CD pipeline  
✓ Cost-effective architecture  

**Next Steps:**
1. Monitor initial traffic
2. Optimize based on metrics
3. Scale as needed
4. Implement advanced features
