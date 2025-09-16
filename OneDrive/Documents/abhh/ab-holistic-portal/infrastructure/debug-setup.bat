@echo off
REM Debug and Fix AWS Setup Issues
echo ========================================
echo AWS Setup Debugging Tool
echo ========================================
echo.

echo Step 1: Checking AWS CLI Status...
aws sts get-caller-identity
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: AWS CLI not configured properly
    echo Please run: aws configure
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
for /f "tokens=*" %%i in ('aws configure get region') do set AWS_REGION=%%i

echo Account ID: %ACCOUNT_ID%
echo Region: %AWS_REGION%
echo.

echo Step 2: Checking existing Cognito User Pools...
aws cognito-idp list-user-pools --max-items 10

echo.
echo Step 3: Checking existing S3 buckets...
aws s3 ls | findstr ab-holistic

echo.
echo Step 4: Checking DynamoDB tables...
aws dynamodb list-tables --query "TableNames[?contains(@, 'ab-holistic')]"

echo.
echo Step 5: Manual Cognito User Pool Creation...
set /p CREATE_COGNITO="Create User Pool manually? (y/N): "
if /i "%CREATE_COGNITO%"=="y" (
    echo Creating User Pool...

    REM Simple User Pool creation
    aws cognito-idp create-user-pool ^
        --pool-name "ab-holistic-portal-users-dev" ^
        --policies "{\"PasswordPolicy\":{\"MinimumLength\":8,\"RequireUppercase\":true,\"RequireLowercase\":true,\"RequireNumbers\":true,\"RequireSymbols\":true}}" ^
        --auto-verified-attributes email ^
        --username-attributes email ^
        --query "UserPool.Id" ^
        --output text > temp_pool_id.txt

    set /p USER_POOL_ID=<temp_pool_id.txt
    del temp_pool_id.txt

    echo User Pool ID: %USER_POOL_ID%

    REM Create Client
    aws cognito-idp create-user-pool-client ^
        --user-pool-id %USER_POOL_ID% ^
        --client-name "ab-holistic-portal-client-dev" ^
        --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH ^
        --query "UserPoolClient.ClientId" ^
        --output text > temp_client_id.txt

    set /p USER_POOL_CLIENT_ID=<temp_client_id.txt
    del temp_client_id.txt

    echo User Pool Client ID: %USER_POOL_CLIENT_ID%

    REM Create Groups
    aws cognito-idp create-group --group-name "admins" --user-pool-id %USER_POOL_ID% --description "Admin users" --precedence 1
    aws cognito-idp create-group --group-name "applicants" --user-pool-id %USER_POOL_ID% --description "Applicant users" --precedence 2

    echo Groups created successfully

    REM Save to environment file
    (
    echo NEXT_PUBLIC_AWS_REGION=%AWS_REGION%
    echo NEXT_PUBLIC_USER_POOL_ID=%USER_POOL_ID%
    echo NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID=%USER_POOL_CLIENT_ID%
    ) > ..\frontend\.env.dev

    echo Environment file created: frontend\.env.dev
)

echo.
echo Step 6: Create S3 Buckets...
set /p CREATE_S3="Create S3 buckets manually? (y/N): "
if /i "%CREATE_S3%"=="y" (
    set RESUMES_BUCKET=ab-holistic-portal-resumes-dev-%ACCOUNT_ID%
    set VIDEOS_BUCKET=ab-holistic-portal-videos-dev-%ACCOUNT_ID%

    echo Creating bucket: %RESUMES_BUCKET%
    aws s3 mb s3://%RESUMES_BUCKET% --region %AWS_REGION%

    echo Creating bucket: %VIDEOS_BUCKET%
    aws s3 mb s3://%VIDEOS_BUCKET% --region %AWS_REGION%

    echo Buckets created successfully

    REM Add to environment file
    echo NEXT_PUBLIC_S3_BUCKET_RESUMES=%RESUMES_BUCKET% >> ..\frontend\.env.dev
    echo NEXT_PUBLIC_S3_BUCKET_VIDEOS=%VIDEOS_BUCKET% >> ..\frontend\.env.dev
)

echo.
echo Step 7: Check Serverless Framework...
where serverless >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Serverless Framework not found globally
    echo Installing serverless framework...
    npm install -g serverless
) else (
    echo Serverless Framework is installed
    serverless --version
)

echo.
echo Step 8: Check Node.js and NPM...
node --version
npm --version

echo.
echo ========================================
echo Debug Complete
echo ========================================
echo.
echo Check the output above for any errors.
echo.
echo Common fixes:
echo 1. If Cognito creation failed: Check IAM permissions
echo 2. If S3 creation failed: Check region and bucket naming
echo 3. If Serverless not found: Install globally with npm install -g serverless
echo 4. If Node.js issues: Update to Node 18+
echo.
pause