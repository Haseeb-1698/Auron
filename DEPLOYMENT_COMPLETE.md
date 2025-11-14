# 🚀 Complete Deployment Guide - Auron Platform

> **Production-Ready Deployment Instructions for Auron Cybersecurity Training Platform**

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [API Keys Configuration](#api-keys-configuration)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Service Health Checks](#service-health-checks)
5. [Workshop Scenario](#workshop-scenario)
6. [Troubleshooting](#troubleshooting)

---

## 🖥️ System Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04+, Debian 11+, CentOS 8+, macOS 12+, or Windows 10/11 with WSL2
- **CPU**: 4 cores (Intel i5/AMD Ryzen 5 or better)
- **RAM**: 8GB minimum, **16GB recommended** for all services
- **Disk**: 30GB free space (SSD recommended)
- **Network**: Stable internet for initial setup

### Required Software
```bash
# Docker Engine 24.0+ and Docker Compose v2.20+
docker --version  # Should be 24.0.0 or higher
docker compose version  # Should be v2.20.0 or higher

# Node.js 18+ (for development only)
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 9.0.0 or higher

# Git
git --version  # Any recent version
```

### Ports Required
Ensure these ports are **NOT in use**:
- **5173** - Frontend Dashboard
- **4000** - Backend API
- **5432** - PostgreSQL Database
- **6379** - Redis Cache
- **8080** - DVWA Lab
- **3000** - Juice Shop Lab
- **8081** - Metasploitable Lab
- **8090** - OWASP ZAP Scanner
- **5601** - Wazuh Dashboard
- **9200** - Wazuh Indexer
- **55000** - Wazuh Manager API
- **514/udp** - Syslog (Wazuh log collection)

---

## 🔑 API Keys Configuration

### Required API Keys

#### 1. **LiquidMetal AI (Claude API)** - Required for AI Hints
```bash
# Get your API key from: https://liquidmetal.anthropic.com/ or https://console.anthropic.com/
LIQUIDMETAL_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxx
LIQUIDMETAL_ENDPOINT=https://api.liquidmetal.ai/v1/chat/completions
```

**Features Enabled:**
- AI-powered adaptive hints (progressive difficulty)
- Vulnerability explanations (technical + remediation)
- Code security analysis (SQL injection, XSS detection)
- Personalized learning path recommendations

**Pricing:**
- Claude Sonnet: ~$3 per 1M input tokens, $15 per 1M output tokens
- Estimated cost: $0.05-0.15 per user session (5-10 hints)

#### 2. **Vultr Cloud API** - Optional (For Cloud Labs)
```bash
# Get your API key from: https://my.vultr.com/settings/#settingsapi
VULTR_API_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VULTR_DEFAULT_REGION=ewr  # New Jersey
VULTR_DEFAULT_PLAN=vc2-1c-1gb  # $6/month
```

**Features Enabled:**
- Cloud-based lab instances (for remote workshops)
- Automatic VM provisioning and cleanup
- Multi-region support
- Resource monitoring

**Cost Estimation:**
- **vc2-1c-1gb**: $6/month ($0.009/hour) - 1 CPU, 1GB RAM, 25GB SSD
- **vc2-2c-4gb**: $18/month ($0.027/hour) - 2 CPU, 4GB RAM, 80GB SSD
- Hourly billing - only pay for running instances
- Free API requests

**When to Use:**
- ✅ Remote workshops with 10+ participants
- ✅ No local hardware resources
- ✅ Need persistent lab environments
- ❌ Local development (use Docker instead)

#### 3. **OWASP ZAP** - Pre-configured (No API Key Needed)
```bash
# ZAP runs locally in Docker with API key already set
ZAP_API_URL=http://zap:8090
ZAP_API_KEY=auron-zap-api-key  # Pre-configured, change if needed
```

#### 4. **Wazuh SIEM** - Pre-configured (No API Key Needed)
```bash
# Wazuh credentials (change in production!)
WAZUH_DASHBOARD_USER=admin
WAZUH_DASHBOARD_PASSWORD=SecretPassword
```

### Optional API Keys

#### 5. **SMTP Email Notifications** - Optional (Future Feature)
```bash
# For password reset, achievement notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@auron.dev
```

**Gmail Setup:**
1. Enable 2FA: https://myaccount.google.com/security
2. Create App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password as `SMTP_PASSWORD`

---

## 🚀 Step-by-Step Deployment

### Step 1: Clone Repository
```bash
# Clone the repository
git clone https://github.com/Haseeb-1698/Auron.git
cd Auron

# Verify structure
ls -la
# You should see: backend/ frontend/ docker-compose.yml .env.example
```

### Step 2: Configure Environment Variables

#### 2.1 Copy Environment Template
```bash
# Copy the example environment file
cp .env.example .env
```

#### 2.2 Edit `.env` File
```bash
# Use your favorite editor
nano .env
# OR
vim .env
# OR
code .env
```

#### 2.3 Essential Variables to Configure

**Database & Redis** (Leave defaults for local deployment):
```bash
# PostgreSQL Configuration
POSTGRES_DB=auron_db
POSTGRES_USER=auron_user
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD_IN_PRODUCTION  # ⚠️ CHANGE IN PRODUCTION!
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty for local dev
```

**JWT Secrets** (⚠️ MUST CHANGE IN PRODUCTION):
```bash
# Generate strong secrets using:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

JWT_SECRET=CHANGE_THIS_TO_RANDOM_64_CHAR_HEX_STRING
JWT_REFRESH_SECRET=CHANGE_THIS_TO_DIFFERENT_RANDOM_64_CHAR_HEX_STRING
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

**AI Integration** (Required for AI hints):
```bash
# LiquidMetal AI (Claude) Configuration
LIQUIDMETAL_API_KEY=sk-ant-api03-YOUR_KEY_HERE  # ⚠️ REQUIRED for AI features
LIQUIDMETAL_ENDPOINT=https://api.liquidmetal.ai/v1/chat/completions
LIQUIDMETAL_MODEL=claude-3-sonnet-20240229
LIQUIDMETAL_MAX_TOKENS=1500
LIQUIDMETAL_TEMPERATURE=0.7
```

**Vultr Cloud** (Optional - only if using cloud labs):
```bash
# Vultr Configuration (Optional)
VULTR_API_KEY=YOUR_VULTR_API_KEY_HERE  # Only needed for cloud labs
VULTR_DEFAULT_REGION=ewr
VULTR_DEFAULT_PLAN=vc2-1c-1gb
```

**ZAP & Wazuh** (Pre-configured):
```bash
# OWASP ZAP Configuration
ZAP_API_URL=http://zap:8090
ZAP_API_KEY=auron-zap-api-key

# Wazuh SIEM Configuration
WAZUH_DASHBOARD_USER=admin
WAZUH_DASHBOARD_PASSWORD=SecretPassword  # ⚠️ CHANGE IN PRODUCTION!
```

**Application Settings**:
```bash
# Server Configuration
NODE_ENV=production
PORT=4000
API_BASE_URL=http://localhost:4000
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# File Uploads
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads

# 2FA Configuration
TWO_FACTOR_APP_NAME=Auron Security Platform
```

#### 2.4 Verify Configuration
```bash
# Check for required variables
grep -E "LIQUIDMETAL_API_KEY|JWT_SECRET|POSTGRES_PASSWORD" .env

# Ensure no placeholder values remain
grep -E "CHANGE_THIS|YOUR_KEY_HERE|placeholder" .env
# This should return nothing if properly configured
```

### Step 3: Build and Start Services

#### 3.1 Start All Services
```bash
# Start all 12 Docker services in detached mode
docker compose up -d

# This will:
# 1. Pull all required Docker images (first time only)
# 2. Build custom backend and frontend images
# 3. Create Docker network and volumes
# 4. Start all services in correct order
```

**Expected Output:**
```
[+] Running 13/13
 ✔ Network auron-network        Created
 ✔ Volume auron_postgres-data   Created
 ✔ Volume auron_redis-data      Created
 ✔ Container auron-postgres     Started
 ✔ Container auron-redis        Started
 ✔ Container auron-backend      Started
 ✔ Container auron-frontend     Started
 ✔ Container auron-dvwa-db      Started
 ✔ Container auron-dvwa         Started
 ✔ Container auron-juiceshop    Started
 ✔ Container auron-metasploitable Started
 ✔ Container auron-zap          Started
 ✔ Container auron-wazuh        Started
 ✔ Container auron-wazuh-indexer Started
 ✔ Container auron-wazuh-dashboard Started
```

#### 3.2 Monitor Startup Progress
```bash
# Watch logs (press Ctrl+C to exit)
docker compose logs -f

# Check specific service logs
docker compose logs -f backend    # Backend API
docker compose logs -f frontend   # Frontend dashboard
docker compose logs -f wazuh      # Wazuh SIEM
```

#### 3.3 Wait for Services to be Healthy
```bash
# Check service health (wait until all show "healthy")
watch -n 2 'docker compose ps'

# All services should show (healthy) status:
# auron-backend       ... Up (healthy)
# auron-postgres      ... Up (healthy)
# auron-wazuh         ... Up (healthy)
```

**Typical Startup Times:**
- PostgreSQL, Redis: 5-10 seconds
- Backend API: 10-20 seconds (waiting for DB)
- Frontend: 15-30 seconds (Nginx startup)
- DVWA, Juice Shop: 20-40 seconds
- Wazuh Stack: 60-90 seconds (heavy initialization)
- ZAP: 30-45 seconds

### Step 4: Initialize Database

#### 4.1 Run Migrations
```bash
# Database migrations are run automatically by backend on startup
# Check backend logs to verify:
docker compose logs backend | grep -i migration

# Expected output:
# "Running database migrations..."
# "Migrations completed successfully"
```

#### 4.2 Seed Initial Data
```bash
# Seed data runs automatically on first start
# Check logs:
docker compose logs backend | grep -i seed

# This creates:
# - 4 demo users (admin, instructor, 2 students)
# - 4 labs (SQL Injection, XSS, DVWA Full, Juice Shop)
# - 11 badges (First Lab, SQL Master, XSS Hunter, etc.)
```

### Step 5: Verify Deployment

#### 5.1 Check Service Health
```bash
# All services should be running
docker compose ps

# Check resource usage
docker stats --no-stream

# Expected RAM usage:
# - Wazuh stack: 3-4GB
# - PostgreSQL: 200-500MB
# - Backend: 150-300MB
# - ZAP: 400-800MB
# - Other services: 50-200MB each
# Total: 6-8GB
```

#### 5.2 Test Service Endpoints

**Frontend Dashboard:**
```bash
curl -I http://localhost:5173
# Expected: HTTP/1.1 200 OK
```

**Backend API:**
```bash
curl http://localhost:4000/health
# Expected: {"status":"ok","timestamp":"2025-11-14T..."}
```

**PostgreSQL:**
```bash
docker exec auron-postgres pg_isready -U auron_user
# Expected: /var/run/postgresql:5432 - accepting connections
```

**Redis:**
```bash
docker exec auron-redis redis-cli ping
# Expected: PONG
```

**DVWA:**
```bash
curl -I http://localhost:8080
# Expected: HTTP/1.1 200 OK
```

**Wazuh Dashboard:**
```bash
curl -I -k https://localhost:5601
# Expected: HTTP/1.1 302 Found (redirect to login)
```

### Step 6: Access the Platform

#### 6.1 Open Frontend Dashboard
```bash
# Open in browser:
http://localhost:5173
```

#### 6.2 Create Admin Account
1. Click "Register" on login page
2. Fill in details:
   - **Email**: `admin@auron.dev`
   - **Username**: `admin`
   - **Password**: (your secure password)
   - **First Name**: Admin
   - **Last Name**: User
3. Click "Register"
4. You'll be logged in automatically

#### 6.3 Access Lab Services

**DVWA (Damn Vulnerable Web App):**
```
URL: http://localhost:8080
Username: admin
Password: password
```

**Juice Shop:**
```
URL: http://localhost:3000
(No login required initially)
```

**Wazuh SIEM Dashboard:**
```
URL: https://localhost:5601  (note: HTTPS with self-signed cert)
Username: admin
Password: SecretPassword
```

**Metasploitable:**
```
URL: http://localhost:8081
SSH: localhost:2222 (user: msfadmin, pass: msfadmin)
```

### Step 7: Test Core Functionality

#### 7.1 Test Lab Access
1. Login to Auron dashboard
2. Navigate to "Labs" page
3. Click on "SQL Injection Basics"
4. Click "Start Lab" button
5. Verify lab instance starts (status shows "Running")

#### 7.2 Test Vulnerability Scanning
1. Go to lab detail page
2. Click "Run Scan" button
3. Wait for ZAP scan to complete (2-5 minutes)
4. View scan results with severity-coded findings

#### 7.3 Test AI Hints
1. Expand an exercise in lab
2. Click "Request Hint" button
3. Verify AI-generated hint appears in dialog
4. **Note**: Requires `LIQUIDMETAL_API_KEY` to be configured

#### 7.4 Test Report Generation
1. Navigate to "Reports" page
2. Click "Generate Report"
3. Select "Vulnerability Scan" type
4. Choose "PDF" format
5. Enter title and generate
6. Download generated PDF report

#### 7.5 Test Wazuh SIEM
1. Open Wazuh dashboard (https://localhost:5601)
2. Login with admin credentials
3. Navigate to "Security Events"
4. Run an attack script:
   ```bash
   docker exec auron-attack-scripts /scripts/dvwa-sqli.sh
   ```
5. Refresh Wazuh - you should see SQL injection alerts!

---

## 🏥 Service Health Checks

### Automated Health Monitoring

All services have built-in health checks:

```bash
# Check all service health
docker compose ps --format "table {{.Name}}\t{{.Status}}"

# Continuous monitoring
watch -n 5 'docker compose ps --format "table {{.Name}}\t{{.Status}}"'
```

### Manual Health Checks

**Backend API:**
```bash
curl http://localhost:4000/health
# {"status":"ok","database":"connected","redis":"connected"}
```

**PostgreSQL:**
```bash
docker exec auron-postgres pg_isready -U auron_user -d auron_db
```

**Redis:**
```bash
docker exec auron-redis redis-cli ping
```

**Wazuh Manager:**
```bash
curl -k -u admin:SecretPassword https://localhost:55000/
# {"data":{"title":"Wazuh API REST","api_version":"4.x"}}
```

### Common Health Issues

**Issue**: Backend shows "unhealthy"
```bash
# Check logs
docker compose logs backend --tail 50

# Common causes:
# 1. Database not ready - wait 30 seconds and check again
# 2. Missing environment variables - check .env file
# 3. Port 4000 already in use - stop conflicting service
```

**Issue**: Frontend shows 502 Bad Gateway
```bash
# Backend might not be ready
docker compose logs backend | grep -i "server listening"

# Restart frontend after backend is up
docker compose restart frontend
```

**Issue**: Wazuh services not starting
```bash
# Wazuh requires more resources
# Check RAM usage:
docker stats --no-stream

# If RAM > 90%, consider:
# 1. Close other applications
# 2. Increase Docker Desktop RAM limit (Mac/Windows)
# 3. Use staging compose file with lighter services
```

---

## 🎓 Workshop Scenario

### Quick Workshop Setup (5 minutes)

#### 1. Verify All Services Running
```bash
docker compose ps
# All 12 services should show "Up (healthy)"
```

#### 2. Create Student Accounts
```bash
# Students register via http://localhost:5173/register
# Or create via API:
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student1@workshop.dev",
    "username": "student1",
    "password": "Workshop123!",
    "firstName": "Student",
    "lastName": "One"
  }'
```

#### 3. Run Attack Demonstration
```bash
# SQL Injection Demo
docker exec auron-attack-scripts /scripts/dvwa-sqli.sh

# Port Scan Demo
docker exec auron-attack-scripts /scripts/port-scan.sh dvwa

# Directory Brute Force Demo
docker exec auron-attack-scripts /scripts/dirb-scan.sh http://juiceshop:3000
```

#### 4. Show Real-Time SIEM Alerts
1. Open Wazuh Dashboard (https://localhost:5601)
2. Navigate to "Security Events" → "Events"
3. Filter by severity: "High" or "Critical"
4. Students see attacks detected in real-time!

#### 5. Workshop Flow
1. **Introduction** (10 min): Platform tour, explain labs
2. **Hands-On Lab** (30 min): Students work on SQL Injection basics
3. **Attack Demonstration** (15 min): Run attack scripts, show SIEM
4. **AI Hints Practice** (15 min): Students request hints for challenges
5. **Report Generation** (10 min): Generate and download PDF reports
6. **Q&A** (10 min)

### Workshop Tips

**Before Workshop:**
- [ ] Test all services 1 day before
- [ ] Create test student account
- [ ] Run through full lab workflow
- [ ] Verify Wazuh shows alerts
- [ ] Generate sample PDF report

**During Workshop:**
- [ ] Have backup plan if services fail (screenshots/video)
- [ ] Monitor Docker resource usage
- [ ] Keep Wazuh dashboard open on second screen
- [ ] Encourage students to explore AI hints

**After Workshop:**
- [ ] Reset lab environments: `docker compose restart dvwa juiceshop`
- [ ] Clear student progress (optional): `docker exec auron-backend npm run seed:reset`
- [ ] Export Wazuh alerts for analysis

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue 1: Port Already in Use
```bash
# Error: "Bind for 0.0.0.0:4000 failed: port is already allocated"

# Find process using port
lsof -i :4000  # On Mac/Linux
netstat -ano | findstr :4000  # On Windows

# Kill process or change port in .env
PORT=4001  # Change backend port
```

#### Issue 2: Out of Memory
```bash
# Symptoms: Services randomly restarting, slow performance

# Check memory usage
docker stats --no-stream

# Solutions:
# 1. Increase Docker Desktop memory (Mac/Windows)
#    Docker Desktop → Settings → Resources → Memory → 12GB

# 2. Use staging compose (lighter services)
docker compose -f docker-compose.staging.yml up -d

# 3. Stop unused services temporarily
docker compose stop metasploitable wazuh-dashboard
```

#### Issue 3: Database Connection Failed
```bash
# Error: "Unable to connect to database"

# Check PostgreSQL is running
docker compose ps postgres

# Check connection
docker exec auron-postgres pg_isready

# Verify credentials in .env match docker-compose.yml
grep POSTGRES_ .env

# Restart backend after fixing
docker compose restart backend
```

#### Issue 4: Frontend Shows Blank Page
```bash
# Check frontend logs
docker compose logs frontend --tail 50

# Verify backend API is reachable
curl http://localhost:4000/health

# Rebuild frontend
docker compose build frontend --no-cache
docker compose up -d frontend
```

#### Issue 5: Wazuh Not Showing Alerts
```bash
# 1. Check Wazuh Manager is running
docker compose ps wazuh

# 2. Verify syslog port is open
docker exec auron-wazuh netstat -tulpn | grep 514

# 3. Check vulnerable containers have syslog driver
docker inspect auron-dvwa | grep -A 5 "LogConfig"
# Should show: "Type": "syslog"

# 4. Manually send test log
docker exec auron-dvwa logger -t dvwa "TESTING: admin' OR '1'='1"

# 5. Check Wazuh received it
docker exec auron-wazuh tail -f /var/ossec/logs/archives/archives.log
```

#### Issue 6: ZAP Scan Fails
```bash
# Check ZAP is running
docker compose ps zap

# Test ZAP API
curl http://localhost:8090

# Check ZAP logs
docker compose logs zap --tail 50

# Verify target is reachable from ZAP container
docker exec auron-zap wget -O- http://dvwa
```

#### Issue 7: AI Hints Not Working
```bash
# Verify API key is set
docker exec auron-backend env | grep LIQUIDMETAL

# Test AI service directly
docker exec auron-backend npm run test:ai

# Check backend logs for API errors
docker compose logs backend | grep -i liquidmetal
```

### Getting Help

**Logs Collection:**
```bash
# Save all logs for support
docker compose logs > auron-logs-$(date +%Y%m%d-%H%M%S).txt

# Check specific service
docker compose logs [service-name] --tail 100

# Follow logs in real-time
docker compose logs -f backend frontend
```

**System Info:**
```bash
# Docker version
docker version

# Compose version
docker compose version

# System resources
docker system df
docker system info

# Container resource usage
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

**Reset Everything:**
```bash
# Stop all services
docker compose down

# Remove volumes (⚠️ deletes all data)
docker compose down -v

# Remove images
docker compose down --rmi all

# Start fresh
docker compose up -d
```

---

## 📊 Post-Deployment Checklist

### ✅ Deployment Verification

- [ ] All 12 Docker services running (green status)
- [ ] Frontend accessible at http://localhost:5173
- [ ] Backend API responding at http://localhost:4000
- [ ] Can register new user account
- [ ] Can login with created account
- [ ] Labs page shows 4 default labs
- [ ] Can start a lab instance
- [ ] DVWA accessible and working
- [ ] Juice Shop accessible and working
- [ ] Wazuh dashboard accessible (https://localhost:5601)
- [ ] Can run attack script successfully
- [ ] Wazuh shows attack alerts
- [ ] Can request AI hint (if API key configured)
- [ ] Can generate vulnerability scan report
- [ ] Can download PDF report
- [ ] All services stay running for 30+ minutes

### 🎯 Production Readiness

**Before Production Deployment:**
- [ ] Changed all default passwords in `.env`
- [ ] Generated strong JWT secrets (64+ character hex)
- [ ] Configured HTTPS/TLS certificates
- [ ] Set up firewall rules (only necessary ports exposed)
- [ ] Configured backup strategy (PostgreSQL dumps)
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Documented incident response procedures
- [ ] Tested disaster recovery process
- [ ] Reviewed all security considerations
- [ ] Configured log rotation and retention

---

## 🌐 Production Deployment

### Using Vultr Cloud (Recommended for Production)

#### 1. Provision VM
```bash
# Using Vultr CLI or API
vultr-cli instance create \
  --region ewr \
  --plan vc2-4c-8gb \
  --os 387 \  # Ubuntu 22.04
  --label auron-production \
  --ssh-keys <your-ssh-key-id>
```

#### 2. SSH into Server
```bash
ssh root@<your-vm-ip>
```

#### 3. Install Dependencies
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git
apt install -y git
```

#### 4. Deploy Auron
```bash
# Clone repository
git clone https://github.com/Haseeb-1698/Auron.git
cd Auron

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Start services
docker compose up -d
```

#### 5. Configure Firewall
```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (redirect to HTTPS)
ufw allow 443/tcp   # HTTPS
ufw enable

# Block direct access to services
ufw deny 4000/tcp   # Backend (use reverse proxy)
ufw deny 5432/tcp   # PostgreSQL
ufw deny 6379/tcp   # Redis
```

#### 6. Setup Nginx Reverse Proxy
```bash
# Install Nginx
apt install -y nginx

# Configure HTTPS with Let's Encrypt
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com

# Configure reverse proxy (see deployment/nginx.conf)
```

---

## 📞 Support

**Need Help?**
- 📧 Email: support@auron.dev
- 💬 GitHub Issues: https://github.com/Haseeb-1698/Auron/issues
- 📖 Documentation: https://github.com/Haseeb-1698/Auron/wiki

**Found a Bug?**
- Report at: https://github.com/Haseeb-1698/Auron/issues/new

---

**🎉 Deployment Complete! You're ready to train the next generation of cybersecurity professionals!**
