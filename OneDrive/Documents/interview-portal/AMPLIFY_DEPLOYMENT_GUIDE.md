# 🚀 Amplify Console Deployment Guide

## Quick Deployment Steps

### 1. Access Amplify Console
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Ensure you're in the **eu-west-2** region
3. Make sure you're logged into account **624914081304**

### 2. Connect Repository
1. Click "New app" → "Host web app"
2. Select "GitHub" as source
3. Authorize and select your repository: `interview-portal`
4. Branch: `main`

### 3. Configure Build Settings
Use this `amplify.yml` (already in your repo):
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### 4. Critical Environment Variables
Set these EXACT values in Amplify Console → App Settings → Environment Variables:

```
# AWS Configuration
NEXT_PUBLIC_AWS_REGION=eu-west-2
NEXT_PUBLIC_AWS_USER_POOLS_ID=eu-west-2_FpwJJthe4
NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID=3juansb0jr3s3b8qouon7nr9gn
NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID=eu-west-2:c0ce106d-6892-4312-ab97-2dcae624ec66

# AppSync Configuration  
NEXT_PUBLIC_AWS_APPSYNC_GRAPHQL_ENDPOINT=https://54ofumz56bfh3kozn2qrd55ih4.appsync-api.eu-west-2.amazonaws.com/graphql
NEXT_PUBLIC_AWS_APPSYNC_API_KEY=da2-2ottpnk4ejdarf3moy2nzq2adu
NEXT_PUBLIC_AWS_APPSYNC_REGION=eu-west-2

# Storage Configuration
AWS_USER_FILES_S3_BUCKET=prorecruit-storage-eu-west-2-624914081304

# Server-side AWS Credentials (for admin APIs)
# Use the production AWS credentials you have
AWS_ACCESS_KEY_ID=[YOUR_PRODUCTION_AWS_ACCESS_KEY_ID]
AWS_SECRET_ACCESS_KEY=[YOUR_PRODUCTION_AWS_SECRET_ACCESS_KEY]
PRORECRUIT_ACCESS_KEY_ID=[YOUR_PRODUCTION_AWS_ACCESS_KEY_ID]
PRORECRUIT_SECRET_ACCESS_KEY=[YOUR_PRODUCTION_AWS_SECRET_ACCESS_KEY]
```

### 5. Deploy
1. Click "Save and deploy"
2. Wait for build to complete (~3-5 minutes)
3. Test the deployment URL

## 🧪 Post-Deployment Testing

### Test Super Admin Login
1. Visit your Amplify app URL
2. Go to `/login`
3. Login with: `dukeika@gmail.com` / `ProRecruit123!`
4. **Expected**: Should redirect to `/admin/dashboard`
5. **Previous Issue**: Was redirecting to `/candidate/dashboard`

### Test Debug Page
Visit `/debug-auth` on your deployed URL to verify all configurations match the expected values.

### Verify Admin Functions
Test admin management scripts against the deployed environment:
```bash
node scripts/list-admins.js
```

## 🚨 Key Success Indicators

✅ **Login redirects to admin dashboard** (not candidate portal)  
✅ **No Cognito Identity Pool 400 errors** in browser console  
✅ **No AppSync 502 errors** in browser console  
✅ **Debug page shows correct configurations**  
✅ **Admin scripts work with production resources**  

## Alternative: GitHub Actions Deployment

If you prefer automated deployments, your CI/CD workflow in `.github/workflows/ci-cd.yml` is already configured for the correct region (eu-west-2) after our fixes.

Set the same environment variables as GitHub Secrets and the deployment will work automatically on pushes to main.

---

**Next Steps After Deployment:**
1. Test super admin login immediately
2. Verify admin dashboard access
3. Test candidate application flow
4. Test company admin creation functionality

This deployment approach bypasses the Amplify CLI cross-account issues and uses the Console directly with the correct configurations.