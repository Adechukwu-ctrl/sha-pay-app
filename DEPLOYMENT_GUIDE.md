# Sha Pay Backend Deployment Guide

This guide covers multiple deployment options for the Sha Pay backend application, including cloud platforms, monitoring, and CI/CD setup.

## 📋 Prerequisites

- Node.js 18+ installed
- Docker installed (for containerized deployments)
- Git repository set up
- Cloud platform accounts (Heroku, AWS, etc.)
- Environment variables configured

## 🚀 Deployment Options

### 1. Heroku Deployment

#### Quick Deploy

```bash
# Navigate to backend directory
cd backend

# Run deployment script (Windows)
.\scripts\deploy-heroku.bat sha-pay-backend

# Or run deployment script (Linux/Mac)
./scripts/deploy-heroku.sh sha-pay-backend
```

#### Manual Heroku Setup

1. **Install Heroku CLI**
   ```bash
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   heroku --version
   ```

2. **Login to Heroku**
   ```bash
   heroku auth:login
   ```

3. **Create Heroku App**
   ```bash
   heroku create sha-pay-backend --region us
   ```

4. **Add PostgreSQL Database**
   ```bash
   heroku addons:create heroku-postgresql:mini --app sha-pay-backend
   ```

5. **Add Logging**
   ```bash
   heroku addons:create papertrail:choklad --app sha-pay-backend
   ```

6. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production --app sha-pay-backend
   heroku config:set JWT_SECRET=your_jwt_secret --app sha-pay-backend
   heroku config:set ENCRYPTION_KEY=your_encryption_key --app sha-pay-backend
   heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name --app sha-pay-backend
   heroku config:set CLOUDINARY_API_KEY=your_api_key --app sha-pay-backend
   heroku config:set CLOUDINARY_API_SECRET=your_api_secret --app sha-pay-backend
   heroku config:set EMAIL_USER=your_email --app sha-pay-backend
   heroku config:set EMAIL_PASS=your_email_password --app sha-pay-backend
   heroku config:set PAYSTACK_SECRET_KEY=your_paystack_secret --app sha-pay-backend
   heroku config:set PAYSTACK_PUBLIC_KEY=your_paystack_public --app sha-pay-backend
   heroku config:set STORAGE_PROVIDER=cloudinary --app sha-pay-backend
   ```

7. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

8. **Run Migrations**
   ```bash
   heroku run npm run db:migrate --app sha-pay-backend
   ```

### 2. AWS ECS Deployment

#### Prerequisites
- AWS CLI installed and configured
- Docker installed
- AWS account with appropriate permissions

#### Deploy to AWS

1. **Configure AWS CLI**
   ```bash
   aws configure
   ```

2. **Update AWS Configuration**
   - Edit `aws-task-definition.json`
   - Replace `YOUR_ACCOUNT_ID` with your AWS account ID
   - Replace `YOUR_REGION` with your preferred region
   - Update VPC and security group settings

3. **Run Deployment Script**
   ```bash
   ./scripts/deploy-aws.sh us-east-1 sha-pay-cluster
   ```

4. **Set up AWS Secrets Manager**
   ```bash
   # Create secrets for environment variables
   aws secretsmanager create-secret --name "sha-pay/database-url" --secret-string "your_database_url"
   aws secretsmanager create-secret --name "sha-pay/jwt-secret" --secret-string "your_jwt_secret"
   # ... repeat for all secrets
   ```

### 3. Docker Deployment

#### Build and Run Locally

```bash
# Build Docker image
docker build -t sha-pay-backend .

