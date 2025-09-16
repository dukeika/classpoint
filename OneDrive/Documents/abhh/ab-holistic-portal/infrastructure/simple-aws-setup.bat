@echo off
echo ========================================
echo Simple AWS Resource Creation
echo ========================================
echo.

echo Let's create AWS resources one by one with simple commands.
echo Please copy and paste each command into PowerShell when prompted.
echo.

echo Step 1: Check AWS Configuration
echo ================================
echo.
echo Copy this command into PowerShell:
echo aws sts get-caller-identity
echo.
pause

echo Step 2: Create Cognito User Pool
echo ==================================
echo.
echo Copy this command into PowerShell (all on one line):
echo.
echo aws cognito-idp create-user-pool --pool-name "ab-holistic-portal-users-dev" --policies '{\"PasswordPolicy\":{\"MinimumLength\":8,\"RequireUppercase\":true,\"RequireLowercase\":true,\"RequireNumbers\":true,\"RequireSymbols\":true}}' --auto-verified-attributes email --username-attributes email --query "UserPool.Id" --output text
echo.
echo IMPORTANT: Copy the User Pool ID that gets returned (looks like: us-east-1_XXXXXXXXX)
echo.
set /p USER_POOL_ID="Paste the User Pool ID here: "
echo You entered: %USER_POOL_ID%
echo.

echo Step 3: Create User Pool Client
echo =================================
echo.
echo Copy this command into PowerShell (replace YOUR_POOL_ID with the ID above):
echo.
echo aws cognito-idp create-user-pool-client --user-pool-id %USER_POOL_ID% --client-name "ab-holistic-portal-client-dev" --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH --query "UserPoolClient.ClientId" --output text
echo.
echo IMPORTANT: Copy the Client ID that gets returned
echo.
set /p USER_POOL_CLIENT_ID="Paste the Client ID here: "
echo You entered: %USER_POOL_CLIENT_ID%
echo.

echo Step 4: Create User Groups
echo ============================
echo.
echo Copy these commands into PowerShell one by one:
echo.
echo aws cognito-idp create-group --group-name "admins" --user-pool-id %USER_POOL_ID% --description "Admin users" --precedence 1
echo.
echo aws cognito-idp create-group --group-name "applicants" --user-pool-id %USER_POOL_ID% --description "Applicant users" --precedence 2
echo.
pause

echo Step 5: Get Account ID for S3 Buckets
echo =======================================
echo.
echo Copy this command into PowerShell:
echo.
echo aws sts get-caller-identity --query Account --output text
echo.
set /p ACCOUNT_ID="Paste your Account ID here: "
echo You entered: %ACCOUNT_ID%
echo.

echo Step 6: Create S3 Buckets
echo ==========================
echo.
echo Copy these commands into PowerShell one by one:
echo.
echo aws s3 mb s3://ab-holistic-portal-resumes-dev-%ACCOUNT_ID% --region us-east-1
echo.
echo aws s3 mb s3://ab-holistic-portal-videos-dev-%ACCOUNT_ID% --region us-east-1
echo.
pause

echo Step 7: Secure S3 Buckets
echo ==========================
echo.
echo Copy these commands into PowerShell one by one:
echo.
echo aws s3api put-public-access-block --bucket ab-holistic-portal-resumes-dev-%ACCOUNT_ID% --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
echo.
echo aws s3api put-public-access-block --bucket ab-holistic-portal-videos-dev-%ACCOUNT_ID% --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
echo.
pause

echo Step 8: Create Environment Files
echo ==================================
echo.
echo Creating frontend/.env.dev...

REM Create frontend environment file
(
echo NEXT_PUBLIC_AWS_REGION=us-east-1
echo NEXT_PUBLIC_USER_POOL_ID=%USER_POOL_ID%
echo NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID=%USER_POOL_CLIENT_ID%
echo NEXT_PUBLIC_S3_BUCKET_RESUMES=ab-holistic-portal-resumes-dev-%ACCOUNT_ID%
echo NEXT_PUBLIC_S3_BUCKET_VIDEOS=ab-holistic-portal-videos-dev-%ACCOUNT_ID%
) > ..\frontend\.env.dev

echo Created: frontend\.env.dev

REM Create backend environment file
(
echo STAGE=dev
echo REGION=us-east-1
echo USER_POOL_ID=%USER_POOL_ID%
echo JWT_SECRET=change-this-to-a-secure-secret-key
echo JOBS_TABLE=ab-holistic-portal-jobs-dev
echo APPLICANTS_TABLE=ab-holistic-portal-applicants-dev
echo APPLICATIONS_TABLE=ab-holistic-portal-applications-dev
echo TESTS_TABLE=ab-holistic-portal-tests-dev
echo TEST_SUBMISSIONS_TABLE=ab-holistic-portal-test-submissions-dev
echo NOTIFICATIONS_TABLE=ab-holistic-portal-notifications-dev
echo S3_BUCKET_RESUMES=ab-holistic-portal-resumes-dev-%ACCOUNT_ID%
echo S3_BUCKET_VIDEOS=ab-holistic-portal-videos-dev-%ACCOUNT_ID%
) > ..\backend\.env.dev

echo Created: backend\.env.dev

echo.
echo ========================================
echo Setup Summary
echo ========================================
echo.
echo Cognito User Pool ID: %USER_POOL_ID%
echo Cognito Client ID: %USER_POOL_CLIENT_ID%
echo Account ID: %ACCOUNT_ID%
echo.
echo S3 Buckets:
echo - ab-holistic-portal-resumes-dev-%ACCOUNT_ID%
echo - ab-holistic-portal-videos-dev-%ACCOUNT_ID%
echo.
echo Environment files created:
echo - frontend\.env.dev
echo - backend\.env.dev
echo.

echo Step 9: Create Admin User (Optional)
echo ======================================
echo.
set /p CREATE_ADMIN="Create admin user now? (y/N): "
if /i "%CREATE_ADMIN%"=="y" (
    set /p ADMIN_EMAIL="Enter admin email: "
    set /p ADMIN_PASSWORD="Enter temporary password (8+ chars, mixed case, numbers, symbols): "

    echo.
    echo Copy this command into PowerShell:
    echo.
    echo aws cognito-idp admin-create-user --user-pool-id %USER_POOL_ID% --username !ADMIN_EMAIL! --user-attributes Name=email,Value=!ADMIN_EMAIL! Name=given_name,Value=Admin Name=family_name,Value=User --temporary-password !ADMIN_PASSWORD! --message-action SUPPRESS
    echo.
    echo Then copy this command:
    echo.
    echo aws cognito-idp admin-add-user-to-group --user-pool-id %USER_POOL_ID% --username !ADMIN_EMAIL! --group-name admins
    echo.
    pause
)

echo.
echo ========================================
echo Next Steps
echo ========================================
echo.
echo 1. Install Serverless Framework globally:
echo    npm install -g serverless
echo.
echo 2. Install backend dependencies:
echo    cd backend
echo    npm install
echo.
echo 3. Deploy backend:
echo    npm run deploy:dev
echo.
echo 4. Install frontend dependencies:
echo    cd ..\frontend
echo    npm install
echo.
echo 5. Start development server:
echo    npm run dev
echo.
echo All AWS resources have been created!
echo Check the environment files for your configuration.
echo.
pause