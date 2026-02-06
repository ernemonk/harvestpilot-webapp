# Web App Secrets Injection Guide

## Overview

This guide explains how HarvestPilot Webapp ensures Firebase configuration secrets are securely injected during the build and deployment process.

## Secrets Required

All secrets are stored in GitHub Actions and injected during the build process:

### Firebase Configuration Secrets

| Secret Name | Example | Description |
|-------------|---------|-------------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyDrt4k...` | Firebase API key for web authentication |
| `VITE_FIREBASE_AUTH_DOMAIN` | `harvest-hub-2025.firebaseapp.com` | Firebase authentication domain |
| `VITE_FIREBASE_PROJECT_ID` | `harvest-hub-2025` | Firebase project identifier |
| `VITE_FIREBASE_STORAGE_BUCKET` | `harvest-hub-2025.firebasestorage.app` | Firebase Cloud Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `100818252456` | Firebase Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | `1:100818252456:web:ce249fddcf...` | Firebase web app identifier |
| `VITE_APP_URL` | `https://harvest-hub.app` | Application URL for CORS and redirects |
| `FIREBASE_KEY_JSON` | `{...}` | Firebase service account (for deployment) |
| `VERCEL_TOKEN` | (if using Vercel) | Vercel deployment token |

## Build Process

### GitHub Actions Workflow

The workflow in `.github/workflows/deploy-firebase.yml` injects secrets:

```yaml
- name: Build application
  run: npm run build
  env:
    VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
    VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
    VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
    VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
    VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
    VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
    VITE_APP_URL: ${{ secrets.VITE_APP_URL }}
```

### Build-Time Injection

Vite reads environment variables prefixed with `VITE_` and embeds them in the bundle:

```typescript
// src/config/firebase.ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
```

### Deployment

After build, the application is deployed to Firebase Hosting:

```yaml
- name: Deploy to Firebase Hosting
  uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    repoToken: ${{ secrets.GITHUB_TOKEN }}
    firebaseServiceAccount: ${{ secrets.FIREBASE_KEY_JSON }}
    channelId: live
    projectId: harvest-hub-2025
```

## Setup Instructions

### 1. Add GitHub Secrets

For **harvestpilot-webapp** repository:

```bash
# Set each secret individually
gh secret set VITE_FIREBASE_API_KEY --body "YOUR_API_KEY" -R ernemonk/harvestpilot-webapp
gh secret set VITE_FIREBASE_AUTH_DOMAIN --body "YOUR_AUTH_DOMAIN" -R ernemonk/harvestpilot-webapp
gh secret set VITE_FIREBASE_PROJECT_ID --body "YOUR_PROJECT_ID" -R ernemonk/harvestpilot-webapp
gh secret set VITE_FIREBASE_STORAGE_BUCKET --body "YOUR_STORAGE_BUCKET" -R ernemonk/harvestpilot-webapp
gh secret set VITE_FIREBASE_MESSAGING_SENDER_ID --body "YOUR_SENDER_ID" -R ernemonk/harvestpilot-webapp
gh secret set VITE_FIREBASE_APP_ID --body "YOUR_APP_ID" -R ernemonk/harvestpilot-webapp
gh secret set VITE_APP_URL --body "https://harvest-hub.app" -R ernemonk/harvestpilot-webapp
gh secret set FIREBASE_KEY_JSON --body "$(cat firebase-key.json)" -R ernemonk/harvestpilot-webapp
```

Or create from `.env` file:

```bash
# Copy from .env file
gh secret set VITE_FIREBASE_API_KEY < .env
```

### 2. Get Firebase Configuration

Get values from Firebase Console:

1. Go to: https://console.firebase.google.com/
2. Select project: `Harvest Hub 2025`
3. Go to: Project Settings (gear icon)
4. Copy values from "Web API Key", "Auth Domain", etc.
5. For service account: Download JSON from Service Accounts tab

### 3. Verify Secrets Are Set

```bash
gh secret list -R ernemonk/harvestpilot-webapp
```

Should show all `VITE_*` secrets.

## Local Development

For local development, create `.env.local`:

```bash
# Copy from .env.example
cp .env.example .env.local

# Edit with your Firebase values
# DO NOT commit .env.local to Git
```

**Important:** Add `.env.local` to `.gitignore` (already done):

