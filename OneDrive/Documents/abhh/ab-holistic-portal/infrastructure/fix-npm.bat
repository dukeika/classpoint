@echo off
echo ========================================
echo NPM Installation Fix Script
echo ========================================
echo.

echo This script will fix common NPM installation issues
echo by clearing cache and dependencies
echo.

set /p CONFIRM="Continue? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo Fix cancelled.
    pause
    exit /b 0
)

echo.
echo Step 1: Clearing NPM cache...
npm cache clean --force
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Cache clean failed, continuing...
)

echo.
echo Step 2: Checking current directory...
if not exist "..\frontend" (
    echo Error: Please run this script from the infrastructure directory
    echo Current directory should contain frontend and backend folders
    pause
    exit /b 1
)

echo.
echo Step 3: Fixing frontend dependencies...
cd ..\frontend

echo Removing old dependencies...
if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

echo Installing frontend dependencies...
npm install --verbose --no-audit --no-fund
if %ERRORLEVEL% NEQ 0 (
    echo Frontend npm install failed!
    echo Trying with increased timeout...
    npm config set fetch-retry-mintimeout 20000
    npm config set fetch-retry-maxtimeout 120000
    npm install --verbose
    if %ERRORLEVEL% NEQ 0 (
        echo Frontend installation still failing.
        echo Try using yarn instead: npm install -g yarn && yarn install
        pause
        exit /b 1
    )
)

echo Frontend dependencies installed successfully!

echo.
echo Step 4: Fixing backend dependencies...
cd ..\backend

echo Removing old dependencies...
if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

echo Installing backend dependencies...
npm install --verbose --no-audit --no-fund
if %ERRORLEVEL% NEQ 0 (
    echo Backend npm install failed!
    echo Trying with increased timeout...
    npm config set fetch-retry-mintimeout 20000
    npm config set fetch-retry-maxtimeout 120000
    npm install --verbose
    if %ERRORLEVEL% NEQ 0 (
        echo Backend installation still failing.
        echo Try using yarn instead: npm install -g yarn && yarn install
        pause
        exit /b 1
    )
)

echo Backend dependencies installed successfully!

echo.
echo ========================================
echo NPM Fix Complete!
echo ========================================
echo.
echo Both frontend and backend dependencies have been installed.
echo You can now continue with the AWS infrastructure setup.
echo.
echo Next steps:
echo 1. Continue with infrastructure setup
echo 2. Or run: cd ..\infrastructure && setup-windows.bat
echo.

cd ..\infrastructure
pause