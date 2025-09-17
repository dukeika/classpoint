# 🚀 AB Holistic Interview Portal - AWS Deployment Guide

## ❌ **Current Deployment Issues**

### **Backend Issues:**
1. **Environment Variable Mismatch**: `serverless.yml` expects environment variables but `.env.dev` has hardcoded values
2. **Missing AWS Resources**: Cognito User Pool and S3 buckets referenced in config don't exist
3. **Deployment Timeout**: CloudFormation stack creation is timing out due to large template
4. **Missing Region Configuration**: Some resources not properly configured for us-west-1

### **Frontend Issues:**
1. **No Amplify Configuration**: No `amplify/` directory or configuration files
2. **Static Export Config**: `next.config.js` is configured for static export, not Amplify hosting
3. **Missing Environment Variables**: No `.env` files for different environments

## ✅ **Quick Fix Solutions**

### **Option 1: Manual AWS Setup (Recommended for Development)**

#### **Step 1: Create Cognito User Pool**
```bash
# Set your AWS region
export AWS_REGION=us-west-1

# Create User Pool
aws cognito-idp create-user-pool \
  --pool-name "ab-holistic-portal-dev" \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": false
    }
  }' \
  --auto-verified-attributes email \
  --username-attributes email \
  --region us-west-1 \
  --query 'UserPool.Id' \
  --output text
```

#### **Step 2: Create User Pool Client**
```bash
# Replace USER_POOL_ID with output from step 1
aws cognito-idp create-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-name "ab-holistic-portal-dev-client" \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH \
  --region us-west-1 \
  --query 'UserPoolClient.ClientId' \
  --output text
```

#### **Step 3: Create S3 Buckets**
```bash
# Get Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create buckets with unique names
aws s3 mb s3://ab-holistic-portal-resumes-dev-${ACCOUNT_ID} --region us-west-1
aws s3 mb s3://ab-holistic-portal-videos-dev-${ACCOUNT_ID} --region us-west-1

# Configure bucket security
aws s3api put-public-access-block \
  --bucket ab-holistic-portal-resumes-dev-${ACCOUNT_ID} \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### **Option 2: Simplified Serverless Deployment**

#### **Step 1: Update serverless.yml**
Remove resource creation from `serverless.yml` and deploy only Lambda functions:

```yaml
# Remove the entire resources: section
# Add environment variables from .env.dev directly
```

#### **Step 2: Deploy Functions Only**
```bash
cd backend
serverless deploy --stage dev --region us-west-1
```

### **Option 3: Use AWS CDK (Recommended for Production)**

#### **Step 1: Initialize CDK**
```bash
cd infrastructure
npm install -g aws-cdk
cdk init app --language typescript
```

#### **Step 2: Deploy Infrastructure**
```bash
cdk deploy --all
```

## 🔧 **Immediate Fixes Applied**

I'll now apply the following fixes to get deployment working:

1. **Simplify serverless.yml**: Remove resource definitions that cause timeouts
2. **Fix environment variables**: Use actual environment variables instead of placeholders
3. **Create deployment scripts**: Add Windows batch files for easy deployment
4. **Update frontend config**: Fix Next.js configuration for proper deployment

## 🚀 **Next Steps**

After fixing the configuration:

1. **Create AWS Resources Manually**: Use AWS CLI or Console to create Cognito and S3 resources
2. **Update Environment Files**: Set correct resource IDs in `.env` files
3. **Deploy Backend**: Use serverless framework for Lambda functions
4. **Deploy Frontend**: Use Amplify CLI or static hosting
5. **Test End-to-End**: Verify authentication and API functionality

## 📞 **Support**

If deployment issues persist:
- Check AWS CLI configuration: `aws configure list`
- Verify IAM permissions for CloudFormation, Lambda, S3, Cognito
- Review AWS CloudFormation console for stack creation errors
- Check AWS CloudWatch logs for Lambda function errors