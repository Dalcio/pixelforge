# PixelForge

> **Real-time Image Processing System** — A production-ready, cloud-based image transformation service built with modern web technologies.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🚀 Features

- ✅ **Real-time Progress Tracking** — Live updates via Firestore onSnapshot
- 🎨 **Image Transformations** — Resize, rotate, flip, blur, sharpen, grayscale, quality adjustment
- ⚡ **Background Processing** — Asynchronous job queue with BullMQ
- 🔒 **Security** — CORS whitelist, rate limiting, Firebase rules
- 📊 **Monitoring** — Comprehensive logging and health checks
- 🧪 **Fully Tested** — Unit, integration, and E2E test coverage
- 🎯 **Production Ready** — Deployed on free-tier infrastructure

---

## 📋 Table of Contents

- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Local Development](#-local-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

---

## 🏗️ Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   API       │─────▶│   Worker    │
│   (React)   │      │  (Express)  │      │  (BullMQ)   │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │                     │
       │                    │                     │
       ▼                    ▼                     ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Firestore  │      │   Redis     │      │   Storage   │
│  (Database) │      │   (Queue)   │      │  (Images)   │
└─────────────┘      └─────────────┘      └─────────────┘
```

### **Components**

- **Frontend** (Vite + React + TypeScript + Tailwind CSS)
  - Real-time job monitoring via Firestore
  - Beautiful, responsive UI
  - Image transformation controls

- **API** (Express + TypeScript)
  - RESTful endpoints
  - Request validation (Joi)
  - Rate limiting & CORS
  - Job management

- **Worker** (BullMQ + Sharp)
  - Background image processing
  - Progress tracking (0% → 100%)
  - Error handling & retry logic

- **Infrastructure**
  - **Database**: Firebase Firestore
  - **Queue**: Redis (Upstash)
  - **Storage**: Firebase Storage
  - **Hosting**: Render (API), Vercel (Frontend)

---

## 📦 Prerequisites

Ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (`npm install -g pnpm`)
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Git** ([Download](https://git-scm.com/))

### **Accounts Required**

- [Firebase Account](https://firebase.google.com/) (free tier)
- [Upstash Account](https://upstash.com/) (free Redis)
- [Render Account](https://render.com/) (free tier)
- [Vercel Account](https://vercel.com/) (free tier)

---

## 🔧 Installation

### **1. Clone the Repository**

```bash
git clone https://github.com/Dalcio/pixelforge.git
cd pixelforge
```

### **2. Install Dependencies**

```bash
pnpm install
```

This will install all packages in the monorepo using pnpm workspaces.

---

## 🔐 Environment Variables

### **Required Environment Variables**

Create the following `.env` files based on the `.env.example` templates:

#### **Root `.env`** (Optional - for local Redis)
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### **API `.env`** (`apps/api/.env`)
```env
# Server
NODE_ENV=development
PORT=3000

# CORS (comma-separated origins)
ALLOWED_ORIGINS=http://localhost:5173

# Redis (use ONE of these)
UPSTASH_REDIS_URL=your_upstash_redis_url
# OR for local Redis:
# REDIS_HOST=localhost
# REDIS_PORT=6379

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
```

#### **Web `.env`** (`apps/web/.env`)
```env
# API endpoint
VITE_API_BASE=http://localhost:3000

# Firebase Web Config
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### **Getting Firebase Credentials**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. **For Admin SDK** (API):
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download JSON file
   - Extract values for `.env`
4. **For Web SDK** (Frontend):
   - Go to Project Settings → General
   - Under "Your apps", add a Web app
   - Copy the config values to `.env`

### **Getting Upstash Redis URL**

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database (select free tier)
3. Copy the connection string to `UPSTASH_REDIS_URL`

---

## 💻 Local Development

### **Option 1: Start All Services Together**

```bash
pnpm dev
```

This starts:
- API server on `http://localhost:3000`
- Worker (automatically started with API)
- Frontend on `http://localhost:5173`

### **Option 2: Start Services Individually**

```bash
# Terminal 1: API + Worker
pnpm api:dev

# Terminal 2: Frontend
pnpm web:dev
```

### **Local Redis (Optional)**

If not using Upstash, start local Redis:

```bash
# Windows (using included redis-server)
cd redis
redis-server.exe redis.windows.conf

# macOS/Linux
redis-server
```

### **Verify Services**

- **API Health**: http://localhost:3000/health
- **Frontend**: http://localhost:5173

---

## 🧪 Testing

### **Run All Tests**

```bash
pnpm test
```

### **Run Tests by Package**

```bash
pnpm test:api      # API tests
pnpm test:utils    # Utility tests
pnpm test:web      # Frontend tests
```

### **Watch Mode**

```bash
cd apps/api
pnpm test:watch
```

### **Test Coverage**

- ✅ E2E job lifecycle tests
- ✅ Rate limiting tests
- ✅ CORS configuration tests
- ✅ Input validation tests
- ✅ Error handling tests
- ✅ Redis connection tests

---

## 🚀 Deployment

### **1. Deploy Firebase Services**

```bash
# Login to Firebase
firebase login

# Deploy Firestore rules and indexes
cd firebase
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### **2. Deploy API + Worker to Render**

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Use these settings:
   - **Name**: `pixelforge-api`
   - **Build Command**: `npm install -g pnpm && pnpm install --frozen-lockfile && bash scripts/build-api.sh`
   - **Start Command**: `cd apps/api && node dist/server.js`
   - **Environment**: Add all API environment variables from `.env`
6. Deploy

### **3. Deploy Frontend to Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd apps/web
vercel --prod
```

Or use Vercel GitHub integration for automatic deployments.

### **4. Update Environment Variables**

After deployment, update:

- **API**: `ALLOWED_ORIGINS` (add production frontend URL)
- **Web**: `VITE_API_BASE` (use production API URL)

### **Production URLs**

- **API**: `https://pixelforge-api.onrender.com`
- **Frontend**: `https://pixelforge.vercel.app`

---

## 📚 API Documentation

### **Base URL**: `http://localhost:3000/api`

### **Endpoints**

#### **1. Create Job**
```http
POST /api/jobs
Content-Type: application/json

{
  "inputUrl": "https://example.com/image.jpg",
  "transformations": {
    "width": 800,
    "height": 600,
    "grayscale": true,
    "quality": 85
  }
}
```

**Response (201)**:
```json
{
  "id": "abc123",
  "status": "pending"
}
```

#### **2. Get Job Status**
```http
GET /api/jobs/:id
```

**Response (200)**:
```json
{
  "id": "abc123",
  "status": "completed",
  "progress": 100,
  "inputUrl": "https://example.com/image.jpg",
  "outputUrl": "https://storage.googleapis.com/...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:01:00.000Z"
}
```

#### **3. List Jobs**
```http
GET /api/jobs
```

**Response (200)**:
```json
{
  "jobs": [...],
  "total": 10
}
```

#### **4. Retry Failed Job**
```http
PUT /api/jobs/:id/retry
```

#### **5. Delete Job**
```http
DELETE /api/jobs/:id
```

#### **6. Health Check**
```http
GET /health
```

### **Transformation Options**

| Option | Type | Range | Description |
|--------|------|-------|-------------|
| `width` | number | 1-4000 | Target width in pixels |
| `height` | number | 1-4000 | Target height in pixels |
| `grayscale` | boolean | - | Convert to grayscale |
| `blur` | number | 0-10 | Blur amount |
| `sharpen` | boolean | - | Apply sharpening |
| `rotate` | number | 0, 90, 180, 270 | Rotation angle |
| `flip` | boolean | - | Flip vertically |
| `flop` | boolean | - | Flip horizontally |
| `quality` | number | 1-100 | JPEG quality |

### **Error Codes**

- `400` — Bad Request (invalid input)
- `404` — Job not found
- `413` — Payload too large (>1MB)
- `429` — Too many requests (rate limit)
- `500` — Internal server error
- `503` — Service unavailable (Redis down)

---

## 📁 Project Structure

```
pixelforge/
├── apps/
│   ├── api/                 # Express API + Worker
│   │   ├── src/
│   │   │   ├── controllers/ # Route handlers
│   │   │   ├── middlewares/ # CORS, rate limiting, errors
│   │   │   ├── routes/      # API routes
│   │   │   ├── services/    # Business logic
│   │   │   ├── validators/  # Input validation
│   │   │   ├── worker/      # Image processor
│   │   │   ├── lib/         # Redis, Firestore clients
│   │   │   └── server.ts    # Entry point
│   │   └── package.json
│   │
│   └── web/                 # React frontend
│       ├── src/
│       │   ├── components/  # UI components
│       │   ├── hooks/       # Custom React hooks
│       │   ├── lib/         # API client, Firebase
│       │   ├── pages/       # Page components
│       │   └── styles/      # Tailwind CSS
│       └── package.json
│
├── packages/
│   ├── types/               # Shared TypeScript types
│   ├── utils/               # Shared utilities
│   └── config/              # Shared configuration
│
├── firebase/
│   ├── firestore.rules      # Firestore security rules
│   ├── firestore.indexes.json
│   └── storage.rules        # Storage security rules
│
├── scripts/                 # Build & dev scripts
├── render.yaml              # Render deployment config
├── vercel.json              # Vercel deployment config
└── pnpm-workspace.yaml      # Monorepo configuration
```

---

## 🔒 Security

### **Implemented Measures**

- ✅ **CORS Whitelist** — Environment-based origin control
- ✅ **Rate Limiting** — 100 requests per 15 minutes per IP
- ✅ **Input Validation** — Joi schemas for all inputs
- ✅ **File Size Limits** — 10MB max image size
- ✅ **Firebase Rules** — Strict read/write permissions
- ✅ **URL Validation** — Prevents SSRF attacks
- ✅ **Error Sanitization** — No sensitive data in responses

### **Best Practices**

- Never commit `.env` files
- Use service accounts with minimal permissions
- Rotate Firebase private keys regularly
- Monitor rate limit violations
- Keep dependencies updated

---

## 🐛 Troubleshooting

### **"Redis connection failed"**
- Check `UPSTASH_REDIS_URL` or `REDIS_HOST` in `.env`
- Verify Upstash database is active
- For local Redis, ensure `redis-server` is running

### **"Firebase not initialized"**
- Verify all `FIREBASE_*` variables are set
- Check Firebase service account JSON is valid
- Ensure Firestore and Storage are enabled in Firebase Console

### **"CORS error"**
- Add your frontend URL to `ALLOWED_ORIGINS`
- Format: `http://localhost:5173,https://yourdomain.com`

### **"Rate limit exceeded"**
- Wait 15 minutes or adjust limits in `rate-limiter.ts`
- Health check endpoint (`/health`) is exempt

### **"Job stuck in pending"**
- Check worker logs for errors
- Verify Redis queue is processing
- Restart API server

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**

- Follow TypeScript strict mode
- Write tests for new features
- Use conventional commit messages
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Sharp](https://sharp.pixelplumbing.com/) — High-performance image processing
- [BullMQ](https://docs.bullmq.io/) — Robust job queue
- [Firebase](https://firebase.google.com/) — Backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) — Beautiful UI design

---

## 📞 Support

- **Documentation**: [View Full Docs](https://github.com/Dalcio/pixelforge/wiki)
- **Issues**: [Report a Bug](https://github.com/Dalcio/pixelforge/issues)
- **Discussions**: [Community Forum](https://github.com/Dalcio/pixelforge/discussions)

---

**Made with ❤️ by [Dalcio](https://github.com/Dalcio)**
