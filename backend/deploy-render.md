# Render.com Deployment Guide for Sha Pay Backend

## Issues Identified and Fixed

### 1. Cross-Platform Script Issues
- **Problem**: The `prod:start` script used Windows-specific `set` command
- **Fix**: Updated to use cross-platform `NODE_ENV=production node server.js`

### 2. Missing Render Configuration
- **Problem**: No render.yaml configuration file
- **Fix**: Created render.yaml with proper service configuration

### 3. Environment Variables
- **Problem**: Missing or incorrect environment variable configuration
- **Fix**: Configured proper environment variables in render.yaml

## Deployment Steps

### Step 1: Push Updated Code to GitHub
```bash
git add .
git commit -m "Fix Render deployment configuration"
git push origin main
```

### Step 2: Configure Render Service
1. Go to [Render.com Dashboard](https://dashboard.render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Use these settings:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm run prod:start`
   - **Environment**: Node
   - **Node Version**: 18 or higher

### Step 3: Set Environment Variables
In Render dashboard, add these environment variables:
- `NODE_ENV=production`
- `PORT=10000` (Render automatically sets this)
- `DATABASE_URL` (from your PostgreSQL database)
- `JWT_SECRET` (generate a secure random string)
- `JWT_REFRESH_SECRET` (generate another secure random string)

### Step 4: Create PostgreSQL Database
1. In Render dashboard, create a new PostgreSQL database
2. Copy the connection string
3. Add it as `DATABASE_URL` environment variable

### Step 5: Deploy
1. Trigger manual deploy in Render dashboard
2. Monitor logs for any errors
3. Test the health endpoint: `https://your-service.onrender.com/api/health`

## Common Issues and Solutions

### Issue: Build Fails
- Check that `package.json` is in the backend directory
- Verify all dependencies are listed in package.json
- Check build logs for specific error messages

### Issue: Service Won't Start
- Verify environment variables are set correctly
- Check that DATABASE_URL is properly formatted
- Review application logs for startup errors

### Issue: Database Connection Fails
- Ensure PostgreSQL database is created and running
- Verify DATABASE_URL format: `postgresql://user:password@host:port/database`
- Check database credentials and permissions

## Health Check
Once deployed, test the service:
```bash
curl https://your-service.onrender.com/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2024-01-XX...",
  "uptime": 123.45,
  "environment": "production"
}
```