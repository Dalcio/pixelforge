# Redis Setup Guide

## Overview

PixelForge uses Redis as the queue backend for BullMQ, enabling reliable job processing with persistence, retries, and concurrency control.

**Auto-start Feature**: When running `pnpm dev`, `pnpm api:dev`, or `pnpm worker:dev`, Redis automatically starts if not already running on Windows, macOS, and Linux.

## Quick Start (Development)

For local development, the easiest approach:

1. **Install Redis** (see Option 5 below for your platform)
2. **Run PixelForge**:
   ```bash
   pnpm dev    # Redis auto-starts, then all services launch
   ```

That's it! Redis will automatically start and stay running in the background.

## Option 1: Upstash (Recommended for Production)

Upstash provides serverless Redis with a generous free tier, perfect for production deployments.

### Why Upstash?

- **Serverless**: No server management
- **Free tier**: 10,000 commands/day
- **Global**: Low latency worldwide
- **Durable**: Data persistence included
- **HTTPS support**: REST API fallback

### Setup Steps

1. **Create Account**

   - Go to [upstash.com](https://upstash.com/)
   - Sign up with GitHub or email

2. **Create Redis Database**

   - Click **Create Database**
   - Name: `fluximage-queue`
   - Type: **Regional** (choose closest region)
   - Primary region: Select your region
   - Click **Create**

3. **Get Connection Details**

   In your database dashboard, find:

   ```
   Endpoint: redis-12345.upstash.io
   Port: 6379 (or 38943 for TLS)
   Password: AYFxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. **Configure Environment Variables**

   In `apps/api/.env` and `apps/worker/.env`:

   ```bash
   REDIS_HOST=redis-12345.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=AYFxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

   **For TLS** (recommended):

   ```bash
   REDIS_HOST=redis-12345.upstash.io
   REDIS_PORT=38943
   REDIS_PASSWORD=AYFxxxxxxxxxxxxxxxxxxxxxxxxxx
   REDIS_TLS=true
   ```

5. **Update Redis Client (if using TLS)**

   In `apps/api/src/lib/redis-client.ts` and `apps/worker/src/lib/redis-client.ts`:

   ```typescript
   export const getRedisClient = (): Redis => {
     if (redisClient) {
       return redisClient;
     }

     const host = process.env.REDIS_HOST || "localhost";
     const port = parseInt(process.env.REDIS_PORT || "6379", 10);
     const password = process.env.REDIS_PASSWORD;
     const useTls = process.env.REDIS_TLS === "true";

     redisClient = new Redis({
       host,
       port,
       password: password || undefined,
       maxRetriesPerRequest: null,
       tls: useTls ? {} : undefined,
     });

     return redisClient;
   };
   ```

### Upstash Free Tier Limits

- **10,000 commands/day**
- **256 MB storage**
- **100 concurrent connections**
- **1 database**

**Estimated capacity**: ~500-1000 jobs/day (depending on job complexity)

### Upstash Pricing (Paid Tier)

- **$0.20 per 100K commands**
- **$0.25/GB storage**
- **Pay as you go**

## Option 2: Railway (Free Tier)

Railway provides Redis with PostgreSQL-like simplicity and a free tier.

### Setup Steps

1. **Create Account**

   - Go to [railway.app](https://railway.app/)
   - Sign up with GitHub

2. **Create New Project**

   - Click **New Project**
   - Select **Provision Redis**

3. **Get Connection Details**

   In Railway dashboard:

   - Click on Redis service
   - Go to **Variables** tab
   - Copy `REDIS_URL`

   Format: `redis://default:password@host:port`

4. **Parse Connection String**

   ```
   REDIS_URL=redis://default:abc123xyz@redis.railway.internal:6379

   Extract:
   REDIS_HOST=redis.railway.internal
   REDIS_PORT=6379
   REDIS_PASSWORD=abc123xyz
   ```

5. **Configure .env**

   ```bash
   REDIS_HOST=redis.railway.internal
   REDIS_PORT=6379
   REDIS_PASSWORD=abc123xyz
   ```

### Railway Free Tier Limits

- **$5/month free credit**
- **512 MB memory**
- **1 GB storage**
- **100 GB egress**

**Note**: Free tier may not be available in all regions. Check Railway pricing.

## Option 3: Redis Cloud (Managed)

Redis Cloud (by Redis Labs) offers enterprise-grade Redis.

### Setup Steps

1. Go to [redis.com/cloud](https://redis.com/try-free/)
2. Create free account
3. Create database (30MB free)
4. Get connection details
5. Configure .env as above

### Free Tier

- **30 MB storage**
- **30 connections**
- **High availability**

## Option 4: Local Development (Docker)

For local development only, use Docker.

### Docker Compose

Create `docker-compose.yml` in project root:

```yaml
version: "3.8"

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

### Start Redis

```bash
docker-compose up -d
```

### Configure .env (Local)

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Stop Redis

```bash
docker-compose down
```

## Option 5: Local Installation

### Windows (Native)

PixelForge includes Redis 5.0.14.1 for Windows in the `redis/` folder.

**Auto-start (Recommended)**:
Redis automatically starts when you run:

```bash
pnpm dev          # Starts all services + Redis
pnpm api:dev      # Starts API + Redis
pnpm worker:dev   # Starts Worker + Redis
```

**Manual start**:

```bash
cd redis
redis-server.exe
```

**Alternative: Download Latest**

1. Download Redis for Windows from:

   - [Microsoft Archive](https://github.com/microsoftarchive/redis/releases)
   - [tporadowski/redis](https://github.com/tporadowski/redis/releases) (unofficial, newer versions)

2. Extract to `redis/` folder or any location

3. Run:
   ```bash
   redis-server.exe
   ```

**Using Redis as Windows Service**:

```bash
# Install service
redis-server.exe --service-install redis.windows.conf

# Start service
redis-server.exe --service-start

# Stop service
redis-server.exe --service-stop

# Uninstall service
redis-server.exe --service-uninstall
```

### macOS (Homebrew)

**Install Redis**:

```bash
brew install redis
```

**Start Redis**:

```bash
# Start now and on login
brew services start redis

# Or start once (stops on exit)
redis-server /opt/homebrew/etc/redis.conf
```

**Auto-start with PixelForge**:
Redis automatically starts when you run:

```bash
pnpm dev          # Starts all services + Redis
pnpm api:dev      # Starts API + Redis
pnpm worker:dev   # Starts Worker + Redis
```

**Stop Redis**:

```bash
brew services stop redis
```

**Check Status**:

```bash
brew services info redis
```

### Linux (Ubuntu/Debian)

**Install Redis**:

```bash
sudo apt update
sudo apt install redis-server
```

**Configure Redis**:
Edit `/etc/redis/redis.conf`:

```bash
sudo nano /etc/redis/redis.conf
```

Set supervised mode:

```
supervised systemd
```

**Start Redis**:

```bash
sudo systemctl start redis-server

# Enable on boot
sudo systemctl enable redis-server
```

**Auto-start with PixelForge**:
Redis automatically starts when you run:

```bash
pnpm dev          # Starts all services + Redis
pnpm api:dev      # Starts API + Redis
pnpm worker:dev   # Starts Worker + Redis
```

**Check Status**:

```bash
sudo systemctl status redis-server
```

**Stop Redis**:

```bash
sudo systemctl stop redis-server
```

### Linux (CentOS/RHEL/Fedora)

**Install Redis**:

```bash
# CentOS/RHEL 8+
sudo dnf install redis

# CentOS/RHEL 7
sudo yum install redis

# Fedora
sudo dnf install redis
```

**Start Redis**:

```bash
sudo systemctl start redis

# Enable on boot
sudo systemctl enable redis
```

**Auto-start with PixelForge**:

```bash
pnpm dev          # Starts all services + Redis
pnpm api:dev      # Starts API + Redis
pnpm worker:dev   # Starts Worker + Redis
```

### Linux (Arch Linux)

**Install Redis**:

```bash
sudo pacman -S redis
```

**Start Redis**:

```bash
sudo systemctl start redis

# Enable on boot
sudo systemctl enable redis
```

### Configure .env (All Platforms - Local)

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Testing Redis Connection

### Using Redis CLI

```bash
# If using password
redis-cli -h your-host -p your-port -a your-password

# Test connection
> PING
PONG

# Set a key
> SET test "hello"
OK

# Get a key
> GET test
"hello"
```

### Using Node.js

Create `test-redis.js`:

```javascript
const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

redis.ping((err, result) => {
  if (err) {
    console.error("Redis connection failed:", err);
  } else {
    console.log("Redis connected:", result);
  }
  redis.disconnect();
});
```

Run:

```bash
node test-redis.js
```

## BullMQ Queue Configuration

FluxImage uses BullMQ for job management. Redis configuration is automatically used by BullMQ.

### Queue Features

- **Persistence**: Jobs survive Redis restarts
- **Retries**: Automatic retry with exponential backoff
- **Concurrency**: 5 jobs processed simultaneously
- **Priority**: Jobs can be prioritized
- **Delayed jobs**: Schedule jobs for future execution

### Monitoring Queues

Install BullMQ dashboard:

```bash
pnpm add @bull-board/api @bull-board/express
```

Add to API (optional):

```typescript
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(getQueue())],
  serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());
```

Access at: `http://localhost:3000/admin/queues`

## Production Considerations

### 1. Connection Pooling

Redis client auto-manages connections, but for high load:

```typescript
const redisClient = new Redis({
  // ... existing config
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});
```

### 2. Persistence Configuration

Ensure Redis has persistence enabled:

```bash
# redis.conf
appendonly yes
appendfsync everysec
```

### 3. Memory Management

Set max memory and eviction policy:

```bash
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### 4. Monitoring

Monitor key metrics:

- **Memory usage**
- **Commands/sec**
- **Queue length**
- **Failed jobs**

### 5. Backup Strategy

For critical data:

- Enable RDB snapshots
- Use AOF persistence
- Regular backups (if self-hosted)

## Troubleshooting

### Error: "ECONNREFUSED"

**Cause**: Can't connect to Redis

**Solution**:

- Check REDIS_HOST and REDIS_PORT
- Ensure Redis is running
- Check firewall rules

### Error: "NOAUTH Authentication required"

**Cause**: Password not provided

**Solution**: Set REDIS_PASSWORD in .env

### Error: "ERR max number of clients reached"

**Cause**: Too many connections

**Solution**:

- Increase max clients in Redis config
- Fix connection leaks
- Use connection pooling

### Error: "OOM command not allowed"

**Cause**: Redis out of memory

**Solution**:

- Increase maxmemory
- Clear old jobs
- Set eviction policy

## Capacity Planning

### Job Size Estimation

Typical job payload:

```json
{
  "jobId": "1699999999999-abc123def",
  "inputUrl": "https://example.com/image.jpg"
}
```

~150 bytes per job

### Queue Depth

For 1000 pending jobs:

- **Payload**: 150 KB
- **BullMQ overhead**: ~50 KB
- **Total**: ~200 KB

### Commands per Job

Estimated commands per job lifecycle:

- **Enqueue**: 5 commands
- **Processing**: 10 commands
- **Completion**: 5 commands
- **Total**: ~20 commands/job

**10,000 commands/day = ~500 jobs/day on free tier**

## Summary Checklist

- [ ] Choose Redis provider (Upstash recommended)
- [ ] Create Redis instance
- [ ] Get connection credentials
- [ ] Configure .env for API
- [ ] Configure .env for Worker
- [ ] Test Redis connection
- [ ] Verify BullMQ integration
- [ ] Set up monitoring (optional)
- [ ] Configure persistence (production)
- [ ] Set up alerts (production)
