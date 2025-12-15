# ⚡ Quick Start Guide

Greitas pradžios vadovas - nuo nulio iki veikiančios aplikacijos per 10 minučių.

---

## 📋 Prieš pradedant

Įsitikink, kad turi:
- ✅ Node.js 20+ (`node --version`)
- ✅ Docker Desktop
- ✅ Git
- ✅ Tekstų redaktorius (VS Code rekomenduojama)

---

## 🚀 5 Žingsniai į Veikiančią App

### 1️⃣ Clone ir Setup (2 min)

```bash
# Clone projekto template
git clone https://github.com/yourusername/pet-sitting-platform.git
cd pet-sitting-platform

# Arba jei kuri naują - inicializuok git
git init
```

### 2️⃣ Docker Compose (1 min)

```bash
# Startuok visą stack vienu komanda
docker-compose up -d

# Tai pakels:
# ✅ PostgreSQL (port 5432)
# ✅ Redis (port 6379)
# ✅ Backend (port 5000)
# ✅ Frontend (port 5173)
```

### 3️⃣ Database Setup (2 min)

```bash
# Įeik į backend containerį
docker exec -it petsitting-backend sh

# Paleisk migraciją
npx prisma migrate dev --name init

# Seed duomenimis (optional)
npx prisma db seed

# Exit container
exit
```

### 4️⃣ Open Browser (1 min)

```bash
# Frontend
open http://localhost:5173

# Backend API
open http://localhost:5000/api

# API Docs (Swagger)
open http://localhost:5000/api/docs

# Prisma Studio (DB viewer)
docker exec -it petsitting-backend npx prisma studio
```

### 5️⃣ Test Login (1 min)

Registruokis arba naudok seed vartotoją:
```
Email: owner@test.com
Password: Test123!@#
```

**🎉 Veikia! Galima kurti.**

---

## 🛠 Development Workflow

### Option 1: Docker (rekomenduojama pradedantiesiems)

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop everything
docker-compose down

# Restart single service
docker-compose restart backend
```

### Option 2: Manual (geresnis development)

```bash
# Terminal 1 - PostgreSQL & Redis
docker-compose up -d postgres redis

# Terminal 2 - Backend
cd backend
npm install
npm run dev

# Terminal 3 - Frontend
cd frontend
npm install
npm run dev

# Terminal 4 - Prisma Studio (optional)
cd backend
npx prisma studio
```

---

## 📝 Environment Variables

### Backend `.env`

Paprasčiausia konfigūracija:
```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/petsitting_db
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_REFRESH_SECRET=another-super-secret-key
FRONTEND_URL=http://localhost:5173

# Email (optional MVP)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Stripe Test
STRIPE_SECRET_KEY=sk_test_your_key
```

### Frontend `.env`

```bash
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

**💡 Tip:** Copy iš `.env.example` failų

---

## 🧪 Quick Test

### 1. Backend API Test
```bash
# Test endpoint
curl http://localhost:5000/api/health

# Response: { "status": "ok" }
```

### 2. Frontend Test
```
Atidaryk http://localhost:5173
Turėtum matyti landing page
```

### 3. Database Test
```bash
# Prisma Studio
cd backend
npx prisma studio

# Browser atsidarys su DB viewer
```

---

## 🔧 Common Issues & Fixes

### Port already in use
```bash
# Find and kill process
lsof -i :5000
kill -9 <PID>

# Arba pakeisk portą .env faile
```

### Database connection error
```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Node modules error
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Docker error
```bash
# Restart Docker Desktop
# Arba reset containers
docker-compose down -v
docker-compose up -d
```

---

## 📚 Next Steps

Po sėkmingo setup'o:

1. **Perskaityk** [SPECIFICATION.md](./SPECIFICATION.md)
2. **Susipažink** su [API_SPECIFICATION.md](./API_SPECIFICATION.md)
3. **Sekį** [ROADMAP.md](./ROADMAP.md)
4. **Pradėk kurti** pagal Etapą 0

---

## 🎯 Development Checklist

Prieš pradedant kurti features:

- [ ] Docker veikia
- [ ] Database prisijungta
- [ ] Frontend rodo landing page
- [ ] Backend API /health veikia
- [ ] Prisma Studio atsidaro
- [ ] Git repository inicializuotas
- [ ] .env failai sukonfigūruoti
- [ ] Galiu sukurti naują branch

---

## 💡 Pro Tips

### VS Code Extensions
```
- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense
- Docker
- GitLens
- Thunder Client (API testing)
```

### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Git Setup
```bash
# Sukurk initial commit
git add .
git commit -m "Initial commit"

# Sukurk development branch
git checkout -b develop

# Feature branch pattern
git checkout -b feature/auth-system
```

### Database GUI Options
```
1. Prisma Studio (built-in)
2. TablePlus
3. DBeaver
4. pgAdmin
```

---

## 🐛 Debug Mode

### Backend
```typescript
// src/main.ts
if (process.env.NODE_ENV === 'development') {
  app.enableCors({ origin: '*' }); // Dev only!
}
```

### Frontend
```typescript
// Enable React DevTools
console.log('Development mode:', import.meta.env.DEV);
```

### Database
```bash
# Enable query logging
DATABASE_URL="...?connection_limit=5&pool_timeout=0&log=query"
```

---

## 📊 Monitoring

### Development Tools
```bash
# Backend health
http://localhost:5000/api/health

# Database
http://localhost:5555 (Prisma Studio)

# Frontend
http://localhost:5173

# Redis
redis-cli ping
```

### Logs
```bash
# Backend logs
tail -f backend/logs/combined.log

# Docker logs
docker-compose logs -f --tail=100
```

---

## 🎓 Learning Resources

- **NestJS:** https://docs.nestjs.com
- **Prisma:** https://www.prisma.io/docs
- **React:** https://react.dev
- **Tailwind:** https://tailwindcss.com/docs
- **Socket.IO:** https://socket.io/docs
- **Stripe:** https://stripe.com/docs

---

## 🤝 Need Help?

1. **Check docs:** Visi [dokumentai](./README.md#-dokumentacija)
2. **Search issues:** [GitHub Issues](https://github.com/yourusername/pet-sitting-platform/issues)
3. **Ask community:** Discord/Slack
4. **Debug:** Naudok VS Code debugger

---

## ✅ Ready to Code?

Kai viskas veikia:

```bash
# Sukurk feature branch
git checkout -b feature/your-feature-name

# Pradėk kurti
code .

# Happy coding! 🚀
```

---

<div align="center">
  <p><strong>Sėkmės kuriant! 🎉</strong></p>
  <p>Jei užstrigai - žiūrėk dokumentaciją arba klausk community</p>
</div>
