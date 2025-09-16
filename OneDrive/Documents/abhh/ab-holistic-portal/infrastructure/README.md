# 🏗️ AWS Infrastructure Setup Guide

This directory contains scripts and configurations to set up the complete AWS infrastructure for the AB Holistic Interview Portal.

## 🔒 **SECURITY FIRST**

⚠️ **NEVER commit AWS credentials to version control**
⚠️ **Always use IAM roles and policies with least privilege**
⚠️ **Rotate credentials immediately if they've been exposed**

## 📋 **Prerequisites**

1. **AWS CLI installed and configured**
   ```bash
   # Install AWS CLI
   # Windows: Download from https://aws.amazon.com/cli/
   # macOS: brew install awscli
   # Linux: sudo apt install awscli

   # Configure AWS CLI securely
   aws configure
   ```

2. **Required AWS Permissions**
   - Cognito (CreateUserPool, CreateIdentityPool)
   - S3 (CreateBucket, PutBucketPolicy)
   - DynamoDB (CreateTable)
   - IAM (CreateRole, AttachRolePolicy)
   - CloudFormation (CreateStack, UpdateStack)

3. **Node.js 18+ and npm installed**

## 🚀 **Quick Setup**

### For Windows:
```cmd
cd infrastructure
setup-windows.bat
```

### For Linux/macOS:
```bash
cd infrastructure
chmod +x aws-setup.sh
./aws-setup.sh
```

## 📝 **Manual Setup Steps**

### 1. Configure AWS CLI Securely

```bash
# Configure with your credentials
aws configure

# Test configuration
aws sts get-caller-identity
```

### 2. Set Environment Variables

```bash
# Choose your environment
export ENVIRONMENT=dev  # or staging, prod
export AWS_REGION=us-east-1
export PROJECT_NAME=ab-holistic-portal
```

### 3. Create Cognito User Pool

```bash
# Create User Pool
USER_POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name "${PROJECT_NAME}-users-${ENVIRONMENT}" \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": true
    }
  }' \
  --auto-verified-attributes email \
  --username-attributes email \
  --query 'UserPool.Id' \
  --output text)

echo "User Pool ID: $USER_POOL_ID"

# Create User Pool Client
USER_POOL_CLIENT_ID=$(aws cognito-idp create-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-name "${PROJECT_NAME}-client-${ENVIRONMENT}" \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH \
  --query 'UserPoolClient.ClientId' \
  --output text)

echo "User Pool Client ID: $USER_POOL_CLIENT_ID"

# Create User Groups
aws cognito-idp create-group \
  --group-name "admins" \
  --user-pool-id $USER_POOL_ID \
  --description "Admin users with full access" \
  --precedence 1

aws cognito-idp create-group \
  --group-name "applicants" \
  --user-pool-id $USER_POOL_ID \
  --description "Applicant users" \
  --precedence 2
```

### 4. Create S3 Buckets

```bash
# Get account ID for unique bucket names
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create buckets
RESUMES_BUCKET="${PROJECT_NAME}-resumes-${ENVIRONMENT}-${ACCOUNT_ID}"
VIDEOS_BUCKET="${PROJECT_NAME}-videos-${ENVIRONMENT}-${ACCOUNT_ID}"

aws s3 mb s3://${RESUMES_BUCKET} --region $AWS_REGION
aws s3 mb s3://${VIDEOS_BUCKET} --region $AWS_REGION

# Configure bucket security
aws s3api put-public-access-block \
  --bucket $RESUMES_BUCKET \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

aws s3api put-public-access-block \
  --bucket $VIDEOS_BUCKET \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket $RESUMES_BUCKET \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }'

aws s3api put-bucket-encryption \
  --bucket $VIDEOS_BUCKET \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }'
```

### 5. Create Environment Configuration

```bash
# Create .env file for frontend
cat > ../frontend/.env.${ENVIRONMENT} << EOF
NEXT_PUBLIC_AWS_REGION=$AWS_REGION
NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID=$USER_POOL_CLIENT_ID
NEXT_PUBLIC_S3_BUCKET_RESUMES=$RESUMES_BUCKET
NEXT_PUBLIC_S3_BUCKET_VIDEOS=$VIDEOS_BUCKET
EOF

echo "Created frontend/.env.${ENVIRONMENT}"
```

### 6. Create Admin User

```bash
# Create admin user
read -p "Enter admin email: " ADMIN_EMAIL
read -s -p "Enter temporary password: " ADMIN_PASSWORD

aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username $ADMIN_EMAIL \
  --user-attributes Name=email,Value=$ADMIN_EMAIL Name=given_name,Value=Admin Name=family_name,Value=User \
  --temporary-password $ADMIN_PASSWORD \
  --message-action SUPPRESS

aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username $ADMIN_EMAIL \
  --group-name admins

echo "Created admin user: $ADMIN_EMAIL"
```

## 🔧 **Backend Deployment**

After infrastructure setup:

```bash
# Navigate to backend
cd ../backend

# Install dependencies
npm install

# Update serverless.yml with your resource IDs
# Edit serverless.yml and add your USER_POOL_ID, S3 bucket names, etc.

# Deploy backend
npm run deploy:dev  # or deploy:staging, deploy:prod
```

## 🎨 **Frontend Deployment**

```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
```

## 📊 **Verify Setup**

### Test Cognito
```bash
# List users in pool
aws cognito-idp list-users --user-pool-id $USER_POOL_ID

# Check groups
aws cognito-idp list-groups --user-pool-id $USER_POOL_ID
```

### Test S3 Buckets
```bash
# List buckets
aws s3 ls | grep ab-holistic-portal

# Check bucket policies
aws s3api get-public-access-block --bucket $RESUMES_BUCKET
```

### Test Application
1. Start frontend: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Try registering a new user
4. Test admin login with created admin user

## 🔐 **Security Checklist**

- [ ] S3 buckets are private with public access blocked
- [ ] Cognito password policy enforced
- [ ] IAM roles follow least privilege principle
- [ ] All data encrypted at rest
- [ ] Environment variables are not committed to git
- [ ] Admin user password changed from temporary

## 🗑️ **Cleanup (Careful!)**

To remove all AWS resources:

```bash
# Delete Cognito resources
aws cognito-idp delete-user-pool --user-pool-id $USER_POOL_ID

# Delete S3 buckets (remove all objects first)
aws s3 rm s3://$RESUMES_BUCKET --recursive
aws s3 rb s3://$RESUMES_BUCKET

aws s3 rm s3://$VIDEOS_BUCKET --recursive
aws s3 rb s3://$VIDEOS_BUCKET

# Delete DynamoDB tables
aws dynamodb delete-table --table-name "${PROJECT_NAME}-jobs-${ENVIRONMENT}"
# ... repeat for all tables
```

## 📞 **Support**

If you encounter issues:

1. Check AWS CLI configuration: `aws sts get-caller-identity`
2. Verify IAM permissions for your user/role
3. Check AWS CloudTrail logs for API errors
4. Review the Implementation Guide for troubleshooting

## 🎯 **Next Steps**

After successful setup:

1. ✅ Test user registration and login
2. ✅ Deploy backend Lambda functions
3. ✅ Test file upload to S3
4. ✅ Configure domain and SSL certificate
5. ✅ Set up monitoring and alerts
6. ✅ Configure backup strategies

---

**Remember: Keep your AWS credentials secure and never commit them to version control!**