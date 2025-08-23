# Sha Pay Backend Deployment Guide

This guide will help you deploy the Sha Pay backend to production with cloud database and storage.

## Prerequisites

- Node.js 18+ installed
- Java JDK 21+ installed (for Android development)
- PostgreSQL cloud database (Heroku Postgres, AWS RDS, etc.)
- Cloud storage account (Cloudinary or AWS S3)
- Email service (Gmail SMTP or SendGrid)
- SMS service (Twilio)

## 1. Cloud Database Setup

### Option A: Heroku Postgres
1. Create a Heroku app
2. Add Heroku Postgres addon
3. Get the DATABASE_URL from Heroku config vars

### Option B: AWS RDS PostgreSQL
1. Create RDS PostgreSQL instance
2. Configure security groups for access
3. Note down connection details

### Option C: Other Cloud Providers
- Google Cloud SQL
- DigitalOcean Managed Databases
- Azure Database for PostgreSQL

## 2. Cloud Storage Setup

### Option A: Cloudinary (Recommended)
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret
3. Configure transformation settings for image optimization

### Option B: AWS S3
1. Create an S3 bucket
2. Create IAM user with S3 permissions
3. Get Access Key ID and Secret Access Key
4. Configure bucket policies for public read access

## 3. Environment Configuration

### Update .env.production

```bash
# Database Configuration
NODE_ENV=production
PORT=3000

# PostgreSQL Database
DATABASE_URL=postgresql://username:password@host:port/database
# OR individual settings:
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=sha_pay_production
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@shapay.com
FROM_NAME=Sha Pay

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Cloud Storage Configuration
# Cloudinary (Primary)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# AWS S3 (Fallback)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=sha-pay-storage

# Payment Gateways
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key
PAYSTACK_SECRET_KEY=sk_live_your_paystack_secret_key
```

## 4. Database Migration

### Run the migration script:

```bash
# Install dependencies
npm install

# Run database setup script
node scripts/setup-cloud-database.js

# Or run migration from local SQLite to cloud PostgreSQL
node scripts/migrate-to-cloud.js
```

### Manual Database Setup:

```bash
# Connect to your PostgreSQL database and run:
psql $DATABASE_URL

# Create database if it doesn't exist
CREATE DATABASE sha_pay_production;

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE sha_pay_production TO your_user;
```

## 5. Deployment Options

### Option A: Heroku

1. Install Heroku CLI
2. Login to Heroku:
   ```bash
   heroku login
   ```

3. Create Heroku app:
   ```bash
   heroku create sha-pay-backend
   ```

4. Add PostgreSQL addon:
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

5. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-jwt-secret
   # ... set all other environment variables
   ```

6. Deploy:
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push heroku main
   ```

### Option B: DigitalOcean App Platform

1. Connect your GitHub repository
2. Configure environment variables in the dashboard
3. Set up PostgreSQL database
4. Deploy automatically from GitHub

### Option C: AWS Elastic Beanstalk

1. Install EB CLI
2. Initialize Elastic Beanstalk:
   ```bash
   eb init
   ```

3. Create environment:
   ```bash
   eb create production
   ```

4. Set environment variables:
   ```bash
   eb setenv NODE_ENV=production JWT_SECRET=your-secret
   ```

5. Deploy:
   ```bash
   eb deploy
   ```

### Option D: VPS (Ubuntu/CentOS)

1. Install Node.js, PM2, and Nginx
2. Clone repository
3. Install dependencies
4. Configure environment variables
5. Start with PM2:
   ```bash
   pm2 start server.js --name sha-pay-backend
   pm2 startup
   pm2 save
   ```

6. Configure Nginx reverse proxy
7. Set up SSL with Let's Encrypt

## 6. Post-Deployment Verification

### Health Check
```bash
curl https://your-api-domain.com/api/health
```

### Database Connection
```bash
curl https://your-api-domain.com/api/auth/register -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User","userType":"service_requester"}'
```

### File Upload Test
```bash
curl -X POST https://your-api-domain.com/api/users/:id/upload-picture \
  -H "Authorization: Bearer your-jwt-token" \
  -F "profilePicture=@test-image.jpg"
```

## 7. Monitoring and Maintenance

### Set up monitoring:
- Application performance monitoring (New Relic, DataDog)
- Error tracking (Sentry)
- Uptime monitoring (Pingdom, UptimeRobot)
- Log aggregation (LogDNA, Papertrail)

### Regular maintenance:
- Database backups
- Security updates
- Performance optimization
- Log rotation

## 8. Security Checklist

- [ ] Use HTTPS in production
- [ ] Set secure JWT secrets (32+ characters)
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up database connection pooling
- [ ] Use environment variables for secrets
- [ ] Enable database SSL connections
- [ ] Configure proper file upload limits
- [ ] Set up database backups
- [ ] Monitor for security vulnerabilities

## 9. Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify database credentials
   - Ensure database server is accessible
   - Check SSL requirements

2. **File Upload Errors**
   - Verify cloud storage credentials
   - Check file size limits
   - Ensure proper CORS configuration
   - Verify file type restrictions

3. **Email/SMS Not Working**
   - Check SMTP/Twilio credentials
   - Verify sender email/phone number
   - Check rate limits
   - Review service provider logs

4. **JWT Token Issues**
   - Ensure JWT_SECRET is set
   - Check token expiration times
   - Verify token format
   - Check for clock synchronization

### Logs and Debugging:

```bash
# Heroku logs
heroku logs --tail

# PM2 logs
pm2 logs sha-pay-backend

# Check application status
pm2 status

# Restart application
pm2 restart sha-pay-backend
```

## 10. Performance Optimization

- Enable gzip compression
- Use CDN for static assets
- Implement database indexing
- Set up Redis for caching
- Optimize database queries
- Use connection pooling
- Implement API response caching

## Support

For deployment issues or questions:
- Check the application logs
- Review this deployment guide
- Contact the development team
- Check the project documentation

---

**Note**: Replace all placeholder values (your-secret, your-domain, etc.) with actual production values. Keep your environment variables secure and never commit them to version control.