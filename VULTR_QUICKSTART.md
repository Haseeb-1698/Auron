# ⚡ Vultr Quick Start Guide - Auron Platform

> **Get your cybersecurity training platform running on Vultr in 10 minutes**

## 🎯 Recommended VM Configuration

### Production Setup (Recommended)
```
Plan:     vc2-8c-16gb
CPU:      8 vCPUs
RAM:      16GB
Storage:  320GB SSD
Cost:     $96/month ($0.143/hour)
OS:       Ubuntu 22.04 LTS
```

**Why this plan?**
- Runs all 12 Docker services smoothly
- Wazuh SIEM performs optimally
- Handles 20+ concurrent users
- No performance bottlenecks

### Budget Setup
```
Plan:     vc2-4c-8gb
CPU:      4 vCPUs
RAM:      8GB
Storage:  160GB SSD
Cost:     $48/month ($0.071/hour)
```
⚠️ Note: Wazuh may be slower with 8GB RAM

---

## 🚀 Automated Deployment (5 Steps)

### Step 1: Create Vultr Instance
1. Go to https://my.vultr.com/
2. Click **"Deploy New Server"**
3. Select:
   - **Cloud Compute - High Performance**
   - **Location**: `ewr` (New Jersey) or nearest
   - **OS**: Ubuntu 22.04 LTS x64
   - **Plan**: `vc2-8c-16gb` (16GB RAM)
4. Add your **SSH key**
5. Click **"Deploy Now"**
6. Wait 3-5 minutes for instance to be ready

### Step 2: Connect to Server
```bash
# From your local machine
ssh root@YOUR_SERVER_IP
```

### Step 3: Create Non-Root User
```bash
# Create user with sudo privileges
adduser auron
usermod -aG sudo auron

# Copy SSH keys
mkdir -p /home/auron/.ssh
cp /root/.ssh/authorized_keys /home/auron/.ssh/
chown -R auron:auron /home/auron/.ssh
chmod 700 /home/auron/.ssh
chmod 600 /home/auron/.ssh/authorized_keys

# Exit and reconnect as new user
exit
ssh auron@YOUR_SERVER_IP
```

### Step 4: Download and Run Automated Script

**Option A: Using Wrapper Script (Recommended - Handles Docker Permissions)**
```bash
# Clone repository
git clone https://github.com/Haseeb-1698/Auron.git
cd Auron

# Run wrapper script (handles docker group activation)
bash scripts/vultr-deploy-wrapper.sh
```

**Option B: Manual Method**
```bash
# Clone repository
git clone https://github.com/Haseeb-1698/Auron.git
cd Auron

# Activate docker group first
newgrp docker

# Run deployment script
bash scripts/vultr-deploy.sh
```

The script will automatically:
- ✅ Check system requirements
- ✅ Install Docker & Docker Compose
- ✅ Configure firewall (UFW)
- ✅ Setup Fail2Ban
- ✅ Generate secure passwords
- ✅ Configure environment variables
- ✅ Pull and build Docker images
- ✅ Start all 12 services
- ✅ Display access URLs and credentials

**Total time: ~10 minutes** (mostly Docker image downloads)

### Step 5: Access Platform
```bash
# Via SSH tunnel (RECOMMENDED for security)
ssh -L 5173:localhost:5173 \
    -L 4000:localhost:4000 \
    -L 5601:localhost:5601 \
    auron@YOUR_SERVER_IP

# Then open in browser:
# http://localhost:5173
```

---

## 🔑 Manual Deployment (If You Prefer)

If you want more control, follow the detailed guide: [VULTR_DEPLOYMENT.md](VULTR_DEPLOYMENT.md)

---

## 🌐 Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://YOUR_SERVER_IP:5173 | Register new account |
| **Backend API** | http://YOUR_SERVER_IP:4000/api | - |
| **Wazuh SIEM** | https://YOUR_SERVER_IP:5601 | See `.credentials.txt` |
| **DVWA Lab** | http://localhost:8080 | admin / password |
| **Juice Shop** | http://localhost:3000 | - |

**⚠️ Replace `YOUR_SERVER_IP` with your actual Vultr server IP**

---

## 🔒 Security Best Practices

### 1. Use SSH Tunneling (Recommended)
```bash
# Tunnel all ports securely
ssh -L 5173:localhost:5173 \
    -L 4000:localhost:4000 \
    -L 5601:localhost:5601 \
    -L 8080:localhost:8080 \
    -L 3000:localhost:3000 \
    auron@YOUR_SERVER_IP

# Access via localhost
open http://localhost:5173
```

### 2. Configure Firewall
```bash
# The automated script sets this up, but verify:
sudo ufw status

# Should show:
# 22/tcp    ALLOW    # SSH only
# Everything else DENY
```

### 3. Change Default Passwords
```bash
# View generated credentials
cat .credentials.txt

# Save them securely, then delete
rm .credentials.txt
```

### 4. DO NOT Expose Vulnerable Apps
- ❌ NEVER expose ports 8080 (DVWA), 3000 (Juice Shop), 8081 (Metasploitable) to internet
- ✅ ALWAYS use SSH tunneling
- ✅ ONLY bind to localhost (127.0.0.1)

---

