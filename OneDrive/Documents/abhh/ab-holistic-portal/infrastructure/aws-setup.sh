#!/bin/bash

# AB Holistic Interview Portal - AWS Infrastructure Setup Script
# This script sets up the complete AWS infrastructure for the interview portal
#
# IMPORTANT:
# 1. Configure AWS CLI with proper credentials first: aws configure
# 2. Ensure you have sufficient permissions for Cognito, DynamoDB, S3, IAM
# 3. Review all settings before running in production

set -e  # Exit on any error

# Configuration variables
PROJECT_NAME="ab-holistic-portal"
ENVIRONMENT="dev"  # Change to 'staging' or 'prod' for other environments
AWS_REGION="us-east-1"  # Change to your preferred region
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if AWS CLI is configured
check_aws_cli() {
    log_info "Checking AWS CLI configuration..."

    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi

    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS CLI is not configured or credentials are invalid."
        log_info "Please run: aws configure"
        exit 1
    fi

    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    CURRENT_REGION=$(aws configure get region)

    log_success "AWS CLI is configured"
    log_info "Account ID: $ACCOUNT_ID"
    log_info "Current Region: $CURRENT_REGION"

    if [ "$CURRENT_REGION" != "$AWS_REGION" ]; then
        log_warning "Current region ($CURRENT_REGION) differs from target region ($AWS_REGION)"
        read -p "Continue with target region $AWS_REGION? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Function to create Cognito User Pool
create_cognito_user_pool() {
    log_info "Creating Cognito User Pool..."

    # Create User Pool
    USER_POOL_ID=$(aws cognito-idp create-user-pool \
        --pool-name "${PROJECT_NAME}-users-${ENVIRONMENT}" \
        --region $AWS_REGION \
        --policies '{
            "PasswordPolicy": {
                "MinimumLength": 8,
                "RequireUppercase": true,
                "RequireLowercase": true,
                "RequireNumbers": true,
                "RequireSymbols": true,
                "TemporaryPasswordValidityDays": 7
            }
        }' \
        --auto-verified-attributes email \
        --username-attributes email \
        --email-configuration '{
            "EmailSendingAccount": "COGNITO_DEFAULT"
        }' \
        --admin-create-user-config '{
            "AllowAdminCreateUserOnly": false,
            "InviteMessageAction": "EMAIL"
        }' \
        --user-pool-tags '{
            "Environment": "'$ENVIRONMENT'",
            "Project": "'$PROJECT_NAME'"
        }' \
        --schema '[
            {
                "Name": "email",
                "AttributeDataType": "String",
                "Required": true,
                "Mutable": true
            },
            {
                "Name": "given_name",
                "AttributeDataType": "String",
                "Required": true,
                "Mutable": true
            },
            {
                "Name": "family_name",
                "AttributeDataType": "String",
                "Required": true,
                "Mutable": true
            },
            {
                "Name": "phone_number",
                "AttributeDataType": "String",
                "Required": false,
                "Mutable": true
            }
        ]' \
        --query 'UserPool.Id' \
        --output text)

    log_success "Created User Pool: $USER_POOL_ID"

    # Create User Pool Client
    USER_POOL_CLIENT_ID=$(aws cognito-idp create-user-pool-client \
        --user-pool-id $USER_POOL_ID \
        --client-name "${PROJECT_NAME}-client-${ENVIRONMENT}" \
        --region $AWS_REGION \
        --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH \
        --prevent-user-existence-errors ENABLED \
        --enable-token-revocation \
        --query 'UserPoolClient.ClientId' \
        --output text)

    log_success "Created User Pool Client: $USER_POOL_CLIENT_ID"

    # Create User Groups
    log_info "Creating user groups..."

    aws cognito-idp create-group \
        --group-name "admins" \
        --user-pool-id $USER_POOL_ID \
        --description "Admin users with full access" \
        --precedence 1 \
        --region $AWS_REGION

    aws cognito-idp create-group \
        --group-name "applicants" \
        --user-pool-id $USER_POOL_ID \
        --description "Applicant users" \
        --precedence 2 \
        --region $AWS_REGION

    log_success "Created user groups: admins, applicants"

    # Create Identity Pool
    IDENTITY_POOL_ID=$(aws cognito-identity create-identity-pool \
        --identity-pool-name "${PROJECT_NAME}-identity-${ENVIRONMENT}" \
        --allow-unauthenticated-identities \
        --cognito-identity-providers ProviderName=cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID},ClientId=${USER_POOL_CLIENT_ID} \
        --region $AWS_REGION \
        --query 'IdentityPoolId' \
        --output text)

    log_success "Created Identity Pool: $IDENTITY_POOL_ID"

    # Export variables for other functions
    export USER_POOL_ID
    export USER_POOL_CLIENT_ID
    export IDENTITY_POOL_ID
}

