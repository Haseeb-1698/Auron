#!/bin/bash

##############################################################################
# Directory/File Brute Force Script
# Educational purpose only - demonstrates web directory discovery
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Target configuration
TARGET_URL="${1:-http://dvwa}"
WORDLIST="${2:-/usr/share/wordlists/dirb/common.txt}"
THREADS="${3:-10}"

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Directory Brute Force Script${NC}"
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
check_tool dirb
check_tool curl

# Check if wordlist exists, create a basic one if not
if [ ! -f "$WORDLIST" ]; then
    echo -e "${YELLOW}[~] Wordlist not found, creating basic wordlist...${NC}"
    mkdir -p /tmp/wordlists
    cat > /tmp/wordlists/basic.txt <<EOF
admin
backup
config
uploads
images
js
css
includes
data
sql
database
test
tmp
temp
login
dashboard
api
docs
documentation
hidden
.git
.env
.htaccess
robots.txt
sitemap.xml
phpinfo.php
info.php
test.php
backup.sql
database.sql
EOF
    WORDLIST="/tmp/wordlists/basic.txt"
fi

# Step 1: Basic connectivity test
echo ""
echo "[*] Step 1: Testing connectivity to target..."
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${TARGET_URL}/)

if [ "$STATUS_CODE" == "200" ] || [ "$STATUS_CODE" == "302" ] || [ "$STATUS_CODE" == "301" ]; then
    echo -e "${GREEN}[✓] Target is reachable (HTTP $STATUS_CODE)${NC}"
else
    echo -e "${RED}[✗] Target returned HTTP $STATUS_CODE${NC}"
    echo "Continuing anyway..."
fi

# Step 2: Check for robots.txt
echo ""
echo "[*] Step 2: Checking for robots.txt..."
ROBOTS=$(curl -s ${TARGET_URL}/robots.txt)
if echo "$ROBOTS" | grep -q "Disallow"; then
    echo -e "${GREEN}[✓] robots.txt found with disallowed paths:${NC}"
    echo "$ROBOTS" | grep "Disallow"
else
    echo -e "${YELLOW}[~] No robots.txt or no restrictions found${NC}"
fi

# Step 3: Run directory brute force with dirb
echo ""
echo "[*] Step 3: Running directory brute force..."
echo "[*] Using wordlist: $WORDLIST"
echo "[*] This may take several minutes depending on wordlist size..."
echo ""

dirb ${TARGET_URL} ${WORDLIST} -o /tmp/dirb-output.txt -S -w

# Parse results
echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Discovered Directories & Files${NC}"
echo -e "${GREEN}======================================${NC}"

# Show interesting findings
grep "CODE:200" /tmp/dirb-output.txt 2>/dev/null | head -20 || echo "No accessible directories found"

# Step 4: Check for common sensitive files
echo ""
echo "[*] Step 4: Checking for common sensitive files..."

SENSITIVE_FILES=(
    ".env"
    "config.php"
    "database.php"
    "phpinfo.php"
    "info.php"
    ".git/config"
    "backup.sql"
    "database.sql"
    "admin.php"
)

echo -e "${BLUE}Testing for sensitive files:${NC}"
for file in "${SENSITIVE_FILES[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${TARGET_URL}/${file})
    if [ "$STATUS" == "200" ]; then
        echo -e "${RED}[!] FOUND: ${file} (HTTP 200)${NC}"
    fi
done

# Summary
echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Attack Summary${NC}"
echo -e "${GREEN}======================================${NC}"
echo "Target: ${TARGET_URL}"
echo "Wordlist: $WORDLIST"
echo ""

# Count results
FOUND_DIRS=$(grep "CODE:200" /tmp/dirb-output.txt 2>/dev/null | wc -l || echo "0")
echo -e "${BLUE}Total accessible paths found: ${FOUND_DIRS}${NC}"

echo ""
echo "Check Wazuh Dashboard (http://localhost:5601) to see if the scan was detected!"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Investigate discovered directories for sensitive information"
echo "  2. Check for file upload vulnerabilities"
echo "  3. Look for backup files or source code exposure"
echo "  4. Test discovered admin panels for weak authentication"
echo ""
echo -e "${YELLOW}Mitigation Tips:${NC}"
echo "  1. Remove unnecessary files and directories"
echo "  2. Implement proper access controls"
echo "  3. Disable directory listing"
echo "  4. Use .htaccess or nginx config to restrict access"
echo "  5. Never expose sensitive files like .env, config files, or backups"
echo "  6. Implement rate limiting to prevent brute force"
echo ""

# Cleanup
# Keep /tmp/dirb-output.txt for review
