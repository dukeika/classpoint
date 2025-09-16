@echo off
REM Fix Serverless Framework Issues
echo ========================================
echo Serverless Framework Fix Script
echo ========================================
echo.

echo Checking current setup...

REM Check if we're in the right directory
if not exist "..\backend\serverless.yml" (
    echo ERROR: Please run this from the infrastructure directory
    echo The backend folder should be accessible from here
    pause
    exit /b 1
)

echo Step 1: Install Serverless Framework globally...
npm install -g serverless
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Global install failed, trying with elevated permissions
    echo Please run this command as Administrator if issues persist
)

echo.
echo Step 2: Check Serverless installation...
serverless --version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Serverless installation failed
    echo Try running: npm install -g serverless --force
    pause
    exit /b 1
)

echo.
echo Step 3: Navigate to backend and check dependencies...
cd ..\backend

echo Current directory: %CD%

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing backend dependencies...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo NPM install failed. Trying to fix...
        npm cache clean --force
        npm install --no-optional --no-audit
    )
)

echo.
echo Step 4: Check serverless.yml configuration...
if not exist "serverless.yml" (
    echo ERROR: serverless.yml not found in backend directory
    pause
    exit /b 1
)

echo Found serverless.yml

echo.
echo Step 5: Test serverless configuration...
echo Testing serverless info...
serverless info --stage dev
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Serverless info failed (expected if not deployed yet)
)

echo.
echo Step 6: Set up environment variables...
if not exist ".env.dev" (
    echo Creating minimal .env.dev file...
    (
    echo STAGE=dev
    echo REGION=us-east-1
    echo JOBS_TABLE=ab-holistic-portal-jobs-dev
    echo APPLICANTS_TABLE=ab-holistic-portal-applicants-dev
    echo APPLICATIONS_TABLE=ab-holistic-portal-applications-dev
    echo TESTS_TABLE=ab-holistic-portal-tests-dev
    echo TEST_SUBMISSIONS_TABLE=ab-holistic-portal-test-submissions-dev
    echo NOTIFICATIONS_TABLE=ab-holistic-portal-notifications-dev
    echo USER_POOL_ID=your-user-pool-id
    echo JWT_SECRET=your-jwt-secret-change-this
    ) > .env.dev
    echo Created .env.dev with default values
    echo Please update USER_POOL_ID with your actual Cognito User Pool ID
)

echo.
echo Step 7: Try serverless deployment with verbose output...
set /p DEPLOY_NOW="Try deployment now? (y/N): "
if /i "%DEPLOY_NOW%"=="y" (
    echo Deploying with verbose output...
    serverless deploy --stage dev --verbose
)

echo.
echo ========================================
echo Serverless Fix Complete
echo ========================================
echo.
echo If deployment still fails, check:
echo 1. AWS credentials are configured: aws sts get-caller-identity
echo 2. User Pool ID is correct in .env.dev
echo 3. IAM permissions for Lambda, API Gateway, DynamoDB
echo 4. Node.js version is 18+ : node --version
echo.

cd ..\infrastructure
pause