# Function to create S3 buckets
create_s3_buckets() {
    log_info "Creating S3 buckets..."

    # Create resumes bucket
    RESUMES_BUCKET="${PROJECT_NAME}-resumes-${ENVIRONMENT}-${ACCOUNT_ID}"
    aws s3 mb s3://${RESUMES_BUCKET} --region $AWS_REGION

    # Configure resumes bucket
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

    aws s3api put-bucket-versioning \
        --bucket $RESUMES_BUCKET \
        --versioning-configuration Status=Enabled

    aws s3api put-public-access-block \
        --bucket $RESUMES_BUCKET \
        --public-access-block-configuration \
            BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

    log_success "Created resumes bucket: $RESUMES_BUCKET"

    # Create videos bucket
    VIDEOS_BUCKET="${PROJECT_NAME}-videos-${ENVIRONMENT}-${ACCOUNT_ID}"
    aws s3 mb s3://${VIDEOS_BUCKET} --region $AWS_REGION

    # Configure videos bucket
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

    aws s3api put-bucket-versioning \
        --bucket $VIDEOS_BUCKET \
        --versioning-configuration Status=Enabled

    aws s3api put-public-access-block \
        --bucket $VIDEOS_BUCKET \
        --public-access-block-configuration \
            BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

    # Add lifecycle policy for videos
    aws s3api put-bucket-lifecycle-configuration \
        --bucket $VIDEOS_BUCKET \
        --lifecycle-configuration file://s3-lifecycle-policy.json

    log_success "Created videos bucket: $VIDEOS_BUCKET"

    # Export variables
    export RESUMES_BUCKET
    export VIDEOS_BUCKET
}

