#!/bin/bash
set -e

# Wazuh SSL Certificate Generation Script
# This script generates self-signed SSL certificates for Wazuh components

CERTS_DIR="./wazuh-certs"
echo "🔐 Generating Wazuh SSL Certificates..."

# Create certificates directory
mkdir -p "$CERTS_DIR"/{indexer,filebeat,dashboard}

# Generate Root CA
echo "📜 Generating Root CA..."
openssl genrsa -out "$CERTS_DIR/root-ca-key.pem" 2048
openssl req -new -x509 -sha256 -key "$CERTS_DIR/root-ca-key.pem" \
    -out "$CERTS_DIR/root-ca.pem" \
    -days 3650 \
    -subj "/C=US/ST=California/L=San Francisco/O=Auron/OU=Training/CN=root-ca"

# Generate Admin cert
echo "🔑 Generating Admin certificate..."
openssl genrsa -out "$CERTS_DIR/admin-key-temp.pem" 2048
openssl pkcs8 -inform PEM -outform PEM -in "$CERTS_DIR/admin-key-temp.pem" \
    -topk8 -nocrypt -v1 PBE-SHA1-3DES -out "$CERTS_DIR/admin-key.pem"
openssl req -new -key "$CERTS_DIR/admin-key.pem" \
    -out "$CERTS_DIR/admin.csr" \
    -subj "/C=US/ST=California/L=San Francisco/O=Auron/OU=Training/CN=admin"
openssl x509 -req -in "$CERTS_DIR/admin.csr" \
    -CA "$CERTS_DIR/root-ca.pem" \
    -CAkey "$CERTS_DIR/root-ca-key.pem" \
    -CAcreateserial \
    -sha256 -out "$CERTS_DIR/admin.pem" -days 3650

# Generate Indexer certificate
echo "📊 Generating Wazuh Indexer certificate..."
openssl genrsa -out "$CERTS_DIR/indexer/indexer-key-temp.pem" 2048
openssl pkcs8 -inform PEM -outform PEM -in "$CERTS_DIR/indexer/indexer-key-temp.pem" \
    -topk8 -nocrypt -v1 PBE-SHA1-3DES -out "$CERTS_DIR/indexer/indexer-key.pem"
openssl req -new -key "$CERTS_DIR/indexer/indexer-key.pem" \
    -out "$CERTS_DIR/indexer/indexer.csr" \
    -subj "/C=US/ST=California/L=San Francisco/O=Auron/OU=Training/CN=wazuh-indexer"

# Create SAN config for indexer
cat > "$CERTS_DIR/indexer/indexer.ext" << EOF
subjectAltName = @alt_names
[alt_names]
DNS.1 = wazuh-indexer
DNS.2 = localhost
IP.1 = 127.0.0.1
EOF

openssl x509 -req -in "$CERTS_DIR/indexer/indexer.csr" \
    -CA "$CERTS_DIR/root-ca.pem" \
    -CAkey "$CERTS_DIR/root-ca-key.pem" \
    -CAcreateserial \
    -sha256 -out "$CERTS_DIR/indexer/indexer.pem" -days 3650 \
    -extfile "$CERTS_DIR/indexer/indexer.ext"

# Copy root CA to indexer
cp "$CERTS_DIR/root-ca.pem" "$CERTS_DIR/indexer/"

# Generate Filebeat certificate (for Wazuh Manager)
echo "📡 Generating Filebeat certificate..."
openssl genrsa -out "$CERTS_DIR/filebeat/filebeat-key-temp.pem" 2048
openssl pkcs8 -inform PEM -outform PEM -in "$CERTS_DIR/filebeat/filebeat-key-temp.pem" \
    -topk8 -nocrypt -v1 PBE-SHA1-3DES -out "$CERTS_DIR/filebeat/filebeat-key.pem"
openssl req -new -key "$CERTS_DIR/filebeat/filebeat-key.pem" \
    -out "$CERTS_DIR/filebeat/filebeat.csr" \
    -subj "/C=US/ST=California/L=San Francisco/O=Auron/OU=Training/CN=wazuh"

cat > "$CERTS_DIR/filebeat/filebeat.ext" << EOF
subjectAltName = @alt_names
[alt_names]
DNS.1 = wazuh
DNS.2 = localhost
IP.1 = 127.0.0.1
EOF

openssl x509 -req -in "$CERTS_DIR/filebeat/filebeat.csr" \
    -CA "$CERTS_DIR/root-ca.pem" \
    -CAkey "$CERTS_DIR/root-ca-key.pem" \
    -CAcreateserial \
    -sha256 -out "$CERTS_DIR/filebeat/filebeat.pem" -days 3650 \
    -extfile "$CERTS_DIR/filebeat/filebeat.ext"

# Copy root CA to filebeat
cp "$CERTS_DIR/root-ca.pem" "$CERTS_DIR/filebeat/"

# Generate Dashboard certificate
echo "🖥️  Generating Dashboard certificate..."
openssl genrsa -out "$CERTS_DIR/dashboard/dashboard-key-temp.pem" 2048
openssl pkcs8 -inform PEM -outform PEM -in "$CERTS_DIR/dashboard/dashboard-key-temp.pem" \
    -topk8 -nocrypt -v1 PBE-SHA1-3DES -out "$CERTS_DIR/dashboard/dashboard-key.pem"
openssl req -new -key "$CERTS_DIR/dashboard/dashboard-key.pem" \
    -out "$CERTS_DIR/dashboard/dashboard.csr" \
    -subj "/C=US/ST=California/L=San Francisco/O=Auron/OU=Training/CN=wazuh-dashboard"

cat > "$CERTS_DIR/dashboard/dashboard.ext" << EOF
subjectAltName = @alt_names
[alt_names]
DNS.1 = wazuh-dashboard
DNS.2 = localhost
IP.1 = 127.0.0.1
EOF

openssl x509 -req -in "$CERTS_DIR/dashboard/dashboard.csr" \
    -CA "$CERTS_DIR/root-ca.pem" \
    -CAkey "$CERTS_DIR/root-ca-key.pem" \
    -CAcreateserial \
    -sha256 -out "$CERTS_DIR/dashboard/dashboard.pem" -days 3650 \
    -extfile "$CERTS_DIR/dashboard/dashboard.ext"

# Copy root CA and admin certs to dashboard
cp "$CERTS_DIR/root-ca.pem" "$CERTS_DIR/dashboard/"
cp "$CERTS_DIR/admin.pem" "$CERTS_DIR/dashboard/"
cp "$CERTS_DIR/admin-key.pem" "$CERTS_DIR/dashboard/"

# Set permissions
chmod 644 "$CERTS_DIR"/*/*.pem
chmod 644 "$CERTS_DIR"/*.pem 2>/dev/null || true

# Clean up temporary files
rm -f "$CERTS_DIR"/*/*.csr
rm -f "$CERTS_DIR"/*/*.ext
rm -f "$CERTS_DIR"/*/*.srl
rm -f "$CERTS_DIR"/*.csr
rm -f "$CERTS_DIR"/*-temp.pem
rm -f "$CERTS_DIR"/*/*-temp.pem

echo "✅ Wazuh SSL certificates generated successfully in $CERTS_DIR/"
echo ""
echo "Certificate structure:"
echo "  📁 $CERTS_DIR/"
echo "    📁 indexer/ - Wazuh Indexer certificates"
echo "    📁 filebeat/ - Wazuh Manager (Filebeat) certificates"
echo "    📁 dashboard/ - Wazuh Dashboard certificates"
echo ""
echo "🚀 You can now start Wazuh services with: docker compose up -d"
