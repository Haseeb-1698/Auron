# Auron Docker Lab Environment

This directory contains the Docker-based cybersecurity lab environment for Auron, featuring vulnerable applications and security tools for hands-on learning.

## Lab Components

### 1. DVWA (Damn Vulnerable Web Application)
- **Port**: 8080
- **Purpose**: Practice common web vulnerabilities
- **Vulnerabilities**: SQL Injection, XSS, CSRF, File Upload, Command Injection
- **Access**: http://localhost:8080
- **Default Credentials**: admin / password

### 2. OWASP Juice Shop
- **Port**: 3000
- **Purpose**: Modern vulnerable web application with gamified challenges
- **Technologies**: Node.js, Angular, Express
- **Access**: http://localhost:3000
- **Features**: 100+ security challenges across OWASP Top 10

### 3. Wazuh Security Platform
- **Ports**: 
  - Manager: 1514, 1515, 514/udp, 55000
  - Dashboard: 5601
- **Purpose**: Security monitoring, log analysis, threat detection
- **Access**: http://localhost:5601
- **Features**: SIEM, IDS, compliance monitoring

### 4. Metasploitable
- **Ports**: 8081 (HTTP), 2222 (SSH), 2121 (FTP), 3306 (MySQL)
- **Purpose**: Penetration testing practice
- **Vulnerabilities**: Misconfigured services, outdated software
- **Access**: http://localhost:8081

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- At least 8GB RAM available
- 20GB free disk space

### Starting the Lab

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d dvwa

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Checking Service Status

```bash
# List running containers
docker-compose ps

# Check specific service health
docker-compose exec dvwa curl http://localhost

# Access service shell
docker-compose exec dvwa /bin/bash
```

## Lab Exercises

### Beginner: DVWA Basics
1. SQL Injection fundamentals
2. Cross-Site Scripting (XSS)
3. CSRF token bypass
4. File upload vulnerabilities

### Intermediate: Juice Shop Challenges
1. Broken Authentication
2. Sensitive Data Exposure
3. XML External Entities (XXE)
4. Broken Access Control

### Advanced: Metasploitable Exploitation
1. Service enumeration
2. Vulnerability scanning
3. Exploit development
4. Post-exploitation techniques

### Defense: Wazuh Monitoring
1. Configure log collection
2. Set up alerting rules
3. Detect attack patterns
4. Incident response

## Security Notes

⚠️ **IMPORTANT**: 
- These applications are INTENTIONALLY vulnerable
- Run ONLY in isolated environments
- NEVER expose to the internet
- Use for educational purposes only
- Reset containers regularly

## Network Configuration

All services run on the `auron-network` bridge network:
```
Services can communicate using container names:
- dvwa
- dvwa-db
- juiceshop
- wazuh
- wazuh-dashboard
- metasploitable
- backend
```

## Troubleshooting

### Service Won't Start
```bash
# Check logs
docker-compose logs [service-name]

# Restart service
docker-compose restart [service-name]

# Rebuild service
docker-compose up -d --build [service-name]
```

### Port Conflicts
If ports are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "8082:80"  # Change 8080 to 8082
```

### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d
```

### Memory Issues
```bash
# Limit container memory
docker-compose up -d --scale wazuh=1 --memory=2g
```

## Maintenance

### Updating Images
```bash
# Pull latest images
docker-compose pull

# Recreate containers with new images
docker-compose up -d --force-recreate
```

### Backup Lab Progress
```bash
# Backup volumes
docker run --rm -v auron_dvwa-data:/data -v $(pwd):/backup alpine tar czf /backup/dvwa-backup.tar.gz /data
```

### Clean Up
```bash
# Remove unused containers and images
docker system prune -a

# Remove specific volumes
docker volume rm auron_dvwa-data
```

## Learning Paths

### Web Application Security Path
1. Start with DVWA (beginner level)
2. Progress through DVWA difficulty levels
3. Move to Juice Shop challenges
4. Practice with browser extension analysis

### Penetration Testing Path
1. Begin with basic enumeration
2. Practice with Metasploitable
3. Learn Metasploit framework
4. Study Wazuh detection

### Defensive Security Path
1. Configure Wazuh agents
2. Create detection rules
3. Analyze attack logs
4. Build incident response playbooks

## Resources

- [DVWA Documentation](https://github.com/digininja/DVWA)
- [Juice Shop Guide](https://pwning.owasp-juice.shop/)
- [Wazuh Documentation](https://documentation.wazuh.com/)
- [Metasploit Unleashed](https://www.offensive-security.com/metasploit-unleashed/)

## Contributing

To add new lab components:
1. Add service definition to `docker-compose.yml`
2. Create documentation in this README
3. Add lab exercises and solutions
4. Update the backend API with new lab metadata
