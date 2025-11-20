# Firebase Security Rules - Quick Reference

## Files Overview

```
/pixelforge
  firebase.json              - Firebase config (links rules files)
  firestore.rules           - Firestore database security rules
  storage.rules             - Cloud Storage security rules
  .firebaserc.example       - Project config template
  .gitignore                - Excludes .firebaserc and .firebase/
```

## Firestore Rules Summary

### Jobs Collection (`/jobs/{jobId}`)

| Operation  | Allowed | Conditions                                        |
| ---------- | ------- | ------------------------------------------------- |
| **Read**   | ✅ Yes  | Public access (for real-time updates)             |
| **Create** | ✅ Yes  | Valid structure, status='pending', matching ID    |
| **Update** | ✅ Yes  | Only specific fields, valid status, has timestamp |
| **Delete** | ❌ No   | Jobs kept for audit trail                         |

### Allowed Update Fields

- `status` (must be valid: pending/processing/completed/failed)
- `outputUrl` (string, optional)
- `error` (string, optional)
- `updatedAt` (timestamp, required)
- `processedAt` (timestamp, optional)

### Immutable Fields

- `id` - Cannot be changed after creation
- `inputUrl` - Cannot be changed after creation
- `createdAt` - Cannot be changed after creation

## Storage Rules Summary

### Processed Images (`/processed/{jobId}`)

| Operation | Allowed | Notes                                   |
| --------- | ------- | --------------------------------------- |
| **Read**  | ✅ Yes  | Public access for downloads             |
| **Write** | ❌ No   | Backend only (Admin SDK bypasses rules) |

## Deployment Commands

```bash
# Install Firebase CLI (once)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (first time)
firebase init
# Select: Firestore, Storage
# Use existing rules files

# Deploy all rules
firebase deploy --only firestore:rules,storage:rules

# Deploy Firestore only
firebase deploy --only firestore:rules

# Deploy Storage only
firebase deploy --only storage:rules

# Test locally with emulator
firebase emulators:start --only firestore,storage
```

## Configuration Setup

1. Copy example file:

   ```bash
   cp .firebaserc.example .firebaserc
   ```

2. Edit `.firebaserc` with your project ID:

   ```json
   {
     "projects": {
       "default": "your-firebase-project-id"
     }
   }
   ```

3. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

## Validation

### Test in Firebase Console

1. **Firestore**:

   - Go to: https://console.firebase.google.com
   - Navigate: Firestore Database → Rules tab
   - Verify rules match `firestore.rules`
   - Check "Rules Playground" for testing

2. **Storage**:
   - Navigate: Storage → Rules tab
   - Verify rules match `storage.rules`

### Test with Code

**Firestore - Read (Should Succeed):**

```javascript
const db = firebase.firestore();
const jobs = await db.collection("jobs").get();
console.log(`✅ Read ${jobs.size} jobs`);
```

**Firestore - Delete (Should Fail):**

```javascript
try {
  await db.collection("jobs").doc("test-id").delete();
  console.error("❌ Delete should have failed!");
} catch (error) {
  console.log("✅ Delete correctly denied:", error.code);
}
```

**Storage - Read (Should Succeed):**

```bash
curl https://firebasestorage.googleapis.com/v0/b/your-bucket/o/processed%2Ftest.jpg?alt=media
```

**Storage - Upload from Client (Should Fail):**

```javascript
const storage = firebase.storage();
try {
  await storage.ref("processed/test.jpg").put(blob);
  console.error("❌ Upload should have failed!");
} catch (error) {
  console.log("✅ Upload correctly denied:", error.code);
}
```

## Monitoring

### View Denied Requests

**Firebase Console:**

1. Firestore → Rules → Monitor tab
2. Storage → Rules → Monitor tab
3. Review denied requests and reasons

**Cloud Logging:**

```bash
# Firestore logs
gcloud logging read "resource.type=cloud_firestore_database" --limit 50

# Storage logs
gcloud logging read "resource.type=gcs_bucket" --limit 50
```

## Troubleshooting

### Issue: "PERMISSION_DENIED"

**From Web App (Expected):**

- ✅ Normal if trying to delete jobs
- ✅ Normal if trying to upload to storage
- ❌ Unexpected if trying to read jobs → Check rules

**From Backend (Unexpected):**

- Check using Firebase Admin SDK (bypasses rules)
- Verify service account has proper permissions

### Issue: "Deploy Failed"

```bash
# Check syntax
firebase deploy --only firestore:rules --debug

# Validate rules file
cat firestore.rules  # Check for syntax errors
```

### Issue: "Project Not Found"

```bash
# List projects
firebase projects:list

# Add/switch project
firebase use your-project-id
```

## Rollback

### Via Console (Fastest)

1. Firestore → Rules → History tab
2. Select previous version
3. Click "Restore"

### Via Git

```bash
# Revert rules files
git checkout HEAD~1 firestore.rules storage.rules

# Deploy old version
firebase deploy --only firestore:rules,storage:rules

# Restore latest
git checkout HEAD firestore.rules storage.rules
```

## Security Best Practices

### ✅ Do's

- Deploy rules before going to production
- Monitor denied requests regularly
- Test rules with emulator before deploying
- Keep rules under version control
- Use helper functions for complex logic
- Document rule changes in commit messages

### ❌ Don'ts

- Don't use `allow read, write: if true;` in production
- Don't expose sensitive data in rule errors
- Don't make rules too complex (performance impact)
- Don't skip testing after rule changes
- Don't commit `.firebaserc` to public repos

## Production Checklist

- [ ] Rules deployed to Firestore
- [ ] Rules deployed to Storage
- [ ] Tested read access (works)
- [ ] Tested delete access (denied)
- [ ] Tested client storage upload (denied)
- [ ] Backend can write (Admin SDK)
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Documentation updated

## Related Documentation

- **Full Guide**: [docs/firestore-security-rules.md](firestore-security-rules.md)
- **Firebase Setup**: [docs/firebase-setup.md](firebase-setup.md)
- **Security**: [docs/security.md](security.md)

## Quick Links

- [Firebase Console](https://console.firebase.google.com)
- [Firestore Rules Reference](https://firebase.google.com/docs/firestore/security/rules-structure)
- [Storage Rules Reference](https://firebase.google.com/docs/storage/security)
- [Rules Playground](https://firebase.google.com/docs/rules/simulator)
