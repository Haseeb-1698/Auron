# Getting Started with Auron

Welcome to Auron! This guide will help you get started with the platform quickly.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Docker Desktop**: Version 20.10 or higher
  - Download from [docker.com](https://www.docker.com/products/docker-desktop)
- **Docker Compose**: Usually included with Docker Desktop
- **Node.js**: Version 18 or higher (for backend development)
  - Download from [nodejs.org](https://nodejs.org/)
- **Google Chrome**: Latest version (for browser extension)

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: 8GB minimum (16GB recommended)
- **Disk Space**: 20GB free space
- **CPU**: 4 cores recommended

## Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/Haseeb-1698/Auron.git
cd Auron
```

### Step 2: Start Docker Lab Environment

```bash
# Start all lab services
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs (optional)
docker-compose logs -f
```

This will start:
- DVWA on port 8080
- Juice Shop on port 3000
- Wazuh Dashboard on port 5601
- Metasploitable on port 8081
- Backend API on port 4000

### Step 3: Initialize the Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start the backend server
npm start
```

The backend API will be available at http://localhost:4000

### Step 4: Install Browser Extension

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Navigate to and select the `browser-extension` folder
6. The Auron extension icon should appear in your toolbar

### Step 5: Create Your Account

1. Open your browser and go to http://localhost:4000/health
2. You should see: `{"status":"ok","timestamp":"..."}`
3. Use the API or create a simple registration form to register

Example using curl:
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student",
    "email": "student@example.com",
    "password": "SecurePassword123"
  }'
```

## Quick Tour

### 1. Your First Vulnerability Lab

**Try SQL Injection in DVWA:**

1. Open http://localhost:8080
2. Login with: `admin` / `password`
3. Navigate to "SQL Injection"
4. Try input: `' OR '1'='1`
5. Observe the vulnerability

### 2. Using the Browser Extension

1. While on the DVWA page, click the Auron extension icon
2. Navigate through the tabs:
   - **Cookies**: See cookie security analysis
   - **Sessions**: Check session management
   - **CSP**: Review Content Security Policy
   - **Phishing**: See phishing indicators
3. Click "Export Report" to save findings

### 3. Tracking Your Progress

Make API calls to track progress:

```bash
# Login first to get token
TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student","password":"SecurePassword123"}' \
  | jq -r '.token')

# Update progress
curl -X POST http://localhost:4000/api/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "lab_id": "dvwa",
    "module_id": "sql-injection-1",
    "completed": true,
    "score": 100
  }'

# View your progress
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/progress | jq
```

## Learning Paths

### Path 1: Absolute Beginner
1. Start with DVWA on "Low" security
2. Follow built-in help guides
3. Practice SQL Injection
4. Move to XSS exercises
5. Use extension to analyze real sites

### Path 2: Web Security Focused
1. Complete DVWA challenges
2. Move to Juice Shop
3. Complete 10 beginner challenges
4. Analyze security headers with extension
5. Create security reports

### Path 3: Penetration Testing
1. Learn basic enumeration
2. Practice on Metasploitable
3. Use nmap to scan services
4. Research vulnerabilities
5. Document findings

### Path 4: Blue Team / Defense
1. Set up Wazuh monitoring
2. Configure log collection
3. Simulate attacks on DVWA
4. Observe Wazuh alerts
5. Create response procedures

## Common Commands

### Docker Management
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart dvwa

# View logs
docker-compose logs -f [service-name]

# Reset everything (removes data)
docker-compose down -v
```

### Backend Management
```bash
# Start development mode (auto-reload)
npm run dev

# Start production mode
npm start

# View logs
tail -f combined.log
```

### Extension Development
```bash
# After making changes to extension:
# 1. Go to chrome://extensions/
# 2. Click reload icon on Auron extension
```

## Troubleshooting

### Issue: Docker containers won't start
**Solution:**
```bash
# Check if ports are in use
netstat -an | grep LISTEN | grep -E "8080|3000|4000"

# Kill processes using those ports or change ports in docker-compose.yml
```

### Issue: Backend database errors
**Solution:**
```bash
cd backend
rm -rf data/auron.db
npm start  # Database will be recreated
```

### Issue: Extension not analyzing pages
**Solution:**
1. Reload the extension in chrome://extensions/
2. Refresh the webpage you're analyzing
3. Check browser console for errors (F12)

### Issue: Services running slowly
**Solution:**
```bash
# Check Docker resource usage
docker stats

# Increase Docker Desktop memory allocation:
# Docker Desktop → Settings → Resources → Memory
# Increase to 8GB or more
```

## Next Steps

1. **Read the documentation**:
   - [Docker Lab Guide](../docker-lab/README.md)
   - [Browser Extension Guide](../browser-extension/README.md)
   - [Backend API Guide](../backend/README.md)

2. **Join the community**:
   - Report issues on GitHub
   - Contribute improvements
   - Share your findings

3. **Practice regularly**:
   - Set learning goals
   - Track your progress
   - Document vulnerabilities
   - Share knowledge

4. **Stay updated**:
   - Watch the repository
   - Check for updates
   - Review new labs

## Support

Need help?
- Check [FAQ](FAQ.md)
- Review [Troubleshooting Guide](TROUBLESHOOTING.md)
- Open an [Issue](https://github.com/Haseeb-1698/Auron/issues)
- Join discussions

## Security Reminder

⚠️ **Important**: 
- Only use in isolated environments
- Never expose to internet
- Do not use on systems without permission
- Reset labs after practice sessions

Happy learning! 🎓🔒
