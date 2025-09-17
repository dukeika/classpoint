@echo off
echo ============================================
echo  AB Holistic Portal - AWS Resource Setup
echo ============================================

echo.
echo This script will create the required AWS resources:
echo - Cognito User Pool and User Pool Client
echo - S3 Buckets for file storage
echo - Admin user for testing
echo.

set /p CONFIRM=Do you want to continue? (y/n):
if /i "%CONFIRM%" neq "y" exit /b 0

echo.
echo [1/6] Getting AWS Account ID...
for /f "tokens=*" %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
echo Account ID: %ACCOUNT_ID%

echo.
echo [2/6] Creating Cognito User Pool...
for /f "tokens=*" %%i in ('aws cognito-idp create-user-pool --pool-name "ab-holistic-portal-dev" --policies "{\"PasswordPolicy\":{\"MinimumLength\":8,\"RequireUppercase\":true,\"RequireLowercase\":true,\"RequireNumbers\":true,\"RequireSymbols\":false}}" --auto-verified-attributes email --username-attributes email --region us-west-1 --query UserPool.Id --output text') do set USER_POOL_ID=%%i
echo User Pool ID: %USER_POOL_ID%

echo.
echo [3/6] Creating User Pool Client...
for /f "tokens=*" %%i in ('aws cognito-idp create-user-pool-client --user-pool-id %USER_POOL_ID% --client-name "ab-holistic-portal-dev-client" --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH --region us-west-1 --query UserPoolClient.ClientId --output text') do set USER_POOL_CLIENT_ID=%%i
echo User Pool Client ID: %USER_POOL_CLIENT_ID%

echo.
echo [4/6] Creating S3 buckets...
set RESUMES_BUCKET=ab-holistic-portal-resumes-dev-%ACCOUNT_ID%
set VIDEOS_BUCKET=ab-holistic-portal-videos-dev-%ACCOUNT_ID%

aws s3 mb s3://%RESUMES_BUCKET% --region us-west-1
aws s3 mb s3://%VIDEOS_BUCKET% --region us-west-1

echo.
echo [5/6] Configuring S3 bucket security...
aws s3api put-public-access-block --bucket %RESUMES_BUCKET% --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-public-access-block --bucket %VIDEOS_BUCKET% --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo.
echo [6/6] Creating admin user groups...
aws cognito-idp create-group --group-name "admins" --user-pool-id %USER_POOL_ID% --description "Admin users with full access" --precedence 1 --region us-west-1
aws cognito-idp create-group --group-name "applicants" --user-pool-id %USER_POOL_ID% --description "Applicant users" --precedence 2 --region us-west-1

echo.
echo ============================================
echo  AWS RESOURCES CREATED SUCCESSFULLY!
echo ============================================
echo.
echo User Pool ID: %USER_POOL_ID%
echo User Pool Client ID: %USER_POOL_CLIENT_ID%
echo Resumes Bucket: %RESUMES_BUCKET%
echo Videos Bucket: %VIDEOS_BUCKET%
echo.
echo Next Steps:
echo 1. Update backend/.env.dev with these values
echo 2. Run backend/deploy-simple.bat to deploy functions
echo 3. Create an admin user in AWS Cognito Console
echo.

echo Creating backend/.env.dev file...
(
echo STAGE=dev
echo REGION=us-west-1
echo USER_POOL_ID=%USER_POOL_ID%
echo USER_POOL_WEB_CLIENT_ID=%USER_POOL_CLIENT_ID%
echo JWT_SECRET=change-this-to-a-secure-secret-key-in-production
echo S3_BUCKET_RESUMES=%RESUMES_BUCKET%
echo S3_BUCKET_VIDEOS=%VIDEOS_BUCKET%
) > backend\.env.dev

echo.
echo Environment file updated: backend/.env.dev
echo.
pause