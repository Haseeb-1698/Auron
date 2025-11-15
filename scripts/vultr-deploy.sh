#!/bin/bash

##############################################################################
# Auron Platform - Automated Vultr Deployment Script
# Version: 2.0
# Description: Automated setup script for deploying Auron on Vultr VPS
# Usage: bash scripts/vultr-deploy.sh
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MIN_RAM=7500000  # 7.5GB minimum (in KB)
MIN_DISK=25      # 25GB minimum
MIN_CPU=2

##############################################################################
# Helper Functions
##############################################################################

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║           Auron Platform - Vultr Deployment                 ║"
    echo "║         Cybersecurity Training Lab Automated Setup          ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${GREEN}==>${NC} ${BLUE}$1${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should NOT be run as root"
        print_warning "Please run as a regular user with sudo privileges"
        exit 1
    fi
}

check_sudo() {
    print_step "Checking sudo privileges"
    if sudo -n true 2>/dev/null; then
        print_success "Sudo privileges confirmed"
    else
        print_warning "This script requires sudo privileges"
        sudo -v
        print_success "Sudo privileges granted"
    fi
}

check_system_requirements() {
    print_step "Checking system requirements"

    # Check OS
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        print_success "Operating System: $NAME $VERSION"

        if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
            print_warning "This script is optimized for Ubuntu/Debian"
            read -p "Continue anyway? (y/n) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi

    # Check RAM
    total_ram=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    total_ram_gb=$(echo "scale=2; $total_ram/1024/1024" | bc)

    if [ "$total_ram" -lt "$MIN_RAM" ]; then
        print_error "Insufficient RAM: ${total_ram_gb}GB detected, 8GB minimum required"
        print_warning "For full Wazuh SIEM support, 16GB RAM is recommended"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "RAM: ${total_ram_gb}GB (OK)"
    fi

    # Check CPU
    cpu_cores=$(nproc)
    if [ "$cpu_cores" -lt "$MIN_CPU" ]; then
        print_warning "Only $cpu_cores CPU cores detected, ${MIN_CPU}+ recommended"
    else
        print_success "CPU Cores: $cpu_cores (OK)"
    fi

    # Check Disk Space
    available_disk=$(df / | tail -1 | awk '{print $4}')
    available_disk_gb=$(echo "scale=2; $available_disk/1024/1024" | bc)

    if [ "$(echo "$available_disk_gb < $MIN_DISK" | bc)" -eq 1 ]; then
        print_error "Insufficient disk space: ${available_disk_gb}GB available, ${MIN_DISK}GB required"
        exit 1
    else
        print_success "Disk Space: ${available_disk_gb}GB available (OK)"
    fi
}

install_docker() {
    print_step "Installing Docker and Docker Compose"

    # Check if Docker is already installed
    if command -v docker &> /dev/null; then
        docker_version=$(docker --version | awk '{print $3}' | tr -d ',')
        print_success "Docker already installed: $docker_version"
    else
        print_warning "Docker not found, installing..."

        # Update package index
        sudo apt update

        # Install prerequisites
        sudo apt install -y \
            ca-certificates \
            curl \
            gnupg \
            lsb-release

        # Add Docker's official GPG key
        sudo mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

        # Set up repository
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

        # Install Docker Engine
        sudo apt update
        sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

        print_success "Docker installed successfully"
    fi

    # Add current user to docker group
    if groups | grep -q docker; then
        print_success "User already in docker group"
    else
        sudo usermod -aG docker $USER
        print_warning "Added user to docker group"
    fi

    # Enable and start Docker
    sudo systemctl enable docker
    sudo systemctl start docker

    # Test Docker access
    if ! docker ps &> /dev/null; then
        print_warning "Docker group membership requires session refresh"
        print_warning "Activating docker group with newgrp..."

        # We need to tell the user to run newgrp or re-login
        echo ""
        print_error "Docker permission issue detected!"
        echo ""
        echo "Please run ONE of the following:"
        echo ""
        echo "  Option 1 (Quick): Run this command, then re-run the script:"
        echo "    newgrp docker"
        echo ""
        echo "  Option 2 (Recommended): Log out and SSH back in, then re-run the script:"
        echo "    exit"
        echo "    ssh $USER@$(hostname -I | awk '{print $1}')"
        echo ""
        exit 1
    fi

    # Verify Docker Compose
    if docker compose version &> /dev/null; then
        compose_version=$(docker compose version | awk '{print $4}')
        print_success "Docker Compose: $compose_version"
    else
        print_error "Docker Compose not found!"
        exit 1
    fi
}

