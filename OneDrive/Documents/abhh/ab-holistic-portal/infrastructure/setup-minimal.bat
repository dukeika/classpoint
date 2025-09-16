@echo off
REM Minimal AWS Infrastructure Setup - Without NPM Dependencies
REM This script focuses only on AWS resource creation

echo ========================================
echo AB Holistic Interview Portal
echo Minimal AWS Infrastructure Setup
echo ========================================
echo.

echo This script will create AWS resources WITHOUT installing NPM dependencies
echo You can install dependencies separately after AWS setup is complete
echo.

REM Check if AWS CLI is installed
where aws >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: AWS CLI is not installed.
    echo Please install AWS CLI from: https://aws.amazon.com/cli/
    pause
    exit /b 1
)

REM Check AWS CLI configuration
aws sts get-caller-identity >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: AWS CLI is not configured.
    echo Please run: aws configure
    pause
    exit /b 1
)

echo AWS CLI is configured successfully!
echo.

REM Get current AWS identity
for /f "tokens=*" %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
for /f "tokens=*" %%i in ('aws configure get region') do set AWS_REGION=%%i

echo Current AWS Account: %ACCOUNT_ID%
echo Current AWS Region: %AWS_REGION%
echo.

set /p ENVIRONMENT="Enter environment (dev/staging/prod) [dev]: "
if "%ENVIRONMENT%"=="" set ENVIRONMENT=dev

echo Setting up AWS infrastructure for environment: %ENVIRONMENT%
echo.

set /p CONFIRM="Continue with AWS resource creation? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo Setup cancelled.
    pause
    exit /b 0
)

echo.
echo ========================================
echo Creating AWS Resources
echo ========================================

REM Create unique bucket names
set PROJECT_NAME=ab-holistic-portal
set RESUMES_BUCKET=%PROJECT_NAME%-resumes-%ENVIRONMENT%-%ACCOUNT_ID%
set VIDEOS_BUCKET=%PROJECT_NAME%-videos-%ENVIRONMENT%-%ACCOUNT_ID%

echo.
echo Creating Cognito User Pool...
for /f "tokens=*" %%i in ('aws cognito-idp create-user-pool --pool-name "%PROJECT_NAME%-users-%ENVIRONMENT%" --policies "{\"PasswordPolicy\":{\"MinimumLength\":8,\"RequireUppercase\":true,\"RequireLowercase\":true,\"RequireNumbers\":true,\"RequireSymbols\":true}}" --auto-verified-attributes email --username-attributes email --user-pool-tags Environment=%ENVIRONMENT%,Project=%PROJECT_NAME% --query "UserPool.Id" --output text') do set USER_POOL_ID=%%i

echo Created User Pool: %USER_POOL_ID%

echo Creating User Pool Client...
for /f "tokens=*" %%i in ('aws cognito-idp create-user-pool-client --user-pool-id %USER_POOL_ID% --client-name "%PROJECT_NAME%-client-%ENVIRONMENT%" --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH --prevent-user-existence-errors ENABLED --enable-token-revocation --query "UserPoolClient.ClientId" --output text') do set USER_POOL_CLIENT_ID=%%i

echo Created User Pool Client: %USER_POOL_CLIENT_ID%

echo Creating User Groups...
aws cognito-idp create-group --group-name "admins" --user-pool-id %USER_POOL_ID% --description "Admin users with full access" --precedence 1 >nul
aws cognito-idp create-group --group-name "applicants" --user-pool-id %USER_POOL_ID% --description "Applicant users" --precedence 2 >nul

echo Created user groups: admins, applicants

echo.
echo Creating S3 Buckets...
aws s3 mb s3://%RESUMES_BUCKET% --region %AWS_REGION%
aws s3 mb s3://%VIDEOS_BUCKET% --region %AWS_REGION%

echo Configuring S3 Security...
aws s3api put-public-access-block --bucket %RESUMES_BUCKET% --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-public-access-block --bucket %VIDEOS_BUCKET% --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo Enabling S3 Encryption...
aws s3api put-bucket-encryption --bucket %RESUMES_BUCKET% --server-side-encryption-configuration "{\"Rules\":[{\"ApplyServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"AES256\"}}]}"
aws s3api put-bucket-encryption --bucket %VIDEOS_BUCKET% --server-side-encryption-configuration "{\"Rules\":[{\"ApplyServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"AES256\"}}]}"

