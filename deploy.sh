#!/bin/bash

#############################################
# ProTel Template Builder - VPS Deploy Script
# 
# Supports: Ubuntu 22.04 LTS and 24.04 LTS (Server or Desktop)
#
# This script automatically installs and configures:
# - Docker & Docker Compose
# - MongoDB
# - Collabora Online
# - Backend API
# - Frontend Application
# - Nginx Reverse Proxy
# - SSL Certificates (optional)
#
# Usage: bash deploy.sh
#############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log_error "Please run as root (use sudo)"
        exit 1
    fi
}

check_ubuntu_version() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_VERSION=$VERSION_ID
        
        if [[ "$ID" != "ubuntu" ]]; then
            log_warning "This script is designed for Ubuntu. Your OS: $ID"
            read -p "Continue anyway? (y/n) " -n 1 -r
            echo
            [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
        fi
        
        log_info "Detected: $PRETTY_NAME"
        
        # Check if Desktop version
        if command -v gnome-shell &> /dev/null || command -v unity &> /dev/null; then
            log_warning "Ubuntu Desktop detected - this uses more resources than Server edition"
            log_info "Consider disabling GUI after setup to save ~1GB RAM"
        fi
        
        # For Ubuntu 24.04, install python3-distutils
        if [[ "$OS_VERSION" == "24.04" ]]; then
            log_info "Ubuntu 24.04 detected - installing additional Python packages..."
            apt-get install -y python3-distutils python3-setuptools python3-pip || true
        fi
    fi
}

install_docker() {
    if command -v docker &> /dev/null; then
        log_info "Docker already installed"
    else
        log_info "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
        systemctl enable docker
        systemctl start docker
        log_info "Docker installed successfully"
    fi
}

install_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        log_info "Docker Compose already installed"
    else
        log_info "Installing Docker Compose..."
        apt-get install -y docker-compose-plugin docker-compose
        log_info "Docker Compose installed successfully"
    fi
}

configure_firewall() {
    log_info "Configuring firewall..."
    ufw --force enable
    ufw allow 22/tcp   # SSH
    ufw allow 80/tcp   # HTTP
    ufw allow 443/tcp  # HTTPS
    log_info "Firewall configured"
}

setup_environment() {
    if [ ! -f .env ]; then
        log_info "Creating .env file..."
        cp .env.example .env
        
        # Generate random passwords
        MONGO_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        COLLABORA_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        JWT_SECRET=$(openssl rand -base64 64)
        
        # Update .env with generated passwords
        sed -i "s/MongoDBPass001!/$MONGO_PASS/" .env
        sed -i "s/CodePass001!/$COLLABORA_PASS/" .env
        sed -i "s/K7h9mP3nQ2rS5tU6vW8xY0zA1bC3dE4fF5gG6hH7iI8jJ9kK0lL1mM2nN3oO4pP5qQ6rR7sS8tT9uU0vV1wW2xX3yY4zZ5==/$JWT_SECRET/" .env
        
        log_warning "Please edit .env file and set your DOMAIN before continuing!"
        nano .env
    else
        log_info ".env file already exists"
    fi
    
    # Load environment variables
    source .env
    
    # Validate DOMAIN is set
    if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "yourdomain.com" ]; then
        log_error "Please set your actual DOMAIN in .env file!"
        exit 1
    fi
    
    log_info "Domain configured: $DOMAIN"
}

install_nginx() {
    if command -v nginx &> /dev/null; then
        log_info "Nginx already installed"
    else
        log_info "Installing Nginx..."
        apt-get install -y nginx
        systemctl enable nginx
        log_info "Nginx installed successfully"
    fi
}

configure_nginx() {
    log_info "Configuring Nginx..."
    
    # Load domain from .env
    source .env
    
    # Backup existing config
    if [ -f /etc/nginx/sites-available/protel ]; then
        cp /etc/nginx/sites-available/protel /etc/nginx/sites-available/protel.backup
    fi
    
    # Replace ${DOMAIN} placeholder in nginx config
    cp nginx/conf.d/default.conf /tmp/nginx-protel.conf
    sed -i "s/\${DOMAIN}/$DOMAIN/g" /tmp/nginx-protel.conf
    
    # Copy nginx configuration
    cp /tmp/nginx-protel.conf /etc/nginx/sites-available/protel
    
    # Remove default site and enable protel site
    rm -f /etc/nginx/sites-enabled/default
    ln -sf /etc/nginx/sites-available/protel /etc/nginx/sites-enabled/protel
    
    # Test nginx configuration
    if nginx -t; then
        log_info "Nginx configuration valid"
        systemctl reload nginx
    else
        log_error "Nginx configuration invalid!"
        exit 1
    fi
}