## 🛠️ Useful Commands

### Service Management
```bash
# View status
docker compose ps

# View logs
docker compose logs -f

# View specific service logs
docker compose logs backend
docker compose logs wazuh-manager

# Restart services
docker compose restart

# Stop all services
docker compose down

# Start all services
docker compose up -d
```

### Resource Monitoring
```bash
# Docker resource usage
docker stats

# System resources
htop

# Disk usage
df -h
docker system df
```

### Troubleshooting
```bash
# Check if all ports are listening
sudo netstat -tlnp

# Test backend API
curl http://localhost:4000/api/health

# Check Docker network
docker network ls
docker network inspect auron_default

# View all containers
docker ps -a
```

---

## 🐛 Common Issues & Solutions

### Issue: Wazuh Not Starting
```bash
# Wazuh needs time to initialize (~90 seconds)
docker compose logs wazuh-manager

# If still failing, check RAM
free -h

# Need 16GB for optimal Wazuh performance
```

**Solution**: Upgrade to `vc2-8c-16gb` plan

### Issue: Port Already in Use
```bash
# Find what's using the port
sudo lsof -i :5173

# Kill the process or change port in .env
```

### Issue: Can't Connect to Frontend
```bash
# Check if container is running
docker compose ps frontend

# Check backend API URL in .env
grep VITE_API_URL .env

# Should be: VITE_API_URL=http://YOUR_SERVER_IP:4000/api

# Rebuild if changed
docker compose build frontend
docker compose restart frontend
```

### Issue: Database Connection Failed
```bash
# Check PostgreSQL logs
docker compose logs postgres

# Check if database exists
docker compose exec postgres psql -U auron_user -d auron_db -c "SELECT 1;"

# If corrupted, reset (WARNING: deletes data)
docker compose down -v
docker compose up -d
```

---

## 💰 Cost Optimization

### Hourly Billing
Vultr charges hourly, so you only pay when running:
```
Workshop duration: 4 hours
Cost: $0.143/hour × 4 = $0.57
```

### Save Costs with Snapshots
```bash
# 1. Take snapshot before destroying
# Via Vultr dashboard: Settings → Create Snapshot

# 2. Destroy instance
# Stops billing

# 3. Restore from snapshot when needed
# Deploys in 2-3 minutes

# Snapshot storage: ~$1/month (much cheaper than $96/month)
```

### Use Smaller Plan for Testing
```bash
# For development/testing without Wazuh
# Use vc2-2c-4gb ($18/month)

# Disable Wazuh in docker-compose.yml:
# Comment out:
#   - wazuh-manager
#   - wazuh-indexer
#   - wazuh-dashboard
```

---

## 📊 Expected Startup Times

| Service | Startup Time |
|---------|--------------|
| PostgreSQL | 10 seconds |
| Redis | 5 seconds |
| Backend API | 20 seconds |
| Frontend | 15 seconds |
| DVWA | 20 seconds |
| Juice Shop | 25 seconds |
| Metasploitable | 30 seconds |
| OWASP ZAP | 40 seconds |
| **Wazuh** | **90-120 seconds** |
| **Total** | **2-3 minutes** |

---

## 🎓 Workshop Scenario

### Hosting Remote Workshop
1. **Deploy on Vultr** (10 minutes)
2. **Create student accounts** in advance
3. **Share SSH tunnel command** with students:
   ```bash
   ssh -L 5173:localhost:5173 student@YOUR_SERVER_IP
   ```
4. **Run workshop** (1-4 hours)
5. **Take snapshot** of instance
6. **Destroy instance** to stop billing

**Cost Example:**
- Workshop: 4 hours × $0.143/hour = **$0.57**
- Snapshot storage: **$1/month**
- Total: **~$1.50 per workshop**

---

## 📚 Additional Documentation

- **Full Deployment Guide**: [VULTR_DEPLOYMENT.md](VULTR_DEPLOYMENT.md)
- **General Deployment**: [DEPLOYMENT_COMPLETE.md](DEPLOYMENT_COMPLETE.md)
- **Platform README**: [README.md](README.md)
- **Workshop Guide**: [WORKSHOP_GUIDE.md](WORKSHOP_GUIDE.md)

---

## 🆘 Getting Help

1. **Check logs**: `docker compose logs -f`
2. **Review documentation**: See links above
3. **GitHub Issues**: https://github.com/Haseeb-1698/Auron/issues
4. **Vultr Support**: https://my.vultr.com/support/

---

## ✅ Deployment Checklist

- [ ] Created Vultr instance (vc2-8c-16gb recommended)
- [ ] Connected via SSH
- [ ] Created non-root user with sudo
- [ ] Ran automated deployment script
- [ ] Configured firewall (UFW)
- [ ] Setup SSH tunneling
- [ ] Saved credentials from `.credentials.txt`
- [ ] Tested frontend access (http://localhost:5173)
- [ ] Registered first user account
- [ ] Started first lab successfully
- [ ] Verified Wazuh SIEM access (https://localhost:5601)

---

**🚀 Ready to train!**

**Questions?** Open an issue: https://github.com/Haseeb-1698/Auron/issues

---

**Last Updated**: November 15, 2025
**Version**: 2.0
