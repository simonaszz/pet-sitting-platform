# 📖 Pet-Sitting Platform - Dokumentų Rodyklė

Pilna projekto dokumentacija su patobulinimais.

---

## 🎯 Pradžia

Jei **pirmas kartas** čia:
1. **[QUICK_START.md](./QUICK_START.md)** ⚡ - Greitas startas (10 min)
2. **[README.md](./README.md)** 📚 - Projekto apžvalga
3. **[ROADMAP.md](./ROADMAP.md)** 🗺️ - Kaip pradėti kurti

---

## 📋 Pagrindiniai Dokumentai

### 1. **[SPECIFICATION.md](./SPECIFICATION.md)** ⭐
**Pilna techninė specifikacija**
- Produkto vizija
- Technologijų stack'as
- Rolės ir teisės
- Funkcionalumas (MVP)
- **Patobulinta DB schema** su visais fields
- Enums ir relationships

### 2. **[API_SPECIFICATION.md](./API_SPECIFICATION.md)** 🔌
**REST API dokumentacija**
- Visi endpoints (60+)
- Request/Response pavyzdžiai
- Query parameters
- Error responses
- Authorization rules

### 3. **[WEBSOCKET_SPECIFICATION.md](./WEBSOCKET_SPECIFICATION.md)** ⚡
**Socket.IO events specifikacija**
- Chat events (send_message, typing, read, etc.)
- Booking notifications
- Real-time updates
- Connection management
- Testing examples

### 4. **[SECURITY.md](./SECURITY.md)** 🔐
**Security best practices**
- Authentication (JWT, bcrypt, email verification)
- Authorization (RBAC)
- Input validation (SQL injection, XSS)
- Rate limiting
- File upload security
- Payment security (Stripe)
- HTTPS & headers
- Database security
- GDPR compliance

### 5. **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** 🔧
**Environment konfigūracija**
- Backend .env variables (30+)
- Frontend .env variables
- Docker setup
- Database commands
- Production deployment
- Common issues & solutions

### 6. **[ROADMAP.md](./ROADMAP.md)** 🗺️
**Implementation roadmap**
- 10 etapų (0-9 + Polish)
- Kiekvienas etapas su tasks
- Timeline: ~43-59 darbo dienų
- MVP scope definition
- Post-MVP features

### 7. **[FILE_STRUCTURE.md](./FILE_STRUCTURE.md)** 📂
**Projekto failų struktūra**
- Backend struktura (NestJS modules)
- Frontend struktura (React pages/components)
- Docker struktura
- Naming conventions

### 8. **[VALIDATION_SCHEMAS.md](./VALIDATION_SCHEMAS.md)** ✅
**Validation schemas**
- Backend DTOs (class-validator)
- Frontend schemas (Zod)
- Custom validators
- Error handling
- Usage examples

---

## 🆕 Pagrindiniai Patobulinimai

### Pridėta į DB Schema:

#### User Model:
- ✅ `avatar` - profilio nuotrauka
- ✅ `isBlocked` - admin blokavimas
- ✅ `isEmailVerified` - email verification
- ✅ `emailVerifyToken` - verification token
- ✅ `passwordResetToken` - reset token
- ✅ `passwordResetExp` - token expiry
- ✅ `lastLoginAt` - paskutinis prisijungimas
- ✅ `updatedAt` - timestamp

#### Pet Model:
- ✅ `photo` - pet nuotrauka
- ✅ `medicalNotes` - svarbūs veterinariniai duomenys
- ✅ `updatedAt` - timestamp

#### SitterProfile Model:
- ✅ `photos[]` - galerija
- ✅ `latitude/longitude` - geolocation
- ✅ `availability` (JSON) - darbo valandos
- ✅ `maxPets` - maksimalus skaičius vienu metu
- ✅ `experienceYears` - patirtis
- ✅ `avgRating` - cached rating
- ✅ `totalReviews` - count
- ✅ `responseTime` - average minutes
- ✅ `updatedAt` - timestamp

#### Visit Model:
- ✅ `totalPrice` - apskaičiuota kaina
- ✅ `paidAt` - mokėjimo data
- ✅ `canceledBy` - kas atšaukė
- ✅ `cancelReason` - priežastis
- ✅ `completedAt` - užbaigimo data
- ✅ `updatedAt` - timestamp

#### Message Model:
- ✅ `readAt` - kada perskaityta (ne tik boolean)
- ✅ `editedAt` - redagavimo data
- ✅ `deletedAt` - soft delete

#### Review Model:
- ✅ `response` - sitter atsakymas
- ✅ `respondedAt` - atsakymo data
- ✅ `isHidden` - admin moderation
- ✅ `createdAt/updatedAt` - timestamps

#### Naujos Lentelės:
- ✅ **Notification** - in-app pranešimai
- ✅ **Transaction** - mokėjimų istorija

### Pridėta į API:

#### Auth:
- ✅ Email verification endpoints
- ✅ Password reset flow
- ✅ Refresh token endpoint
- ✅ Resend verification

#### Payments:
- ✅ Payment intent creation
- ✅ Payment confirmation
- ✅ Refund endpoint
- ✅ Transaction history
- ✅ Webhook handling

