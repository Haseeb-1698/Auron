# Attack Scripts (Educational)

This container provides a safe, repeatable way to run common attack scenarios against the lab services for training and validation.

Services targeted (compose network names):
- dvwa (http://dvwa or http://localhost:8080)
- juiceshop (http://juiceshop:3000 or http://localhost:3000)
- metasploitable (http://metasploitable:80)

Usage

1) Start the full lab
docker-compose up -d

2) Run scripts from the host into the Kali container
# Port scan metasploitable
docker exec auron-attack-scripts bash /scripts/port-scan.sh metasploitable

# Directory brute force Juice Shop
docker exec auron-attack-scripts bash /scripts/dirb-scan.sh http://juiceshop:3000

# DVWA SQL injection (requires DVWA cookie and security=low)
# First, log in to DVWA and copy your PHPSESSID cookie
docker exec -e DVWA_COOKIE="PHPSESSID=<value>; security=low" auron-attack-scripts bash /scripts/dvwa-sqli.sh

Notes

- The scripts will auto-install required tools if missing (nmap, dirb, sqlmap).
- These examples are for educational use only. Do not target systems you do not own or have explicit permission to test.
- For repeatable results, keep DVWA security at "low" and ensure the target services are reachable on the compose network.

Wazuh Monitoring

- Open Wazuh Dashboard at http://localhost:5601
- As you run the scripts, observe new events/alerts.
- You can extend Wazuh rules to detect reconnaissance and exploitation patterns.