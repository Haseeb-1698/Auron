# Wazuh SIEM Integration for Auron Platform

This directory contains custom Wazuh configuration files that enable real-time security monitoring and attack detection for the Auron workshop environment.

## Overview

The Wazuh integration provides:
- **Real-time log monitoring** from all vulnerable containers (DVWA, Juice Shop, Metasploitable, Attack Scripts)
- **Custom detection rules** for common attack patterns (SQL injection, XSS, directory traversal, brute force, etc.)
- **SIEM visibility** during workshop attack demonstrations
- **Automated alerting** when attacks are executed

## Architecture

```
Vulnerable Containers (dvwa, juiceshop, metasploitable, attack-scripts)
    |
    | (Docker syslog driver)
    v
Wazuh Manager (port 514/udp)
    |
    | (Custom decoders + rules)
    v
Wazuh Indexer (OpenSearch)
    |
    v
Wazuh Dashboard (port 5601)
```

## Files

### `local_rules.xml`
Custom Wazuh rules for detecting workshop attacks:

**Attack Categories Detected:**
- **SQL Injection** (Rules 100001-100002, 100200)
  - UNION SELECT statements
  - SQL keywords (INSERT, DROP, UPDATE, DELETE)
  - OR 1=1 patterns
  - SQLMap tool detection

- **Cross-Site Scripting (XSS)** (Rules 100010-100011)
  - Script tag injection
  - JavaScript event handlers (onerror, onload)
  - Iframe/Object/Embed tags

- **Directory Traversal** (Rules 100020-100021)
  - ../ and ..\ patterns
  - URL-encoded traversal attempts
  - /etc/passwd, /etc/shadow access

- **Command Injection** (Rules 100030-100031)
  - Shell command chaining (|, ;, &&, ||)
  - Dangerous commands (cat, wget, curl, bash, nc)

- **Brute Force Attacks** (Rules 100040-100041, 100080)
  - Multiple authentication failures
  - Hydra-like patterns

- **Port Scanning** (Rules 100050-100051, 100070)
  - Multiple connection attempts
  - Nmap-like patterns

- **Web Scanners** (Rules 100060-100061)
  - Nikto, Dirb, Dirbuster detection
  - Attack tool User-Agent strings

- **Service-Specific Rules**
  - DVWA (Rules 100100-100101)
  - Juice Shop (Rules 100110-100111)
  - Metasploitable (Rules 100120-100121)
  - Attack Scripts (Rules 100130-100131)

- **Advanced Attacks**
  - File Upload (Rule 100210)
  - XXE - XML External Entity (Rule 100220)
  - LDAP Injection (Rule 100230)
  - SSRF - Server-Side Request Forgery (Rule 100240)

### `local_decoder.xml`
Custom decoders for parsing logs from workshop containers:

- **dvwa-access**: Parses DVWA Apache access logs
- **juiceshop**: Parses Juice Shop application logs
- **metasploitable-ssh**: Parses SSH authentication logs
- **attack-scripts**: Parses attack tool execution logs
- **sql-injection-pattern**: Detects SQL injection signatures
- **web-scanner-ua**: Identifies attack tool User-Agents

### `filebeat.yml`
Filebeat configuration for log collection (optional, not currently used):
- Docker container log collection
- Service-specific log paths
- Output to Wazuh Manager via Logstash protocol

### `install-agent.sh`
Agent installation script (optional, for manual agent setup):
- Configures rsyslog forwarding
- Sets up service tags
- Lightweight alternative to full Wazuh agents

## How It Works

### Log Forwarding
All vulnerable containers use Docker's built-in **syslog logging driver** to forward their logs to Wazuh Manager:

```yaml
logging:
  driver: syslog
  options:
    syslog-address: "udp://wazuh:514"
    tag: "service-name"
    syslog-format: "rfc3164"
```