install_dependencies() {
    print_step "Installing system dependencies"

    sudo apt update
    sudo apt install -y \
        git \
        curl \
        wget \
        vim \
        nano \
        htop \
        net-tools \
        ufw \
        fail2ban \
        unzip \
        bc \
        openssl \
        jq

    print_success "System dependencies installed"
}

configure_firewall() {
    print_step "Configuring UFW firewall"

    # Check if UFW is installed
    if ! command -v ufw &> /dev/null; then
        sudo apt install -y ufw
    fi

    print_warning "Firewall configuration options:"
    echo "1) Localhost only (SSH tunnel required) - RECOMMENDED"
    echo "2) Expose frontend/backend ports (less secure)"
    echo "3) Skip firewall configuration"

    read -p "Select option (1-3): " fw_option

    case $fw_option in
        1)
            print_success "Configuring firewall for localhost-only access"
            sudo ufw default deny incoming
            sudo ufw default allow outgoing
            sudo ufw allow 22/tcp comment 'SSH'
            sudo ufw --force enable
            print_success "Firewall configured. Use SSH tunneling for remote access."
            ;;
        2)
            print_warning "Exposing ports to internet (NOT recommended for vulnerable apps!)"
            sudo ufw default deny incoming
            sudo ufw default allow outgoing
            sudo ufw allow 22/tcp comment 'SSH'
            sudo ufw allow 5173/tcp comment 'Auron Frontend'
            sudo ufw allow 4000/tcp comment 'Auron Backend'
            sudo ufw allow 5601/tcp comment 'Wazuh Dashboard'
            sudo ufw --force enable
            print_success "Firewall configured with exposed ports"
            ;;
        3)
            print_warning "Skipping firewall configuration"
            ;;
        *)
            print_error "Invalid option, skipping firewall"
            ;;
    esac
}

configure_fail2ban() {
    print_step "Configuring Fail2Ban"

    if command -v fail2ban-client &> /dev/null; then
        sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local 2>/dev/null || true

        # Configure SSH jail
        sudo tee /etc/fail2ban/jail.d/sshd.local > /dev/null <<EOF
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

        sudo systemctl enable fail2ban
        sudo systemctl restart fail2ban
        print_success "Fail2Ban configured"
    else
        print_warning "Fail2Ban not installed, skipping"
    fi
}

clone_repository() {
    print_step "Cloning Auron repository"

    # Check if already in Auron directory
    if [[ $(basename "$PWD") == "Auron" ]] && [[ -f "docker-compose.yml" ]]; then
        print_success "Already in Auron directory, skipping clone"
        return
    fi

    # Clone if not exists
    if [[ ! -d "Auron" ]]; then
        print_warning "Cloning from GitHub..."
        git clone https://github.com/Haseeb-1698/Auron.git
        cd Auron
        print_success "Repository cloned"
    else
        print_success "Repository already exists"
        cd Auron
    fi
}