echo Enabling S3 Versioning...
aws s3api put-bucket-versioning --bucket %RESUMES_BUCKET% --versioning-configuration Status=Enabled
aws s3api put-bucket-versioning --bucket %VIDEOS_BUCKET% --versioning-configuration Status=Enabled

echo.
echo Creating DynamoDB Tables...

REM Jobs Table
aws dynamodb create-table ^
  --table-name "%PROJECT_NAME%-jobs-%ENVIRONMENT%" ^
  --attribute-definitions AttributeName=jobId,AttributeType=S AttributeName=status,AttributeType=S AttributeName=createdAt,AttributeType=S ^
  --key-schema AttributeName=jobId,KeyType=HASH ^
  --global-secondary-indexes "IndexName=StatusIndex,KeySchema=[{AttributeName=status,KeyType=HASH},{AttributeName=createdAt,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" ^
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 ^
  --tags Key=Environment,Value=%ENVIRONMENT% Key=Project,Value=%PROJECT_NAME% >nul

echo Created Jobs table

REM Applications Table
aws dynamodb create-table ^
  --table-name "%PROJECT_NAME%-applications-%ENVIRONMENT%" ^
  --attribute-definitions AttributeName=applicationId,AttributeType=S AttributeName=jobId,AttributeType=S AttributeName=applicantId,AttributeType=S AttributeName=stage,AttributeType=S ^
  --key-schema AttributeName=applicationId,KeyType=HASH ^
  --global-secondary-indexes "IndexName=JobIndex,KeySchema=[{AttributeName=jobId,KeyType=HASH},{AttributeName=stage,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" "IndexName=ApplicantIndex,KeySchema=[{AttributeName=applicantId,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" ^
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 ^
  --tags Key=Environment,Value=%ENVIRONMENT% Key=Project,Value=%PROJECT_NAME% >nul

echo Created Applications table

REM Applicants Table
aws dynamodb create-table ^
  --table-name "%PROJECT_NAME%-applicants-%ENVIRONMENT%" ^
  --attribute-definitions AttributeName=applicantId,AttributeType=S AttributeName=email,AttributeType=S ^
  --key-schema AttributeName=applicantId,KeyType=HASH ^
  --global-secondary-indexes "IndexName=EmailIndex,KeySchema=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" ^
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 ^
  --tags Key=Environment,Value=%ENVIRONMENT% Key=Project,Value=%PROJECT_NAME% >nul

echo Created Applicants table

REM Tests Table
aws dynamodb create-table ^
  --table-name "%PROJECT_NAME%-tests-%ENVIRONMENT%" ^
  --attribute-definitions AttributeName=testId,AttributeType=S AttributeName=jobId,AttributeType=S ^
  --key-schema AttributeName=testId,KeyType=HASH ^
  --global-secondary-indexes "IndexName=JobIndex,KeySchema=[{AttributeName=jobId,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" ^
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 ^
  --tags Key=Environment,Value=%ENVIRONMENT% Key=Project,Value=%PROJECT_NAME% >nul

echo Created Tests table

REM Test Submissions Table
aws dynamodb create-table ^
  --table-name "%PROJECT_NAME%-test-submissions-%ENVIRONMENT%" ^
  --attribute-definitions AttributeName=submissionId,AttributeType=S AttributeName=testId,AttributeType=S AttributeName=applicantId,AttributeType=S ^
  --key-schema AttributeName=submissionId,KeyType=HASH ^
  --global-secondary-indexes "IndexName=TestIndex,KeySchema=[{AttributeName=testId,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" "IndexName=ApplicantIndex,KeySchema=[{AttributeName=applicantId,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" ^
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 ^
  --tags Key=Environment,Value=%ENVIRONMENT% Key=Project,Value=%PROJECT_NAME% >nul

echo Created Test Submissions table

