# 🐳 Docker Setup Guide

Visas projektas veikia Docker aplinkoje su Nginx reverse proxy.

## 📋 Architektūra

```
┌─────────────────────────────────────────────┐
│           Nginx (Port 80)                    │
│        Reverse Proxy + Load Balancer        │
└─────────────┬───────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌────────┐          ┌──────────┐
│Backend │          │ Frontend │
│:5000   │          │ :5173    │
│NestJS  │          │ React    │
└────┬───┘          └──────────┘
     │
     ▼
┌──────────┐
│PostgreSQL│
│  :5432   │
└──────────┘
```

## 🚀 Quick Start

### 1. Sukurti .env failą

**Vienas .env failas root kataloge:**
```bash
# Root directory
cp .env.example .env

# Redaguok .env su reikiamomis reikšmėmis
nano .env
```

**Kodėl root kataloge?**
- ✅ Docker Compose automatiškai skaito `.env` iš root
- ✅ Vieta visoms konfigūracijoms (Backend + Frontend + DB)
- ✅ Paprasčiau valdyti environment variables
- ✅ Production-ready approach

### 2. Paleisti visą stack

```bash
# Root directory
docker-compose up -d
```

### 3. Sukurti database schema

```bash
# Įeik į backend containerį
docker exec -it petsitting-backend sh

# Paleisk migrations
npx prisma migrate dev --name init

# (Optional) Seed data
npx prisma db seed

# Exit
exit
```

### 4. Atidaryti aplikaciją

```
http://localhost        - Frontend (per Nginx)
http://localhost/api    - Backend API (per Nginx)
http://localhost/health - Health check
```

## 📝 Docker Commands

### Visa stack

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Rebuild services
docker-compose up -d --build

# Remove everything including volumes
docker-compose down -v
```

### Individual services

```bash
# Restart single service
docker-compose restart backend
docker-compose restart frontend
docker-compose restart nginx

# Stop single service
docker-compose stop backend

# Start single service
docker-compose start backend
```

### Database

```bash
# Access PostgreSQL
docker exec -it petsitting-postgres psql -U postgres -d petsitting_db

# Backup database
docker exec petsitting-postgres pg_dump -U postgres petsitting_db > backup.sql

# Restore database
docker exec -i petsitting-postgres psql -U postgres petsitting_db < backup.sql
```

### Redis

```bash
# Access Redis CLI
docker exec -it petsitting-redis redis-cli

# Check Redis
docker exec -it petsitting-redis redis-cli ping
```

## 🔍 Debugging

### View container status

```bash
docker-compose ps
```

### Check logs

```bash
# All services
docker-compose logs --tail=100

# Specific service
docker-compose logs -f backend --tail=50
```

### Execute commands in container

```bash
# Backend
docker exec -it petsitting-backend sh
npm run test

# Frontend
docker exec -it petsitting-frontend sh
npm run build
```

### Network inspection

```bash
# List networks
docker network ls

# Inspect project network
docker network inspect pet-sitting-platform_default
```

## 🛠 Development Workflow

### Option 1: Full Docker (rekomenduojama)

```bash
# Startuok viską
docker-compose up -d

# Code changes auto-reload (hot reload)
# - Backend: nodemon
# - Frontend: Vite HMR
```

### Option 2: Hybrid (DB Docker, Code local)

```bash
# Startuok tik databases
docker-compose up -d postgres redis

# Terminal 1 - Backend locally
cd backend
npm install
npm run dev

# Terminal 2 - Frontend locally
cd frontend
npm install
npm run dev
```

## 🔧 Nginx Configuration

### Proxy Rules

- `/` → Frontend (React)
- `/api` → Backend (NestJS)
- `/socket.io` → Backend WebSocket
- `/uploads` → Backend static files
- `/ws` → Frontend HMR WebSocket (Vite)

### Edit nginx config

```bash
# Redaguok
nano docker/nginx/conf.d/default.conf

# Reload nginx
docker-compose restart nginx
```

## 📊 Performance

### Check resource usage

```bash
docker stats
```

### Optimize images

```bash
# Remove unused images
docker image prune

# Remove unused containers
docker container prune

# Remove everything unused
docker system prune -a
```

## 🔐 Production Considerations

Kai deployini production:

1. **SSL/HTTPS**: Pridėk SSL certificates į nginx
2. **Environment**: Pakeisk `NODE_ENV=production`
3. **Secrets**: Naudok Docker secrets arba vault
4. **Scaling**: Naudok docker-compose scale arba Kubernetes
5. **Monitoring**: Pridėk Prometheus + Grafana
6. **Backups**: Automatizuok database backups

## ❌ Common Issues

### Port already in use

```bash
# Check what's using port 80
lsof -i :80

# Use different port in docker-compose.yml
ports:
  - '8080:80'
```

### Permission denied

```bash
# Fix permissions
sudo chown -R $USER:$USER .
```

### Database connection error

```bash
# Check if postgres is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

### Nginx 502 Bad Gateway

```bash
# Check if backend/frontend are running
docker-compose ps

# Check nginx config syntax
docker exec petsitting-nginx nginx -t

# Reload nginx
docker-compose restart nginx
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Prisma with Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)

---

**Sėkmės su Docker! 🚀**
