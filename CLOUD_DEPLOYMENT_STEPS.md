# Auron Platform - Cloud Server Deployment Steps

## Prerequisites
You should be logged into your Vultr cloud server: `ssh root@155.138.194.62`

## Step 1: Clone Repository and Setup

```bash
# Navigate to deployment directory
cd /var/www

# Remove old directory if exists
rm -rf Auron

# Clone fresh from GitHub (main branch with all fixes)
git clone https://github.com/Haseeb-1698/Auron.git
cd Auron

# Check that you're on main branch
git branch
```

## Step 2: Create Environment Files

```bash
# Run the environment setup script
cat > create-env.sh << 'ENVSCRIPT'
#!/bin/bash

# Generate secure random passwords
PG_PASS=$(openssl rand -hex 16)
REDIS_PASS=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 16)

# Get server IP
SERVER_IP="155.138.194.62"

# Create root .env
cat > .env << EOF
NODE_ENV=production
VITE_API_URL=http://\${SERVER_IP}/api
VITE_WS_URL=ws://\${SERVER_IP}
VITE_APP_NAME=Auron Security Platform
PORT=4000
API_PREFIX=/api
CORS_ORIGIN=http://\${SERVER_IP}
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auron_db
DB_USER=auron_user
DB_PASSWORD=\${PG_PASS}
DB_POOL_MIN=2
DB_POOL_MAX=10
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=\${REDIS_PASS}
REDIS_DB=0
JWT_SECRET=\${JWT_SECRET}
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=\${JWT_REFRESH}
JWT_REFRESH_EXPIRES_IN=30d
SESSION_SECRET=\${SESSION_SECRET}
ENCRYPTION_KEY=\${ENCRYPTION_KEY}
LIQUIDMETAL_API_KEY=lm_apikey_575aa68be5cf41768cd2b080ce632a430d801aa50b3947d8
LIQUIDMETAL_ENDPOINT=https://api.liquidmetal.ai/v1
CLAUDE_MODEL=claude-3-sonnet-20240229
SMART_MEMORY_ENABLED=true
VULTR_API_KEY=W5HBIPI6BXALXG6LBO4PDDVVA5WP5EQ3FWOA
VULTR_DEFAULT_REGION=ewr
VULTR_DEFAULT_PLAN=vc2-1c-1gb
LAB_MODE=cloud
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=haseebinsta26@gmail.com
SMTP_PASSWORD=123haseeb123
SMTP_FROM=haseebinsta26@gmail.com
PUBLIC_HOST=\${SERVER_IP}
LOG_LEVEL=info
LOG_DIR=/var/www/Auron/logs
HELMET_CSP_ENABLED=true
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/var/www/Auron/uploads
EOF

# Copy to backend
cp .env backend/.env

# Create frontend .env
cat > frontend/.env << FRONTEOF
VITE_API_URL=http://\${SERVER_IP}/api
VITE_WS_URL=ws://\${SERVER_IP}
VITE_APP_NAME=Auron Security Platform
FRONTEOF

# Save credentials
cat > /root/auron-credentials.txt << CREDS
=== Auron Platform Credentials ===
Generated: \$(date)

PostgreSQL Password: \${PG_PASS}
Redis Password: \${REDIS_PASS}
JWT Secret: \${JWT_SECRET}
JWT Refresh Secret: \${JWT_REFRESH}
Session Secret: \${SESSION_SECRET}
Encryption Key: \${ENCRYPTION_KEY}

PostgreSQL Setup:
  sudo -u postgres psql -c "ALTER USER auron_user WITH PASSWORD '\${PG_PASS}';"

Redis Setup:
  sudo sed -i "s/^# requirepass.*/requirepass \${REDIS_PASS}/" /etc/redis/redis.conf
  sudo sed -i "s/^requirepass.*/requirepass \${REDIS_PASS}/" /etc/redis/redis.conf
  sudo systemctl restart redis-server
CREDS

chmod 600 /root/auron-credentials.txt
echo "✅ Environment files created!"
echo "📄 Credentials saved to /root/auron-credentials.txt"
cat /root/auron-credentials.txt
ENVSCRIPT

chmod +x create-env.sh
./create-env.sh
```

## Step 3: Configure PostgreSQL and Redis

