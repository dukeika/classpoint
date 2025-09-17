@echo off
echo ====================================
echo  AB Holistic Portal - Simple Deploy
echo ====================================

echo.
echo [1/3] Building TypeScript code...
call npm run build
if errorlevel 1 (
    echo ERROR: TypeScript build failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Deploying functions only (no resources)...
call serverless deploy --config serverless-simple.yml --stage dev --region us-west-1
if errorlevel 1 (
    echo ERROR: Serverless deployment failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Deployment completed successfully!
echo.
echo API Gateway URL will be shown above.
echo Copy the URL and update your frontend environment variables.
echo.

pause