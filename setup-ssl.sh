#!/bin/bash
set -e

echo "=== Setting up SSL with Let's Encrypt ==="
echo ""

DOMAIN="protel.code045.nl"
EMAIL="your-email@example.com"  # Change this!

echo "Prerequisites:"
echo "1. Domain $DOMAIN must point to this server's IP"
echo "2. Port 80 must be open for ACME challenge"
echo ""

read -p "Have you updated the EMAIL variable in this script? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please edit this script and set your email address first!"
    exit 1
fi

echo "Installing certbot..."
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

echo ""
echo "Obtaining SSL certificate..."
sudo certbot certonly \
    --webroot \
    -w /var/www/html \
    -d $DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email

echo ""
echo "Setting up auto-renewal..."
sudo systemctl enable snap.certbot.renew.timer
sudo systemctl start snap.certbot.renew.timer

echo ""
echo "Reloading nginx..."
sudo systemctl reload nginx

echo ""
echo "=== SSL Setup Complete ==="
echo ""
echo "Certificate location: /etc/letsencrypt/live/$DOMAIN/"
echo "Auto-renewal: Enabled (runs twice daily)"
echo ""
echo "Test your site: https://$DOMAIN"
echo ""
echo "Check certificate:"
echo "  sudo certbot certificates"
echo ""
echo "Manual renewal (if needed):"
echo "  sudo certbot renew"
echo ""