configure_environment() {
    print_step "Configuring environment variables"

    if [[ -f .env ]]; then
        print_warning ".env file already exists"
        read -p "Overwrite? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_success "Keeping existing .env file"
            return
        fi
    fi

    # Copy example
    cp .env.example .env

    # Get server IP
    server_ip=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")

    print_warning "Environment configuration:"
    echo "Generating secure passwords..."

    # Generate secure passwords (alphanumeric only to avoid sed escaping issues)
    postgres_password=$(openssl rand -hex 16)
    jwt_secret=$(openssl rand -hex 32)
    jwt_refresh_secret=$(openssl rand -hex 32)
    redis_password=$(openssl rand -hex 16)
    session_secret=$(openssl rand -hex 16)
    wazuh_password=$(openssl rand -hex 16)

    # Function to safely update .env file
    update_env() {
        local key=$1
        local value=$2
        # Escape special characters for sed
        local escaped_value=$(printf '%s\n' "$value" | sed 's/[&/\]/\\&/g')
        sed -i "s|^${key}=.*|${key}=${escaped_value}|" .env
    }

    # Update .env file with generated passwords
    update_env "POSTGRES_PASSWORD" "$postgres_password"
    update_env "DATABASE_URL" "postgresql://auron_user:${postgres_password}@postgres:5432/auron_db"
    update_env "JWT_SECRET" "$jwt_secret"
    update_env "JWT_REFRESH_SECRET" "$jwt_refresh_secret"
    update_env "REDIS_PASSWORD" "$redis_password"
    update_env "SESSION_SECRET" "$session_secret"
    update_env "WAZUH_DASHBOARD_PASSWORD" "$wazuh_password"
    update_env "WAZUH_API_PASSWORD" "$wazuh_password"

    # Update API URLs
    update_env "VITE_API_URL" "http://${server_ip}:4000/api"
    update_env "VITE_WS_URL" "ws://${server_ip}:4000"
    update_env "CORS_ORIGIN" "http://${server_ip}:5173"

    # Set production mode
    update_env "NODE_ENV" "production"
    update_env "LOG_LEVEL" "info"

    print_success "Generated secure passwords and configured environment"

    # Ask for optional API keys
    echo ""
    print_warning "Optional API Keys Configuration:"
    echo ""

    # LiquidMetal API Key
    read -p "Enter LiquidMetal API key (for AI hints, press Enter to skip): " liquidmetal_key
    if [[ ! -z "$liquidmetal_key" ]]; then
        update_env "LIQUIDMETAL_API_KEY" "$liquidmetal_key"
        print_success "LiquidMetal API key configured"
    else
        print_warning "Skipping LiquidMetal API key (AI hints will not work)"
    fi

    # Vultr API Key
    read -p "Enter Vultr API key (for cloud labs, press Enter to skip): " vultr_key
    if [[ ! -z "$vultr_key" ]]; then
        # Uncomment and set Vultr API key
        sed -i "s/^# VULTR_API_KEY=.*/VULTR_API_KEY=$vultr_key/" .env
        sed -i "s/^# VULTR_DEFAULT_REGION=.*/VULTR_DEFAULT_REGION=ewr/" .env
        sed -i "s/^# VULTR_DEFAULT_PLAN=.*/VULTR_DEFAULT_PLAN=vc2-1c-1gb/" .env
        print_success "Vultr API key configured"
    else
        print_warning "Skipping Vultr API key (local Docker labs only)"
    fi

    # Save credentials
    cat > .credentials.txt <<EOF
╔══════════════════════════════════════════════════════════════╗
║           Auron Platform - Generated Credentials            ║
╚══════════════════════════════════════════════════════════════╝

Server IP: $server_ip

PostgreSQL:
  - Database: auron_db
  - User: auron_user
  - Password: $postgres_password

Wazuh SIEM:
  - URL: https://$server_ip:5601
  - Username: admin
  - Password: $wazuh_password

Redis:
  - Password: $redis_password

JWT Secrets:
  - Access Token Secret: $jwt_secret
  - Refresh Token Secret: $jwt_refresh_secret

Session Secret: $session_secret

⚠️  IMPORTANT: Keep this file secure and delete after saving credentials!

EOF

    chmod 600 .credentials.txt
    print_success "Credentials saved to .credentials.txt"
}

