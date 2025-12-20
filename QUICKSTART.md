# Quick Start Guide

## 🚀 Deploy naar VPS in 5 minuten

### Stap 1: VPS Aanmaken bij Hetzner

1. Ga naar https://hetzner.com
2. Kies **Ubuntu 22.04 LTS**
3. Selecteer minimaal **CX21** (4GB RAM) - €5.83/maand
4. Voeg je SSH key toe
5. Maak server aan en noteer het IP-adres

### Stap 2: DNS Instellen

Bij je domain provider (TransIP, Cloudflare, etc.), voeg **1 A-record** toe:

```
Type  Name    Value           TTL
A     @       VPS-IP-ADDRESS  3600
A     www     VPS-IP-ADDRESS  3600
```

**Dat is alles!** Alle services draaien op één domein:
- `yourdomain.com` → Frontend
- `yourdomain.com/api` → Backend
- `yourdomain.com/collabora` → Collabora

Wacht 5-10 minuten totdat DNS is gepropageerd.

### Stap 3: Repository Forken & Aanpassen

1. Fork deze repository op GitHub
2. Clone je fork lokaal:
```bash
git clone https://github.com/JOUW-USERNAME/protel-template-builder.git
cd protel-template-builder
```

3. Update domeinnaam in `.env.example`:
```bash
# Edit alleen deze regel:
sed -i 's/yourdomain.com/jouwdomein.nl/g' .env.example
```

4. Push naar je repository:
```bash
git add .
git commit -m "Update domain configuration"
git push
```

### Stap 4: Deploy naar VPS

SSH naar je VPS:
```bash
ssh root@VPS-IP-ADDRESS
```

Run het deployment script:
```bash
# Clone je repository
git clone https://github.com/JOUW-USERNAME/protel-template-builder.git
cd protel-template-builder

# Maak deploy script executable
chmod +x deploy.sh

# Run deployment (automatisch!)
bash deploy.sh
```

Het script vraagt je om `.env` aan te passen. Druk op ENTER en wijzig:
```bash
nano .env

# Wijzig alleen deze regel:
DOMAIN=jouwdomein.nl

# Save: Ctrl+O, Enter
# Exit: Ctrl+X
```

Daarna vraagt het script of je SSL wilt. Type `y` als je DNS al klaar is.

### Stap 5: Klaar! 🎉

Je applicatie draait nu op **één domein**:
- **Frontend:** https://jouwdomein.nl
- **Backend API:** https://jouwdomein.nl/api  
- **Collabora:** https://jouwdomein.nl/collabora

## 🔄 Updates Pushen

Lokaal:
```bash
# Maak wijzigingen
git add .
git commit -m "Your changes"
git push
```

Op VPS:
```bash
ssh root@VPS-IP-ADDRESS
cd protel-template-builder
git pull
docker-compose up -d --build
```

## 💻 Local Development

Voor local development (zonder deployment):

```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Start Docker services (Collabora + MongoDB)
docker-compose -f docker-compose.dev.yml up -d

# Start backend (nieuwe terminal)
cd backend
npm run dev

# Start frontend (nieuwe terminal)
npm run dev
```

Open http://localhost:3000

## 📊 Handige Commando's

### Op de VPS

```bash
# Status bekijken
docker-compose ps

# Logs bekijken
docker-compose logs -f

# Specifieke service logs
docker-compose logs -f backend

# Services herstarten
docker-compose restart

# Services stoppen
docker-compose down

# Services starten
docker-compose up -d
```

### Database Backup

```bash
# Backup maken
docker exec protel-mongodb mongodump --out=/backup
docker cp protel-mongodb:/backup ./mongodb-backup-$(date +%Y%m%d)

# Backup downloaden naar lokaal (vanaf je computer)
scp -r root@VPS-IP:/root/protel-template-builder/mongodb-backup-* ./backups/
```

### SSL Certificaat Vernieuwen

```bash
# Automatisch (draait elke 12 uur via cron)
certbot renew

# Forceer vernieuwing
certbot renew --force-renewal

# Certificaten bekijken
certbot certificates
```

## 🐛 Troubleshooting

### "Services failed to start"
```bash
# Bekijk logs voor details
docker-compose logs

# Check disk space
df -h

# Als disk vol: clean Docker
docker system prune -a
```

### "Can't connect to Collabora"
```bash
# Check Collabora container
docker logs protel-collabora

# Test discovery endpoint
curl http://localhost:9980/hosting/discovery
```

### "Database connection failed"
```bash
# Check MongoDB
docker exec protel-mongodb mongosh --eval "db.adminCommand('ping')"

# Restart MongoDB
docker-compose restart mongodb
```

### "SSL certificate error"
```bash
# Zorg dat DNS klaar is (test eerst):
dig jouwdomein.nl

# Probeer opnieuw
certbot --nginx -d jouwdomein.nl -d www.jouwdomein.nl
```

## 💰 Kosten Overzicht

| Item | Kosten | Per |
|------|--------|-----|
| Hetzner CX21 VPS | €5.83 | maand |
| Domeinnaam | ~€10 | jaar |
| SSL Certificaat | Gratis | - |
| **Totaal** | **~€6.66** | **maand** |

## 🔐 Security Checklist

- ✅ Firewall enabled (alleen 22, 80, 443)
- ✅ SSL/TLS certificaten
- ✅ Strong auto-generated passwords
- ✅ MongoDB authentication
- ✅ Docker containers isolated
- ✅ Non-root users in containers
- ✅ Auto-renewal SSL certificates

## 📞 Hulp Nodig?

- 📖 Volledige documentatie: [README.md](README.md)
- 🐛 Issues: https://github.com/jouw-repo/issues
- 💬 Community: https://github.com/jouw-repo/discussions

---

**Succes met je deployment! 🚀**
