# 🐾 Pet-Sitting Platform

> Pilna pet-sitting platforma su real-time komunikacija, mokėjimais ir booking sistema.
> 
> **🐳 Visas projektas veikia Docker aplinkoje su Nginx reverse proxy**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://nginx.org/)

---

## 📋 Turinys

- [Apie projektą](#-apie-projektą)
- [Funkcionalumas](#-funkcionalumas)
- [Technologijos](#-technologijos)
- [Dokumentacija](#-dokumentacija)
- [Greitas startas](#-greitas-startas)
- [Projekto struktūra](#-projekto-struktūra)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Prisidėjimas](#-prisidėjimas)
- [Licencija](#-licencija)

---

## 🎯 Apie projektą

Pet-sitting platforma, skirta sujungti gyvūnų savininkus su patikimais prižiūrėtojais. Platforma siūlo:

- 🔍 **Paiešką** - rask sitterius pagal vietovę, kainą ir reitingą
- 📅 **Booking sistemą** - rezervuok vizitus su automatine kainų kalkuliacija
- 💬 **Real-time chat** - bendrauk su sitteriais/owners tiesiogiai
- 💳 **Mokėjimus** - saugūs mokėjimai per Stripe
- ⭐ **Reviews** - vertink ir rašyk atsiliepimus
- 📸 **Foto galerijas** - dalinskis vizitų nuotraukomis
- 🔔 **Pranešimus** - gauk real-time notifications

---

## ✨ Funkcionalumas

### 🔐 Autentifikacija
- ✅ Registracija su email verification
- ✅ Prisijungimas (JWT)
- ✅ Slaptažodžio atkūrimas
- ✅ Refresh tokens
- ✅ Role-based access (OWNER, SITTER, BOTH, ADMIN)

### 👤 Profilis
- ✅ Profilio valdymas
- ✅ Avatar upload
- ✅ Role switching

### 🐾 Pets (Owner)
- ✅ CRUD operacijos
- ✅ Pet nuotraukų upload
- ✅ Medicininiai užrašai

### 🧑‍💼 Sitter Profilis
- ✅ Profilio kūrimas/redagavimas
- ✅ Paslaugų sąrašas
- ✅ Kainodara (valandinis)
- ✅ Darbo valandos
- ✅ Nuotraukų galerija
- ✅ Verifikacijos statusas

### 🔍 Paieška
- ✅ Filtrai: miestas, reitingas, kaina, paslaugos
- ✅ Distance-based search (geolocation)
- ✅ Availability checking
- ✅ Sorting

### 📅 Booking/Visit Sistema
- ✅ Booking sukūrimas
- ✅ Statusų flow (PENDING → ACCEPTED → PAID → COMPLETED)
- ✅ Automatinė kainos kalkuliacija
- ✅ Cancellation policy
- ✅ Sitter kalendorius

### 💳 Mokėjimai (Stripe)
- ✅ Payment intents
- ✅ Webhook handling
- ✅ Refund sistema
- ✅ Transaction history

### 💬 Real-time Chat
- ✅ 1-on-1 messaging
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Image/file sharing
- ✅ Message history

### ⭐ Reviews
- ✅ Rating sistema (1-5)
- ✅ Komentarai
- ✅ Sitter atsakymai
- ✅ Average rating calculation

### 🔔 Notifications
- ✅ In-app notifications
- ✅ Email notifications
- ✅ Real-time delivery
- ✅ Notification preferences

### 👨‍💼 Admin Panel
- ✅ Vartotojų valdymas
- ✅ Sitterių verifikavimas
- ✅ Review moderavimas
- ✅ Statistika

---

## 🛠 Technologijos

### Frontend
```
React 18          - UI framework
TypeScript        - Type safety
Vite              - Build tool
Tailwind CSS      - Styling
shadcn/ui         - UI components
React Router      - Routing
React Query       - Server state
Zustand           - Client state
Socket.IO Client  - WebSocket
React Hook Form   - Forms
Zod               - Validation
Axios             - HTTP client
Stripe.js         - Payments
```

### Backend
```
NestJS            - Framework
TypeScript        - Type safety
Prisma ORM        - Database ORM
PostgreSQL        - Database
Socket.IO         - WebSocket
JWT               - Authentication
bcrypt            - Password hashing
Stripe            - Payment processing
Nodemailer        - Email sending
Winston           - Logging
class-validator   - Validation
multer            - File upload
sharp             - Image processing
```

### Infrastructure
```
Docker            - Containerization
Docker Compose    - Multi-container orchestration
PostgreSQL 15     - Database
Nginx             - Reverse proxy (production)
```

### Development Tools
```
ESLint            - Linting
Prettier          - Code formatting
Husky             - Git hooks
Vitest            - Unit testing
Supertest         - API testing
Playwright        - E2E testing
```

---

## 📚 Dokumentacija

Visa projekto dokumentacija:

- **[SPECIFICATION.md](./SPECIFICATION.md)** - Pilna specifikacija ir DB schema
- **[API_SPECIFICATION.md](./API_SPECIFICATION.md)** - REST API dokumentacija
- **[WEBSOCKET_SPECIFICATION.md](./WEBSOCKET_SPECIFICATION.md)** - WebSocket events
- **[SECURITY.md](./SECURITY.md)** - Security best practices
- **[ROADMAP.md](./ROADMAP.md)** - Implementation roadmap
- **[DOCKER_SETUP.md](./DOCKER_SETUP.md)** - Docker ir Nginx konfigūracija
- **[ENV_CONFIGURATION.md](./ENV_CONFIGURATION.md)** - Environment variables valdymas
- **[FILE_STRUCTURE.md](./FILE_STRUCTURE.md)** - Projekto struktūra
- **[FIRST_RUN.md](./FIRST_RUN.md)** - Pirmas paleidimas ir testing

---

## 🚀 Greitas Startas

### Prerequisites

```bash
# Node.js 20+
node --version  # v20.x.x

# Docker & Docker Compose
docker --version
docker-compose --version

# pnpm (rekomenduojama)
npm install -g pnpm
```

### Installation

1. **Clone repository**
```bash
git clone https://github.com/yourusername/pet-sitting-platform.git
cd pet-sitting-platform
```

2. **Setup Environment Variables**
```bash
# Vienas .env failas root kataloge
cp .env.example .env

# Redaguok .env su savo reikšmėmis
nano .env
```

> **📝 Note:** Projektas naudoja vieną centralizuotą `.env` failą root kataloge, 
> kuris automatiškai injektuojamas į visus Docker servisus. 
> Žiūrėk [ENV_CONFIGURATION.md](./ENV_CONFIGURATION.md) daugiau info.

3. **Start with Docker Compose**
```bash
# Root directory
docker-compose up -d

# Arba manually:
# Terminal 1 - Backend
cd backend
pnpm install
pnpm prisma migrate dev
pnpm run dev

# Terminal 2 - Frontend
cd frontend
pnpm install
pnpm run dev
```

4. **Access Application**
```
Frontend:  http://localhost:5173
Backend:   http://localhost:5000/api
API Docs:  http://localhost:5000/api/docs
```

### Database Setup

```bash
cd backend

# Run migrations
pnpm prisma migrate dev

# Generate Prisma client
pnpm prisma generate

# Seed database (optional)
pnpm prisma db seed

# Open Prisma Studio
pnpm prisma studio
```

---

## 📂 Projekto Struktūra

```
pet-sitting-platform/
├── backend/          # NestJS backend
│   ├── src/
│   ├── prisma/
│   └── test/
│
├── frontend/         # React frontend
│   ├── src/
│   ├── public/
│   └── tests/
│
├── docker/           # Docker configs
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
│
├── docs/             # Documentation
└── docker-compose.yml
```

Detalesnė struktūra: [FILE_STRUCTURE.md](./FILE_STRUCTURE.md)

---

## 💻 Development

### Backend Commands

```bash
cd backend

# Development
pnpm run dev              # Start dev server

# Build
pnpm run build            # Build production
pnpm run start:prod       # Start production

# Database
pnpm prisma migrate dev   # Run migration
pnpm prisma generate      # Generate client
pnpm prisma studio        # Open studio

# Testing
pnpm run test             # Unit tests
pnpm run test:e2e         # E2E tests
pnpm run test:cov         # Coverage

# Linting
pnpm run lint             # Lint
pnpm run format           # Format
```

### Frontend Commands

```bash
cd frontend

# Development
pnpm run dev              # Start dev server
pnpm run build            # Build production
pnpm run preview          # Preview build

# Testing
pnpm run test             # Unit tests
pnpm run test:ui          # Vitest UI
pnpm run test:e2e         # Playwright E2E

# Linting
pnpm run lint             # Lint
pnpm run format           # Format
```

---

## 🧪 Testing

### Backend Tests

```bash
# Unit tests
pnpm run test

# Specific test file
pnpm run test auth.service.spec.ts

# E2E tests
pnpm run test:e2e

# Coverage
pnpm run test:cov
```

### Frontend Tests

```bash
# Unit tests
pnpm run test

# UI mode
pnpm run test:ui

# E2E tests
pnpm run test:e2e

# E2E UI mode
pnpm run test:e2e -- --ui
```

---

## 🚢 Deployment

### Backend (Railway/Render/AWS)

1. **Set environment variables**
2. **Build Docker image**
```bash
docker build -f docker/backend.Dockerfile -t petsitting-backend .
```
3. **Push to registry**
4. **Deploy**

### Frontend (Vercel/Netlify)

1. **Build**
```bash
cd frontend
pnpm run build
```
2. **Deploy dist/ folder**

### Full Stack (Docker Compose)

```bash
# Production docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

Pilna deployment instrukcija: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md#production-deployment)

---

## 🤝 Prisidėjimas

Contributions are welcome! Please follow these steps:

1. Fork projektą
2. Sukurk feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit pakeitimai (`git commit -m 'Add some AmazingFeature'`)
4. Push į branch (`git push origin feature/AmazingFeature`)
5. Atidaryk Pull Request

### Coding Standards

- ✅ Follow ESLint/Prettier configs
- ✅ Write tests for new features
- ✅ Update documentation
- ✅ Follow Git commit conventions

---

## 📸 Screenshots

*TODO: Pridėti screenshots po UI užbaigimo*

---

## 🗺️ Roadmap

Pilnas roadmap: [ROADMAP.md](./ROADMAP.md)

**MVP (Q1 2024):**
- [x] Authentication system
- [x] User profiles & pets
- [x] Sitter search
- [x] Booking system
- [x] Payments (Stripe)
- [x] Real-time chat
- [x] Reviews
- [x] Notifications
- [x] Admin panel

**Post-MVP:**
- [ ] Mobile app (React Native)
- [ ] Map view integration
- [ ] Push notifications
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] AI matching algorithm

---

## 🐛 Bug Reports

Radai bug'ą? [Create an issue](https://github.com/yourusername/pet-sitting-platform/issues)

---

## 📄 Licencija

MIT License - see [LICENSE](./LICENSE) file for details

---

## 👨‍💻 Autorius

**Tavo Vardas**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com
- LinkedIn: [Your Name](https://linkedin.com/in/yourprofile)

---

## 🙏 Padėkos

- [NestJS](https://nestjs.com/) - Backend framework
- [React](https://reactjs.org/) - Frontend framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Stripe](https://stripe.com/) - Payment processing

---

## 📞 Support

Reikia pagalbos? 
- 📧 Email: support@petsitting.com
- 💬 Discord: [Join our community](https://discord.gg/yourserver)
- 📖 Docs: [Documentation](./docs)

---

<div align="center">
  <p>Made with ❤️ and ☕</p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>
