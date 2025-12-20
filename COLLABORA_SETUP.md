# Collabora CODE Setup

## Vereisten
- Docker Desktop geïnstalleerd en draaiende
- Node.js en npm

## Opstarten

### 1. Start Collabora CODE en Backend
```bash
docker-compose up -d
```

Dit start:
- Collabora CODE server op poort 9980
- Backend API server op poort 3001

### 2. Start de Frontend (in een nieuwe terminal)
```bash
npm run dev
```

De frontend draait op http://localhost:3000

## Gebruik

1. Open http://localhost:3000 in je browser
2. Upload een ODT bestand
3. Het bestand wordt geopend in de Collabora Online editor
4. Je kunt het bestand direct bewerken in de browser
5. Gebruik de Download knop om het bewerkte bestand op te slaan

## Stoppen

```bash
docker-compose down
```

## Problemen oplossen

### Collabora laadt niet
- Controleer of Docker draait: `docker ps`
- Bekijk Collabora logs: `docker logs collabora-code`
- Controleer of poort 9980 beschikbaar is

### Backend errors
- Controleer backend logs: `docker logs protel-backend`
- Zorg dat de uploads directory bestaat

### CORS errors
- Zorg dat de frontend op localhost:3000 draait
- Check de CORS instellingen in backend/src/server.ts

## Development

Om alleen de backend te starten zonder Docker:
```bash
cd backend
npm install
npm run dev
```

Collabora CODE moet dan wel nog via Docker draaien:
```bash
docker run -t -d -p 9980:9980 -e "domain=localhost" \
  -e "username=admin" -e "password=admin" \
  --cap-add MKNOD collabora/code:latest
```
