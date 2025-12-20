#!/bin/bash
set -e

echo "=== Fixing Collabora Reverse Proxy Configuration ==="
echo "Based on: https://sdk.collaboraonline.com/docs/installation/Proxy_settings.html"
echo ""

if [ "$EUID" -ne 0 ]; then 
   echo "Please run as root (use sudo)"
   exit 1
fi

DEPLOY_DIR="/opt/protel-template-builder"
DOMAIN="protel.code045.nl"

echo "Step 1: Updating Nginx configuration..."
cat > /etc/nginx/sites-available/$DOMAIN <<'NGINX_EOF'
# ProTel Template Builder - Nginx Configuration with Collabora
# Based on https://sdk.collaboraonline.com/docs/installation/Proxy_settings.html

upstream backend {
    server localhost:3001;
}

upstream collabora {
    server localhost:9980;
}

# WebSocket upgrade mapping
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

# HTTP - redirect to HTTPS (commented out for testing)
# server {
#     listen 80;
#     listen [::]:80;
#     server_name protel.code045.nl;
#     
#     location /.well-known/acme-challenge/ {
#         root /var/www/html;
#     }
#     
#     location / {
#         return 301 https://$host$request_uri;
#     }
# }

# HTTP (for testing without SSL)
server {
    listen 80;
    listen [::]:80;
    server_name protel.code045.nl;

    client_max_body_size 100M;

    # Frontend - serve static files
    location / {
        root /opt/protel-template-builder/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Collabora static files
    location ^~ /browser {
        proxy_pass http://collabora;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
    }

    # Collabora admin console
    location ^~ /loleaflet {
        proxy_pass http://collabora;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
    }

    # Collabora WebSocket (most important - must be first)
    location ~ ^/(c|l)ool {
        proxy_pass http://collabora;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_read_timeout 3600s;
        proxy_connect_timeout 75s;
        proxy_buffering off;
    }

    # Collabora hosting discovery
    location ^~ /hosting/discovery {
        proxy_pass http://collabora;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
    }

    # Collabora capabilities
    location ^~ /hosting/capabilities {
        proxy_pass http://collabora;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINX_EOF

echo "Step 2: Testing Nginx configuration..."
nginx -t

echo ""
echo "Step 3: Reloading Nginx..."
systemctl reload nginx

echo ""
echo "Step 4: Updating Collabora configuration..."
# Backup original config
cp /etc/coolwsd/coolwsd.xml /etc/coolwsd/coolwsd.xml.backup-$(date +%Y%m%d-%H%M%S)

# Install xmlstarlet if needed
if ! command -v xmlstarlet &> /dev/null; then
    echo "Installing xmlstarlet..."
    apt-get install -y xmlstarlet
fi

# Update SSL settings
xmlstarlet ed -L \
  -u '/config/ssl/enable' -v 'false' \
  -u '/config/ssl/termination' -v 'true' \
  /etc/coolwsd/coolwsd.xml

# Update storage WOPI host
xmlstarlet ed -L \
  -u '/config/storage/wopi/host[@allow="true"]' -v 'protel\.code045\.nl' \
  /etc/coolwsd/coolwsd.xml

# Update net proto
xmlstarlet ed -L \
  -u '/config/net/proto' -v 'all' \
  /etc/coolwsd/coolwsd.xml

echo ""
echo "Step 5: Restarting Collabora..."
systemctl restart coolwsd

echo ""
echo "Step 6: Updating backend to not modify discovery URLs..."
cd $DEPLOY_DIR/backend

# Create backup
cp server.cjs server.cjs.backup-$(date +%Y%m%d-%H%M%S)

# Update the discovery endpoint to not modify URLs
cat > /tmp/discovery-fix.js <<'JS_EOF'
// Discovery endpoint
app.get('/api/collabora/discovery', async (req, res) => {
  try {
    const collaboraUrl = process.env.COLLABORA_URL || 'http://localhost:9980';
    const discoveryUrl = `${collaboraUrl}/hosting/discovery`;
    
    console.log('Fetching discovery from:', discoveryUrl);
    
    // Fetch discovery XML from Collabora (using native fetch in Node 18+)
    const response = await fetch(discoveryUrl);
    
    if (!response.ok) {
      throw new Error(`Collabora discovery failed: ${response.statusText}`);
    }
    
    const discoveryXml = await response.text();
    
    // Collabora returns correct URLs with domain - no modification needed
    res.json({ 
      collaboraUrl: '',
      discoveryXml: discoveryXml 
    });
  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({ error: error.message });
  }
});
JS_EOF

# Replace the discovery endpoint in server.cjs
# This is a simplified approach - finding and replacing the entire function
sed -i '/^app\.get.*\/api\/collabora\/discovery/,/^});/{
  /^app\.get.*\/api\/collabora\/discovery/!{
    /^});/!d
  }
}' server.cjs

# Insert the new discovery endpoint after the GET /api/collabora/files/:fileId/contents endpoint
sed -i '/^app\.get.*\/api\/collabora\/files\/:fileId\/contents.*$/,/^});$/{
  /^});$/a\
\
// Discovery endpoint\
app.get("/api/collabora/discovery", async (req, res) => {\
  try {\
    const collaboraUrl = process.env.COLLABORA_URL || "http://localhost:9980";\
    const discoveryUrl = `${collaboraUrl}/hosting/discovery`;\
    \
    console.log("Fetching discovery from:", discoveryUrl);\
    \
    const response = await fetch(discoveryUrl);\
    \
    if (!response.ok) {\
      throw new Error(`Collabora discovery failed: ${response.statusText}`);\
    }\
    \
    const discoveryXml = await response.text();\
    \
    // Collabora returns correct URLs - no modification needed\
    res.json({ \
      collaboraUrl: "",\
      discoveryXml: discoveryXml \
    });\
  } catch (error) {\
    console.error("Discovery error:", error);\
    res.status(500).json({ error: error.message });\
  }\
});
}' server.cjs

echo ""
echo "Step 7: Restarting backend service..."
systemctl restart protel-backend

echo ""
echo "=== Configuration Complete ==="
echo ""
echo "Services Status:"
systemctl status nginx --no-pager -l | head -5
systemctl status coolwsd --no-pager -l | head -5  
systemctl status protel-backend --no-pager -l | head -5

echo ""
echo "Testing Collabora discovery..."
curl -s http://localhost:9980/hosting/discovery | head -10

echo ""
echo "Testing via Nginx..."
curl -s http://localhost/hosting/discovery | head -10

echo ""
echo "=== Next Steps ==="
echo "1. Upload a file at http://$DOMAIN"
echo "2. Check browser console for WebSocket connection"
echo "3. WebSocket URL should be: ws://$DOMAIN/cool/.../ws"
echo ""
echo "If everything works, enable HTTPS redirect in nginx config"
echo ""
