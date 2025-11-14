#!/bin/bash
# Auron Platform - Wazuh Agent Installation Script
# This script configures lightweight log forwarding to Wazuh Manager

set -e

WAZUH_MANAGER=${WAZUH_MANAGER:-wazuh}
SERVICE_NAME=${SERVICE_NAME:-unknown}

echo "[Auron] Configuring log forwarding for service: ${SERVICE_NAME}"

# Install rsyslog if not present (for log forwarding)
if ! command -v rsyslogd &> /dev/null; then
    echo "[Auron] Installing rsyslog..."
    if command -v apt-get &> /dev/null; then
        apt-get update -qq && apt-get install -y -qq rsyslog > /dev/null 2>&1
    elif command -v yum &> /dev/null; then
        yum install -y rsyslog > /dev/null 2>&1
    elif command -v apk &> /dev/null; then
        apk add --no-cache rsyslog > /dev/null 2>&1
    fi
fi

# Configure rsyslog to forward logs to Wazuh Manager
cat > /etc/rsyslog.d/50-wazuh.conf <<EOF
# Forward all logs to Wazuh Manager
*.* @${WAZUH_MANAGER}:514

# Add service tag to all messages
\$template AuronFormat,"${SERVICE_NAME} %msg%\n"
*.* ?AuronFormat
EOF

# Start rsyslog in background
if [ -f /var/run/rsyslogd.pid ]; then
    kill $(cat /var/run/rsyslogd.pid) 2>/dev/null || true
fi
rsyslogd

echo "[Auron] Log forwarding configured for ${SERVICE_NAME} -> ${WAZUH_MANAGER}:514"

# Execute the original container command
exec "$@"
