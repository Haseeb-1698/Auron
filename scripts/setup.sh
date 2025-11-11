#!/bin/bash

# Auron Platform Setup Script
# This script helps set up the Auron cybersecurity training platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "   Auron Platform Setup"
echo "========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker Compose is installed${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Warning: Node.js is not installed${NC}"
    echo "Node.js is required for backend development"
    echo "Install from https://nodejs.org/"
else
    echo -e "${GREEN}✓ Node.js is installed ($(node --version))${NC}"
fi

echo ""
echo "========================================="
echo "   Starting Auron Services"
echo "========================================="
echo ""

# Pull Docker images
echo "Pulling Docker images..."
docker-compose pull

# Start services
echo "Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Check service status
echo ""
echo "Service Status:"
docker-compose ps

echo ""
echo "========================================="
echo "   Setup Complete!"
echo "========================================="
echo ""
echo "Services are now running:"
echo ""
echo "  DVWA:              http://localhost:8080"
echo "  Juice Shop:        http://localhost:3000"
echo "  Wazuh Dashboard:   http://localhost:5601"
echo "  Metasploitable:    http://localhost:8081"
echo "  Backend API:       http://localhost:4000"
echo ""
echo "Next steps:"
echo "1. Install the browser extension:"
echo "   - Open chrome://extensions/"
echo "   - Enable Developer mode"
echo "   - Click 'Load unpacked'"
echo "   - Select the 'browser-extension' folder"
echo ""
echo "2. Access the labs and start learning!"
echo ""
echo "To stop services: docker-compose down"
echo "To view logs: docker-compose logs -f"
echo ""
echo "For more information, see docs/GETTING_STARTED.md"
echo ""
