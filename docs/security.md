# Security Best Practices - PixelForge

## ✅ Issue #5: Secure Firebase Configuration

### Overview

Firebase configuration credentials have been moved from hardcoded values to environment variables to prevent accidental exposure in version control and public repositories.

### Changes Made

#### 1. **Environment Variables** (`apps/web/.env`)

All Firebase credentials are now loaded from environment variables:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

#### 2. **Updated Firebase Configuration** (`apps/web/src/lib/firebase.ts`)

- Removed hardcoded credentials
- Uses `import.meta.env.VITE_*` for all configuration values
- Added validation to check for required fields
- Graceful handling when configuration is incomplete
- Optional analytics initialization (only if measurement ID is provided)

#### 3. **Git Ignore Protection** (`.gitignore`)

Ensures sensitive files are never committed:

```
.env
.env.local
.env.production
*firebase-adminsdk*.json
packages/config/*.json
```

#### 4. **Documentation Updates** (`apps/web/README.md`)

- Added Firebase setup instructions
- Documented how to obtain credentials from Firebase Console
- Security notes about not committing `.env` files

### Security Benefits

1. **No Credential Exposure**: API keys and project IDs are not stored in source code
2. **Environment-Specific Configuration**: Different environments can use different Firebase projects
3. **Developer Safety**: `.env.example` provides template without exposing real credentials
4. **CI/CD Ready**: Secrets can be injected via environment variables in deployment pipelines

### Setup Instructions

#### For Development:

1. Copy the example environment file:

   ```bash
   cd apps/web
   cp .env.example .env
   ```

2. Get Firebase credentials:

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Click **Project Settings** (gear icon)
   - Scroll to **Your apps** section
   - Copy each value to your `.env` file

3. Never commit the `.env` file:
   ```bash
   # Verify it's ignored
   git status
   # Should not show .env file
   ```

#### For Production:

1. **Vercel/Netlify**: Add environment variables in dashboard:

   - Go to Project Settings > Environment Variables
   - Add each `VITE_FIREBASE_*` variable
   - Rebuild application

2. **Docker**: Pass environment variables via docker-compose or Dockerfile:

   ```yaml
   environment:
     - VITE_FIREBASE_API_KEY=${FIREBASE_API_KEY}
     - VITE_FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
     # ...
   ```

3. **GitHub Actions**: Use secrets:
   ```yaml
   env:
     VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
     VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
   ```

### Validation

The application now validates Firebase configuration on initialization:

```typescript
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn(
    "Firebase configuration is incomplete. Please check your environment variables."
  );
  return;
}
```

This prevents the app from attempting to initialize Firebase with invalid credentials.

### Testing

Two tests verify the security implementation:

1. **No Hardcoded Credentials**: Verifies source code doesn't contain API keys
2. **Environment Variable Usage**: Confirms configuration uses `import.meta.env`

Run tests:

```bash
pnpm --filter @fluximage/web test
```

### Additional Security Recommendations

1. **Firebase Security Rules**: Implement Firestore and Storage rules (Issue #6)
2. **API Key Restrictions**:

   - Go to Google Cloud Console
   - Restrict API key to specific domains/apps
   - Enable only required APIs

3. **Rate Limiting**: Consider implementing rate limits in Firebase rules
4. **Monitoring**: Enable Firebase Security Rules monitoring in console

### Migration from Hardcoded Config

If you previously had hardcoded credentials:

1. **Rotate API Keys** (if exposed publicly):

   - Firebase Console > Project Settings
   - Delete compromised web app
   - Create new web app with fresh credentials

2. **Update All Environments**:

   - Development: Update `.env`
   - Staging: Update deployment environment variables
   - Production: Update production environment variables

3. **Verify No Credentials in Git History**:
   ```bash
   # Search for potential leaks
   git log -S "AIzaSy" --all
   ```
   If found, consider using tools like `git-filter-repo` or BFG Repo-Cleaner

### Status

✅ **Complete** - Firebase credentials are now securely managed via environment variables

- No hardcoded credentials in source code
- Git ignore protection in place
- Documentation updated
- Tests passing
- Build successful

---

**Related Issues:**

- Issue #6: Firestore Security Rules (Pending)
