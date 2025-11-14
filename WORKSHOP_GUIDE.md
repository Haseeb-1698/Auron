# Auron Workshop & Training Delivery Guide

**Version:** 2.0
**Last Updated:** 2025-11-14
**Target Audience:** Workshop Facilitators, Security Instructors, Lab Administrators

---

## Table of Contents

1. [Quick Start (First 10 Minutes)](#quick-start-first-10-minutes)
2. [Pre-Workshop Checklist](#pre-workshop-checklist)
3. [Complete Setup Guide](#complete-setup-guide)
4. [Workshop Scenarios](#workshop-scenarios)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## Quick Start (First 10 Minutes)

### Prerequisites Verification

```bash
# Verify Docker and Docker Compose
docker --version  # Should be 24.0+
docker compose version  # Should be 2.20+

# Check system resources
free -h  # Minimum 8GB RAM recommended
df -h    # Minimum 50GB free disk space
```

### Rapid Deployment

```bash
# 1. Clone and navigate
cd Auron

# 2. Copy environment file
cp .env.example .env

# 3. Start the stack (this will take 3-5 minutes)
docker compose up -d

# 4. Monitor startup (wait for all services to show "healthy")
watch -n 2 'docker ps --format "table {{.Names}}\t{{.Status}}"'

# Press Ctrl+C when all show "healthy" or "Up"
```

### Verify Everything Works

```bash
# Test all endpoints
curl -f http://localhost:4000/health && echo "✓ Backend healthy"
curl -f -I http://localhost:5173 && echo "✓ Frontend accessible"
curl -f http://localhost:8080 && echo "✓ DVWA ready"
curl -f http://localhost:3000 && echo "✓ Juice Shop ready"
curl -f http://localhost:9200 && echo "✓ Wazuh indexer ready"
curl -f http://localhost:5601 && echo "✓ Wazuh Dashboard ready"
curl -f http://localhost:8090 && echo "✓ ZAP ready"

# Verify Wazuh is receiving logs
docker exec auron-wazuh /var/ossec/bin/wazuh-control status && echo "✓ Wazuh Manager running"

# Quick attack test
docker exec auron-attack-scripts nmap --version && echo "✓ Attack tools ready"
```

**If all tests pass, you're ready for the workshop! ✓**

**Pro Tip:** Open http://localhost:5601 (admin/SecretPassword) to verify Wazuh Dashboard is accessible.

---

## Pre-Workshop Checklist

### Day Before Workshop

- [ ] **Hardware**: 4+ CPU cores, 8GB+ RAM, 50GB+ free disk
- [ ] **Docker**: Version 24.0+, Docker Compose 2.20+
- [ ] **Network**: Stable internet for initial image pulls (~5GB)
- [ ] **Ports Available**: 3000, 4000, 5173, 5601, 8080, 8081, 8090, 9200
- [ ] **Test Run**: Complete setup once to verify and cache images

### 1 Hour Before Workshop

```bash
# Start the stack
docker compose up -d

# Wait for healthchecks (3-5 minutes)
while ! docker ps | grep -q "healthy"; do
  echo "Waiting for services to be healthy..."
  sleep 5
done

# Create demo accounts
curl -X POST http://localhost:4000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "demo",
    "email": "demo@workshop.local",
    "password": "Workshop123!",
    "fullName": "Demo User"
  }'

# Verify Wazuh dashboard
open http://localhost:5601
# Login: admin / SecretPassword (from docker-compose.yml)
```

### During Workshop Setup

- [ ] **Display URLs** on whiteboard or slides:
  - Frontend: `http://localhost:5173`
  - Wazuh Dashboard: `http://localhost:5601`
  - DVWA: `http://localhost:8080`
  - Juice Shop: `http://localhost:3000`

- [ ] **Credentials** readily available:
  - Demo account: `demo / Workshop123!`
  - Wazuh: `admin / SecretPassword`
  - DVWA: `admin / password`

---

## Complete Setup Guide

### 1. Environment Configuration

Edit `.env` with workshop-specific settings:

```bash
# Backend API
PORT=4000
NODE_ENV=production

# Database (default credentials fine for workshops)
DB_NAME=auron_db
DB_USER=auron_user
DB_PASSWORD=workshop_secure_pass

# Security (IMPORTANT: Change for production)
JWT_SECRET=workshop_jwt_secret_change_me

# Rate Limiting (adjust based on attendee count)
RATE_LIMIT_WINDOW_MS=900000     # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100     # Per IP

# OWASP ZAP Configuration
ZAP_API_URL=http://zap:8090
ZAP_API_KEY=auron-zap-api-key
ZAP_SCAN_TIMEOUT=300000         # 5 minutes

# Frontend
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000
```

### 2. Build and Start Services

```bash
# Build custom images (first time only, ~10 minutes)
docker compose build

# Start all services
docker compose up -d

# View logs in real-time
docker compose logs -f

# Or monitor specific service
docker compose logs -f backend
```

### 3. Verify Service Health

```bash
# Check all container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Expected output should show:
# NAME                     STATUS                    PORTS
# auron-frontend           Up (healthy)              127.0.0.1:5173->80
# auron-backend            Up (healthy)              127.0.0.1:4000->4000
# auron-dvwa               Up (healthy)              127.0.0.1:8080->80
# auron-juiceshop          Up (healthy)              127.0.0.1:3000->3000
# auron-metasploitable     Up (healthy)              127.0.0.1:8081->80
# auron-zap                Up (healthy)              127.0.0.1:8090->8090
# auron-wazuh-dashboard    Up                        127.0.0.1:5601->5601
# auron-wazuh              Up                        127.0.0.1:55000->55000
# auron-wazuh-indexer      Up (healthy)              127.0.0.1:9200->9200
# auron-postgres           Up (healthy)              127.0.0.1:5432->5432
# auron-redis              Up (healthy)              127.0.0.1:6379->6379
# auron-attack-scripts     Up                        (no ports)
```

### 4. Initialize Demo Data

```bash
# Run database migrations
docker exec auron-backend npm run migrate

# Seed labs (if seed script exists)
docker exec auron-backend npm run seed

# Or create labs manually via API
curl -X POST http://localhost:4000/api/admin/labs \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -d '{
    "name": "SQL Injection Basics",
    "description": "Learn to identify and exploit SQL injection vulnerabilities",
    "category": "web_security",
    "difficulty": "beginner",
    "containerConfig": {
      "image": "vulnerables/web-dvwa:latest",
      "ports": [{"container": 80, "host": null}]
    }
  }'
```

---

## Workshop Scenarios

### SIEM Visibility (Blue Team Perspective)

**NEW:** All workshop scenarios now include real-time SIEM monitoring with Wazuh!

Every attack executed during the workshop is automatically:
- ✅ Logged in real-time to Wazuh Manager
- ✅ Parsed by custom decoders
- ✅ Matched against 40+ custom detection rules
- ✅ Displayed in Wazuh Dashboard with severity scoring

**Recommended Setup for Instructors:**
1. **Dual-screen setup:**
   - Screen 1: Terminal (attacker perspective)
   - Screen 2: Wazuh Dashboard at http://localhost:5601 (defender perspective)

2. **Pre-configure Wazuh filters:**
   ```
   # In Wazuh Dashboard, create saved searches:
   - "SQL Injection Attempts" → rule.id:(100001 OR 100002 OR 100101 OR 100200)
   - "Port Scans" → rule.id:(100050 OR 100051 OR 100070)
   - "Brute Force" → rule.id:(100040 OR 100041 OR 100080)
   - "DVWA Activity" → service:dvwa
   - "Juice Shop Activity" → service:juiceshop
   ```

3. **Enable auto-refresh:**
   - Click clock icon in top-right → Set to "5 seconds"
   - This provides live attack visibility during demonstrations

**Teaching Moment:**
> "This is what a Security Operations Center (SOC) analyst sees when your application is under attack. Notice how the same SQL injection you just executed shows up instantly in the SIEM with full context: source IP, attack payload, affected service, and remediation guidance."

For detailed rule documentation, see `wazuh-config/README.md`.

---

### Scenario 1: Web Application Security Basics (60 min)

**Objective:** Introduce OWASP Top 10 vulnerabilities using DVWA

#### Setup (5 min)

```bash
# Ensure DVWA is accessible
curl -I http://localhost:8080

# Participants log into Auron platform
open http://localhost:5173
```

#### Demo Flow (55 min)

1. **SQL Injection (15 min)**
   ```bash
   # Run attack script
   docker exec auron-attack-scripts bash /scripts/dvwa-sqli.sh

   # Show in Wazuh Dashboard
   # Navigate to Security Events → filter for "sql"
   ```

2. **Directory Scanning (10 min)**
   ```bash
   # Port scan metasploitable
   docker exec auron-attack-scripts bash /scripts/port-scan.sh metasploitable quick

   # Directory brute-force
   docker exec auron-attack-scripts bash /scripts/dirb-scan.sh http://juiceshop:3000
   ```

3. **Vulnerability Scanning (20 min)**
   - Log into Auron as demo user
   - Start a DVWA lab instance via UI
   - Trigger a FULL vulnerability scan
   - Wait ~5 minutes for ZAP to complete
   - Review findings in the dashboard
   - Generate PDF report

4. **Wazuh SIEM Review (10 min)**
   - Open Wazuh Dashboard: `http://localhost:5601`
   - Show Security Events for the past hour
   - Explain alert severity levels
   - Demonstrate event correlation

---

### Scenario 2: Advanced Penetration Testing (90 min)

**Objective:** Hands-on exploitation using Metasploitable

#### Prerequisites

- Participants should have basic Linux knowledge
- Familiarity with Metasploit recommended

#### Steps

1. **Reconnaissance** (20 min)
   ```bash
   # From attack scripts container
   docker exec -it auron-attack-scripts bash

   # Nmap comprehensive scan
   nmap -sV -sC -O metasploitable -oN /scripts/scan_results.txt

   # Review open ports
   cat /scripts/scan_results.txt
   ```

2. **Exploitation** (30 min)
   ```bash
   # Launch Metasploit
   msfconsole

   # Example: Exploit vsftpd backdoor
   msf6 > use exploit/unix/ftp/vsftpd_234_backdoor
   msf6 exploit(vsftpd_234_backdoor) > set RHOST metasploitable
   msf6 exploit(vsftpd_234_backdoor) > exploit
   ```

3. **Post-Exploitation** (20 min)
   - Privilege escalation techniques
   - Data exfiltration simulation
   - Persistence mechanisms

4. **Detection & Response** (20 min)
   - Review Wazuh alerts generated by exploitation
   - Analyze logs in SIEM
   - Discuss blue-team response strategies

---

### Scenario 3: Vulnerability Assessment & Reporting (45 min)

**Objective:** Complete scan-to-report workflow

#### Full Workflow

```bash
# 1. Register and login
BACKEND=http://localhost:4000/api
USER_EMAIL="student1@workshop.local"
USER_PASS="SecurePass123!"

# Register
curl -X POST "$BACKEND/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{
    \"username\": \"student1\",
    \"email\": \"$USER_EMAIL\",
    \"password\": \"$USER_PASS\",
    \"fullName\": \"Student One\"
  }"

# Login and get token
TOKEN=$(curl -s -X POST "$BACKEND/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\": \"$USER_EMAIL\", \"password\": \"$USER_PASS\"}" \
  | jq -r '.data.accessToken')

# 2. List available labs
curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND/labs" | jq .

# 3. Start a lab instance
LAB_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND/labs" | jq -r '.data[0].id')

INSTANCE=$(curl -s -X POST "$BACKEND/labs/$LAB_ID/start" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{}')

INSTANCE_ID=$(echo "$INSTANCE" | jq -r '.data.id')
ACCESS_URL=$(echo "$INSTANCE" | jq -r '.data.accessUrl')

echo "Lab running at: $ACCESS_URL"

# 4. Start vulnerability scan (FULL with ZAP)
SCAN=$(curl -s -X POST "$BACKEND/scans" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"labId\": \"$LAB_ID\",
    \"instanceId\": \"$INSTANCE_ID\",
    \"scanType\": \"full\"
  }")

SCAN_ID=$(echo "$SCAN" | jq -r '.data.id')

echo "Scan started: $SCAN_ID"
echo "This will take ~5 minutes. Monitoring progress..."

# 5. Poll scan status
while true; do
  STATUS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND/scans/$SCAN_ID" | jq -r '.data.status')
  PROGRESS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND/scans/$SCAN_ID" | jq -r '.data.progress')

  echo "Scan status: $STATUS ($PROGRESS%)"

  if [ "$STATUS" = "completed" ]; then
    break
  fi

  sleep 10
done

# 6. View scan results
curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND/scans/$SCAN_ID" | jq '.data.results'

# 7. Generate PDF report
REPORT=$(curl -s -X POST "$BACKEND/reports" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "reportType": "vulnerability_scan",
    "format": "pdf",
    "title": "Workshop Vulnerability Assessment",
    "description": "Comprehensive scan results from workshop lab"
  }')

REPORT_ID=$(echo "$REPORT" | jq -r '.data.id')

# Wait for report generation
sleep 5

# 8. Download PDF
curl -L -H "Authorization: Bearer $TOKEN" \
  "$BACKEND/reports/$REPORT_ID/download" \
  -o "workshop_report_$REPORT_ID.pdf"

echo "Report saved as workshop_report_$REPORT_ID.pdf"
```

---

## Troubleshooting

### Issue: Services Not Starting

**Symptoms:**
- `docker ps` shows containers in "unhealthy" or "restarting" state
- Healthcheck failures

**Diagnosis:**
```bash
# Check logs for specific service
docker logs auron-backend --tail=100
docker logs auron-dvwa --tail=100
docker logs auron-wazuh-indexer --tail=100

# Check resource usage
docker stats --no-stream

# Verify port conflicts
sudo netstat -tulpn | grep -E '(3000|4000|5173|5601|8080|8090|9200)'
```

**Solutions:**

1. **Insufficient Memory:**
   ```bash
   # Stop and restart with more memory
   docker compose down
   # Edit docker-compose.yml to add resource limits
   docker compose up -d
   ```

2. **Port Conflicts:**
   ```bash
   # Find conflicting process
   sudo lsof -i :8080  # Replace with conflicting port

   # Kill it or change port in .env
   ```

3. **Database Connection Issues:**
   ```bash
   # Recreate database
   docker compose down -v  # WARNING: Deletes data
   docker compose up -d postgres
   # Wait for postgres to be healthy
   docker compose up -d
   ```

---

### Issue: Attack Scripts Failing

**Symptoms:**
- `docker exec auron-attack-scripts nmap` returns "command not found"

**Cause:** Tools not pre-installed or container not built properly

**Solution:**
```bash
# Rebuild attack-scripts with baked tools
docker compose build attack-scripts

# Or install tools manually (slower)
docker exec auron-attack-scripts apt-get update
docker exec auron-attack-scripts apt-get install -y nmap
```

---

### Issue: ZAP Scan Hangs or Times Out

**Symptoms:**
- FULL scans stay at 30-50% progress
- Scan eventually fails with timeout

**Diagnosis:**
```bash
# Check ZAP logs
docker logs auron-zap --tail=100

# Test ZAP API manually
curl http://localhost:8090/JSON/core/view/alerts/ \
  "?apikey=auron-zap-api-key&baseurl=http://dvwa"
```

**Solutions:**

1. **Increase Timeout:**
   ```bash
   # In .env file
   ZAP_SCAN_TIMEOUT=600000  # 10 minutes

   # Restart backend
   docker compose restart backend
   ```

2. **ZAP Not Responding:**
   ```bash
   # Restart ZAP service
   docker compose restart zap

   # Wait for healthcheck
   docker ps | grep zap
   ```

---

### Issue: PDF Generation Fails

**Symptoms:**
- Report status shows "failed"
- Error: "PDF generation failed"

**Cause:** Puppeteer/Chrome dependencies missing in container

**Solution:**
```bash
# Rebuild backend with Puppeteer dependencies
docker compose build backend

# Or check backend logs for specific error
docker logs auron-backend | grep -A 10 "PDF generation"
```

---

### Issue: Wazuh Shows No Alerts

**Note:** Wazuh is now fully integrated! All vulnerable containers automatically forward logs to Wazuh Manager.

**How to Access Wazuh Dashboard:**
```bash
# Open in browser
open http://localhost:5601

# Login credentials:
# Username: admin
# Password: SecretPassword
```

**Verifying Log Collection:**
```bash
# Check logs are being received by Wazuh
docker exec auron-wazuh tail -f /var/ossec/logs/archives/archives.log

# Check Wazuh service status
docker exec auron-wazuh /var/ossec/bin/wazuh-control status

# Test log forwarding from a container
docker exec auron-dvwa logger "Test message from DVWA"
```

**Workshop Demonstration:**
1. **Open Wazuh Dashboard** (http://localhost:5601)
2. **Navigate to "Security events"** in left menu
3. **Run an attack:**
   ```bash
   curl "http://localhost:8080/vulnerabilities/sqli/?id=1' OR 1=1--&Submit=Submit"
   ```
4. **Watch alert appear in real-time** (Rule ID: 100101 - SQL Injection on DVWA)
5. **Explain to students:**
   - Show attack from terminal (red team perspective)
   - Show alert in Wazuh (blue team perspective)
   - Discuss detection rules and how they work

**Common Attack Detections:**
- SQL Injection → Rules 100001-100002, 100101, 100200
- XSS → Rules 100010-100011
- Directory Traversal → Rules 100020-100021
- Brute Force → Rules 100040-100041, 100080
- Port Scanning → Rules 100050-100051, 100070
- Web Scanners (Nikto, Dirb) → Rules 100060-100061

**Filtering by Service:**
```
# In Wazuh Dashboard search bar:
service: dvwa
service: juiceshop
service: metasploitable
service: attack-scripts
```

**If No Alerts Appear:**
1. Verify Wazuh is healthy: `docker ps | grep wazuh`
2. Check custom rules loaded: `docker exec auron-wazuh cat /var/ossec/etc/rules/local_rules.xml`
3. Verify syslog port open: `docker exec auron-wazuh netstat -ulnp | grep 514`
4. Check container logging config: `docker inspect auron-dvwa | grep -A 10 LogConfig`

For detailed Wazuh configuration, see `wazuh-config/README.md`

---

### Issue: Frontend Can't Connect to Backend

**Symptoms:**
- Login fails
- API calls return CORS errors in browser console

**Diagnosis:**
```bash
# Test backend directly
curl http://localhost:4000/health

# Check CORS configuration
docker logs auron-backend | grep -i cors
```

**Solution:**
```bash
# Verify CORS_ORIGIN in .env matches frontend URL
# .env file:
CORS_ORIGIN=http://localhost:5173

# Restart backend
docker compose restart backend
```

---

## FAQ

### Q: How many students can one instance support?

**A:** Depends on resources:
- **Small** (4 cores, 8GB RAM): 1-5 concurrent students
- **Medium** (8 cores, 16GB RAM): 5-15 concurrent students
- **Large** (16 cores, 32GB RAM): 15-30 concurrent students

Monitor with `docker stats` during workshop and scale up if needed.

---

### Q: Can I run this on a cloud VM?

**A:** Yes! Recommended specs:
- **AWS:** t3.xlarge or larger (4 vCPU, 16GB RAM)
- **Azure:** Standard_D4s_v3 or larger
- **GCP:** n2-standard-4 or larger

Ensure security groups allow ports 5173, 5601 (or use SSH tunneling).

---

### Q: How do I reset everything between workshops?

**A:**
```bash
# Nuclear option: Delete all data and restart
docker compose down -v
docker compose up -d

# Soft option: Just restart services
docker compose restart

# Keep data, rebuild images
docker compose build
docker compose up -d --force-recreate
```

---

### Q: Can students access this remotely?

**A:** Current setup binds to `127.0.0.1` for security.

To allow remote access:

1. **Edit `docker-compose.yml`:**
   ```yaml
   # Change all ports from:
   - "127.0.0.1:5173:80"

   # To (exposes to all interfaces):
   - "5173:80"
   ```

2. **Set up firewall rules** to restrict access to your workshop network

3. **Use HTTPS** with a reverse proxy (nginx/Caddy) for production

**⚠ Security Warning:** Only do this on isolated workshop networks, not public internet!

---

### Q: How do I update to the latest version?

**A:**
```bash
# Pull latest code
git pull origin main

# Rebuild images
docker compose build

# Restart with new images
docker compose down
docker compose up -d

# Run any new migrations
docker exec auron-backend npm run migrate
```

---

## Support

**Issues?** Check:
1. This guide
2. `docker logs [service-name]`
3. GitHub Issues: https://github.com/Haseeb-1698/Auron/issues

**Questions?** Open a discussion on GitHub or contact the Auron team.

---

**Happy Teaching! 🎓🔒**
