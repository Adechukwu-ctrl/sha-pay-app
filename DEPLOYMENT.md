# Deployment Guide

This guide covers deployment options and CI/CD setup for the Sha Pay application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development with Docker](#local-development-with-docker)
- [Production Deployment](#production-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Environment Variables](#environment-variables)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+
- Redis 7+
- Git

## Local Development with Docker

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Sha_Pay
   ```

2. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your local configuration
   ```

3. **Start development environment**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. **Run database migrations**
   ```bash
   docker-compose -f docker-compose.dev.yml exec backend-dev npm run migrate
   ```

5. **Access the application**
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/api/docs
   - pgAdmin: http://localhost:5050 (admin@shapay.com / admin123)
   - Redis Commander: http://localhost:8081
   - Mailhog: http://localhost:8025

### Development Services

The development environment includes:
- **Backend API** (Node.js with hot reload)
- **PostgreSQL** database with pgAdmin
- **Redis** cache with Redis Commander
- **Mailhog** for email testing

## Production Deployment

### Docker Compose (Recommended)

1. **Prepare production environment**
   ```bash
   cp backend/.env.example backend/.env.production
   # Configure production environment variables
   ```

2. **Deploy with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Run database migrations**
   ```bash
   docker-compose exec backend npm run migrate
   ```

### Kubernetes Deployment

1. **Build and push Docker image**
   ```bash
   docker build -t your-registry/sha-pay-backend:latest ./backend
   docker push your-registry/sha-pay-backend:latest
   ```

2. **Apply Kubernetes manifests**
   ```bash
   kubectl apply -f k8s/
   ```

### Cloud Deployment Options

#### AWS ECS
- Use the provided `docker-compose.yml` with ECS CLI
- Configure RDS for PostgreSQL and ElastiCache for Redis

#### Google Cloud Run
- Deploy backend as a Cloud Run service
- Use Cloud SQL for PostgreSQL and Memorystore for Redis

#### Azure Container Instances
- Deploy using Azure Container Groups
- Use Azure Database for PostgreSQL and Azure Cache for Redis

## CI/CD Pipeline

### GitHub Actions Setup

The repository includes a comprehensive CI/CD pipeline (`.github/workflows/ci-cd.yml`) that:

1. **Continuous Integration**
   - Runs backend and frontend tests
   - Performs security scanning
   - Generates code coverage reports

2. **Continuous Deployment**
   - Builds and pushes Docker images
   - Deploys to staging and production environments
   - Runs smoke tests and health checks

### Required Secrets

Configure these secrets in your GitHub repository:

```bash
# Container Registry
GITHUB_TOKEN  # Automatically provided

# Staging Environment
STAGING_URL=https://staging.shapay.com

# Production Environment
PRODUCTION_URL=https://shapay.com

# Database (if using external services)
DB_CONNECTION_STRING=postgresql://user:pass@host:port/db

# Third-party Services
STRIPE_SECRET_KEY=sk_live_...
PAYSTACK_SECRET_KEY=sk_live_...
CLOUDINARY_URL=cloudinary://...
```

### Pipeline Stages

1. **Test Stage**
   - Unit tests for backend and frontend
   - Integration tests
   - Code coverage analysis

2. **Security Stage**
   - Vulnerability scanning with Trivy
   - Dependency audit
   - SAST (Static Application Security Testing)

3. **Build Stage**
   - Docker image building
   - Multi-stage builds for optimization
   - Image scanning and signing

4. **Deploy Stage**
   - Staging deployment (develop branch)
   - Production deployment (main branch)
   - Rollback capabilities

## Environment Variables

### Backend Configuration

```bash
# Server
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://app.shapay.com

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sha_pay_db
DB_USER=sha_pay_user
DB_PASSWORD=secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# File Upload
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment Gateways
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_SECRET_KEY=sk_live_...

# Platform Settings
PLATFORM_FEE_RATE=0.025
PLATFORM_CURRENCY=NGN
PAYMENT_TIMEOUT=1800

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your_session_secret
CORS_ORIGIN=https://app.shapay.com
```

## Monitoring and Logging

### Application Monitoring

1. **Health Checks**
   - Endpoint: `GET /api/health`
   - Docker health checks configured
   - Kubernetes liveness and readiness probes

2. **Logging**
   - Structured logging with Winston
   - Log levels: error, warn, info, debug
   - Log rotation and retention policies

3. **Metrics**
   - Application performance metrics
   - Database connection monitoring
   - Redis cache hit rates

### Recommended Monitoring Stack

- **Prometheus** for metrics collection
- **Grafana** for visualization
- **ELK Stack** (Elasticsearch, Logstash, Kibana) for log analysis
- **Sentry** for error tracking

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database connectivity
   docker-compose exec backend npm run health-check
   
   # View database logs
   docker-compose logs postgres
   ```

2. **Redis Connection Issues**
   ```bash
   # Test Redis connection
   docker-compose exec redis redis-cli ping
   
   # View Redis logs
   docker-compose logs redis
   ```

3. **Application Startup Issues**
   ```bash
   # View application logs
   docker-compose logs backend
   
   # Check environment variables
   docker-compose exec backend env | grep -E '^(DB_|REDIS_|JWT_)'
   ```

4. **Performance Issues**
   ```bash
   # Monitor resource usage
   docker stats
   
   # Check database performance
   docker-compose exec postgres psql -U sha_pay_user -d sha_pay_db -c "SELECT * FROM pg_stat_activity;"
   ```

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Set environment variable
DEBUG=sha-pay:*

# Or use debug script
npm run debug
```

### Log Analysis

```bash
# View recent logs
docker-compose logs --tail=100 backend

# Follow logs in real-time
docker-compose logs -f backend

# Search logs for errors
docker-compose logs backend | grep -i error
```

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use secrets management in production
   - Rotate secrets regularly

2. **Network Security**
   - Use HTTPS in production
   - Configure proper CORS settings
   - Implement rate limiting

3. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Regular security updates

4. **Container Security**
   - Use non-root users in containers
   - Scan images for vulnerabilities
   - Keep base images updated

## Support

For deployment issues or questions:

- Create an issue in the repository
- Check the troubleshooting section
- Review application logs
- Contact the development team