# 🔧 Environment Setup

## Environment Variables

### Backend `.env`

```bash
# ============================================
# SERVER
# ============================================
NODE_ENV=development # development | production | test
PORT=5000
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgresql://postgres:password@localhost:5432/petsitting_db?schema=public

# ============================================
# JWT
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m # 15 minutes
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d # 7 days

# ============================================
# BCRYPT
# ============================================
BCRYPT_SALT_ROUNDS=10

# ============================================
# EMAIL (SMTP)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false # true for 465, false for other ports
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@petsitting.com
EMAIL_FROM_NAME=Pet Sitting Platform

# ============================================
# STRIPE
# ============================================
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_CURRENCY=eur

# ============================================
# FILE UPLOAD
# ============================================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880 # 5MB in bytes
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf

# ============================================
# AWS S3 (Optional - for production)
# ============================================
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=petsitting-uploads
USE_S3=false # true in production

# ============================================
# REDIS (for Socket.IO adapter & caching)
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD= # empty for local dev
REDIS_URL=redis://localhost:6379

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX=5 # max login attempts per 15min

# ============================================
# CORS
# ============================================
CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=debug # error | warn | info | debug
LOG_FILE_PATH=./logs

# ============================================
# WEBSOCKET
# ============================================
WS_PORT=5000 # same as API port
WS_PATH=/socket.io

# ============================================
# GEOLOCATION
# ============================================
GEOCODING_API_KEY=your-google-maps-api-key # for address → lat/lng

# ============================================
# MONITORING (Optional)
# ============================================
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=development

# ============================================
# FEATURE FLAGS
# ============================================
ENABLE_EMAIL_VERIFICATION=true
ENABLE_PAYMENT=true
ENABLE_GEOLOCATION=true
```

---

### Frontend `.env`

```bash
# ============================================
# API
# ============================================
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000

# ============================================
# STRIPE
# ============================================
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# ============================================
# GOOGLE MAPS (Optional)
# ============================================
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# ============================================
# APP CONFIG
# ============================================
VITE_APP_NAME=Pet Sitting Platform
VITE_APP_URL=http://localhost:5173

# ============================================
# FEATURE FLAGS
# ============================================
VITE_ENABLE_GEOLOCATION=true
VITE_ENABLE_CHAT=true

# ============================================
# SENTRY (Optional)
# ============================================
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=development
```

---

## Docker Environment

### `docker-compose.yml` environment
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: petsitting_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: ../docker/backend.Dockerfile
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:password@postgres:5432/petsitting_db
      REDIS_URL: redis://redis:6379
    env_file:
      - ./backend/.env
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules
      - ./uploads:/app/uploads

  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/frontend.Dockerfile
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:5000/api
      VITE_WS_URL: http://localhost:5000
    env_file:
      - ./frontend/.env
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
```

---

## Setup Instructions

### 1. Prerequisites
```bash
# Install Node.js 20+
node --version # v20.x.x

# Install Docker & Docker Compose
docker --version
docker-compose --version

# Install pnpm (optional, recommended)
npm install -g pnpm
```

### 2. Clone & Install

```bash
# Create project directory
mkdir pet-sitting-platform
cd pet-sitting-platform

# Create backend
mkdir backend
cd backend
npm init -y
# Install dependencies (see package.json below)

# Create frontend
cd ..
mkdir frontend
npm create vite@latest . -- --template react-ts
# Install dependencies
```

### 3. Environment Files

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your values

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your values
```

### 4. Database Setup

```bash
# Start Postgres with Docker
docker-compose up -d postgres redis

# Run Prisma migrations
cd backend
npx prisma migrate dev --name init
npx prisma generate

# Seed database (optional)
npx prisma db seed
```

### 5. Run Development

```bash
# Option 1: With Docker
docker-compose up

# Option 2: Manually
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 6. Access Application

```
Frontend: http://localhost:5173
Backend API: http://localhost:5000/api
API Docs: http://localhost:5000/api/docs (Swagger)
```

---

## Database Commands

```bash
# Create new migration
npx prisma migrate dev --name your_migration_name

# Reset database
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Seed database
npx prisma db seed
```

---

## Testing Setup

### Backend Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### Frontend Tests

```bash
# Unit tests
npm run test

# E2E tests (Playwright)
npm run test:e2e

# UI mode
npm run test:ui
```

---

## Production Deployment

### Environment Variables (Production)

```bash
# Backend
NODE_ENV=production
DATABASE_URL=your-production-db-url
REDIS_URL=your-production-redis-url
JWT_SECRET=strong-random-secret-key
STRIPE_SECRET_KEY=sk_live_your_live_key
USE_S3=true
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
CORS_ORIGIN=https://yourdomain.com
SENTRY_DSN=your-production-sentry-dsn

# Frontend
VITE_API_URL=https://api.yourdomain.com/api
VITE_WS_URL=https://api.yourdomain.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
```

### Build Commands

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
# Serve dist/ folder with Nginx/Vercel/Netlify
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (min 32 characters)
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable email verification
- [ ] Use environment-specific Stripe keys
- [ ] Secure file uploads (validation, size limits)
- [ ] Enable logging and monitoring
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Use prepared statements (Prisma does this)
- [ ] Sanitize user inputs
- [ ] Set secure HTTP headers (Helmet.js)
- [ ] Implement CSRF protection if using cookies

---

## Common Issues & Solutions

### Issue: Database connection failed
```bash
# Check if Postgres is running
docker-compose ps

# Check DATABASE_URL format
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### Issue: Redis connection failed
```bash
# Check if Redis is running
docker-compose ps redis

# Test connection
redis-cli ping
```

### Issue: Port already in use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Issue: Prisma migration failed
```bash
# Reset database
npx prisma migrate reset

# Or manually drop database
psql -U postgres
DROP DATABASE petsitting_db;
CREATE DATABASE petsitting_db;
```

### Issue: CORS errors
```bash
# Check CORS_ORIGIN in backend .env
# Should match frontend URL exactly
CORS_ORIGIN=http://localhost:5173
```

---

## Useful Scripts

### Backend `package.json` scripts
```json
{
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "start:prod": "node dist/main",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts"
  }
}
```

### Frontend `package.json` scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx}\""
  }
}
```