# Function to create DynamoDB tables
create_dynamodb_tables() {
    log_info "Creating DynamoDB tables..."

    # Jobs table
    aws dynamodb create-table \
        --table-name "${PROJECT_NAME}-jobs-${ENVIRONMENT}" \
        --attribute-definitions \
            AttributeName=jobId,AttributeType=S \
            AttributeName=status,AttributeType=S \
            AttributeName=createdAt,AttributeType=S \
        --key-schema \
            AttributeName=jobId,KeyType=HASH \
        --global-secondary-indexes \
            IndexName=StatusIndex,KeySchema=[{AttributeName=status,KeyType=HASH},{AttributeName=createdAt,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
        --provisioned-throughput \
            ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --region $AWS_REGION \
        --tags Key=Environment,Value=$ENVIRONMENT Key=Project,Value=$PROJECT_NAME

    # Applications table
    aws dynamodb create-table \
        --table-name "${PROJECT_NAME}-applications-${ENVIRONMENT}" \
        --attribute-definitions \
            AttributeName=applicationId,AttributeType=S \
            AttributeName=jobId,AttributeType=S \
            AttributeName=applicantId,AttributeType=S \
            AttributeName=stage,AttributeType=S \
        --key-schema \
            AttributeName=applicationId,KeyType=HASH \
        --global-secondary-indexes \
            IndexName=JobIndex,KeySchema=[{AttributeName=jobId,KeyType=HASH},{AttributeName=stage,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
            IndexName=ApplicantIndex,KeySchema=[{AttributeName=applicantId,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
        --provisioned-throughput \
            ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --region $AWS_REGION \
        --tags Key=Environment,Value=$ENVIRONMENT Key=Project,Value=$PROJECT_NAME

    # Add other tables (applicants, tests, test-submissions, notifications)
    # Similar pattern for each table...

    log_success "Created DynamoDB tables"
}

# Function to create IAM roles
create_iam_roles() {
    log_info "Creating IAM roles..."

    # Create Cognito authenticated role
    COGNITO_AUTH_ROLE_ARN=$(aws iam create-role \
        --role-name "${PROJECT_NAME}-CognitoAuthRole-${ENVIRONMENT}" \
        --assume-role-policy-document file://cognito-trust-policy.json \
        --query 'Role.Arn' \
        --output text)

    # Attach policies to Cognito roles
    aws iam attach-role-policy \
        --role-name "${PROJECT_NAME}-CognitoAuthRole-${ENVIRONMENT}" \
        --policy-arn "arn:aws:iam::aws:policy/AmazonCognitoPowerUser"

    log_success "Created IAM roles"

    export COGNITO_AUTH_ROLE_ARN
}

# Function to output configuration
output_configuration() {
    log_info "=== AWS Infrastructure Configuration ==="
    echo
    echo "Environment: $ENVIRONMENT"
    echo "Region: $AWS_REGION"
    echo "Account ID: $ACCOUNT_ID"
    echo
    echo "=== Cognito Configuration ==="
    echo "User Pool ID: $USER_POOL_ID"
    echo "User Pool Client ID: $USER_POOL_CLIENT_ID"
    echo "Identity Pool ID: $IDENTITY_POOL_ID"
    echo
    echo "=== S3 Buckets ==="
    echo "Resumes Bucket: $RESUMES_BUCKET"
    echo "Videos Bucket: $VIDEOS_BUCKET"
    echo
    echo "=== Environment Variables for .env ==="
    echo "NEXT_PUBLIC_AWS_REGION=$AWS_REGION"
    echo "NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID"
    echo "NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID=$USER_POOL_CLIENT_ID"
    echo "NEXT_PUBLIC_IDENTITY_POOL_ID=$IDENTITY_POOL_ID"
    echo "NEXT_PUBLIC_S3_BUCKET_RESUMES=$RESUMES_BUCKET"
    echo "NEXT_PUBLIC_S3_BUCKET_VIDEOS=$VIDEOS_BUCKET"
    echo

    # Save to file
    cat > "../frontend/.env.${ENVIRONMENT}" << EOF
NEXT_PUBLIC_AWS_REGION=$AWS_REGION
NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID=$USER_POOL_CLIENT_ID
NEXT_PUBLIC_IDENTITY_POOL_ID=$IDENTITY_POOL_ID
NEXT_PUBLIC_S3_BUCKET_RESUMES=$RESUMES_BUCKET
NEXT_PUBLIC_S3_BUCKET_VIDEOS=$VIDEOS_BUCKET
EOF

    log_success "Configuration saved to frontend/.env.${ENVIRONMENT}"
}

# Function to create admin user
create_admin_user() {
    log_info "Creating admin user..."

    read -p "Enter admin email: " ADMIN_EMAIL
    read -s -p "Enter temporary password: " ADMIN_PASSWORD
    echo

    aws cognito-idp admin-create-user \
        --user-pool-id $USER_POOL_ID \
        --username $ADMIN_EMAIL \
        --user-attributes Name=email,Value=$ADMIN_EMAIL Name=given_name,Value=Admin Name=family_name,Value=User \
        --temporary-password $ADMIN_PASSWORD \
        --message-action SUPPRESS \
        --region $AWS_REGION

    aws cognito-idp admin-add-user-to-group \
        --user-pool-id $USER_POOL_ID \
        --username $ADMIN_EMAIL \
        --group-name admins \
        --region $AWS_REGION

    log_success "Created admin user: $ADMIN_EMAIL"
    log_warning "Please change the temporary password on first login"
}

# Main execution
main() {
    log_info "Starting AWS infrastructure setup for AB Holistic Interview Portal"
    log_warning "Environment: $ENVIRONMENT"

    read -p "Continue with this environment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi

    check_aws_cli
    create_cognito_user_pool
    create_s3_buckets
    create_dynamodb_tables
    create_iam_roles
    output_configuration

    read -p "Create admin user now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        create_admin_user
    fi

    log_success "AWS infrastructure setup completed!"
    log_info "Next steps:"
    echo "1. Review the generated .env file in frontend/.env.${ENVIRONMENT}"
    echo "2. Update serverless.yml with the new resource IDs"
    echo "3. Deploy the backend: cd backend && npm run deploy:${ENVIRONMENT}"
    echo "4. Deploy the frontend: cd frontend && npm run deploy:${ENVIRONMENT}"
}

# Run main function
main "$@"