```bash
# Configure PostgreSQL (use password from /root/auron-credentials.txt)
source .env
sudo -u postgres psql -c "ALTER USER auron_user WITH PASSWORD '$DB_PASSWORD';"

# Configure Redis
sudo sed -i "s/^# requirepass.*/requirepass $REDIS_PASSWORD/" /etc/redis/redis.conf
sudo sed -i "s/^requirepass.*/requirepass $REDIS_PASSWORD/" /etc/redis/redis.conf
sudo systemctl restart redis-server

# Test Redis
redis-cli -a $REDIS_PASSWORD ping
# Should return: PONG
```

## Step 4: Install Dependencies and Build

```bash
cd /var/www/Auron

# Install root dependencies (skip Puppeteer download)
export PUPPETEER_SKIP_DOWNLOAD=true
npm install

# Build backend
cd backend
npm run build
# ✅ Should complete successfully with no errors

# Build frontend
cd ../frontend
npm run build
# ✅ Should create dist/ folder with production build
```

## Step 5: Install and Configure PM2

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cd /var/www/Auron
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'auron-backend',
      cwd: '/var/www/Auron/backend',
      script: 'dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: '/var/www/Auron/logs/backend-error.log',
      out_file: '/var/www/Auron/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M'
    }
  ]
};
EOF

# Create logs directory
mkdir -p /var/www/Auron/logs

# Start backend with PM2
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs auron-backend --lines 50

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command output instructions
```

## Step 6: Configure Nginx

```bash
# Create Nginx configuration
cat > /etc/nginx/sites-available/auron << 'EOF'
server {
    listen 80;
    server_name 155.138.194.62;

    # Frontend
    root /var/www/Auron/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;
    gzip_min_length 1000;

    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=31536000";
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Disable access logs for static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        access_log off;
        expires 1y;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/auron /etc/nginx/sites-enabled/

# Remove default site if exists
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Check Nginx status
systemctl status nginx
```

## Step 7: Configure Firewall

```bash
# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Check firewall status
ufw status
```

## Step 8: Verify Deployment

```bash
# Check all services
systemctl status postgresql
systemctl status redis-server
systemctl status nginx
pm2 status

# Test backend API
curl http://localhost:4000/api/health

# Test from outside
curl http://155.138.194.62/api/health

# Check logs
pm2 logs auron-backend --lines 100
tail -f /var/log/nginx/error.log
```

## Step 9: Access Your Application

Open your browser and navigate to:
- **http://155.138.194.62**

You should see the Auron Security Platform login page!

## Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs auron-backend

# Check environment variables
cd /var/www/Auron/backend
cat .env

# Test database connection
psql -U auron_user -d auron_db -h localhost
# Enter password from /root/auron-credentials.txt
```

### Frontend shows blank page
```bash
# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Verify dist folder exists
ls -la /var/www/Auron/frontend/dist/

# Check Nginx configuration
nginx -t
```

### Database connection errors
```bash
# Verify PostgreSQL is running
systemctl status postgresql

# Check PostgreSQL logs
tail -f /var/log/postgresql/postgresql-*-main.log

# Test connection
psql -U auron_user -d auron_db -h localhost -c "SELECT version();"
```

### Redis connection errors
```bash
# Check Redis is running
systemctl status redis-server

# Test Redis connection
redis-cli -a $(grep REDIS_PASSWORD /var/www/Auron/.env | cut -d'=' -f2) ping
```

## Optional: SSL with Let's Encrypt (Future Step)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate (requires a domain name)
# certbot --nginx -d your-domain.com
```

## Maintenance Commands

```bash
# Restart backend
pm2 restart auron-backend

# View backend logs
pm2 logs auron-backend

# Stop backend
pm2 stop auron-backend

# Restart Nginx
systemctl restart nginx

# Update code
cd /var/www/Auron
git pull origin main
cd backend && npm run build
cd ../frontend && npm run build
pm2 restart auron-backend
systemctl reload nginx
```

## Success Criteria

✅ PostgreSQL running and accessible
✅ Redis running with authentication
✅ Backend built successfully (no TypeScript errors)
✅ Frontend built successfully
✅ PM2 running backend in cluster mode
✅ Nginx serving frontend and proxying backend
✅ Application accessible at http://155.138.194.62
✅ Can register new users and login

---

**All TypeScript compilation issues have been fixed in the main branch!**