install_certbot() {
    log_info "Installing Certbot for SSL certificates..."
    
    # For Ubuntu 24.04, use snap
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        if [[ "$VERSION_ID" == "24.04" ]]; then
            log_info "Using snap to install Certbot for Ubuntu 24.04..."
            apt-get install -y snapd
            snap install core
            snap refresh core
            snap install --classic certbot
            ln -sf /snap/bin/certbot /usr/bin/certbot
        else
            # For Ubuntu 22.04 and earlier
            apt-get install -y certbot python3-certbot-nginx
        fi
    fi
    
    log_info "Certbot installed successfully"
}

setup_ssl() {
    # Load domain from .env
    source .env
    
    if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "yourdomain.com" ] || [ "$DOMAIN" = "protel.code045.com" ]; then
        log_error "Please set your DOMAIN in .env file first!"
        return 1
    fi
    
    log_info "Setting up SSL certificates for: $DOMAIN and www.$DOMAIN"
    log_warning "Make sure your DNS is pointing to this server!"
    
    read -p "Continue with SSL setup? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Skipping SSL setup"
        return 0
    fi
    
    # Use nginx plugin (doesn't need to stop nginx)
    log_info "Requesting SSL certificate..."
    certbot --nginx -d $DOMAIN -d www.$DOMAIN \
        --non-interactive \
        --agree-tos \
        --email admin@$DOMAIN \
        --redirect || {
            log_error "SSL certificate request failed!"
            log_warning "Common reasons:"
            log_warning "  1. DNS not configured or not propagated yet"
            log_warning "  2. Domain not pointing to this server"
            log_warning "  3. Port 80/443 blocked by firewall"
            log_info "You can run this later with: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
            return 1
        }
    
    log_info "SSL certificates installed successfully!"
    log_info "Auto-renewal is configured"
    
    return 0
}

start_services() {
    log_info "Starting all services..."
    docker-compose down 2>/dev/null || true
    docker-compose pull
    docker-compose up -d --build
    
    log_info "Waiting for services to be healthy..."
    sleep 15
    
    # Check service health
    if docker-compose ps | grep -q "Up"; then
        log_info "Services started successfully!"
    else
        log_error "Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
}

show_status() {
    echo ""
    log_info "======================================="
    log_info "Deployment Complete!"
    log_info "======================================="
    echo ""
    
    source .env
    
    log_info "Services status:"
    docker-compose ps
    
    echo ""
    log_info "Access your application:"
    
    # Check if SSL is configured
    if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
        log_info "  Application: https://$DOMAIN"
        log_info "  Backend API: https://$DOMAIN/api"
        log_info "  Collabora:   https://$DOMAIN/collabora"
    else
        log_info "  Application: http://$DOMAIN"
        log_info "  Backend API: http://$DOMAIN/api"
        log_info "  Collabora:   http://$DOMAIN/collabora"
        echo ""
        log_warning "SSL not configured. You can set it up with:"
        log_warning "  certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    fi
    
    echo ""
    log_info "Useful commands:"
    log_info "  View logs:      docker-compose logs -f"
    log_info "  View specific:  docker-compose logs -f backend"
    log_info "  Restart:        docker-compose restart"
    log_info "  Stop:           docker-compose down"
    log_info "  Update app:     git pull && docker-compose up -d --build"
    
    echo ""
    log_info "Credentials saved in .env file"
    log_info "  MongoDB User:     $MONGO_USER"
    log_info "  Collabora User:   $COLLABORA_USER"
    echo ""
    
    log_info "System resources:"
    free -h | grep Mem
    echo ""
    docker stats --no-stream
}

# Main installation flow
main() {
    log_info "Starting ProTel Template Builder deployment..."
    echo ""
    
    check_root
    check_ubuntu_version
    
    log_info "Updating system packages..."
    apt-get update && apt-get upgrade -y
    
    log_info "Installing system tools..."
    apt-get install -y git curl wget ufw openssl nano
    
    install_docker
    install_docker_compose
    configure_firewall
    install_nginx
    
    setup_environment
    
    # Start Docker services first (before nginx configuration)
    start_services
    
    # Configure Nginx to proxy to Docker containers
    configure_nginx
    
    # Optional SSL setup (uses nginx plugin, no port conflict)
    install_certbot
    
    echo ""
    read -p "Set up SSL certificates now? (DNS must be configured) (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_ssl
    else
        log_info "Skipping SSL setup. You can configure it later with:"
        log_info "  certbot --nginx -d yourdomain.com -d www.yourdomain.com"
    fi
    
    show_status
    
    log_info "Deployment completed successfully! 🎉"
}

# Run main function
main
