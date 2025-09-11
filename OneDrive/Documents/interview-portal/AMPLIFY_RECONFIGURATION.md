# 🚨 CRITICAL: Amplify Reconfiguration Required

## Overview
The application has references to an old AWS account (032397978068) and wrong regions that must be resolved to fix authentication issues in production.

## Root Cause Analysis
The authentication issues stem from cross-account configuration mismatches:

1. **Old AWS Account References**: The `amplify/team-provider-info.json` file contains extensive references to AWS account `032397978068`
2. **Region Mismatches**: Multiple environments configured for `us-east-1` and `us-west-1` instead of the current `eu-west-2`
3. **Cross-Account Resource Access**: The app is trying to authenticate users against resources in the wrong AWS account

## Critical Files Affected

### ✅ FIXED - Application Code
- `scripts/*.js` - All admin scripts updated to use `eu-west-2`
- `src/lib/auth/amplify-config.ts` - Mock configs updated
- `src/app/api/admin/create-company-admin/route.ts` - Default region fixed
- `.github/workflows/ci-cd.yml` - CI/CD regions updated

### ❌ NEEDS AMPLIFY CLI ACTION - Infrastructure Config
- `amplify/team-provider-info.json` - Contains old account references that require Amplify CLI reconfiguration

## Required Actions

### 1. Amplify Environment Reconfiguration
The `amplify/team-provider-info.json` file contains:

```json
{
  "dev": {
    "awscloudformation": {
      "AuthRoleArn": "arn:aws:iam::032397978068:role/amplify-interviewsaas-dev-69431-authRole",
      "UnauthRoleArn": "arn:aws:iam::032397978068:role/amplify-interviewsaas-dev-69431-unauthRole",
      "Region": "us-east-1",
      "StackId": "arn:aws:cloudformation:us-east-1:032397978068:stack/amplify-interviewsaas-dev-69431/4079a9e0-7d56-11f0-ad38-12c045b694a5"
    }
  },
  "abbhsaas": {
    "awscloudformation": {
      "AuthRoleArn": "arn:aws:iam::032397978068:role/amplify-interviewsaas-abbhsaas-1fa42-authRole", 
      "Region": "us-west-1"
    }
  }
}
```

**SOLUTION**: The Amplify environment needs to be reinitialized or migrated to the correct AWS account (624914081304) and region (eu-west-2).

### 2. Recommended Steps

#### Option A: Reinitialize Amplify (Recommended)
```bash
# 1. Backup current configuration
cp amplify/team-provider-info.json amplify/team-provider-info.json.backup

# 2. Remove old environment configs
amplify env remove dev --yes
amplify env remove abbhsaas --yes

# 3. Initialize fresh environment in correct account/region
amplify init --yes

# 4. Configure for production account (624914081304) and eu-west-2
amplify env add production

# 5. Push new configuration
amplify push --yes
```

#### Option B: Manual Configuration Update
```bash
# Update AWS profile to use correct account
aws configure --profile production
# Set account: 624914081304
# Set region: eu-west-2

# Use correct profile
amplify configure --profile production

# Update environment
amplify env checkout production
amplify push --yes
```

### 3. Environment Variables Update
Ensure Amplify Console environment variables match:

```
NEXT_PUBLIC_AWS_REGION=eu-west-2
NEXT_PUBLIC_AWS_USER_POOLS_ID=eu-west-2_FpwJJthe4
NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID=3juansb0jr3s3b8qouon7nr9gn
NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID=eu-west-2:c0ce106d-6892-4312-ab97-2dcae624ec66
NEXT_PUBLIC_AWS_APPSYNC_GRAPHQL_ENDPOINT=https://54ofumz56bfh3kozn2qrd55ih4.appsync-api.eu-west-2.amazonaws.com/graphql
NEXT_PUBLIC_AWS_APPSYNC_API_KEY=da2-2ottpnk4ejdarf3moy2nzq2adu
NEXT_PUBLIC_AWS_APPSYNC_REGION=eu-west-2
AWS_USER_FILES_S3_BUCKET=prorecruit-storage-eu-west-2-624914081304
```

### 4. Verification Steps
After reconfiguration:

1. **Test Admin Script**: `node scripts/list-admins.js`
2. **Test Production Login**: Login as dukeika@gmail.com at the deployed URL
3. **Check Auth Flow**: Verify redirect goes to admin dashboard, not candidate portal
4. **Check Debug Page**: Visit `/debug-auth` to verify all configs match

## Current Production Resources (Correct Account: 624914081304)

- **User Pool**: `eu-west-2_FpwJJthe4`
- **Identity Pool**: `eu-west-2:c0ce106d-6892-4312-ab97-2dcae624ec66`
- **AppSync Endpoint**: `https://54ofumz56bfh3kozn2qrd55ih4.appsync-api.eu-west-2.amazonaws.com/graphql`
- **Region**: `eu-west-2`
- **Super Admin**: dukeika@gmail.com (exists and confirmed working)

## Impact
Until this Amplify reconfiguration is completed, the production authentication will continue to fail because the app is pointing to resources in the wrong AWS account.

## Status
- ✅ Application code fixes: COMPLETED
- ❌ Amplify infrastructure reconfiguration: PENDING
- ❌ Production testing: PENDING

---
*Created: $(date)*  
*Priority: CRITICAL - Required for production authentication*