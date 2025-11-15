# 🚀 Vultr Cloud Deployment Guide - Auron Platform

> **Complete guide for deploying Auron Cybersecurity Training Platform on Vultr Cloud**

## 📋 Table of Contents
1. [VM Selection](#vm-selection)
2. [Initial Setup](#initial-setup)
3. [Server Preparation](#server-preparation)
4. [Deployment Steps](#deployment-steps)
5. [Security Configuration](#security-configuration)
6. [Post-Deployment](#post-deployment)
7. [Maintenance](#maintenance)

---

## 🖥️ VM Selection

### Recommended Vultr Plans

| Plan | vCPU | RAM | Storage | Cost/Month | Best For |
|------|------|-----|---------|------------|----------|
| **vc2-8c-16gb** ⭐ | 8 | 16GB | 320GB SSD | $96 | **Production (Recommended)** |
| vc2-4c-8gb | 4 | 8GB | 160GB SSD | $48 | Budget Production |
| vc2-2c-4gb | 2 | 4GB | 80GB SSD | $18 | Testing/Dev (No Wazuh) |

**✅ Recommended**: **vc2-8c-16gb** (8 vCPU, 16GB RAM)
- Runs all 12 Docker services smoothly
- Wazuh SIEM performs optimally
- Handles 20+ concurrent users
- Room for growth

### Operating System
- **Ubuntu 22.04 LTS** (Recommended)
- **Ubuntu 20.04 LTS** (Also works)
- **Debian 11+** (Alternative)

---

## 🎯 Step-by-Step Deployment

### Step 1: Create Vultr Instance

#### Option A: Via Vultr Web Dashboard
1. Go to https://my.vultr.com/
2. Click **"Deploy New Server"**
3. Select:
   - **Cloud Compute - High Performance**
   - **Location**: Choose nearest region (e.g., `ewr` - New Jersey)
   - **OS**: Ubuntu 22.04 LTS x64
   - **Plan**: vc2-8c-16gb (16GB RAM)
   - **Additional Features**:
     - ✅ Enable IPv6
     - ✅ Enable Auto Backups (optional, +$9.60/month)
     - ✅ Enable DDOS Protection (included)
4. **SSH Keys**: Add your SSH public key for secure access
5. **Server Hostname**: `auron-training-platform`
6. **Deploy Now**

#### Option B: Via Vultr CLI (Automated)
```bash
# Install Vultr CLI
curl -LO https://github.com/vultr/vultr-cli/releases/latest/download/vultr-cli_3.0.0_linux_amd64.tar.gz
tar xf vultr-cli_3.0.0_linux_amd64.tar.gz
sudo mv vultr-cli /usr/local/bin/

# Configure API key
export VULTR_API_KEY="your-vultr-api-key-here"

# List available regions
vultr-cli regions list

# List available plans
vultr-cli plans list

# Deploy instance
vultr-cli instance create \
  --region ewr \
  --plan vc2-8c-16gb \
  --os 1743 \
  --label auron-training-platform \
  --enable-ipv6 \
  --ssh-keys your-ssh-key-id
```

**Wait 3-5 minutes** for the instance to be fully deployed.

---

### Step 2: Initial Server Setup

#### Connect to Your Server
```bash
# Get your server IP from Vultr dashboard
ssh root@YOUR_SERVER_IP

# Update system packages
apt update && apt upgrade -y

# Set hostname
hostnamectl set-hostname auron-training
```

#### Create Non-Root User (Security Best Practice)
```bash
# Create user
adduser auron
usermod -aG sudo auron

# Copy SSH keys
mkdir -p /home/auron/.ssh
cp /root/.ssh/authorized_keys /home/auron/.ssh/
chown -R auron:auron /home/auron/.ssh
chmod 700 /home/auron/.ssh
chmod 600 /home/auron/.ssh/authorized_keys

# Test SSH login (from your local machine)
ssh auron@YOUR_SERVER_IP
```

#### Configure Firewall (UFW)
```bash
# Enable UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (if exposing externally - NOT RECOMMENDED for vulnerable apps!)
# sudo ufw allow 80/tcp
# sudo ufw allow 443/tcp

# Allow specific ports for Auron services (ONLY if needed remotely)
sudo ufw allow 5173/tcp  # Frontend Dashboard
sudo ufw allow 4000/tcp  # Backend API
sudo ufw allow 5601/tcp  # Wazuh Dashboard

# Enable firewall
sudo ufw enable
sudo ufw status verbose
```

⚠️ **SECURITY WARNING**: By default, bind all services to `127.0.0.1` (localhost) and use SSH tunneling or VPN for remote access. DO NOT expose vulnerable lab applications (DVWA, Juice Shop, Metasploitable) to the internet!

---

### Step 3: Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker auron
newgrp docker

# Install Docker Compose (if not included)
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version

# Enable Docker to start on boot
sudo systemctl enable docker
sudo systemctl start docker
```

---

### Step 4: Install Required Tools

```bash
# Install Git
sudo apt install git curl wget vim -y

# Install Node.js 18+ (for development/debugging only, optional)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should be v18+
npm --version   # Should be 9+
```

---

### Step 5: Clone and Configure Auron

```bash
# Clone repository
cd /home/auron
git clone https://github.com/Haseeb-1698/Auron.git
cd Auron

# Set proper ownership
sudo chown -R auron:auron /home/auron/Auron
```

#### Configure Environment Variables
```bash
# Copy example environment file
cp .env.example .env

# Edit environment file
nano .env
```

**Required Configuration in `.env`:**
```bash
# === DATABASE ===
POSTGRES_USER=auron_user
POSTGRES_PASSWORD=YourSecurePasswordHere123!
POSTGRES_DB=auron_db
DATABASE_URL=postgresql://auron_user:YourSecurePasswordHere123!@postgres:5432/auron_db

# === BACKEND API ===
NODE_ENV=production
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-this-too

# === FRONTEND ===
VITE_API_URL=http://YOUR_SERVER_IP:4000/api
VITE_WS_URL=ws://YOUR_SERVER_IP:4000

# === AI HINTS (LiquidMetal/Claude) - REQUIRED ===
LIQUIDMETAL_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxx
LIQUIDMETAL_ENDPOINT=https://api.liquidmetal.ai/v1/chat/completions
LIQUIDMETAL_MODEL=claude-3-sonnet-20240229

# === REDIS ===
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=YourRedisPasswordHere123!

# === WAZUH SIEM ===
WAZUH_DASHBOARD_PASSWORD=SecretPassword  # CHANGE THIS!
WAZUH_API_USER=admin
WAZUH_API_PASSWORD=SecretPassword

# === OWASP ZAP ===
ZAP_API_KEY=auron-zap-api-key

# === VULTR CLOUD (Optional - for cloud labs) ===
# VULTR_API_KEY=your-vultr-api-key-here
# VULTR_DEFAULT_REGION=ewr
# VULTR_DEFAULT_PLAN=vc2-1c-1gb

# === SESSION ===
SESSION_SECRET=your-session-secret-change-this-please

# === CORS ===
CORS_ORIGIN=http://YOUR_SERVER_IP:5173

# === LOG LEVEL ===
LOG_LEVEL=info
```

**⚠️ IMPORTANT**: Replace `YOUR_SERVER_IP` with your actual Vultr server IP address!

---

### Step 6: Deploy Platform

```bash
# Build and start all services
docker compose up -d

# Monitor startup progress (Wazuh takes ~90 seconds)
watch -n 2 'docker compose ps'

# Check logs
docker compose logs -f

# Wait for all services to show "healthy" status
```

#### Service Startup Order & Timing
1. **PostgreSQL** - 10 seconds
2. **Redis** - 5 seconds
3. **Backend API** - 20 seconds (waits for DB)
4. **Frontend** - 15 seconds
5. **Lab Containers** (DVWA, Juice Shop, Metasploitable) - 30 seconds
6. **Wazuh** (Manager, Indexer, Dashboard) - **90-120 seconds**
7. **OWASP ZAP** - 40 seconds
8. **Attack Scripts** - Instant

**Total Startup Time**: ~2-3 minutes

---

### Step 7: Verify Deployment

```bash
# Check all services are running
docker compose ps

# Should see 12 services with "Up" status:
# - auron-frontend
# - auron-backend
# - postgres
# - redis
# - dvwa
# - juiceshop
# - metasploitable
# - wazuh-manager
# - wazuh-indexer
# - wazuh-dashboard
# - owasp-zap
# - auron-attack-scripts

# Test API endpoint
curl http://localhost:4000/api/health

# Test frontend
curl http://localhost:5173

# Check logs for errors
docker compose logs backend | grep ERROR
docker compose logs frontend | grep ERROR
```

---

## 🔒 Security Configuration

### 1. SSH Tunneling for Remote Access (RECOMMENDED)

Instead of exposing ports to the internet, use SSH tunneling:

**From your local machine:**
```bash
# Tunnel frontend dashboard
ssh -L 5173:localhost:5173 auron@YOUR_SERVER_IP

# Tunnel backend API
ssh -L 4000:localhost:4000 auron@YOUR_SERVER_IP

# Tunnel Wazuh Dashboard
ssh -L 5601:localhost:5601 auron@YOUR_SERVER_IP

# All at once
ssh -L 5173:localhost:5173 \
    -L 4000:localhost:4000 \
    -L 5601:localhost:5601 \
    -L 8080:localhost:8080 \
    -L 3000:localhost:3000 \
    auron@YOUR_SERVER_IP
```

Then access:
- Frontend: http://localhost:5173
- Wazuh: https://localhost:5601

### 2. Nginx Reverse Proxy (Optional)

If you need web access, use Nginx with SSL:

```bash
# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/auron
```

**Nginx Configuration** (`/etc/nginx/sites-available/auron`):
```nginx
# Frontend
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/auron /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate (optional)
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

### 3. Disable Root SSH Login

```bash
sudo nano /etc/ssh/sshd_config

# Change these lines:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

### 4. Fail2Ban (Brute Force Protection)

```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Enable for SSH
[sshd]
enabled = true
maxretry = 3
bantime = 3600

# Start service
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🌐 Accessing the Platform

### Local Access (via SSH Tunnel)
1. **Establish SSH tunnel** (see Security Configuration above)
2. **Open browser**: http://localhost:5173
3. **Register account**: Click "Register" on dashboard
4. **Start learning**: Browse labs, start containers, complete exercises

### Remote Access (via Nginx)
1. **Open browser**: https://your-domain.com
2. **Register account**
3. **Start learning**

### Service URLs (via SSH tunnel)

| Service | URL | Credentials |
|---------|-----|-------------|
| **Auron Dashboard** | http://localhost:5173 | Register new account |
| **Backend API** | http://localhost:4000/api | - |
| **Swagger Docs** | http://localhost:4000/api-docs | - |
| **DVWA** | http://localhost:8080 | admin / password |
| **Juice Shop** | http://localhost:3000 | - |
| **Metasploitable** | http://localhost:8081 | msfadmin / msfadmin |
| **Wazuh Dashboard** | https://localhost:5601 | admin / SecretPassword |
| **ZAP Proxy** | http://localhost:8090 | - |

---

## 📊 Post-Deployment Checks

### 1. Health Checks
```bash
# Backend health
curl http://localhost:4000/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-15T..."}

# Check database connection
docker compose exec backend npm run db:migrate

# Check Redis
docker compose exec redis redis-cli ping
# Expected: PONG
```

### 2. Register First User
```bash
# Via SSH tunnel: http://localhost:5173
# Click "Register"
# Fill in details
# Login
```

### 3. Test Lab Startup
```bash
# Login to dashboard
# Click "Labs" page
# Click any lab card
# Click "Start Lab"
# Wait 10-30 seconds
# Lab should show "Running" status
```

### 4. Verify Wazuh Integration
```bash
# Access Wazuh Dashboard: https://localhost:5601
# Login: admin / SecretPassword
# Navigate to "Security Events"
# Run attack demo:
docker compose exec auron-attack-scripts /scripts/dvwa-sqli.sh
# Check for alerts in Wazuh
```

---

## 🔧 Maintenance

### Daily Operations

**Check Service Status:**
```bash
docker compose ps
docker compose logs --tail=50
```

**View Resource Usage:**
```bash
docker stats
htop  # or top
df -h  # disk usage
```

**Restart Services:**
```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart wazuh-manager
```

### Backups

**Backup Database:**
```bash
# Create backup
docker compose exec postgres pg_dump -U auron_user auron_db > backup_$(date +%Y%m%d).sql

# Restore backup
docker compose exec -T postgres psql -U auron_user auron_db < backup_20251115.sql
```

**Backup Entire Platform:**
```bash
# Stop services
docker compose down

# Backup volumes
sudo tar -czf auron_backup_$(date +%Y%m%d).tar.gz \
  -C /home/auron/Auron \
  .env docker-compose.yml

# Restart
docker compose up -d
```

### Updates

**Update Auron Platform:**
```bash
cd /home/auron/Auron

# Backup first!
docker compose down
git stash  # Save local changes
git pull origin main
git stash pop  # Restore local changes

# Rebuild and restart
docker compose build --no-cache
docker compose up -d
```

**Update Docker Images:**
```bash
docker compose pull
docker compose up -d
```

### Monitoring

**Setup Monitoring (Optional):**
```bash
# Use docker-compose.staging.yml which includes Prometheus + Grafana
docker compose -f docker-compose.staging.yml up -d

# Access Grafana: http://localhost:3001
# Default: admin / admin
```

---

## 🐛 Troubleshooting

### Issue: Wazuh Not Starting
```bash
# Check logs
docker compose logs wazuh-manager
docker compose logs wazuh-indexer

# Wazuh requires time to initialize (~90 seconds)
# Wait and check again

# If still failing, increase VM RAM to 16GB
```

### Issue: Port Already in Use
```bash
# Find process using port
sudo lsof -i :5173
sudo lsof -i :4000

# Kill process or change port in .env
```

### Issue: Database Connection Failed
```bash
# Check PostgreSQL
docker compose logs postgres

# Reset database
docker compose down -v  # WARNING: Deletes all data!
docker compose up -d
```

### Issue: Frontend Can't Connect to Backend
```bash
# Check VITE_API_URL in .env
# Should be: http://YOUR_SERVER_IP:4000/api

# Rebuild frontend
docker compose build frontend
docker compose restart frontend
```

### Issue: Out of Disk Space
```bash
# Check usage
df -h
docker system df

# Clean up
docker system prune -a --volumes
```

---

## 💰 Cost Estimation

### Monthly Costs (Production Setup)

| Item | Cost |
|------|------|
| **Vultr vc2-8c-16gb** | $96/month |
| **Auto Backups** (optional) | $9.60/month |
| **Snapshots** (optional, 1 snapshot) | $1/month |
| **Bandwidth** | Included (5TB) |
| **Total** | **~$96-107/month** |

### Cost Optimization Tips
1. **Use hourly billing**: Only run when needed (~$0.143/hour)
2. **Snapshots**: Take snapshot, destroy instance, restore later
3. **Smaller plan**: Use vc2-4c-8gb ($48/month) for testing
4. **No Wazuh**: Disable Wazuh in `docker-compose.yml` to use smaller VM

---

## 🎓 Workshop Deployment

For running workshops with remote students:

1. **Deploy on Vultr** using vc2-8c-16gb
2. **Setup SSH tunnels** for each student
3. **Pre-create accounts** for students
4. **Share credentials** securely (1Password, encrypted email)
5. **Monitor usage** via Wazuh and Docker stats
6. **Destroy instance** after workshop to save costs

**Cost Example**:
- Workshop duration: 4 hours
- VM cost: $0.143/hour × 4 = $0.57
- Students: 20
- Cost per student: $0.03

---

## ⚠️ Security Warnings

### DO NOT:
- ❌ Expose DVWA, Juice Shop, or Metasploitable to the internet
- ❌ Use real credentials or sensitive data in labs
- ❌ Deploy on production networks
- ❌ Allow public access without authentication
- ❌ Use weak passwords for Wazuh, PostgreSQL, or JWT secrets

### DO:
- ✅ Use SSH tunneling for remote access
- ✅ Keep firewall enabled (UFW)
- ✅ Change all default passwords in `.env`
- ✅ Regular security updates (`apt update && apt upgrade`)
- ✅ Monitor access logs
- ✅ Use HTTPS with valid SSL certificates
- ✅ Limit access to trusted IPs only

---

## 📚 Additional Resources

- **Auron Documentation**: See [DEPLOYMENT_COMPLETE.md](DEPLOYMENT_COMPLETE.md)
- **Vultr API Docs**: https://www.vultr.com/api/
- **Docker Docs**: https://docs.docker.com/
- **Wazuh Docs**: https://documentation.wazuh.com/
- **OWASP ZAP**: https://www.zaproxy.org/docs/

---

## 🆘 Support

If you encounter issues:
1. Check [DEPLOYMENT_COMPLETE.md](DEPLOYMENT_COMPLETE.md) troubleshooting section
2. Review Docker logs: `docker compose logs`
3. Open GitHub issue: https://github.com/Haseeb-1698/Auron/issues
4. Community discussions: https://github.com/Haseeb-1698/Auron/discussions

---

**🚀 Happy Training!**

**Last Updated**: November 15, 2025
**Version**: 2.0
**Status**: Production-Ready
