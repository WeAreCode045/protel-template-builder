# ProTel Template Builder

ODT template editor met Collabora Online, MongoDB en complete deployment automation.

## ✨ Features

- 📝 ODT bestanden uploaden en bewerken
- ✏️ Collabora Online (volledige LibreOffice Online)
- 💾 MongoDB database voor opslag
- 🔄 Automatische deployment met Docker
- 🔒 SSL/TLS ondersteuning
- 📱 Responsive frontend

## 🚀 Quick Deploy (VPS)

### 1. VPS Aanmaken
- **Provider:** Hetzner, DigitalOcean, of andere
- **OS:** Ubuntu 22.04 LTS
- **Specs:** Minimaal 4GB RAM (CX21 of hoger)

### 2. DNS Configureren
Voeg deze A-records toe bij je DNS provider:
```
yourdomain.com     -> VPS-IP-ADDRESS
www.yourdomain.com -> VPS-IP-ADDRESS
```

**Eén domein voor alles:**
- Frontend: `https://yourdomain.com`
- Backend: `https://yourdomain.com/api`
- Collabora: `https://yourdomain.com/collabora`

### 3. Deployment Script Draaien

SSH naar je VPS en voer dit uit:

```bash
# Clone repository
git clone https://github.com/yourusername/protel-template-builder.git
cd protel-template-builder

# Run deployment script (als root)
sudo bash deploy.sh
```

Het script installeert automatisch:
- ✅ Docker & Docker Compose
- ✅ MongoDB database
- ✅ Collabora Online
- ✅ Backend API
- ✅ Frontend applicatie
- ✅ Nginx reverse proxy
- ✅ Firewall configuratie
- ✅ SSL certificaten (optioneel)

### 4. Environment Variables Aanpassen

Tijdens deployment word je gevraagd om `.env` aan te passen:

```bash
nano .env
```

Pas minimaal aan:
```env
DOMAIN=yourdomain.com
```

Wachtwoorden worden automatisch gegenereerd! Bewaar deze goed.

### 5. Klaar! 🎉

Je applicatie draait nu op:
- Frontend: `https://app.yourdomain.com`
- Backend API: `https://api.yourdomain.com`
- Collabora: `https://collabora.yourdomain.com`

## 💻 Local Development

### Vereisten
- Docker Desktop
- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Start services
docker-compose -f docker-compose.dev.yml up -d

# Start backend (andere terminal)
cd backend && npm run dev

# Start frontend (andere terminal)
npm run dev
```

Open http://localhost:3000

## 🔄 Updates Deployen

```bash
# SSH naar VPS
ssh root@your-vps-ip

# Navigate to project
cd /path/to/protel-template-builder

# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## 📊 Monitoring

### Logs bekijken
```bash
# Alle services
docker-compose logs -f

# Specifieke service
docker-compose logs -f backend
docker-compose logs -f collabora
docker-compose logs -f mongodb
```

### Service status
```bash
docker-compose ps
```

### Health checks
```bash
curl http://localhost/health        # Nginx
curl http://localhost:3001/health   # Backend
```

## 🗄️ Database

### MongoDB toegang
```bash
# Via Docker
docker exec -it protel-mongodb mongosh -u admin -p

# Connection string (from backend)
mongodb://admin:password@mongodb:27017/protel?authSource=admin
```

### Backup maken
```bash
docker exec protel-mongodb mongodump --out=/backup
docker cp protel-mongodb:/backup ./backup-$(date +%Y%m%d)
```

## 🔒 Beveiliging

### Firewall
Alleen poorten 22 (SSH), 80 (HTTP) en 443 (HTTPS) zijn open.

### SSL Certificaten
Automatisch via Let's Encrypt:
```bash
certbot --nginx -d app.yourdomain.com -d api.yourdomain.com -d collabora.yourdomain.com
```

Auto-renewal is standaard geconfigureerd.

### Wachtwoorden
- Worden automatisch gegenereerd tijdens deployment
- Staan in `.env` file (niet in git)
- Backup deze file veilig!

## 📁 Project Structuur

```
protel-template-builder/
├── frontend/              # React + Vite
│   ├── src/
│   ├── Dockerfile
│   └── nginx.conf
├── backend/               # Express API
│   ├── src/
│   ├── server.cjs
│   ├── Dockerfile
│   └── uploads/
├── nginx/                 # Reverse proxy config
│   ├── nginx.conf
│   └── conf.d/
├── docker-compose.yml     # Production setup
├── deploy.sh              # Deployment script
└── .env.example           # Environment template
```

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Backend:** Node.js, Express
- **Database:** MongoDB 7
- **Editor:** Collabora Online (LibreOffice)
- **Proxy:** Nginx
- **Deployment:** Docker, Docker Compose

## 🐛 Troubleshooting

### Services starten niet
```bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Restart services
docker-compose restart
```

### Collabora verbinding mislukt
```bash
# Check Collabora logs
docker logs protel-collabora

# Verify discovery endpoint
curl http://localhost:9980/hosting/discovery
```

### Database verbinding mislukt
```bash
# Check MongoDB is running
docker ps | grep mongodb

# Test connection
docker exec protel-mongodb mongosh --eval "db.adminCommand('ping')"
```

### Nginx errors
```bash
# Test nginx config
docker exec protel-nginx nginx -t

# Reload nginx
docker-compose restart nginx
```

## 📝 Environment Variables

Zie [`.env.example`](.env.example) voor alle beschikbare opties.

### Belangrijkste variabelen:
- `DOMAIN` - Je domeinnaam
- `MONGO_PASSWORD` - MongoDB admin wachtwoord
- `COLLABORA_PASS` - Collabora admin wachtwoord
- `JWT_SECRET` - Voor user authentication (toekomstig)

## 🤝 Contributing

1. Fork de repository
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je changes (`git commit -m 'Add some AmazingFeature'`)
4. Push naar de branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request

## 📄 License

MIT License - zie LICENSE file voor details

## 🆘 Support

- 📖 [Full Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/yourusername/protel-template-builder/issues)
- 💬 [Discussions](https://github.com/yourusername/protel-template-builder/discussions)

## ⚡ Quick Commands Cheat Sheet

```bash
# Deploy/Update
sudo bash deploy.sh                    # Fresh deployment
git pull && docker-compose up -d --build  # Update existing

# Monitoring
docker-compose ps                      # Status
docker-compose logs -f                 # All logs
docker-compose logs -f backend         # Specific service

# Maintenance
docker-compose restart                 # Restart all
docker-compose down                    # Stop all
docker-compose up -d                   # Start all

# Database
docker exec -it protel-mongodb mongosh # MongoDB shell
docker-compose exec backend npm run migrate  # Run migrations

# SSL
certbot renew                          # Renew certificates
certbot certificates                   # List certificates
```

---

Made with ❤️ for ProTel
