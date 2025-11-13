# Auron Deployment Guide

This guide provides instructions for deploying the Auron Cybersecurity Training Platform to staging and production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Migrations](#database-migrations)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- Docker 24.0+
- Docker Compose 2.20+
- Node.js 18+ (for local development)
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)

### Required Accounts
- Docker Registry (GitHub Container Registry, Docker Hub, or AWS ECR)
- Cloud Provider (Vultr, AWS, DigitalOcean, etc.)
- Domain Name with DNS access
- SSL Certificate (Let's Encrypt recommended)

### Required Secrets
Set up the following secrets in your CI/CD environment:

#### GitHub Secrets for Staging
```
STAGING_HOST                 # Staging server IP or hostname
STAGING_USER                 # SSH user (e.g., deploy)
STAGING_SSH_PRIVATE_KEY      # SSH private key for deployment
STAGING_DATABASE_URL         # PostgreSQL connection string
STAGING_REDIS_URL            # Redis connection string
STAGING_JWT_SECRET           # JWT signing secret
STAGING_JWT_REFRESH_SECRET   # JWT refresh token secret
STAGING_CORS_ORIGIN          # Frontend URL
STAGING_POSTGRES_PASSWORD    # PostgreSQL password
STAGING_REDIS_PASSWORD       # Redis password
STAGING_WAZUH_PASSWORD       # Wazuh admin password
STAGING_GRAFANA_PASSWORD     # Grafana admin password
VULTR_API_KEY               # Vultr API key (for cloud labs)
LIQUIDMETAL_API_KEY         # LiquidMetal/Claude API key
SLACK_WEBHOOK_URL           # Slack webhook for notifications
```

## Staging Deployment

### 1. Server Setup

#### 1.1 Provision a Server
```bash
# Minimum requirements for staging:
# - 4 CPU cores
# - 8GB RAM
# - 100GB SSD storage
# - Ubuntu 22.04 LTS

# Example with Vultr:
curl -X POST "https://api.vultr.com/v2/instances" \
  -H "Authorization: Bearer $VULTR_API_KEY" \
  -d '{
    "region": "ewr",
    "plan": "vc2-4c-8gb",
    "os_id": 1743,
    "label": "auron-staging"
  }'
```

#### 1.2 Initial Server Configuration
```bash
# SSH into your server
ssh root@your-staging-server

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Create deployment user
useradd -m -s /bin/bash deploy
usermod -aG docker deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Create application directory
mkdir -p /opt/auron
chown deploy:deploy /opt/auron

# Setup firewall
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw allow 4000/tcp # Backend API
ufw enable
```

### 2. Clone and Configure

```bash
# Switch to deploy user
su - deploy

# Clone repository
cd /opt/auron
git clone https://github.com/your-org/auron.git .
git checkout staging

# Create environment file
cp .env.staging.example .env.staging
nano .env.staging  # Edit with your values

# Create necessary directories
mkdir -p logs uploads reports
```

### 3. Setup SSL Certificates

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot certonly --standalone \
  -d staging.auron.dev \
  -d staging-api.auron.dev \
  --email admin@auron.dev \
  --agree-tos \
  --non-interactive

# Copy certificates to project
sudo cp /etc/letsencrypt/live/staging.auron.dev/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/staging.auron.dev/privkey.pem nginx/ssl/
sudo chown -R deploy:deploy nginx/ssl/
```

### 4. Deploy with Docker Compose

```bash
# Load environment variables
export $(cat .env.staging | xargs)

# Pull images
docker-compose -f docker-compose.staging.yml pull

# Start services
docker-compose -f docker-compose.staging.yml up -d

# Check logs
docker-compose -f docker-compose.staging.yml logs -f

# Verify health
curl http://localhost:4000/health
```

### 5. Database Setup

```bash
# Run migrations
docker-compose -f docker-compose.staging.yml exec backend npm run migrate

# (Optional) Seed sample data
docker-compose -f docker-compose.staging.yml exec backend npm run seed

# Verify database
docker-compose -f docker-compose.staging.yml exec postgres \
  psql -U auron -d auron -c "SELECT COUNT(*) FROM users;"
```

### 6. Automated Deployment via GitHub Actions

The staging environment will automatically deploy when you:
1. Push to the `staging` or `develop` branch
2. Create a pull request to `main`
3. Manually trigger the workflow

Workflow file: `.github/workflows/deploy-staging.yml`

## Production Deployment

### Production-Specific Considerations

1. **High Availability**: Use multiple servers with load balancing
2. **Database**: Use managed PostgreSQL (AWS RDS, Azure Database, etc.)
3. **Redis**: Use managed Redis (AWS ElastiCache, Redis Cloud, etc.)
4. **CDN**: Use Cloudflare or AWS CloudFront for static assets
5. **Backups**: Implement automated daily backups
6. **Monitoring**: Enable comprehensive monitoring and alerting
7. **Logging**: Centralize logs with ELK or similar stack

### Production Deployment Steps

```bash
# 1. Create production environment file
cp .env.staging.example .env.production

# 2. Update with production values
nano .env.production

# 3. Deploy to production
docker-compose -f docker-compose.production.yml up -d

# 4. Run health checks
./scripts/health-check.sh production

# 5. Enable monitoring
docker-compose -f docker-compose.production.yml \
  up -d prometheus grafana
```

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment name | `staging`, `production` |
| `PORT` | Backend API port | `4000` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection | `redis://:password@host:6379` |
| `JWT_SECRET` | JWT signing key | 32+ character string |
| `CORS_ORIGIN` | Frontend URL | `https://staging.auron.dev` |
| `LAB_MODE` | Lab deployment mode | `docker` or `cloud` |
| `VULTR_API_KEY` | Cloud provider key | Vultr API token |
| `LIQUIDMETAL_API_KEY` | AI service key | LiquidMetal API token |

### Optional Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging verbosity | `info` |
| `RATE_LIMIT_MAX_REQUESTS` | API rate limit | `100` |
| `SESSION_MAX_AGE` | Session duration (ms) | `86400000` |
| `ENABLE_2FA` | Two-factor auth | `true` |
| `ENABLE_CLOUD_LABS` | Cloud lab deployment | `false` |

## Database Migrations

### Running Migrations

```bash
# Check migration status
docker-compose exec backend npm run migrate:status

# Run pending migrations
docker-compose exec backend npm run migrate

# Rollback last migration
docker-compose exec backend npm run migrate:undo

# Rollback all migrations
docker-compose exec backend npm run migrate:undo:all
```

### Creating New Migrations

```bash
# Generate migration file
docker-compose exec backend npx sequelize-cli migration:generate \
  --name add-feature-name

# Edit the migration file in backend/src/database/migrations/
# Then run migrations as above
```

## Monitoring

### Health Checks

```bash
# Backend API
curl https://staging-api.auron.dev/health

# Frontend
curl https://staging.auron.dev

# API Documentation
curl https://staging-api.auron.dev/api-docs

# Database connection
docker-compose exec backend node -e "
  require('./dist/config/database').connectDatabase()
    .then(() => console.log('DB OK'))
    .catch(err => console.error('DB Error:', err))
"
```

### Accessing Monitoring Tools

- **Grafana**: http://staging.auron.dev:3001 (admin / your-grafana-password)
- **Prometheus**: http://staging.auron.dev:9090
- **Wazuh Dashboard**: http://staging.auron.dev:5601
- **API Documentation**: https://staging-api.auron.dev/api-docs

### Log Viewing

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# View last 100 lines
docker-compose logs --tail=100 backend

# Save logs to file
docker-compose logs backend > backend-logs.txt
```

## Troubleshooting

### Common Issues

#### 1. Backend not starting
```bash
# Check logs
docker-compose logs backend

# Common causes:
# - Database connection failed
# - Redis connection failed
# - Missing environment variables
# - Port already in use

# Solution:
# Verify DATABASE_URL and REDIS_URL
docker-compose exec postgres pg_isready
docker-compose exec redis redis-cli ping
```

#### 2. Frontend not loading
```bash
# Check nginx logs
docker-compose logs nginx

# Verify API connection
curl http://localhost:4000/health

# Check CORS settings
# Ensure CORS_ORIGIN matches your frontend URL
```

#### 3. Database migration errors
```bash
# Check migration status
docker-compose exec backend npm run migrate:status

# Force reset (CAUTION: Destroys data!)
docker-compose exec backend npm run migrate:undo:all
docker-compose exec backend npm run migrate
```

#### 4. SSL certificate issues
```bash
# Renew certificates
sudo certbot renew

# Verify certificate
openssl s_client -connect staging.auron.dev:443 -showcerts
```

#### 5. Performance issues
```bash
# Check resource usage
docker stats

# Check database performance
docker-compose exec postgres pg_stat_activity

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

### Emergency Procedures

#### Rollback Deployment
```bash
# Stop current deployment
docker-compose down

# Checkout previous version
git checkout <previous-commit-hash>

# Redeploy
docker-compose up -d

# Rollback migrations if needed
docker-compose exec backend npm run migrate:undo
```

#### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U auron auron > backup-$(date +%Y%m%d).sql

# Restore from backup
docker-compose exec -T postgres psql -U auron auron < backup-20240101.sql
```

## Support

For deployment assistance:
- Email: support@auron.dev
- Documentation: https://docs.auron.dev
- GitHub Issues: https://github.com/your-org/auron/issues
