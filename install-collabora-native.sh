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
cd /usr/share/keyrings
wget https://collaboraoffice.com/repos/CollaboraOnline/CODE-ubuntu2204/Release.key -O collaboraonline-release-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/collaboraonline-release-keyring.gpg] https://collaboraoffice.com/repos/CollaboraOnline/CODE-ubuntu2204 ./" > /etc/apt/sources.list.d/collaboraonline.list

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
