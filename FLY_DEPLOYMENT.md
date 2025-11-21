# Deploy PixelForge to Fly.io

## Prerequisites

1. Install Fly CLI
2. Create Fly.io account
3. Have Firebase and Upstash Redis credentials ready

---

## Step 1: Install Fly CLI

**Windows (PowerShell):**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**Or using Chocolatey:**
```powershell
choco install flyctl
```

After installation, close and reopen your terminal.

---

## Step 2: Login to Fly.io

```bash
# Sign up (opens browser)
fly auth signup

# Or login if you already have an account
fly auth login
```

---

## Step 3: Create and Deploy App

From the project root directory:

```bash
# Launch the app (creates it on Fly.io)
fly launch --no-deploy

# When prompted:
# - App name: pixelforge (or your choice)
# - Region: Choose closest to you (e.g., iad for US East, fra for Europe)
# - Postgres: No
# - Redis: No (we're using Upstash)
```

---

## Step 4: Set Environment Variables

```bash
fly secrets set \
  NODE_ENV=production \
  ALLOWED_ORIGINS=https://your-frontend.vercel.app \
  FIREBASE_PROJECT_ID=your-project-id \
  FIREBASE_CLIENT_EMAIL=your-client-email \
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...your private key here...
-----END PRIVATE KEY-----" \
  FIREBASE_STORAGE_BUCKET=your-project.appspot.com \
  UPSTASH_REDIS_URL=rediss://:password@endpoint.upstash.io:6379
```

**Tips for setting FIREBASE_PRIVATE_KEY:**
- Keep all newlines (`\n`) in the key
- Wrap the entire key in quotes
- Or set it through Fly.io dashboard if command line has issues

---

## Step 5: Deploy

```bash
# Deploy the app
fly deploy

# This will:
# 1. Build the Docker image
# 2. Push to Fly.io registry
# 3. Deploy and start the app
```

---

## Step 6: Verify Deployment

```bash
# Check app status
fly status

# View logs (real-time)
fly logs

# Check specific logs
fly logs --app pixelforge

# Get app URL
fly info
```

**Test the API:**
```bash
# Test health endpoint
curl https://pixelforge.fly.dev/health

# Expected response:
# {"status":"ok","uptime":123.456,"timestamp":"2025-11-21T..."}
```

---

## Step 7: Update Frontend

Update your frontend's `VITE_API_BASE` environment variable to:
```
https://pixelforge.fly.dev
```

Then redeploy the frontend on Vercel.

---

## Managing Your App

### View Logs
```bash
fly logs
fly logs -a pixelforge
```

### SSH into Container
```bash
fly ssh console
```

### Restart App
```bash
fly apps restart
```

### Scale Resources (if needed)
```bash
# Scale memory
fly scale memory 512

# Scale CPU
fly scale vm shared-cpu-2x
```

### Update Secrets
```bash
# List secrets
fly secrets list

# Set a new secret
fly secrets set KEY=value

# Remove a secret
fly secrets unset KEY
```

### Monitor Resources
```bash
# Check metrics
fly dashboard metrics

# Or visit: https://fly.io/dashboard
```

---

## Troubleshooting

### Build Fails
```bash
# Check build logs
fly logs --app pixelforge

# Rebuild with verbose output
fly deploy --verbose
```

### App Crashes on Startup
```bash
# Check logs for errors
fly logs

# Common issues:
# - Missing environment variables
# - Invalid Firebase credentials
# - Redis connection issues
```

### Connection Issues
```bash
# Test Redis connection
fly ssh console -C "ping -c 3 your-upstash-endpoint"

# Check firewall rules
fly ips list
```

### Out of Memory
```bash
# Check current memory
fly scale show

# Increase memory (will use paid tier)
fly scale memory 512
```

---

## Cost Management

**Free Tier (Current Setup):**
- ✅ 1 VM with 256MB RAM = Free
- ✅ 160GB bandwidth/month = Free
- ✅ Shared CPU = Free

**To Stay Free:**
- Don't scale beyond 3 VMs total
- Keep memory at 256MB per VM
- Monitor bandwidth usage

**Check Usage:**
```bash
fly dashboard
# Then go to: https://fly.io/dashboard/<your-org>/billing
```

---

## Deployment Checklist

- [ ] Fly CLI installed
- [ ] Logged into Fly.io
- [ ] App launched (`fly launch`)
- [ ] Environment variables set (`fly secrets set`)
- [ ] App deployed (`fly deploy`)
- [ ] Health check passes (curl health endpoint)
- [ ] API accessible from browser
- [ ] Worker logs show "waiting for jobs"
- [ ] Frontend updated with new API URL
- [ ] Test job submission end-to-end

---

## Next Steps

1. **Monitor your app:**
   - Set up alerts in Fly.io dashboard
   - Check logs regularly

2. **Update CORS:**
   - Add your frontend URL to `ALLOWED_ORIGINS`

3. **Test thoroughly:**
   - Submit test jobs
   - Check image processing
   - Verify real-time updates

---

## Support

- Fly.io Docs: https://fly.io/docs
- Community: https://community.fly.io
- Status: https://status.fly.io

---

## Your App is Live! 🎉

**API URL:** `https://pixelforge.fly.dev`
**Health Check:** `https://pixelforge.fly.dev/health`

Both API and Worker are running in a single service, processing images in real-time!