```
# .gitignore
.env.local
.env.*.local
```

## Deployment Flow

```
┌─────────────────┐
│  Code Push      │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  GitHub Actions Triggered            │
│  ├─ Checkout                         │
│  ├─ Setup Node.js                    │
│  ├─ npm ci                           │
│  └─ Inject secrets from GitHub       │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Build Application (npm run build)   │
│  ├─ Vite reads env vars              │
│  ├─ Embeds VITE_* in bundle          │
│  └─ Generates optimized build        │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Deploy to Firebase Hosting          │
│  ├─ Upload dist files                │
│  ├─ Set cache headers                │
│  └─ Make live on CDN                 │
└──────────────────────────────────────┘
```

## Environment Variables in Vite

### Available in Browser

Variables prefixed with `VITE_` are accessible in the browser code:

```typescript
// Available in browser
console.log(import.meta.env.VITE_FIREBASE_API_KEY);  // ✓ Works
```

**⚠️ Important:** Never use `VITE_` prefix for sensitive secrets that shouldn't be exposed!

### Hidden from Browser

Variables without `VITE_` prefix are only available during build:

```typescript
// Only during build, not in browser
import.meta.env.FIREBASE_KEY_JSON;  // ✗ Undefined in browser
```

Use these for build-time configuration only.

## Security Considerations

### ✅ What We Do Right

1. **GitHub Secrets Encryption** - All secrets encrypted at rest
2. **Build-Time Only** - Secrets injected during build, not stored on server
3. **HTTPS Only** - All Firebase communication uses HTTPS
4. **CORS Restricted** - Firebase rules restrict domain access
5. **No Logging** - Secrets not logged in CI/CD output

### ⚠️ Important Notes

1. **VITE Variables Are Public** - Anything prefixed with `VITE_` will be in the JavaScript bundle
   - This is by design for Firebase (API key is meant to be public)
   - But be careful what you add with `VITE_` prefix

2. **Firebase Security Rules** - Protect data with Firestore rules
   - Don't rely on API key secrecy
   - Use authentication and authorization rules
   - Example: Only authenticated users can read their own data

3. **Service Account Key** - The `FIREBASE_KEY_JSON` is private
   - Only used for server-side deployments
   - NOT embedded in the web app
   - Kept secure in GitHub Secrets

## Troubleshooting

### Build Fails with "Missing Firebase Config"

**Error:**
```
Error: Firebase config is missing required fields
```

**Solution:**
1. Verify all `VITE_FIREBASE_*` secrets are set
   ```bash
   gh secret list -R ernemonk/harvestpilot-webapp
   ```
2. Check GitHub Actions logs for which secret is missing
3. Add missing secret and retry

### Build Succeeds but App Won't Load

**Check:**
1. Firebase config is injected
   ```bash
   # In DevTools Console
   console.log(import.meta.env.VITE_FIREBASE_PROJECT_ID)
   ```
2. Firebase project is accessible
3. CORS is configured correctly
4. Check browser console for Firebase errors

### Local Development Not Working

**Solution:**
1. Create `.env.local` (copy from `.env.example`)
2. Fill in Firebase values
3. Restart dev server: `npm run dev`
4. Check that `import.meta.env.VITE_*` is accessible

## Updating Secrets

### If Firebase Config Changes

1. Update secret in GitHub:
   ```bash
   gh secret set VITE_FIREBASE_PROJECT_ID --body "NEW_VALUE"
   ```

2. Trigger new deployment:
   ```bash
   git push origin main
   ```

3. GitHub Actions will automatically rebuild with new secrets

### Rotating Secrets

For security, periodically rotate Firebase API keys:

1. Generate new key in Firebase Console
2. Update GitHub secret
3. Trigger deployment
4. Delete old key in Firebase Console

## References

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [Firebase Web Configuration](https://firebase.google.com/docs/web/setup)
- [GitHub Actions Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Firebase Security Rules Best Practices](https://firebase.google.com/docs/firestore/security/get-started)

## Next Steps

1. ✅ Set all required GitHub Secrets
2. ✅ Verify secrets are listed: `gh secret list`
3. ✅ Push code to trigger deployment: `git push origin main`
4. ✅ Monitor GitHub Actions for successful build
5. ✅ Access deployed app at https://harvest-hub.firebaseapp.com
