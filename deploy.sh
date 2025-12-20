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
        apt-get install -y docker-compose
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
        MONGO_PASS=$(openssl rand -base64 32)
        COLLABORA_PASS=$(openssl rand -base64 32)
        JWT_SECRET=$(openssl rand -base64 64)
        
        # Update .env with generated passwords
        sed -i "s/ChangeThisMongoPassword123!/$MONGO_PASS/" .env
        sed -i "s/ChangeThisSecurePassword123!/$COLLABORA_PASS/" .env
        sed -i "s/your-super-secret-jwt-key-change-this/$JWT_SECRET/" .env
        
        log_warning "Please edit .env file and set your DOMAIN before continuing!"
        log_warning "Press ENTER after editing .env file..."
        read -r
    else
        log_info ".env file already exists"
    fi
    
    # Load environment variables
    source .env
    
    # Validate DOMAIN is set
    if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "yourdomain.com" ]; then
        log_error "Please set your DOMAIN in .env file!"
        exit 1
    fi
    
    # Replace ${DOMAIN} in nginx config
    log_info "Configuring nginx for domain: $DOMAIN"
    sed -i "s/\${DOMAIN}/$DOMAIN/g" nginx/conf.d/default.conf
    
    log_info "Domain configured: $DOMAIN"
}

install_certbot() {
    log_info "Installing Certbot for SSL certificates..."
    apt-get install -y certbot python3-certbot-nginx
}

setup_ssl() {
    read -p "Do you want to set up SSL certificates now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Setting up SSL certificates..."
        
        # Load domain from .env
        source .env
        
        if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "yourdomain.com" ]; then
            log_error "Please set your DOMAIN in .env file first!"
            exit 1
        fi
        
        log_info "Obtaining SSL certificate for: $DOMAIN and www.$DOMAIN"
        
        certbot certonly --standalone --agree-tos --preferred-challenges http \
            -d $DOMAIN \
            -d www.$DOMAIN
        
        # Copy certificates to nginx/ssl directory
        mkdir -p nginx/ssl
        cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/
        cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/
        
        # Update nginx config for SSL (add SSL server block)
        log_info "Updating Nginx configuration for SSL..."
        cat >> nginx/conf.d/default.conf <<EOF

# SSL Configuration
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 100M;

    # Same locations as HTTP server
    location /api {
        proxy_pass http://backend:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_read_timeout 300s;
    }

    location /collabora/ {
        rewrite ^/collabora/(.*)$ /\$1 break;
        proxy_pass http://collabora:9980;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}
EOF
        
        log_info "SSL certificates installed successfully"
    else
        log_info "Skipping SSL setup"
    fi
}

start_services() {
    log_info "Starting all services..."
    docker-compose down 2>/dev/null || true
    docker-compose pull
    docker-compose up -d --build
    
    log_info "Waiting for services to be healthy..."
    sleep 10
    
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
    if [ ! -z "$DOMAIN" ] && [ "$DOMAIN" != "yourdomain.com" ]; then
        log_info "  Application: https://$DOMAIN"
        log_info "  Backend API: https://$DOMAIN/api"
        log_info "  Collabora:   https://$DOMAIN/collabora"
    else
        log_info "  Application: http://$(hostname -I | awk '{print $1}')"
        log_info "  Backend API: http://$(hostname -I | awk '{print $1}')/api"
        log_info "  Collabora:   http://$(hostname -I | awk '{print $1}')/collabora"
    fi
    
    echo ""
    log_info "Useful commands:"
    log_info "  View logs:      docker-compose logs -f"
    log_info "  Restart:        docker-compose restart"
    log_info "  Stop:           docker-compose down"
    log_info "  Update app:     git pull && docker-compose up -d --build"
    
    echo ""
    log_warning "IMPORTANT: Save these credentials!"
    log_warning "MongoDB Password: $(grep MONGO_PASSWORD .env | cut -d'=' -f2)"
    log_warning "Collabora Password: $(grep COLLABORA_PASS .env | cut -d'=' -f2)"
    echo ""
}

# Main installation flow
main() {
    log_info "Starting ProTel Template Builder deployment..."
    
    check_root
    check_ubuntu_version
    
    log_info "Updating system packages..."
    apt-get update && apt-get upgrade -y
    
    install_docker
    install_docker_compose
    
    log_info "Installing additional tools..."
    apt-get install -y git curl wget ufw openssl
    
    configure_firewall
    setup_environment
    
    # Optional SSL setup
    install_certbot
    
    # Ask if user wants SSL now or later
    read -p "Set up SSL certificates now? (Requires DNS to be configured) (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_ssl
    else
        log_info "You can set up SSL later with: certbot --nginx"
    fi
    
    start_services
    show_status
    
    log_info "Deployment completed successfully! 🎉"
}

# Run main function
main
