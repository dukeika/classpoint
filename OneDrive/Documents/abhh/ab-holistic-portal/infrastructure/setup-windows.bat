@echo off
REM AB Holistic Interview Portal - Windows Setup Script
REM This script provides Windows-specific setup commands

echo ========================================
echo AB Holistic Interview Portal Setup
echo ========================================
echo.

REM Check if AWS CLI is installed
where aws >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: AWS CLI is not installed.
    echo Please install AWS CLI from: https://aws.amazon.com/cli/
    echo Then run: aws configure
    pause
    exit /b 1
)

REM Check AWS CLI configuration
aws sts get-caller-identity >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: AWS CLI is not configured.
    echo Please run: aws configure
    echo Enter your Access Key ID, Secret Access Key, Region, and Output format
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

echo Setting up infrastructure for environment: %ENVIRONMENT%
echo.

REM Prompt for confirmation
set /p CONFIRM="Continue with AWS infrastructure setup? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo Setup cancelled.
    pause
    exit /b 0
)

echo.
echo ========================================
echo Step 1: Creating Cognito User Pool
echo ========================================

REM Create Cognito User Pool
for /f "tokens=*" %%i in ('aws cognito-idp create-user-pool --pool-name "ab-holistic-portal-users-%ENVIRONMENT%" --policies "{\"PasswordPolicy\":{\"MinimumLength\":8,\"RequireUppercase\":true,\"RequireLowercase\":true,\"RequireNumbers\":true,\"RequireSymbols\":true}}" --auto-verified-attributes email --username-attributes email --query "UserPool.Id" --output text') do set USER_POOL_ID=%%i

echo Created User Pool: %USER_POOL_ID%

REM Create User Pool Client
for /f "tokens=*" %%i in ('aws cognito-idp create-user-pool-client --user-pool-id %USER_POOL_ID% --client-name "ab-holistic-portal-client-%ENVIRONMENT%" --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH --query "UserPoolClient.ClientId" --output text') do set USER_POOL_CLIENT_ID=%%i

echo Created User Pool Client: %USER_POOL_CLIENT_ID%

REM Create User Groups
aws cognito-idp create-group --group-name "admins" --user-pool-id %USER_POOL_ID% --description "Admin users with full access" --precedence 1
aws cognito-idp create-group --group-name "applicants" --user-pool-id %USER_POOL_ID% --description "Applicant users" --precedence 2

echo Created user groups: admins, applicants

echo.
echo ========================================
echo Step 2: Creating S3 Buckets
echo ========================================

set RESUMES_BUCKET=ab-holistic-portal-resumes-%ENVIRONMENT%-%ACCOUNT_ID%
set VIDEOS_BUCKET=ab-holistic-portal-videos-%ENVIRONMENT%-%ACCOUNT_ID%

REM Create S3 buckets
aws s3 mb s3://%RESUMES_BUCKET% --region %AWS_REGION%
aws s3 mb s3://%VIDEOS_BUCKET% --region %AWS_REGION%

echo Created S3 buckets:
echo - Resumes: %RESUMES_BUCKET%
echo - Videos: %VIDEOS_BUCKET%

REM Configure bucket security
aws s3api put-public-access-block --bucket %RESUMES_BUCKET% --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-public-access-block --bucket %VIDEOS_BUCKET% --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo Configured bucket security settings

echo.
echo ========================================
echo Step 3: Creating Environment File
echo ========================================

REM Create .env file for frontend
(
echo NEXT_PUBLIC_AWS_REGION=%AWS_REGION%
echo NEXT_PUBLIC_USER_POOL_ID=%USER_POOL_ID%
echo NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID=%USER_POOL_CLIENT_ID%
echo NEXT_PUBLIC_S3_BUCKET_RESUMES=%RESUMES_BUCKET%
echo NEXT_PUBLIC_S3_BUCKET_VIDEOS=%VIDEOS_BUCKET%
) > ..\frontend\.env.%ENVIRONMENT%

echo Created environment file: frontend\.env.%ENVIRONMENT%

echo.
echo ========================================
echo Setup Summary
echo ========================================
echo Environment: %ENVIRONMENT%
echo AWS Region: %AWS_REGION%
echo Account ID: %ACCOUNT_ID%
echo.
echo Cognito User Pool ID: %USER_POOL_ID%
echo Cognito Client ID: %USER_POOL_CLIENT_ID%
echo.
echo S3 Resumes Bucket: %RESUMES_BUCKET%
echo S3 Videos Bucket: %VIDEOS_BUCKET%
echo.

set /p CREATE_ADMIN="Create admin user now? (y/N): "
if /i "%CREATE_ADMIN%"=="y" (
    echo.
    set /p ADMIN_EMAIL="Enter admin email: "
    set /p ADMIN_PASSWORD="Enter temporary password: "

    aws cognito-idp admin-create-user --user-pool-id %USER_POOL_ID% --username %ADMIN_EMAIL% --user-attributes Name=email,Value=%ADMIN_EMAIL% Name=given_name,Value=Admin Name=family_name,Value=User --temporary-password %ADMIN_PASSWORD% --message-action SUPPRESS
    aws cognito-idp admin-add-user-to-group --user-pool-id %USER_POOL_ID% --username %ADMIN_EMAIL% --group-name admins

    echo Created admin user: %ADMIN_EMAIL%
    echo Please change the temporary password on first login
)

echo.
echo ========================================
echo Next Steps
echo ========================================
echo 1. Review the generated .env file in frontend\.env.%ENVIRONMENT%
echo 2. Navigate to backend directory: cd backend
echo 3. Install dependencies: npm install
echo 4. Deploy backend: npm run deploy:%ENVIRONMENT%
echo 5. Navigate to frontend directory: cd ..\frontend
echo 6. Install dependencies: npm install
echo 7. Start development: npm run dev
echo.
echo Setup completed successfully!
pause