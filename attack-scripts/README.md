# Attack Scripts for Auron Training Lab

This directory contains prebuilt attack scripts for educational and training purposes in the Auron cybersecurity training lab.

## ⚠️ IMPORTANT SECURITY NOTICE

**These scripts are for EDUCATIONAL PURPOSES ONLY!**

- Only use these scripts against the vulnerable applications in this lab environment
- Never use these scripts against systems you don't own or have explicit permission to test
- All scripts are containerized and isolated within the lab network
- Unauthorized use of these techniques against real systems is illegal

## Available Scripts

### 1. SQL Injection (SQLi)
- `dvwa-sqli.sh` - Automated SQL injection against DVWA
- Demonstrates time-based blind SQLi and union-based SQLi

### 2. Cross-Site Scripting (XSS)
- `dvwa-xss.sh` - XSS attacks against DVWA
- `juiceshop-xss.sh` - XSS attacks against Juice Shop

### 3. Network Reconnaissance
- `port-scan.sh` - Port scanning using nmap
- `service-enum.sh` - Service enumeration

### 4. Directory/File Discovery
- `dirb-scan.sh` - Directory brute forcing using dirb
- `nikto-scan.sh` - Web vulnerability scanning

### 5. Password Attacks
- `hydra-ftp.sh` - FTP brute force against Metasploitable
- `hydra-ssh.sh` - SSH brute force against Metasploitable

## Usage

### From Your Host Machine:

Execute scripts via docker exec:
```bash
# Run a SQL injection attack
docker exec auron-attack-scripts /scripts/dvwa-sqli.sh

# Run a port scan
docker exec auron-attack-scripts /scripts/port-scan.sh dvwa

# Run directory brute force
docker exec auron-attack-scripts /scripts/dirb-scan.sh http://dvwa
```

### From Inside the Container:

```bash
# Enter the attack container
docker exec -it auron-attack-scripts bash

# Install required tools (first time only)
apt-get update && apt-get install -y nmap sqlmap dirb nikto hydra curl

# Run any script
/scripts/dvwa-sqli.sh
```

## Target Hosts

All scripts reference these internal Docker hostnames:
- **dvwa**: http://dvwa (DVWA on port 80)
- **juiceshop**: http://juiceshop:3000 (Juice Shop)
- **metasploitable**: http://metasploitable (Metasploitable2 on port 80)

## Monitoring Attacks

View Wazuh alerts to see how your attacks are detected:
- Open Wazuh Dashboard: http://localhost:5601
- Login with default credentials (check Wazuh docs)
- Navigate to Security Events to see real-time alerts

## Script Categories

### Beginner-Friendly
- `port-scan.sh` - Safe reconnaissance
- `dvwa-sqli.sh` - Basic SQL injection

### Intermediate
- `dirb-scan.sh` - Directory discovery
- `hydra-ftp.sh` - Password attacks

### Advanced
- `metasploit-exploit.sh` - Exploit development
- Custom payloads and evasion techniques

## Adding Your Own Scripts

1. Create your script in this directory
2. Make it executable: `chmod +x your-script.sh`
3. Use internal Docker hostnames for targets
4. Add documentation to this README

## Learning Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- DVWA Documentation: https://github.com/digininja/DVWA
- Juice Shop Guide: https://pwning.owasp-juice.shop/
- Wazuh Documentation: https://documentation.wazuh.com/

## Ethical Guidelines

1. **Consent**: Only attack systems you own or have written permission to test
2. **Disclosure**: Report vulnerabilities responsibly
3. **Education**: Use these skills to improve security, not harm others
4. **Respect**: Follow all applicable laws and ethical guidelines

## Support

For issues or questions:
- Check the main Auron README.md
- Review Wazuh logs for attack detection
- Consult the lab architecture documentation
