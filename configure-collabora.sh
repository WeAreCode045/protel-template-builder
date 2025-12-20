#!/bin/bash
set -e

echo "=== Configuring Collabora for Reverse Proxy ==="
echo ""

if [ "$EUID" -ne 0 ]; then 
   echo "Please run as root (use sudo)"
   exit 1
fi

CONFIG_FILE="/etc/coolwsd/coolwsd.xml"

echo "Backing up config file..."
cp $CONFIG_FILE ${CONFIG_FILE}.backup

echo "Updating Collabora configuration..."

# Update SSL settings
xmlstarlet ed -L \
  -u '/config/ssl/enable' -v 'false' \
  -u '/config/ssl/termination' -v 'true' \
  $CONFIG_FILE

# Update storage WOPI host (allow protel.code045.nl)
xmlstarlet ed -L \
  -u '/config/storage/wopi/host' -v 'protel\.code045\.nl' \
  $CONFIG_FILE

# Update net proto to allow all
xmlstarlet ed -L \
  -u '/config/net/proto' -v 'all' \
  $CONFIG_FILE

# Add alias group if not exists
# Check if aliasgroups section exists, if not we'll add it manually
if ! grep -q "<aliasgroups" $CONFIG_FILE; then
    echo "Adding aliasgroups configuration..."
    # This is complex with xmlstarlet, so we'll use sed
    sed -i '/<\/config>/i \
    <aliasgroups desc="default mode is groups">\n\
        <group>\n\
            <host desc="hostname to allow or deny.">https://protel.code045.nl:443</host>\n\
            <alias desc="regex pattern of aliasname">https://protel.code045.nl/collabora</alias>\n\
        </group>\n\
    </aliasgroups>' $CONFIG_FILE
fi

echo ""
echo "Configuration updated!"
echo ""
echo "Restarting Collabora..."
systemctl restart coolwsd

echo ""
echo "=== Configuration Complete ==="
echo ""
echo "Check status: sudo systemctl status coolwsd"
echo "View config: sudo cat /etc/coolwsd/coolwsd.xml | grep -A 10 aliasgroups"
echo ""
