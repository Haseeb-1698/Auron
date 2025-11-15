#!/bin/bash

##############################################################################
# Auron Platform - Vultr Deployment Wrapper
# This script handles docker group activation automatically
##############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_SCRIPT="$SCRIPT_DIR/vultr-deploy.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if docker group exists and user is member
if groups | grep -q docker; then
    print_info "User is in docker group"

    # Check if we can actually use docker
    if docker ps &> /dev/null; then
        print_success "Docker access confirmed"
        # Run the main deployment script
        exec bash "$DEPLOY_SCRIPT" "$@"
    else
        print_warning "Docker group membership needs to be activated"
        print_info "Activating docker group and re-running script..."
        # Use newgrp to activate docker group and run the script
        exec sg docker -c "bash $DEPLOY_SCRIPT $*"
    fi
else
    print_info "User not yet in docker group"
    print_info "The deployment script will add you to the docker group"

    # Run the deployment script (it will add user to docker group)
    bash "$DEPLOY_SCRIPT" "$@"

    # After script runs (and adds user to docker group), check if we need to re-run
    if [ $? -ne 0 ]; then
        echo ""
        print_warning "Script exited due to docker permissions"
        print_info "Re-running with activated docker group..."
        sleep 2
        exec sg docker -c "bash $DEPLOY_SCRIPT $*"
    fi
fi
