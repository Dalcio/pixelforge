# Firebase Security Rules Deployment Guide

## Overview

This guide explains how to deploy and test the Firestore and Storage security rules for PixelForge.

## Security Rules Files

### 1. **firestore.rules** - Database Security

Protects the `/jobs` collection with the following rules:

- ✅ **Read Access**: Public (allows real-time updates in web app)
- ✅ **Create**: Validates job structure, ensures `pending` status, matches document ID
- ✅ **Update**: Only allows updating specific fields (status, outputUrl, error, timestamps)
- ❌ **Delete**: Explicitly denied (jobs kept for audit/history)
- ❌ **Other Collections**: All access denied

### 2. **storage.rules** - File Storage Security

Protects the `/processed` folder:

- ✅ **Read Access**: Public (allows image downloads via URL)
- ❌ **Write Access**: Denied (only backend can upload)
- ❌ **Other Paths**: All access denied

### 3. **firebase.json** - Configuration

Links the rules files to Firebase services.

## Prerequisites

1. **Firebase CLI** installed:
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase project** created (see `docs/firebase-setup.md`)

3. **Authenticated** with Firebase:
   ```bash
   firebase login
   ```

## Deployment Steps

### Step 1: Initialize Firebase Project

If not already initialized:

```bash
# From project root
firebase init

# Select:
# - Firestore (use existing rules file)
# - Storage (use existing rules file)
# - Select your Firebase project
```

This will use the existing `firebase.json`, `firestore.rules`, and `storage.rules` files.

### Step 2: Deploy Security Rules

Deploy both Firestore and Storage rules:

```bash
firebase deploy --only firestore:rules,storage:rules
```

**Expected output:**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project/overview
```

### Step 3: Verify Deployment

1. **Firestore Rules**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Navigate to **Firestore Database** → **Rules** tab
   - Verify rules match `firestore.rules`

2. **Storage Rules**:
   - Navigate to **Storage** → **Rules** tab
   - Verify rules match `storage.rules`

## Testing Security Rules

### Test 1: Firestore - Read Access (Should Succeed)

```javascript
// From browser console on web app
const db = firebase.firestore();
const jobs = await db.collection('jobs').get();
console.log('Read access works:', jobs.size);
```

### Test 2: Firestore - Create Job (Should Succeed)

```javascript
// From backend API or using Firebase Admin SDK
const jobData = {
  id: 'test-job-123',
  inputUrl: 'https://example.com/image.jpg',
  status: 'pending',
  createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  updatedAt: firebase.firestore.FieldValue.serverTimestamp()
};

await db.collection('jobs').doc('test-job-123').set(jobData);
console.log('Job created successfully');
```

### Test 3: Firestore - Delete Job (Should Fail)

```javascript
// From browser console (should fail)
try {
  await db.collection('jobs').doc('test-job-123').delete();
  console.error('Delete should have failed!');
} catch (error) {
  console.log('Delete correctly denied:', error.code);
}
```

### Test 4: Storage - Read Image (Should Succeed)

```bash
# Public read should work
curl https://firebasestorage.googleapis.com/v0/b/your-bucket/o/processed%2Ftest.jpg?alt=media
```

### Test 5: Storage - Upload Image (Should Fail from Client)

```javascript
// From browser console (should fail)
const storage = firebase.storage();
const ref = storage.ref('processed/test.jpg');

try {
  await ref.put(new Blob(['test']));
  console.error('Upload should have failed!');
} catch (error) {
  console.log('Upload correctly denied:', error.code);
}
```

## Automated Testing with Firebase Emulator

### Step 1: Install Emulator

```bash
firebase setup:emulators:firestore
firebase setup:emulators:storage
```

### Step 2: Start Emulator

```bash
firebase emulators:start --only firestore,storage
```

### Step 3: Run Tests

Create `firestore.test.rules.spec.js`:

```javascript
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');

