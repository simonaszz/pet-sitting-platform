# 🔄 .env Migration - Root Centralization

**Data:** 2025-12-10  
**Change:** Environment variables iškelti į root katalogą

---

## ✅ Kas padaryta

### 1. Sukurtas centralizuotas .env
- ✅ `.env.example` root kataloge su **visomis** konfigūracijomis
- ✅ Backend kintamieji (NODE_ENV, PORT, DATABASE_URL, JWT, etc.)
- ✅ Frontend kintamieji (VITE_API_URL, VITE_WS_URL, etc.)
- ✅ Database kintamieji (POSTGRES_USER, POSTGRES_PASSWORD, etc.)

### 2. Docker Compose atnaujintas
- ✅ Visi servisai naudoja `env_file: - .env`
- ✅ Postgres gauna POSTGRES_* variables
- ✅ Backend gauna visus backend kintamuosius
- ✅ Frontend gauna VITE_* kintamuosius

### 3. Dokumentacija atnaujinta
- ✅ `ENV_CONFIGURATION.md` - pilnas guide
- ✅ `FIRST_RUN.md` - atnaujintas setup
- ✅ `DOCKER_SETUP.md` - atnaujintos instrukcijos  
- ✅ `README.md` - pridėta info apie .env

### 4. Prisma config
- ✅ `backend/prisma.config.ts` - komentaras apie root .env

---

## 📂 Nauja struktūra

```
pet-sitting-platform/
├── .env                    ← VIENAS failas VISKAM
├── .env.example            ← Template su visais kintamaisiais
├── .gitignore              ← .env ignoruojamas
├── docker-compose.yml      ← Naudoja env_file: - .env
│
├── backend/
│   ├── .env.example       ← (deprecated, nenaudoti)
│   └── src/...
│
└── frontend/
    ├── .env.example       ← (deprecated, nenaudoti)
    └── src/...
```

---

## 🎯 Kodėl?

### ✅ Privalumai

1. **Centralizuota konfigūracija**
   - Viena vieta visoms config
   - Lengviau valdyti

2. **Docker Compose native**
   - Automatiškai skaito root .env
   - Nereikia copy-paste

3. **Production-ready**
   - Vienas .env production
   - Secret management paprastesnis

4. **Mažiau klaidų**
   - Nėra sinchronizacijos problemų
   - Vienas source of truth

### ❌ Seni būdai (deprecated)

**Prieš:**
```
backend/.env      ← Backend config
frontend/.env     ← Frontend config
```
❌ 2 failai, galimi skirtumai  
❌ Reikia copy-paste tarp aplinkų  
❌ Docker neautomatizuoja

**Dabar:**
```
.env              ← Vienas failas viskam
```
✅ 1 failas  
✅ Docker Compose automatinis  
✅ Vienas source of truth

---

## 🚀 Kaip naudoti

### Setup

```bash
# Root directory
cp .env.example .env

# Edit jei reikia
nano .env

# Docker Compose nuskaitys automatiškai
docker-compose up -d
```

### Backend gauna:
```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

### Frontend gauna:
```bash
VITE_API_URL=http://localhost/api
VITE_WS_URL=http://localhost
```

### Database gauna:
```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=petsitting_db
```

---

## 🔍 Kaip patikrinti

### 1. Docker Compose config
```bash
# Patikrink ar nuskaito .env
docker-compose config

# Turėtum matyti environment variables
```

### 2. Backend container
```bash
# Įeik į containerį
docker exec -it petsitting-backend sh

# Patikrink env
echo $DATABASE_URL
echo $JWT_SECRET

# Exit
exit
```

### 3. Frontend container
```bash
# Įeik į containerį
docker exec -it petsitting-frontend sh

# Patikrink env (Vite)
npm run dev

# Turėtų build time injected VITE_* variables
```

---

## 📝 Migration Checklist

Jei migravai iš senų .env:

- [ ] Backup `backend/.env` ir `frontend/.env`
- [ ] Copy visus kintamuosius į root `.env`
- [ ] Patikrink ar `docker-compose.yml` turi `env_file: - .env`
- [ ] Restart containers: `docker-compose down && docker-compose up -d`
- [ ] Verify su `docker-compose config`
- [ ] Test backend: `curl http://localhost/api`
- [ ] Test frontend: `open http://localhost`
- [ ] Delete old `backend/.env` ir `frontend/.env` (optional)

---

## 🔒 Security Reminders

### ✅ DO:
- ✅ `.env` yra `.gitignore`
- ✅ Share `.env.example` (be secrets)
- ✅ Different secrets per environment

### ❌ DON'T:
- ❌ **NEVER** commit `.env`
- ❌ **NEVER** share production secrets
- ❌ **NEVER** hardcode secrets

---

## 📚 Dokumentacija

Pilnas guide: [ENV_CONFIGURATION.md](./ENV_CONFIGURATION.md)

**Quick links:**
- [DOCKER_SETUP.md](./DOCKER_SETUP.md) - Docker guide
- [FIRST_RUN.md](./FIRST_RUN.md) - Quick start
- [README.md](./README.md#-greitas-startas) - Greitas startas

---

**✅ Migration completed! Vienas .env failas = paprastesnis life! 🎉**
