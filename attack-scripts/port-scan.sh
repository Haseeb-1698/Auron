#!/bin/bash

##############################################################################
# Network Port Scanning Script
# Educational purpose only - demonstrates network reconnaissance
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Target configuration
TARGET="${1:-dvwa}"
SCAN_TYPE="${2:-quick}"  # quick, full, service

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Network Port Scanning Script${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${YELLOW}WARNING: Educational purposes only!${NC}"
echo -e "${YELLOW}Target: ${TARGET}${NC}"
echo -e "${YELLOW}Scan Type: ${SCAN_TYPE}${NC}"
echo ""

# Check if nmap is installed
if ! command -v nmap &> /dev/null; then
    echo -e "${RED}Error: nmap is not installed${NC}"
    echo "Installing nmap..."
    apt-get update -qq && apt-get install -y nmap >/dev/null 2>&1
fi

# Step 1: Host discovery
echo "[*] Step 1: Checking if target is alive..."
if ping -c 1 -W 2 ${TARGET} >/dev/null 2>&1; then
    echo -e "${GREEN}[✓] Target is reachable${NC}"
else
    echo -e "${YELLOW}[~] Target may be blocking ICMP, continuing anyway...${NC}"
fi

# Step 2: Quick port scan (top 1000 ports)
if [ "$SCAN_TYPE" == "quick" ] || [ "$SCAN_TYPE" == "all" ]; then
    echo ""
    echo "[*] Step 2: Running quick port scan (top 1000 ports)..."
    nmap -T4 -F ${TARGET} | tee /tmp/nmap-quick.txt
fi

# Step 3: Full port scan (all 65535 ports)
if [ "$SCAN_TYPE" == "full" ] || [ "$SCAN_TYPE" == "all" ]; then
    echo ""
    echo "[*] Step 3: Running full port scan (all 65535 ports)..."
    echo "[*] This may take several minutes..."
    nmap -T4 -p- ${TARGET} | tee /tmp/nmap-full.txt
fi

# Step 4: Service version detection
if [ "$SCAN_TYPE" == "service" ] || [ "$SCAN_TYPE" == "all" ]; then
    echo ""
    echo "[*] Step 4: Running service version detection..."
    nmap -T4 -sV --version-intensity 5 ${TARGET} | tee /tmp/nmap-service.txt
fi

# Step 5: OS detection (requires root, may not work in container)
echo ""
echo "[*] Step 5: Attempting OS detection..."
nmap -T4 -O ${TARGET} 2>/dev/null | tee /tmp/nmap-os.txt || echo -e "${YELLOW}[~] OS detection requires root privileges${NC}"

# Step 6: Check for common vulnerabilities
echo ""
echo "[*] Step 6: Scanning for common vulnerabilities..."
nmap -T4 --script=vuln ${TARGET} | tee /tmp/nmap-vuln.txt

# Parse results
echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Scan Results Summary${NC}"
echo -e "${GREEN}======================================${NC}"

# Count open ports
OPEN_PORTS=$(grep "open" /tmp/nmap-quick.txt 2>/dev/null | wc -l || echo "0")
echo -e "${BLUE}Open ports found: ${OPEN_PORTS}${NC}"

# List common services
echo ""
echo -e "${BLUE}Common services detected:${NC}"
grep -E "(http|https|ssh|ftp|mysql|postgresql|smtp|telnet)" /tmp/nmap-quick.txt 2>/dev/null || echo "None found in quick scan"

# Summary
echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Attack Information${NC}"
echo -e "${GREEN}======================================${NC}"
echo "Target: ${TARGET}"
echo "Scan Type: ${SCAN_TYPE}"
echo ""
echo "Check Wazuh Dashboard (http://localhost:5601) to see if the scan was detected!"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Investigate open ports for vulnerable services"
echo "  2. Try service-specific attacks (SQLi, XSS, etc.)"
echo "  3. Look for default credentials"
echo "  4. Check for known CVEs in detected versions"
echo ""
echo -e "${YELLOW}Mitigation Tips:${NC}"
echo "  1. Close unnecessary ports and services"
echo "  2. Use firewall rules to restrict access"
echo "  3. Keep services updated to latest versions"
echo "  4. Implement intrusion detection systems (IDS)"
echo "  5. Use port knocking or VPNs for sensitive services"
echo ""

# Cleanup
rm -f /tmp/nmap-*.txt
