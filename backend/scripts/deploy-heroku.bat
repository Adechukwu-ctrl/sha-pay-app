@echo off
setlocal enabledelayedexpansion

REM Heroku Deployment Script for Sha Pay Backend (Windows)
REM Usage: .\scripts\deploy-heroku.bat [app-name]

set "APP_NAME=%1"
if "%APP_NAME%"=="" set "APP_NAME=sha-pay-backend"

echo 🚀 Starting Heroku deployment for %APP_NAME%...

REM Check if Heroku CLI is installed
heroku --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Heroku CLI is not installed. Please install it first.
    echo Visit: https://devcenter.heroku.com/articles/heroku-cli
    pause
    exit /b 1
)

REM Check if user is logged in to Heroku
heroku auth:whoami >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Please log in to Heroku first
    heroku auth:login
)

REM Check if app exists, create if not
echo 🔍 Checking if app %APP_NAME% exists...
heroku apps:info %APP_NAME% >nul 2>&1
if errorlevel 1 (
    echo 📱 Creating new Heroku app: %APP_NAME%
    heroku create %APP_NAME% --region us
    
    REM Add PostgreSQL addon
    echo 🗄️ Adding PostgreSQL addon...
    heroku addons:create heroku-postgresql:mini --app %APP_NAME%
    
    REM Add Papertrail for logging
    echo 📋 Adding Papertrail for logging...
    heroku addons:create papertrail:choklad --app %APP_NAME%
) else (
    echo ✅ App %APP_NAME% already exists
)

REM Set environment variables
echo 🔧 Setting environment variables...
heroku config:set NODE_ENV=production --app %APP_NAME%
heroku config:set STORAGE_PROVIDER=cloudinary --app %APP_NAME%

REM Prompt for required environment variables
echo.
echo ⚠️ Please set the following environment variables manually:
echo heroku config:set JWT_SECRET=your_jwt_secret --app %APP_NAME%
echo heroku config:set ENCRYPTION_KEY=your_encryption_key --app %APP_NAME%
echo heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name --app %APP_NAME%
echo heroku config:set CLOUDINARY_API_KEY=your_api_key --app %APP_NAME%
echo heroku config:set CLOUDINARY_API_SECRET=your_api_secret --app %APP_NAME%
echo heroku config:set EMAIL_USER=your_email --app %APP_NAME%
echo heroku config:set EMAIL_PASS=your_email_password --app %APP_NAME%
echo heroku config:set PAYSTACK_SECRET_KEY=your_paystack_secret --app %APP_NAME%
echo heroku config:set PAYSTACK_PUBLIC_KEY=your_paystack_public --app %APP_NAME%
echo.
echo Press any key to continue after setting environment variables...
pause

REM Add git remote if not exists
echo 🔗 Setting up git remote...
git remote get-url heroku >nul 2>&1
if errorlevel 1 (
    heroku git:remote -a %APP_NAME%
)

REM Deploy to Heroku
echo 🚀 Deploying to Heroku...
git add .
git commit -m "Deploy to Heroku: %date% %time%" 2>nul || echo No changes to commit
git push heroku main

REM Run database migrations
echo 🗄️ Running database migrations...
heroku run npm run db:migrate --app %APP_NAME%

REM Show completion message
echo ✅ Deployment completed successfully!
echo 🌐 Opening app in browser...
heroku open --app %APP_NAME%

echo 📋 Showing recent logs...
heroku logs --tail --app %APP_NAME%

pause