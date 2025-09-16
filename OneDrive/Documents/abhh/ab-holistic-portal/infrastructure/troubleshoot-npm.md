# 🔧 NPM Install Troubleshooting Guide

## Common Causes & Solutions for NPM Install Getting Stuck

### 1. **Clear NPM Cache**
```bash
# Clear npm cache completely
npm cache clean --force

# Verify cache is cleared
npm cache verify
```

### 2. **Delete node_modules and package-lock.json**
```bash
# In frontend directory
cd frontend
rm -rf node_modules package-lock.json
npm install

# In backend directory
cd ../backend
rm -rf node_modules package-lock.json
npm install
```

### 3. **Network/Registry Issues**
```bash
# Check current registry
npm config get registry

# Switch to official npm registry
npm config set registry https://registry.npmjs.org/

# Or try yarn instead of npm
npm install -g yarn
yarn install
```

### 4. **Timeout Issues**
```bash
# Increase timeout
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm install --verbose
```

### 5. **Corporate Network/Proxy**
```bash
# If behind corporate firewall
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Or disable strict SSL
npm config set strict-ssl false
```

### 6. **Node Version Issues**
```bash
# Check Node version
node --version

# Should be 18.x or higher
# Install/update Node.js if needed
```

## Quick Fix Script for Windows

Save as `fix-npm.bat`:
```batch
@echo off
echo Fixing NPM installation issues...

echo Step 1: Clearing NPM cache
npm cache clean --force

echo Step 2: Cleaning frontend dependencies
cd frontend
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
npm install

echo Step 3: Cleaning backend dependencies
cd ..\backend
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
npm install

echo Done!
pause
```

## Alternative: Use Yarn
```bash
# Install yarn globally
npm install -g yarn

# Use yarn instead of npm
cd frontend
yarn install

cd ../backend
yarn install
```