describe('Firestore Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-test',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test('allow read to jobs collection', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(db.collection('jobs').get());
  });

  test('deny delete on jobs', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection('jobs').doc('test').delete());
  });
});
```

Run tests:
```bash
npm test
```

## Security Rules Explanation

### Firestore Rules Breakdown

```javascript
// Helper: Validate job status
function isValidJobStatus(status) {
  return status in ['pending', 'processing', 'completed', 'failed'];
}
```
Ensures status field only contains valid values.

```javascript
// Helper: Validate job structure
function isValidJobData(data) {
  return data.keys().hasAll(['id', 'inputUrl', 'status', 'createdAt', 'updatedAt']) &&
         // ... type checks
}
```
Ensures all required fields are present with correct types.

```javascript
// Helper: Validate updates
function isValidUpdate(data) {
  let allowedFields = ['status', 'outputUrl', 'error', 'updatedAt', 'processedAt'];
  return data.diff(resource.data).affectedKeys().hasOnly(allowedFields);
}
```
Prevents modification of immutable fields (id, inputUrl, createdAt).

```javascript
// Allow creation
allow create: if isValidJobData(request.resource.data) &&
                 request.resource.data.status == 'pending' &&
                 request.resource.data.id == jobId;
```
- Validates structure
- Ensures initial status is 'pending'
- Ensures document ID matches job ID

```javascript
// Allow updates
allow update: if isValidUpdate(request.resource.data) &&
                 isValidJobStatus(request.resource.data.status) &&
                 request.resource.data.updatedAt is timestamp;
```
- Only allows updating specific fields
- Validates status values
- Requires updatedAt timestamp

```javascript
// Deny deletion
allow delete: if false;
```
Keeps jobs for audit trail.

### Storage Rules Breakdown

```javascript
match /processed/{jobId} {
  allow read: if true;   // Public read access
  allow write: if false; // No client writes
}
```
- Backend (Admin SDK) bypasses these rules
- Clients can only read, not write

## Production Considerations

### 1. Add Authentication (Optional)

For authenticated-only access:

```javascript
// Firestore
allow read: if request.auth != null;

// Storage
allow read: if request.auth != null;
```

### 2. Rate Limiting

Firebase automatically rate-limits, but consider:
- App Check for DDoS protection
- Cloud Functions with rate limiting middleware

### 3. Monitoring

Enable Firebase Security Rules monitoring:
1. Go to Firebase Console
2. Navigate to **Firestore/Storage** → **Rules** tab
3. Click **Monitor** tab
4. Review denied requests

### 4. Audit Logs

Enable audit logging in Google Cloud Console:
```bash
gcloud logging read "resource.type=cloud_firestore_database"
```

## Rollback Procedure

If rules cause issues:

### Option 1: Quick Rollback via Console

1. Go to Firebase Console → Firestore → Rules
2. Click **History** tab
3. Select previous version
4. Click **Restore**

### Option 2: Rollback via CLI

```bash
# Revert to previous commit
git checkout HEAD~1 firestore.rules storage.rules

# Deploy old rules
firebase deploy --only firestore:rules,storage:rules

# Restore current version
git checkout HEAD firestore.rules storage.rules
```

## Troubleshooting

### Error: "PERMISSION_DENIED: Missing or insufficient permissions"

**From Web App:**
- Expected if trying to delete or write to storage
- Check browser console for specific rule violation

**From Backend:**
- Ensure using Firebase Admin SDK (bypasses rules)
- Check service account has necessary permissions

### Error: "Deploy failed"

```bash
# Check syntax
firebase deploy --only firestore:rules --debug

# Validate rules locally
firebase firestore:rules --help
```

### Error: "Rules too complex"

Firebase limits rule complexity. Simplify by:
- Combining conditions
- Removing redundant checks
- Using helper functions efficiently

## Maintenance

### Regular Tasks

1. **Review Denied Requests** (Weekly):
   ```bash
   firebase firestore:rules monitor
   ```

2. **Update Rules** (As Needed):
   - Modify `firestore.rules` or `storage.rules`
   - Test locally with emulator
   - Deploy: `firebase deploy --only firestore:rules,storage:rules`

3. **Audit Security** (Monthly):
   - Review access patterns
   - Check for suspicious activity
   - Update rules based on new features

## Summary

✅ **Deployed**: `firestore.rules` and `storage.rules`
✅ **Validated**: Jobs have proper CRUD restrictions
✅ **Secured**: Storage prevents client uploads
✅ **Documented**: Clear deployment and testing procedures

**Commands Cheat Sheet:**
```bash
# Deploy rules
firebase deploy --only firestore:rules,storage:rules

# Test rules locally
firebase emulators:start --only firestore,storage

# Monitor rules
firebase firestore:rules monitor

# Rollback
# Via Console: Firestore → Rules → History → Restore
```

---

**Related Documentation:**
- `firestore.rules` - Firestore security rules
- `storage.rules` - Storage security rules
- `firebase.json` - Firebase configuration
- `docs/firebase-setup.md` - Initial Firebase setup
- `docs/security.md` - Security best practices
