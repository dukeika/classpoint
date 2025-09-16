@echo off
echo ========================================
echo Backend Dependencies Installation Script
echo ========================================
echo.

echo Current directory: %CD%
echo.

echo Step 1: Checking if we're in the right place...
if not exist "package.json" (
    echo ERROR: package.json not found. Please run this from the backend directory.
    pause
    exit /b 1
)

echo Found package.json
echo.

echo Step 2: Cleaning up old installations...
if exist node_modules (
    echo Removing old node_modules...
    rmdir /s /q node_modules
)

if exist package-lock.json (
    echo Removing old package-lock.json...
    del package-lock.json
)

echo.
echo Step 3: Clearing npm cache...
npm cache clean --force

echo.
echo Step 4: Setting npm configuration...
npm config set registry https://registry.npmjs.org/
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000

echo.
echo Step 5: Installing dependencies...
echo This may take a few minutes...
npm install --verbose --no-audit --no-fund

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS: Dependencies installed!
    echo ========================================
    echo.
    echo Verifying installation...
    if exist node_modules (
        echo ✓ node_modules directory created
        echo ✓ Key packages:
        if exist "node_modules\@aws-sdk" echo   - AWS SDK: Found
        if exist "node_modules\typescript" echo   - TypeScript: Found
        if exist "node_modules\serverless" echo   - Serverless: Found
        echo.
        echo You can now run: npm run deploy:dev
    ) else (
        echo WARNING: node_modules not found after installation
    )
) else (
    echo.
    echo ========================================
    echo FAILED: NPM installation failed
    echo ========================================
    echo.
    echo Trying alternative method with yarn...

    echo Installing yarn globally...
    npm install -g yarn

    if %ERRORLEVEL% EQU 0 (
        echo Using yarn to install dependencies...
        yarn install

        if %ERRORLEVEL% EQU 0 (
            echo SUCCESS: Yarn installation completed!
        ) else (
            echo FAILED: Both npm and yarn failed
            echo.
            echo Possible solutions:
            echo 1. Check internet connection
            echo 2. Try running as Administrator
            echo 3. Disable antivirus temporarily
            echo 4. Check available disk space
        )
    )
)

echo.
pause