# Run container
docker run -p 3000:3000 --env-file .env.production sha-pay-backend
```

#### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔄 CI/CD Setup

### GitHub Actions

The repository includes a comprehensive GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

- Runs tests on every push
- Builds Docker images
- Deploys to staging (main branch)
- Deploys to production (production branch)
- Performs security scans

#### Required Secrets

Add these secrets to your GitHub repository:

```
HEROKU_API_KEY=your_heroku_api_key
```

#### Required Variables

Add these variables to your GitHub repository:

```
HEROKU_EMAIL=your_heroku_email
HEROKU_STAGING_APP=sha-pay-backend-staging
HEROKU_PRODUCTION_APP=sha-pay-backend
```

### Deployment Workflow

1. **Development**: Push to feature branches
2. **Staging**: Merge to `main` branch → Auto-deploy to staging
3. **Production**: Merge to `production` branch → Auto-deploy to production

## 📊 Monitoring and Logging

### Built-in Monitoring

The application includes comprehensive monitoring:

- **Request logging**: All HTTP requests are logged
- **Performance metrics**: Response times, error rates
- **System metrics**: Memory usage, CPU usage
- **Health checks**: Database connectivity, system health
- **Alerts**: Automated alerts for high error rates, slow responses

### Monitoring Endpoints

- **Health Check**: `GET /health`
- **Metrics**: `GET /monitoring` (requires authentication)

### Log Files

Logs are stored in the `logs/` directory:

- `app.log`: Application logs
- `error.log`: Error logs only
- `combined.log`: All logs combined
- `exceptions.log`: Unhandled exceptions
- `rejections.log`: Unhandled promise rejections

### External Monitoring Services

#### Heroku
- **Papertrail**: Centralized logging
- **Heroku Metrics**: Application metrics

#### AWS
- **CloudWatch**: Logs and metrics
- **X-Ray**: Distributed tracing (optional)

## 🔒 Security

### Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing protection
- **Rate Limiting**: API rate limiting
- **Input Validation**: Request validation
- **JWT Authentication**: Secure authentication
- **Data Encryption**: Sensitive data encryption

### Security Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS**: Always use HTTPS in production
3. **Database Security**: Use connection pooling and prepared statements
4. **Regular Updates**: Keep dependencies updated
5. **Security Scanning**: Use automated security scanning tools

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Coverage report
npm run test:coverage
```

### Test Environments

- **Local**: SQLite database
- **CI/CD**: PostgreSQL in GitHub Actions
- **Staging**: Heroku PostgreSQL
- **Production**: Production database

## 🔧 Environment Configuration

### Required Environment Variables

```env
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key

# File Storage
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Payment Gateways
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...

# Logging
LOG_LEVEL=info
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port 3000
   netstat -ano | findstr :3000
   # Kill the process
   taskkill /PID <process_id> /F
   ```

2. **Database Connection Issues**
   - Check DATABASE_URL format
   - Verify database server is running
   - Check firewall settings

3. **Environment Variables Not Loading**
   - Verify .env file location
   - Check file permissions
   - Ensure no spaces around = in .env file

4. **Memory Issues**
   - Monitor memory usage in logs
   - Increase container memory limits
   - Check for memory leaks

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
npm run prod:start
```

### Health Check

```bash
# Check application health
curl http://localhost:3000/health

# Check monitoring metrics
curl http://localhost:3000/monitoring
```

## 📞 Support

For deployment issues:

1. Check the logs first
2. Verify environment variables
3. Test database connectivity
4. Check monitoring endpoints
5. Review security settings

## 🔄 Updates and Maintenance

### Regular Maintenance

1. **Update Dependencies**
   ```bash
   npm audit
   npm update
   ```

2. **Database Maintenance**
   ```bash
   # Run migrations
   npm run db:migrate
   
   # Backup database
   npm run db:backup
   ```

3. **Log Rotation**
   - Logs are automatically rotated
   - Old logs are compressed and archived
   - Configure retention period as needed

4. **Security Updates**
   - Monitor security advisories
   - Update dependencies regularly
   - Review access logs

This deployment guide provides comprehensive instructions for deploying the Sha Pay backend to various platforms with proper monitoring, security, and maintenance procedures.