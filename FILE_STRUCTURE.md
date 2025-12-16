# 📂 File Structure

## Project Root
```
pet-sitting-platform/
├── backend/
├── frontend/
├── docker/
├── docs/
├── .gitignore
├── docker-compose.yml
├── README.md
├── SPECIFICATION.md
├── API_SPECIFICATION.md
├── WEBSOCKET_SPECIFICATION.md
├── SECURITY.md
├── ROADMAP.md
└── ENVIRONMENT_SETUP.md
```

---

## 🔧 Backend Structure (NestJS)

```
backend/
├── src/
│   ├── main.ts                      # Application entry point
│   ├── app.module.ts                # Root module
│   ├── app.controller.ts
│   ├── app.service.ts
│   │
│   ├── common/                      # Shared code
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   ├── filters/
│   │   ├── guards/
│   │   └── pipes/
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/                    # Authentication
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── auth-response.dto.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   └── guards/
│   │   │       └── jwt-auth.guard.ts
│   │   │
│   │   ├── pet/                     # Pets
│   │   │   ├── pet.module.ts
│   │   │   ├── pet.controller.ts
│   │   │   ├── pet.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-pet.dto.ts
│   │   │   │   └── update-pet.dto.ts
│   │   │
│   │   ├── sitter-profile/          # Sitter profiles
│   │   │   ├── sitter-profile.module.ts
│   │   │   ├── sitter-profile.controller.ts
│   │   │   ├── sitter-profile.service.ts
│   │   │   ├── sitter-profile.prisma.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-sitter-profile.dto.ts
│   │   │   │   └── update-sitter-profile.dto.ts
│   │   │
│   │   ├── visit/                   # Visits/Bookings
│   │   │   ├── visit.module.ts
│   │   │   ├── visit.controller.ts
│   │   │   ├── visit.service.ts
│   │   │   ├── visit.prisma.ts
│   │   │   ├── dto/
│   │   │   │   └── create-visit.dto.ts
│   │
│   └── database/                    # Database (Prisma)
│       ├── database.module.ts
│       └── prisma.service.ts
│
├── prisma/
│   ├── schema.prisma                # Database schema
│   ├── migrations/                  # Migration files
│   └── seed.ts                      # Seed data
│
├── test/                            # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── uploads/                         # Local file storage (gitignored)
│   ├── avatars/
│   ├── pets/
│   ├── sitters/
│   └── visits/
│
├── logs/                            # Log files (gitignored)
│   ├── error.log
│   └── combined.log
│
├── .env                             # Environment variables (gitignored)
├── .env.example                     # Example env file
├── .eslintrc.js
├── .prettierrc
├── nest-cli.json
├── tsconfig.json
├── package.json
└── README.md
```

---

## ⚛️ Frontend Structure (React + Vite)

```
frontend/
├── public/
│   ├── vite.svg
│   └── robots.txt
│
├── src/
│   ├── main.tsx                     # Entry point
│   ├── App.tsx                      # Root component
│   ├── index.css                    # Global styles
│   ├── App.css
│   ├── vite-env.d.ts
│   │
│   ├── pages/                       # Page components
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── PetsPage.tsx
│   │   ├── SittersPage.tsx
│   │   ├── SitterDetailPage.tsx
│   │   ├── MySitterProfilePage.tsx
│   │   ├── MyBookingsPage.tsx
│   │   └── MyJobsPage.tsx
│   │
│   ├── components/                  # Reusable components
│   │   ├── Toast.tsx
│   │   └── ToastNotification.tsx
│   │
│   ├── hooks/                       # Custom hooks
│   │   └── useToast.tsx
│   │
│   ├── services/                    # API services
│   │   ├── api.ts                   # Axios instance
│   │   ├── auth.service.ts
│   │   ├── booking.service.ts
│   │   ├── pet.service.ts
│   │   └── sitter.service.ts
│   │
│   ├── store/                       # State management
│   │   └── auth.store.ts
│   │
│   └── assets/                      # Static assets
│       └── react.svg
│
├── .env                             # Environment variables (gitignored)
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── index.html
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── package.json
└── README.md
```

---

## 🐳 Docker Structure

```
docker/
├── backend.Dockerfile               # Backend Docker image
├── frontend.Dockerfile              # Frontend Docker image
└── nginx.conf                       # Nginx config (production)
```

---

## 📚 Docs Structure

```
docs/
├── api/                             # API documentation
│   └── swagger.json
├── architecture/                    # Architecture diagrams
│   ├── system-architecture.png
│   ├── database-schema.png
│   └── user-flow.png
└── guides/                          # User guides
    ├── getting-started.md
    ├── deployment.md
    └── contributing.md
```

---

## Key Points

### Backend:
- **Modular structure** - each feature in separate module
- **DTOs** - validation at controller level
- **Entities** - mirror Prisma models
- **Guards & Decorators** - reusable auth logic
- **WebSocket** - separate from REST modules

### Frontend:
- **Pages** - route-level components
- **Components** - reusable UI pieces
- **Hooks** - business logic extraction
- **Services** - API calls
- **Store** - global state (Zustand)
- **Types** - TypeScript definitions

### Common:
- **.env files** - never commit secrets
- **Uploads folder** - gitignored, local only
- **Logs folder** - gitignored
- **node_modules** - gitignored
