#!/bin/bash

# Heroku Deployment Script for Sha Pay Backend
# Usage: ./scripts/deploy-heroku.sh [app-name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default app name
APP_NAME=${1:-sha-pay-backend}

echo -e "${BLUE}🚀 Starting Heroku deployment for ${APP_NAME}...${NC}"

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo -e "${RED}❌ Heroku CLI is not installed. Please install it first.${NC}"
    echo -e "${YELLOW}Visit: https://devcenter.heroku.com/articles/heroku-cli${NC}"
    exit 1
fi

# Check if user is logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Please log in to Heroku first${NC}"
    heroku auth:login
fi

# Check if app exists, create if not
echo -e "${BLUE}🔍 Checking if app ${APP_NAME} exists...${NC}"
if ! heroku apps:info ${APP_NAME} &> /dev/null; then
    echo -e "${YELLOW}📱 Creating new Heroku app: ${APP_NAME}${NC}"
    heroku create ${APP_NAME} --region us
    
    # Add PostgreSQL addon
    echo -e "${BLUE}🗄️  Adding PostgreSQL addon...${NC}"
    heroku addons:create heroku-postgresql:mini --app ${APP_NAME}
    
    # Add Papertrail for logging
    echo -e "${BLUE}📋 Adding Papertrail for logging...${NC}"
    heroku addons:create papertrail:choklad --app ${APP_NAME}
else
    echo -e "${GREEN}✅ App ${APP_NAME} already exists${NC}"
fi

# Set environment variables
echo -e "${BLUE}🔧 Setting environment variables...${NC}"
heroku config:set NODE_ENV=production --app ${APP_NAME}
heroku config:set STORAGE_PROVIDER=cloudinary --app ${APP_NAME}

# Prompt for required environment variables if not set
echo -e "${YELLOW}⚠️  Please set the following environment variables manually:${NC}"
echo "heroku config:set JWT_SECRET=your_jwt_secret --app ${APP_NAME}"
echo "heroku config:set ENCRYPTION_KEY=your_encryption_key --app ${APP_NAME}"
echo "heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name --app ${APP_NAME}"
echo "heroku config:set CLOUDINARY_API_KEY=your_api_key --app ${APP_NAME}"
echo "heroku config:set CLOUDINARY_API_SECRET=your_api_secret --app ${APP_NAME}"
echo "heroku config:set EMAIL_USER=your_email --app ${APP_NAME}"
echo "heroku config:set EMAIL_PASS=your_email_password --app ${APP_NAME}"
echo "heroku config:set PAYSTACK_SECRET_KEY=your_paystack_secret --app ${APP_NAME}"
echo "heroku config:set PAYSTACK_PUBLIC_KEY=your_paystack_public --app ${APP_NAME}"

# Add git remote if not exists
echo -e "${BLUE}🔗 Setting up git remote...${NC}"
if ! git remote get-url heroku &> /dev/null; then
    heroku git:remote -a ${APP_NAME}
fi

# Deploy to Heroku
echo -e "${BLUE}🚀 Deploying to Heroku...${NC}"
git add .
git commit -m "Deploy to Heroku: $(date)" || echo "No changes to commit"
git push heroku main

# Run database migrations
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
heroku run npm run db:migrate --app ${APP_NAME}

# Open the app
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}🌐 Opening app in browser...${NC}"
heroku open --app ${APP_NAME}

# Show logs
echo -e "${BLUE}📋 Showing recent logs...${NC}"
heroku logs --tail --app ${APP_NAME}