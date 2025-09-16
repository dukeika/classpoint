# 🔧 Manual AWS Setup - Step by Step

When automated scripts fail, let's do it manually with full control.

## 🚨 **Current Issues Analysis**

1. **Cognito User Pool creation incomplete** - The script got stuck creating the User Pool Client
2. **Serverless deployment failing** - Exit status 0xfffff013 indicates configuration issues
3. **Missing dependencies** - Serverless framework might not be properly installed

## 📋 **Manual Fix Process**

### **Step 1: Debug Current State**

```cmd
cd ab-holistic-portal\infrastructure
debug-setup.bat
```

This will show you:
- ✅ AWS CLI status
- ✅ Existing Cognito resources
- ✅ Existing S3 buckets
- ✅ DynamoDB tables
- ✅ Serverless framework status

### **Step 2: Create Cognito Resources Manually**

```cmd
# Get your account info
aws sts get-caller-identity

# Create User Pool (replace with your account details)
aws cognito-idp create-user-pool ^
  --pool-name "ab-holistic-portal-users-dev" ^
  --policies "{\"PasswordPolicy\":{\"MinimumLength\":8,\"RequireUppercase\":true,\"RequireLowercase\":true,\"RequireNumbers\":true,\"RequireSymbols\":true}}" ^
  --auto-verified-attributes email ^
  --username-attributes email

# This will return a User Pool ID like: us-east-1_XXXXXXXXX
# Save this ID!
```

### **Step 3: Create User Pool Client**

```cmd
# Replace YOUR_USER_POOL_ID with the ID from step 2
aws cognito-idp create-user-pool-client ^
  --user-pool-id YOUR_USER_POOL_ID ^
  --client-name "ab-holistic-portal-client-dev" ^
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH

# This will return a Client ID - save this too!
```

### **Step 4: Create User Groups**

```cmd
# Create admin group
aws cognito-idp create-group ^
  --group-name "admins" ^
  --user-pool-id YOUR_USER_POOL_ID ^
  --description "Admin users" ^
  --precedence 1

# Create applicants group
aws cognito-idp create-group ^
  --group-name "applicants" ^
  --user-pool-id YOUR_USER_POOL_ID ^
  --description "Applicant users" ^
  --precedence 2
```

### **Step 5: Create S3 Buckets**

```cmd
# Get your account ID
for /f "tokens=*" %i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%i

# Create unique bucket names
set RESUMES_BUCKET=ab-holistic-portal-resumes-dev-%ACCOUNT_ID%
set VIDEOS_BUCKET=ab-holistic-portal-videos-dev-%ACCOUNT_ID%

# Create buckets
aws s3 mb s3://%RESUMES_BUCKET% --region us-east-1
aws s3 mb s3://%VIDEOS_BUCKET% --region us-east-1

# Make them private
aws s3api put-public-access-block --bucket %RESUMES_BUCKET% --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-public-access-block --bucket %VIDEOS_BUCKET% --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### **Step 6: Create Environment Files**

Create `frontend\.env.dev`:
```env
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=YOUR_USER_POOL_ID_HERE
NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID=YOUR_CLIENT_ID_HERE
NEXT_PUBLIC_S3_BUCKET_RESUMES=ab-holistic-portal-resumes-dev-YOUR_ACCOUNT_ID
NEXT_PUBLIC_S3_BUCKET_VIDEOS=ab-holistic-portal-videos-dev-YOUR_ACCOUNT_ID
```

Create `backend\.env.dev`:
```env
STAGE=dev
REGION=us-east-1
USER_POOL_ID=YOUR_USER_POOL_ID_HERE
JWT_SECRET=your-secure-jwt-secret-change-this
```

### **Step 7: Fix Serverless Issues**

```cmd
cd ab-holistic-portal\infrastructure
fix-serverless.bat
```

This will:
- ✅ Install Serverless Framework globally
- ✅ Check backend dependencies
- ✅ Validate serverless.yml
- ✅ Set up environment variables
- ✅ Test deployment

## 🎯 **Quick Commands Summary**

If you want to skip the scripts and do it super fast:

```cmd
# 1. Check AWS status
aws sts get-caller-identity

# 2. Install Serverless globally
npm install -g serverless

# 3. Create User Pool manually and get the ID
aws cognito-idp create-user-pool --pool-name "ab-holistic-portal-users-dev" --auto-verified-attributes email --username-attributes email

# 4. Create User Pool Client with the ID from step 3
aws cognito-idp create-user-pool-client --user-pool-id YOUR_POOL_ID --client-name "ab-holistic-portal-client-dev" --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH

# 5. Create S3 buckets
aws s3 mb s3://ab-holistic-portal-resumes-dev-YOUR_ACCOUNT_ID
aws s3 mb s3://ab-holistic-portal-videos-dev-YOUR_ACCOUNT_ID

# 6. Update environment files with your actual IDs
# 7. Try serverless deploy again
```

## 🚨 **Most Likely Issues**

1. **Serverless not installed globally**: `npm install -g serverless`
2. **Wrong Node.js version**: Ensure Node 18+
3. **Missing User Pool ID**: Update .env files with actual IDs
4. **IAM permissions**: Your AWS user needs Cognito, S3, Lambda, API Gateway permissions
5. **Region mismatch**: Ensure all resources are in the same region

**Try the debug script first to see exactly what's failing!**