This approach:
- ✅ No agent installation required
- ✅ Non-invasive (doesn't modify container images)
- ✅ Real-time log streaming
- ✅ Workshop-friendly (simple to explain and troubleshoot)

### Custom Rules Loading
Custom rules and decoders are mounted into the Wazuh Manager container:

```yaml
volumes:
  - ./wazuh-config/local_rules.xml:/var/ossec/etc/rules/local_rules.xml:ro
  - ./wazuh-config/local_decoder.xml:/var/ossec/etc/decoders/local_decoder.xml:ro
```

Wazuh automatically loads these files on startup and applies them to all incoming logs.

## Accessing Wazuh Dashboard

1. **Start the environment:**
   ```bash
   docker-compose up -d
   ```

2. **Wait for services to be healthy** (about 2-3 minutes)

3. **Access the dashboard:**
   - URL: http://localhost:5601
   - Username: `admin`
   - Password: `SecretPassword`

4. **Navigate to Security Events:**
   - Click "Security events" in the left menu
   - Filter by service tags: `dvwa`, `juiceshop`, `metasploitable`, `attack-scripts`
   - Watch alerts in real-time as attacks are executed

## Workshop Demonstration

### Example: SQL Injection Detection

1. **Execute an attack:**
   ```bash
   curl "http://localhost:8080/vulnerabilities/sqli/?id=1' OR 1=1--&Submit=Submit"
   ```

2. **View in Wazuh:**
   - Rule ID: `100001` or `100101`
   - Description: "SQL Injection attempt detected" or "SQL Injection attempt on DVWA"
   - Severity: Level 10 (High)
   - Evidence: Full SQL injection string

3. **Explain to students:**
   - Show the raw log in Wazuh
   - Explain how the regex pattern matched
   - Discuss the attack signature
   - Demonstrate blue team visibility

### Example: Port Scan Detection

1. **Execute a scan:**
   ```bash
   docker exec auron-attack-scripts nmap -p 1-100 dvwa
   ```

2. **View in Wazuh:**
   - Rule ID: `100050` → `100051`
   - Description: "Multiple connection attempts from same IP (Possible Port Scan)" → "High volume port scanning activity detected"
   - Severity: Level 6 → Level 8 (escalates with frequency)
   - Shows correlation across multiple events

### Example: Brute Force Detection

1. **Execute Hydra:**
   ```bash
   docker exec auron-attack-scripts hydra -l admin -P /usr/share/wordlists/rockyou.txt.gz ssh://metasploitable
   ```

2. **View in Wazuh:**
   - Rule ID: `100120` → `100121`
   - Description: "Failed SSH authentication" → "SSH Brute Force attack on Metasploitable"
   - Shows frequency-based correlation (5 failures in 120 seconds)

## Troubleshooting

### No Alerts Appearing

1. **Check Wazuh Manager is running:**
   ```bash
   docker exec auron-wazuh /var/ossec/bin/wazuh-control status
   ```

2. **Verify syslog port is listening:**
   ```bash
   docker exec auron-wazuh netstat -ulnp | grep 514
   ```

3. **Check custom rules are loaded:**
   ```bash
   docker exec auron-wazuh cat /var/ossec/etc/rules/local_rules.xml
   ```

4. **Verify logs are being received:**
   ```bash
   docker exec auron-wazuh tail -f /var/ossec/logs/archives/archives.log
   ```

### Custom Rules Not Working

1. **Validate XML syntax:**
   ```bash
   docker exec auron-wazuh /var/ossec/bin/wazuh-logtest
   # Paste a sample log and press Ctrl+D
   ```

2. **Restart Wazuh Manager:**
   ```bash
   docker-compose restart wazuh
   ```

3. **Check rule syntax:**
   - Ensure all `<rule>` tags are properly closed
   - Verify regex patterns are valid PCRE2
   - Check that parent rule IDs exist

### Container Logs Not Forwarding

1. **Check syslog driver configuration:**
   ```bash
   docker inspect auron-dvwa | grep -A 10 LogConfig
   ```

2. **Verify network connectivity:**
   ```bash
   docker exec auron-dvwa ping -c 3 wazuh
   ```

3. **Check Docker daemon syslog support:**
   ```bash
   docker info | grep "Logging Driver"
   ```

## Rule Severity Levels

Wazuh uses severity levels 0-15:
- **Level 0-3**: Informational
- **Level 4-6**: Low priority
- **Level 7-9**: Medium priority
- **Level 10-12**: High priority / Possible attack
- **Level 13-15**: Critical / Active attack

Our custom rules use:
- **Level 5**: Informational (service access, normal activity)
- **Level 6-7**: Reconnaissance (port scans, web scanners)
- **Level 8-9**: Attacks (XSS, directory traversal, injection attempts)
- **Level 10**: High severity (SQL injection, command injection, brute force)

## Best Practices for Workshops

1. **Pre-Workshop Setup:**
   - Start all services 10 minutes before workshop
   - Access Wazuh Dashboard and set up saved searches for common attacks
   - Test at least one attack to verify alerting is working

2. **During Workshop:**
   - Keep Wazuh Dashboard open on a separate screen
   - Use "Auto-refresh" feature to show real-time alerts
   - Filter by specific service tags when demonstrating specific vulnerabilities

3. **Teaching Points:**
   - Show both attacker perspective (terminal) and defender perspective (SIEM)
   - Explain how correlation rules work (frequency, timeframe)
   - Demonstrate how false positives are handled
   - Discuss rule tuning and customization

4. **Performance:**
   - Wazuh adds minimal overhead (< 5% CPU, < 512MB RAM)
   - All logs are also available via `docker logs` if needed
   - Wazuh Indexer retains logs for 7 days by default

## Customization

### Adding New Rules

1. Edit `local_rules.xml`:
   ```xml
   <rule id="100300" level="8">
     <regex type="pcre2">your-pattern-here</regex>
     <description>Your custom attack description</description>
     <group>custom,attack,</group>
   </rule>
   ```

2. Restart Wazuh:
   ```bash
   docker-compose restart wazuh
   ```

### Adding New Decoders

1. Edit `local_decoder.xml`:
   ```xml
   <decoder name="custom-decoder">
     <prematch>^your-log-prefix</prematch>
   </decoder>
   ```

2. Restart Wazuh:
   ```bash
   docker-compose restart wazuh
   ```

## Resources

- [Wazuh Documentation](https://documentation.wazuh.com/)
- [Wazuh Rule Creation Guide](https://documentation.wazuh.com/current/user-manual/ruleset/custom.html)
- [PCRE2 Regex Syntax](https://www.pcre.org/current/doc/html/pcre2syntax.html)
- [Syslog RFC 3164](https://tools.ietf.org/html/rfc3164)

## Support

For workshop-specific questions or issues, refer to the main `WORKSHOP_GUIDE.md` in the project root.
