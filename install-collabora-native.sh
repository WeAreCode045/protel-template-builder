#!/bin/bash
set -e

echo "=== Installing Collabora Online (Native Package) ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo "Please run as root (use sudo)"
   exit 1
fi

echo "1. Adding Collabora repository..."
# Import GPG key
mkdir -p /etc/apt/keyrings
cd /etc/apt/keyrings
wget -O collaboraonline-release-keyring.gpg https://collaboraoffice.com/downloads/gpg/collaboraonline-release-keyring.gpg

# Add repository (new format for Ubuntu 24.04)
cat > /etc/apt/sources.list.d/collaboraonline.sources <<EOF
Types: deb
URIs: https://www.collaboraoffice.com/repos/CollaboraOnline/CODE-deb
Suites: ./
Signed-By: /etc/apt/keyrings/collaboraonline-release-keyring.gpg
EOF

echo ""
echo "2. Updating package list..."
apt-get update

echo ""
echo "3. Installing Collabora Online..."
apt-get install -y coolwsd code-brand

echo ""
echo "4. Configuring Collabora..."
# Set domain for WOPI host
coolconfig set ssl.enable false
coolconfig set ssl.termination true
coolconfig set storage.wopi.host protel.code045.nl
coolconfig set net.proto all

echo ""
echo "5. Starting Collabora service..."
systemctl enable coolwsd
systemctl start coolwsd
systemctl status coolwsd

echo ""
echo "=== Collabora Installation Complete ==="
echo ""
echo "Collabora is now running on localhost:9980"
echo ""
echo "Check status: sudo systemctl status coolwsd"
echo "View logs: sudo journalctl -u coolwsd -f"
echo ""