#### Notifications:
- ✅ Get notifications
- ✅ Mark as read
- ✅ Mark all as read
- ✅ Unread count

#### Sitters:
- ✅ Availability check endpoint
- ✅ Distance-based search
- ✅ Photo management

#### Admin:
- ✅ Dashboard stats
- ✅ User management
- ✅ Sitter verification
- ✅ Review moderation

### Pridėta į Security:

- ✅ **Email verification** sistema
- ✅ **Password reset** su token expiry
- ✅ **Refresh tokens** mechanizmas
- ✅ **Input validation** (DTOs + Zod)
- ✅ **Rate limiting** specifikacija
- ✅ **File upload** security
- ✅ **XSS prevention**
- ✅ **CORS** konfigūracija
- ✅ **Helmet.js** headers
- ✅ **Payment security** (Stripe webhooks)
- ✅ **Logging** sistema (Winston)
- ✅ **GDPR** compliance

---

## 📊 Specifikacijos Palyginimas

| Feature | Originali Spec | Patobulinta Spec |
|---------|----------------|------------------|
| DB Tables | 8 | 10 (+2) |
| User Fields | 7 | 13 (+6) |
| API Endpoints | ~40 | 60+ (+20) |
| WebSocket Events | 8 | 15+ (+7) |
| Security Features | Basic | Advanced |
| Documentation | 1 file | 9 files |
| Validation Schemas | Partial | Complete |
| Environment Vars | ~15 | 40+ |

---

## 🎯 Kaip Naudotis

### Jei kuri MVP:
1. Skaityk **[QUICK_START.md](./QUICK_START.md)** - setup
2. Sekį **[ROADMAP.md](./ROADMAP.md)** - etapai
3. Naudok **[API_SPECIFICATION.md](./API_SPECIFICATION.md)** - endpoints
4. Tikrink **[SECURITY.md](./SECURITY.md)** - best practices

### Jei kuri konkretų feature:
1. Rask feature **[SPECIFICATION.md](./SPECIFICATION.md)**
2. Pažiūrėk API **[API_SPECIFICATION.md](./API_SPECIFICATION.md)**
3. Jei real-time - **[WEBSOCKET_SPECIFICATION.md](./WEBSOCKET_SPECIFICATION.md)**
4. Validation - **[VALIDATION_SCHEMAS.md](./VALIDATION_SCHEMAS.md)**

### Jei deploying:
1. **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** - production vars
2. **[SECURITY.md](./SECURITY.md)** - security checklist
3. **[README.md](./README.md)** - deployment guide

---

## 🔥 Kritiniai MVP Features

Būtinai reikalingi veikimui:

1. ✅ **Auth** + Email verification
2. ✅ **Payments** (Stripe integration)
3. ✅ **Real-time Chat** (Socket.IO)
4. ✅ **Notifications** (in-app + email)
5. ✅ **Geolocation** (distance search)
6. ✅ **File uploads** (avatars, photos)
7. ✅ **Email service** (verification, notifications)

---

## 📚 Papildoma Info

### Tehnologijos:
- **Backend:** NestJS + Prisma + PostgreSQL
- **Frontend:** React + Vite + Tailwind + shadcn/ui
- **Real-time:** Socket.IO + Redis
- **Payments:** Stripe
- **Email:** Nodemailer
- **Deployment:** Docker + Docker Compose

### Estimatai:
- **MVP:** 43-59 darbo dienų (~10-12 savaičių)
- **Solo developer:** ~3 mėnesiai part-time
- **Team (2-3):** ~1.5 mėnesio

### Testuojama:
- Unit tests (Vitest/Jest)
- Integration tests (Supertest)
- E2E tests (Playwright)
- Manual testing checklist

---

## ✅ Pre-Development Checklist

Prieš pradedant kurti:

- [ ] Perskaitei **SPECIFICATION.md**
- [ ] Supratai DB schema
- [ ] Susipažinai su API endpoints
- [ ] Žinai security requirements
- [ ] Turi development environment setup
- [ ] Supratai Roadmap etapus
- [ ] Pasirinkei su kurio etapo pradėti

---

## 🚀 Kas Toliau?

### Option A: Pradėti Kurti
Jei specifikacija tenkina:
1. Setup development environment ([QUICK_START.md](./QUICK_START.md))
2. Pradėk nuo Etapo 0 ([ROADMAP.md](./ROADMAP.md))
3. Sekį task'us iš roadmap

### Option B: Tikslinti Spec
Jei reikia patikslinti:
1. Identifikuok, ko trūksta
2. Papildyk specifikaciją
3. Update dokumentus

### Option C: Prototype
Greitai išbandyti koncepciją:
1. Minimal setup (auth + 1 feature)
2. Test flow
3. Iterate

---

## 📞 Support

Jei kyla klausimų:
1. **Ieškoti docs** - 9 dokumentai su visais atsakymais
2. **Check ROADMAP** - step-by-step guide
3. **Security checklist** - nepamirk security

---

<div align="center">
  <h2>🎉 Specifikacija Užbaigta!</h2>
  <p>Pilna, profesionali, production-ready specifikacija</p>
  <p><strong>Gali pradėti kurti MVP 🚀</strong></p>
</div>
