# 🔐 Environment Configuration

Projektas naudoja **vieną centralizuotą `.env` failą** root kataloge.

---

## 📂 Failų struktūra

```
pet-sitting-platform/
├── .env                  # ← VIENAS failas visoms konfigūracijoms
├── .env.example          # ← Template
├── docker-compose.yml    # Skaito .env automatiškai
├── backend/
│   ├── .env.example     # (deprecated - nenaudoti)
│   └── prisma.config.ts  # Naudoja DATABASE_URL iš root .env
└── frontend/
    └── .env.example     # (deprecated - nenaudoti)
```

---

## 🎯 Kaip veikia

### Docker Compose + .env

Docker Compose **automatiškai** skaito `.env` failą iš root direktorijos:

```yaml
# docker-compose.yml
services:
  postgres:
    env_file:
      - .env              # ← Injektuoja visus kintamuosius
    environment:
      POSTGRES_USER: ${POSTGRES_USER}    # ← Paima iš .env
```

**Rezultatas:** Visi servisai (backend, frontend, postgres, redis) gauna environment variables iš **vieno** failo.

---

## 📝 .env Struktūra

### Backend kintamieji
```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
REDIS_URL=...
SMTP_HOST=...
STRIPE_SECRET_KEY=...
```

### Frontend kintamieji (Vite)
```bash
VITE_API_URL=http://localhost/api
VITE_WS_URL=http://localhost
VITE_STRIPE_PUBLISHABLE_KEY=...
```

**⚠️ Svarbu:** Frontend kintamieji TURI prasidėti su `VITE_` - tai Vite reikalavimas.

### Database kintamieji
```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=petsitting_db
```

---

## 🔄 Kaip naudoti

### 1. Development su Docker

```bash
# 1. Sukurti .env
cp .env.example .env

# 2. Redaguoti jei reikia
nano .env

# 3. Paleisti Docker
docker-compose up -d

# ✅ Visi servisai gauna kintamuosius automatiškai
```

### 2. Local Development (be Docker)

Jei dirbi lokaliai be Docker, reikia load'inti .env:

**Backend:**
```bash
cd backend

# Option 1: dotenv-cli
npm install -g dotenv-cli
dotenv -e ../.env -- npm run dev

# Option 2: export manually
export $(cat ../.env | xargs)
npm run dev
```

**Frontend:**
```bash
cd frontend

# Vite automatiškai ieško .env root kataloge
npm run dev
```

---

## 🚀 Production

### Option 1: Docker Compose Production

```bash
# Sukurti production .env
cp .env.example .env.production

# Edit su production values
nano .env.production

# Deploy
docker-compose --env-file .env.production up -d
```

### Option 2: Cloud Platform (Vercel, Railway, etc.)

Cloud platformose environment variables setiname per UI:

**Backend (Railway, Render):**
- Set kintamuosius per platform dashboard
- **NEGALI** commit'inti `.env` į git

**Frontend (Vercel, Netlify):**
- Set `VITE_*` kintamuosius per platform UI
- Build time bus injected

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Keep `.env` in `.gitignore`
- ✅ Use strong secrets (min 32 characters)
- ✅ Different secrets for dev/staging/prod
- ✅ Share `.env.example` (be secret values)
- ✅ Use secret management tools (Vault, AWS Secrets Manager)

### ❌ DON'T:
- ❌ **NEVER** commit `.env` to git
- ❌ **NEVER** hardcode secrets in code
- ❌ **NEVER** share production secrets via Slack/email
- ❌ **NEVER** use same secrets for dev and prod

---

## 📋 Environment Variables Reference

### Required (Backend)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development`, `production` |
| `PORT` | Backend port | `5000` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT signing secret | Random 32+ chars |
| `JWT_REFRESH_SECRET` | Refresh token secret | Random 32+ chars |

### Required (Frontend)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost/api` |
| `VITE_WS_URL` | WebSocket URL | `http://localhost` |

### Optional (Backend)

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `SMTP_HOST` | Email server | - |
| `STRIPE_SECRET_KEY` | Stripe API key | - |
| `MAX_FILE_SIZE` | Max upload size | `10485760` (10MB) |

### Optional (Frontend)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key | - |
| `VITE_APP_NAME` | App name | `PetSitting Platform` |

---

## 🧪 Testing Different Environments

### Development
```bash
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/petsitting_dev
```

### Test/CI
```bash
NODE_ENV=test
DATABASE_URL=postgresql://localhost:5432/petsitting_test
```

### Production
```bash
NODE_ENV=production
DATABASE_URL=postgresql://prod-db:5432/petsitting_prod
JWT_SECRET=<strong-random-secret>
```

---

## 🔍 Troubleshooting

### Environment variables nepasiekiami

**Problema:** Backend negauna DATABASE_URL

**Sprendimas:**
```bash
# 1. Patikrink ar .env egzistuoja
ls -la .env

# 2. Patikrink ar docker-compose skaito
docker-compose config | grep DATABASE_URL

# 3. Restart containers
docker-compose down
docker-compose up -d
```

### Vite negauna VITE_* variables

**Problema:** `import.meta.env.VITE_API_URL` yra undefined

**Sprendimas:**
```bash
# 1. Patikrink ar kintamasis prasideda su VITE_
echo $VITE_API_URL

# 2. Restart Vite dev server
docker-compose restart frontend

# 3. Clear cache
rm -rf frontend/node_modules/.vite
```

### Production secrets

**Problema:** Kaip valdyti production secrets?

**Sprendimas:**
- Use **AWS Secrets Manager**, **HashiCorp Vault**, arba **Docker Secrets**
- Niekada nesaugok production `.env` git'e
- Use CI/CD platformos secret management

---

## 📚 Additional Resources

- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
- [12 Factor App Config](https://12factor.net/config)

---

**✅ Vienas .env failas = paprastesnis deployment + mažiau klaidų!**
