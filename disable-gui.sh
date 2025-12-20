#!/bin/bash

# Script to disable Ubuntu Desktop GUI and free up resources
# Use this on Ubuntu Desktop installations to save ~1GB RAM
# Only use if you don't need the desktop environment!

set -e

echo "⚠️  WARNING: This will disable the Desktop GUI!"
echo "You will only have command-line access after this."
echo "SSH access will still work normally."
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm) " -r
echo

if [[ ! $REPLY = "yes" ]]; then
    echo "Cancelled."
    exit 0
fi

echo "Disabling desktop environment..."

# Stop display manager
systemctl stop gdm3 2>/dev/null || systemctl stop lightdm 2>/dev/null || true

# Disable display manager from starting on boot
systemctl disable gdm3 2>/dev/null || systemctl disable lightdm 2>/dev/null || true

# Set default target to multi-user (no GUI)
systemctl set-default multi-user.target

echo ""
echo "✅ Desktop environment disabled!"
echo "System will boot to command-line interface on next reboot."
echo ""
echo "To re-enable the GUI later, run:"
echo "  sudo systemctl set-default graphical.target"
echo "  sudo systemctl start gdm3"
echo ""
echo "Reboot now? (y/n)"
read -p "" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    reboot
fi