deploy_platform() {
    print_step "Deploying Auron Platform"

    print_warning "This will start 12 Docker services. Continue?"
    read -p "Deploy now? (y/n) " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled. Run 'docker compose up -d' manually when ready."
        return
    fi

    # Generate Wazuh SSL certificates
    if [ ! -d "wazuh-certs" ]; then
        print_warning "Generating Wazuh SSL certificates..."
        bash scripts/generate-wazuh-certs.sh
        print_success "SSL certificates generated"
    else
        print_success "SSL certificates already exist"
    fi

    # Pull images
    print_warning "Pulling Docker images (this may take 5-10 minutes)..."
    docker compose pull

    # Build custom images
    print_warning "Building custom images..."
    docker compose build

    # Start services
    print_warning "Starting services..."
    docker compose up -d

    print_success "Platform deployed!"

    # Wait for services
    print_warning "Waiting for services to be healthy (this may take 2-3 minutes)..."
    sleep 10

    # Monitor startup
    for i in {1..30}; do
        echo -n "."
        sleep 2

        # Check if all services are up
        running_count=$(docker compose ps --format json 2>/dev/null | jq -r '.State' | grep -c "running" || echo 0)
        if [ "$running_count" -ge 10 ]; then
            echo ""
            print_success "Services are starting up!"
            break
        fi
    done

    echo ""
}

show_status() {
    print_step "Service Status"
    docker compose ps

    echo ""
    print_step "Resource Usage"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
}

show_completion_message() {
    server_ip=$(curl -s ifconfig.me || echo "YOUR_SERVER_IP")

    echo ""
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║               Deployment Complete! 🚀                       ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    echo -e "${YELLOW}Access URLs:${NC}"
    echo ""
    echo "  Frontend Dashboard:  http://$server_ip:5173"
    echo "  Backend API:         http://$server_ip:4000/api"
    echo "  Swagger Docs:        http://$server_ip:4000/api-docs"
    echo "  Wazuh SIEM:          https://$server_ip:5601"
    echo ""

    echo -e "${YELLOW}Via SSH Tunnel (Recommended):${NC}"
    echo ""
    echo "  ssh -L 5173:localhost:5173 \\"
    echo "      -L 4000:localhost:4000 \\"
    echo "      -L 5601:localhost:5601 \\"
    echo "      $USER@$server_ip"
    echo ""
    echo "  Then access: http://localhost:5173"
    echo ""

    echo -e "${YELLOW}Credentials:${NC}"
    echo "  Saved in: .credentials.txt"
    echo "  View: cat .credentials.txt"
    echo ""

    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Access dashboard: http://$server_ip:5173"
    echo "  2. Register your account"
    echo "  3. Browse labs and start learning!"
    echo ""

    echo -e "${YELLOW}Useful Commands:${NC}"
    echo "  - View logs:         docker compose logs -f"
    echo "  - Check status:      docker compose ps"
    echo "  - Restart services:  docker compose restart"
    echo "  - Stop platform:     docker compose down"
    echo ""

    echo -e "${GREEN}Documentation:${NC}"
    echo "  - Deployment Guide:  cat VULTR_DEPLOYMENT.md"
    echo "  - README:            cat README.md"
    echo "  - Troubleshooting:   cat DEPLOYMENT_COMPLETE.md"
    echo ""

    echo -e "${RED}⚠️  Security Reminders:${NC}"
    echo "  - Delete .credentials.txt after saving passwords"
    echo "  - DO NOT expose vulnerable labs (DVWA, Juice Shop) to internet"
    echo "  - Use SSH tunneling for remote access"
    echo "  - Change default passwords regularly"
    echo ""
}

##############################################################################
# Main Execution
##############################################################################

main() {
    print_header

    # Checks
    check_root
    check_sudo
    check_system_requirements

    # Installation
    install_dependencies
    install_docker

    # Security
    configure_firewall
    configure_fail2ban

    # Setup
    clone_repository
    configure_environment

    # Deploy
    deploy_platform

    # Status
    show_status

    # Completion
    show_completion_message

    print_success "Deployment script completed successfully!"
}

# Run main function
main "$@"