REM Notifications Table
aws dynamodb create-table ^
  --table-name "%PROJECT_NAME%-notifications-%ENVIRONMENT%" ^
  --attribute-definitions AttributeName=notificationId,AttributeType=S AttributeName=recipientId,AttributeType=S ^
  --key-schema AttributeName=notificationId,KeyType=HASH ^
  --global-secondary-indexes "IndexName=RecipientIndex,KeySchema=[{AttributeName=recipientId,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" ^
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 ^
  --tags Key=Environment,Value=%ENVIRONMENT% Key=Project,Value=%PROJECT_NAME% >nul

echo Created Notifications table

echo.
echo Creating Environment Configuration...

REM Create .env file for frontend
(
echo NEXT_PUBLIC_AWS_REGION=%AWS_REGION%
echo NEXT_PUBLIC_USER_POOL_ID=%USER_POOL_ID%
echo NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID=%USER_POOL_CLIENT_ID%
echo NEXT_PUBLIC_S3_BUCKET_RESUMES=%RESUMES_BUCKET%
echo NEXT_PUBLIC_S3_BUCKET_VIDEOS=%VIDEOS_BUCKET%
) > ..\frontend\.env.%ENVIRONMENT%

REM Create backend environment variables
(
echo STAGE=%ENVIRONMENT%
echo REGION=%AWS_REGION%
echo JOBS_TABLE=%PROJECT_NAME%-jobs-%ENVIRONMENT%
echo APPLICANTS_TABLE=%PROJECT_NAME%-applicants-%ENVIRONMENT%
echo APPLICATIONS_TABLE=%PROJECT_NAME%-applications-%ENVIRONMENT%
echo TESTS_TABLE=%PROJECT_NAME%-tests-%ENVIRONMENT%
echo TEST_SUBMISSIONS_TABLE=%PROJECT_NAME%-test-submissions-%ENVIRONMENT%
echo NOTIFICATIONS_TABLE=%PROJECT_NAME%-notifications-%ENVIRONMENT%
echo S3_BUCKET_RESUMES=%RESUMES_BUCKET%
echo S3_BUCKET_VIDEOS=%VIDEOS_BUCKET%
echo USER_POOL_ID=%USER_POOL_ID%
) > ..\backend\.env.%ENVIRONMENT%

echo.
echo ========================================
echo AWS Infrastructure Setup Complete!
echo ========================================
echo.
echo Environment: %ENVIRONMENT%
echo AWS Region: %AWS_REGION%
echo Account ID: %ACCOUNT_ID%
echo.
echo Cognito Configuration:
echo - User Pool ID: %USER_POOL_ID%
echo - Client ID: %USER_POOL_CLIENT_ID%
echo.
echo S3 Buckets:
echo - Resumes: %RESUMES_BUCKET%
echo - Videos: %VIDEOS_BUCKET%
echo.
echo Created environment files:
echo - frontend\.env.%ENVIRONMENT%
echo - backend\.env.%ENVIRONMENT%
echo.

set /p CREATE_ADMIN="Create admin user now? (y/N): "
if /i "%CREATE_ADMIN%"=="y" (
    echo.
    set /p ADMIN_EMAIL="Enter admin email: "
    set /p ADMIN_PASSWORD="Enter temporary password: "

    aws cognito-idp admin-create-user --user-pool-id %USER_POOL_ID% --username %ADMIN_EMAIL% --user-attributes Name=email,Value=%ADMIN_EMAIL% Name=given_name,Value=Admin Name=family_name,Value=User --temporary-password %ADMIN_PASSWORD% --message-action SUPPRESS
    aws cognito-idp admin-add-user-to-group --user-pool-id %USER_POOL_ID% --username %ADMIN_EMAIL% --group-name admins

    echo.
    echo Created admin user: %ADMIN_EMAIL%
    echo Please change the temporary password on first login
)

echo.
echo ========================================
echo Next Steps
echo ========================================
echo 1. Install dependencies separately:
echo    - Run: fix-npm.bat (to fix npm issues)
echo    - Or install manually in frontend and backend folders
echo.
echo 2. Deploy backend:
echo    cd ..\backend
echo    npm run deploy:%ENVIRONMENT%
echo.
echo 3. Start frontend development:
echo    cd ..\frontend
echo    npm run dev
echo.
echo AWS infrastructure is ready!
pause