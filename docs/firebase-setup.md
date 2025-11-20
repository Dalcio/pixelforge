# Firebase Setup Guide

## Overview

FluxImage uses Firebase for two services:
- **Firestore**: Real-time database for job state
- **Storage**: File storage for processed images

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Enter project name: `fluximage` (or your choice)
4. Disable Google Analytics (optional)
5. Click **Create project**

## Step 2: Enable Firestore

1. In Firebase Console, navigate to **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (we'll add rules later)
4. Select a location (choose closest to your users)
5. Click **Enable**

### Firestore Structure

FluxImage uses a simple collection structure:

```
/jobs (collection)
  /{jobId} (document)
    - id: string
    - inputUrl: string
    - outputUrl: string (optional)
    - status: "pending" | "processing" | "completed" | "failed"
    - error: string (optional)
    - createdAt: timestamp
    - updatedAt: timestamp
    - processedAt: timestamp (optional)
```

### Firestore Security Rules (Development)

1. In Firestore, go to **Rules** tab
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobs/{jobId} {
      // Allow read for all (real-time updates)
      allow read: if true;
      
      // Allow write only from backend (server-side)
      // In production, use Firebase Auth or API keys
      allow write: if true;
    }
  }
}
```

3. Click **Publish**

**Note**: For production, implement proper authentication.

### Firestore Indexes

Create composite index for query optimization:

1. Go to **Indexes** tab
2. Click **Add index**
3. Collection: `jobs`
4. Fields:
   - `createdAt` - Descending
   - `status` - Ascending (optional)
5. Click **Create**

Or wait for Firestore to suggest indexes based on queries.

## Step 3: Enable Storage

1. In Firebase Console, navigate to **Build** → **Storage**
2. Click **Get started**
3. Choose **Start in production mode**
4. Use same location as Firestore
5. Click **Done**

### Storage Structure

Processed images are stored in:

```
/processed
  /{jobId}.jpg
```

### Storage Security Rules (Development)

1. In Storage, go to **Rules** tab
2. Replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /processed/{allPaths=**} {
      // Allow read for all (public URLs)
      allow read: if true;
      
      // Allow write only from backend
      allow write: if true;
    }
  }
}
```

3. Click **Publish**

## Step 4: Backend Service Account (API + Worker)

### Generate Private Key

1. Go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Click **Generate key**
4. Download JSON file (keep it **secure**, don't commit to git)

### Extract Environment Variables

From the downloaded JSON file, extract:

```json
{
  "project_id": "your-project-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
}
```

### Backend .env Configuration

Create `.env` files in `apps/api/` and `apps/worker/`:

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Storage bucket (for worker only)
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

**Important**: 
- Keep private key in quotes
- Use `\n` for newlines
- Never commit `.env` to git

## Step 5: Frontend Web SDK Configuration

### Get Web App Credentials

1. In Firebase Console, go to **Project Settings**
2. Scroll to **Your apps**
3. Click **Add app** → **Web** (</> icon)
4. Register app name: `fluximage-web`
5. **Don't** check "Firebase Hosting"
6. Click **Register app**

### Copy Config Object

You'll see:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

### Frontend .env Configuration

Create `.env` in `apps/web/`:

```bash
VITE_API_URL=http://localhost:3000/api

VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

**Note**: These are **public** variables (safe to expose in frontend).

## Step 6: Test Firebase Connection

### Test Backend (API)

```bash
cd apps/api
pnpm install
pnpm dev
```

Check logs for:
```
✓ Firebase initialized successfully
```

### Test Frontend

```bash
cd apps/web
pnpm install
pnpm dev
```

Open browser console, should see no Firebase errors.

## Production Considerations

### 1. Firestore Security Rules

Implement proper authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobs/{jobId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      request.auth.token.admin == true;
    }
  }
}
```

### 2. Storage CORS Configuration

Add CORS policy for public access:

```json
[
  {
    "origin": ["https://yourdomain.com"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

Apply with `gsutil`:
```bash
gsutil cors set cors.json gs://your-bucket.appspot.com
```

### 3. Budget Alerts

Set up billing alerts:
1. Go to **Usage and billing**
2. Set budget alerts
3. Monitor Firestore reads/writes
4. Monitor Storage bandwidth

### 4. Firestore Limits

Free tier (Spark):
- 50K reads/day
- 20K writes/day
- 1GB storage

Paid tier (Blaze):
- Pay as you go
- First 50K reads free/day
- $0.06 per 100K reads after

### 5. Storage Costs

- Storage: $0.026/GB/month
- Downloads: $0.12/GB
- Uploads: Free

## Troubleshooting

### Error: "Permission denied"

**Cause**: Security rules blocking access

**Solution**: Check Firestore/Storage rules, ensure backend has admin permissions

### Error: "Invalid private key"

**Cause**: Malformed private key in .env

**Solution**: 
- Ensure newlines are `\n`
- Wrap in quotes
- No extra spaces

### Error: "Cannot find module 'firebase-admin'"

**Cause**: Dependencies not installed

**Solution**:
```bash
pnpm install
```

### Error: "Quota exceeded"

**Cause**: Free tier limits reached

**Solution**: Upgrade to Blaze plan or optimize queries

## Summary Checklist

- [ ] Create Firebase project
- [ ] Enable Firestore
- [ ] Set Firestore security rules
- [ ] Enable Storage
- [ ] Set Storage security rules
- [ ] Generate service account key
- [ ] Configure backend .env (API + Worker)
- [ ] Register web app
- [ ] Configure frontend .env
- [ ] Test connections
- [ ] Set up production security rules
- [ ] Configure billing alerts
