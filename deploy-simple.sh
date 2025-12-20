#!/bin/bash
set -e

echo "=== ProTel Template Builder - Simple Deployment ==="
echo "This deploys Backend and Frontend on host, MongoDB and Collabora in Docker"
echo ""

# Configuration
DOMAIN=${DOMAIN:-"protel.code045.nl"}
DEPLOY_DIR="/opt/protel-template-builder"

cd "$DEPLOY_DIR"

echo "1. Pulling latest code..."
git pull

echo ""
echo "2. Starting Docker services (MongoDB + Collabora)..."
docker-compose up -d

echo ""
echo "3. Building frontend..."
cd frontend
# Clean install to avoid rollup optional dependency bug
rm -rf node_modules package-lock.json
npm install
npm run build

echo ""
echo "4. Installing backend dependencies..."
cd ../backend
rm -rf node_modules package-lock.json
npm install --production

echo ""
echo "5. Updating nginx configuration..."
sudo cp ../nginx-host.conf /etc/nginx/sites-available/protel.code045.nl
sudo ln -sf /etc/nginx/sites-available/protel.code045.nl /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

echo ""
echo "6. Testing nginx configuration..."
sudo nginx -t

echo ""
echo "7. Restarting nginx..."
sudo systemctl restart nginx

echo ""
echo "8. Setting up backend systemd service..."
sudo tee /etc/systemd/system/protel-backend.service > /dev/null <<EOF
[Unit]
Description=ProTel Template Builder Backend
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$DEPLOY_DIR/backend
Environment="NODE_ENV=production"
Environment="PORT=3001"
Environment="COLLABORA_URL=http://localhost:9980"
Environment="BACKEND_URL=https://$DOMAIN/api"
Environment="FRONTEND_URL=https://$DOMAIN"
Environment="MONGO_URI=mongodb://admin:changeme@localhost:27017/protel?authSource=admin"
ExecStart=/usr/bin/node server.cjs
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo ""
echo "9. Starting backend service..."
sudo systemctl daemon-reload
sudo systemctl enable protel-backend
sudo systemctl restart protel-backend

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Services:"
echo "  - MongoDB:    docker container on port 27017"
echo "  - Collabora:  native service on port 9980 (systemctl status coolwsd)"
echo "  - Backend:    systemd service on port 3001"
echo "  - Frontend:   nginx serving static files"
echo "  - Nginx:      https://$DOMAIN"
echo ""
echo "Check status:"
echo "  sudo systemctl status protel-backend"
echo "  sudo systemctl status coolwsd"
echo "  docker-compose ps"
echo "  sudo systemctl status nginx"
echo ""
echo "Logs:"
echo "  sudo journalctl -u protel-backend -f"
echo "  sudo journalctl -u coolwsd -f"
echo "  docker-compose logs -f"
echo ""
