# 🚀 Pirmas Paleidimas - Quick Test

## Kas jau padaryta

✅ **Backend (NestJS)**
- Projektas sukurtas su visomis dependencies
- Prisma ORM sukonfigūruotas
- Database schema apibrėžta (9 modeliai)
- ConfigModule, DatabaseModule ready
- CORS, validation, global `/api` prefix

✅ **Frontend (React + Vite)**
- Projektas sukurtas su TypeScript
- Tailwind CSS sukonfigūruotas
- Visos dependencies įdiegtos (React Router, Axios, Zustand, etc.)

✅ **Docker + Nginx**
- Docker Compose su 5 servisais:
  - PostgreSQL 15
  - Redis 7
  - Backend (NestJS)
  - Frontend (React/Vite)
  - Nginx (reverse proxy)
- Nginx routing:
  - `/` → Frontend
  - `/api` → Backend
  - `/socket.io` → Backend WebSocket

---

## 🎯 Testuoti Setup

### 1. Sukurti .env failą (Root kataloge)

**Vienas .env failas visiems servisams:**

```bash
# Root directory
cp .env.example .env

# Arba sukurti rankiniu būdu:
cat > .env << 'EOF'
# Environment
NODE_ENV=development

# Backend
PORT=5000
FRONTEND_URL=http://localhost

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=petsitting_db
DATABASE_URL=postgresql://postgres:password@postgres:5432/petsitting_db

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=dev-jwt-secret-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=dev-refresh-secret-key-change-in-production-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost

# Frontend (Vite)
VITE_API_URL=http://localhost/api
VITE_WS_URL=http://localhost
VITE_APP_NAME=PetSitting Platform
EOF
```

**📝 Note:** Docker Compose automatiškai skaito `.env` iš root direktorijos ir injektuoja kintamuosius į visus servisus.

### 2. Paleisti Docker Stack

```bash
# Убедись что Docker Desktop работает
docker-compose up -d

# Patikrink ar visi servisai veikia
docker-compose ps

# Turėtum matyti:
# - petsitting-postgres (healthy)
# - petsitting-redis (healthy)
# - petsitting-backend (up)
# - petsitting-frontend (up)
# - petsitting-nginx (up)
```

### 3. Sukurti Database Schema

```bash
# Įeik į backend containerį
docker exec -it petsitting-backend sh

# Paleisk Prisma migration
npx prisma migrate dev --name init

# Patikrink ar veikia
npx prisma studio

# Exit
exit
```

### 4. Patikrinti ar veikia

**Atidaryti browser:**
- http://localhost - Frontend (per Nginx)
- http://localhost/api - Backend API (turėtum matyti "Hello World!")
- http://localhost/health - Nginx health check

**Patikrinti logs:**
```bash
# Visi servisai
docker-compose logs -f

# Arba individualiai
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

---

## 🐛 Jei kas nors neveikia

### Port conflict
```bash
# Check kas naudoja port 80
lsof -i :80

# Sustabdyk kitus servisus arba pakeisk portą docker-compose.yml:
ports:
  - '8080:80'
```

### Database connection error
```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Rebuild everything
```bash
# Stop ir išvalyk
docker-compose down -v

# Rebuild ir restart
docker-compose up -d --build
```

### See all logs
```bash
docker-compose logs --tail=100 -f
```

---

## ✅ Kai viskas veikia

Tu matai:
- ✅ Frontend rodo React default page per http://localhost
- ✅ Backend atsako per http://localhost/api
- ✅ Nginx health check: http://localhost/health → "healthy"
- ✅ Prisma Studio atsidaro (jei paleidai)
- ✅ Visi containeriai "Up" state

**Tada galima pradėti kurti!** 🎉

### Kitas žingsnis: Auth Module

```bash
# Sukurti auth modulį
cd backend
npx nest g module modules/auth
npx nest g service modules/auth
npx nest g controller modules/auth
```

Arba palaukt kol aš sukursiu visą Auth sistemą! 😊

---

## 📝 Useful Commands

```bash
# Restart viską
docker-compose restart

# Stop viską
docker-compose down

# Naujos dependencies backend
docker exec -it petsitting-backend npm install <package>

# Naujos dependencies frontend
docker exec -it petsitting-frontend npm install <package>

# Backend shell
docker exec -it petsitting-backend sh

# Database CLI
docker exec -it petsitting-postgres psql -U postgres -d petsitting_db

# Redis CLI
docker exec -it petsitting-redis redis-cli
```

---

**Sėkmės su testavimu! Jei viskas veikia - ready to code! 🚀**
