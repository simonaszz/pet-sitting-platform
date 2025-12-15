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
│   ├── config/                      # Configuration
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── stripe.config.ts
│   │
│   ├── common/                      # Shared code
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── public.decorator.ts
│   │   │
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── ws-auth.guard.ts
│   │   │
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   │
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   │
│   │   ├── middlewares/
│   │   │   ├── logger.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   │
│   │   └── utils/
│   │       ├── hash.util.ts
│   │       ├── file.util.ts
│   │       └── date.util.ts
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
│   │   │   │   ├── refresh-token.dto.ts
│   │   │   │   ├── forgot-password.dto.ts
│   │   │   │   └── reset-password.dto.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── jwt-refresh.strategy.ts
│   │   │   └── interfaces/
│   │   │       └── jwt-payload.interface.ts
│   │   │
│   │   ├── users/                   # Users
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── update-user.dto.ts
│   │   │   │   └── upload-avatar.dto.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   │
│   │   ├── pets/                    # Pets
│   │   │   ├── pets.module.ts
│   │   │   ├── pets.controller.ts
│   │   │   ├── pets.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-pet.dto.ts
│   │   │   │   ├── update-pet.dto.ts
│   │   │   │   └── upload-pet-photo.dto.ts
│   │   │   └── entities/
│   │   │       └── pet.entity.ts
│   │   │
│   │   ├── sitters/                 # Sitters
│   │   │   ├── sitters.module.ts
│   │   │   ├── sitters.controller.ts
│   │   │   ├── sitters.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-sitter-profile.dto.ts
│   │   │   │   ├── update-sitter-profile.dto.ts
│   │   │   │   ├── search-sitters.dto.ts
│   │   │   │   └── upload-sitter-photos.dto.ts
│   │   │   └── entities/
│   │   │       └── sitter-profile.entity.ts
│   │   │
│   │   ├── visits/                  # Visits/Bookings
│   │   │   ├── visits.module.ts
│   │   │   ├── visits.controller.ts
│   │   │   ├── visits.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-visit.dto.ts
│   │   │   │   ├── update-visit-status.dto.ts
│   │   │   │   ├── upload-visit-photos.dto.ts
│   │   │   │   └── get-visits.dto.ts
│   │   │   └── entities/
│   │   │       ├── visit.entity.ts
│   │   │       └── visit-photo.entity.ts
│   │   │
│   │   ├── chat/                    # Chat (REST)
│   │   │   ├── chat.module.ts
│   │   │   ├── chat.controller.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-chat.dto.ts
│   │   │   │   ├── get-messages.dto.ts
│   │   │   │   └── send-message.dto.ts
│   │   │   └── entities/
│   │   │       ├── chat.entity.ts
│   │   │       └── message.entity.ts
│   │   │
│   │   ├── reviews/                 # Reviews
│   │   │   ├── reviews.module.ts
│   │   │   ├── reviews.controller.ts
│   │   │   ├── reviews.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-review.dto.ts
│   │   │   │   ├── respond-review.dto.ts
│   │   │   │   └── get-reviews.dto.ts
│   │   │   └── entities/
│   │   │       └── review.entity.ts
│   │   │
│   │   ├── payments/                # Payments (Stripe)
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-payment-intent.dto.ts
│   │   │   │   ├── confirm-payment.dto.ts
│   │   │   │   └── refund-payment.dto.ts
│   │   │   └── entities/
│   │   │       └── transaction.entity.ts
│   │   │
│   │   ├── notifications/           # Notifications
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-notification.dto.ts
│   │   │   │   └── get-notifications.dto.ts
│   │   │   └── entities/
│   │   │       └── notification.entity.ts
│   │   │
│   │   ├── admin/                   # Admin
│   │   │   ├── admin.module.ts
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── block-user.dto.ts
│   │   │   │   ├── verify-sitter.dto.ts
│   │   │   │   └── hide-review.dto.ts
│   │   │   └── guards/
│   │   │       └── admin.guard.ts
│   │   │
│   │   ├── email/                   # Email Service
│   │   │   ├── email.module.ts
│   │   │   ├── email.service.ts
│   │   │   └── templates/
│   │   │       ├── welcome.hbs
│   │   │       ├── verify-email.hbs
│   │   │       ├── reset-password.hbs
│   │   │       └── booking-confirmation.hbs
│   │   │
│   │   └── upload/                  # File Upload
│   │       ├── upload.module.ts
│   │       ├── upload.service.ts
│   │       └── upload.controller.ts
│   │
│   ├── websocket/                   # WebSocket (Socket.IO)
│   │   ├── websocket.module.ts
│   │   ├── websocket.gateway.ts
│   │   ├── events/
│   │   │   ├── chat.events.ts
│   │   │   ├── notification.events.ts
│   │   │   └── booking.events.ts
│   │   ├── adapters/
│   │   │   └── redis.adapter.ts
│   │   └── dto/
│   │       ├── join-chat.dto.ts
│   │       ├── send-message.dto.ts
│   │       └── typing.dto.ts
│   │
│   └── database/                    # Database (Prisma)
│       ├── prisma.module.ts
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
│   ├── vite-env.d.ts
│   │
│   ├── pages/                       # Page components
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── ResetPasswordPage.tsx
│   │   │   └── VerifyEmailPage.tsx
│   │   │
│   │   ├── profile/
│   │   │   ├── ProfilePage.tsx
│   │   │   └── EditProfilePage.tsx
│   │   │
│   │   ├── pets/
│   │   │   ├── PetsListPage.tsx
│   │   │   ├── AddPetPage.tsx
│   │   │   └── EditPetPage.tsx
│   │   │
│   │   ├── sitters/
│   │   │   ├── SittersSearchPage.tsx
│   │   │   ├── SitterDetailPage.tsx
│   │   │   ├── CreateSitterProfilePage.tsx
│   │   │   └── EditSitterProfilePage.tsx
│   │   │
│   │   ├── bookings/
│   │   │   ├── BookingsListPage.tsx
│   │   │   ├── CreateBookingPage.tsx
│   │   │   └── BookingDetailPage.tsx
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatListPage.tsx
│   │   │   └── ChatPage.tsx
│   │   │
│   │   ├── payments/
│   │   │   ├── PaymentPage.tsx
│   │   │   ├── PaymentSuccessPage.tsx
│   │   │   └── TransactionHistoryPage.tsx
│   │   │
│   │   ├── notifications/
│   │   │   └── NotificationsPage.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── UsersManagementPage.tsx
│   │   │   ├── SittersVerificationPage.tsx
│   │   │   └── ReviewModerationPage.tsx
│   │   │
│   │   ├── HomePage.tsx
│   │   ├── NotFoundPage.tsx
│   │   └── index.ts
│   │
│   ├── components/                  # Reusable components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── RoleGuard.tsx
│   │   │
│   │   ├── profile/
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── EditProfileForm.tsx
│   │   │   └── AvatarUpload.tsx
│   │   │
│   │   ├── pets/
│   │   │   ├── PetCard.tsx
│   │   │   ├── PetForm.tsx
│   │   │   ├── PetList.tsx
│   │   │   └── PetPhotoUpload.tsx
│   │   │
│   │   ├── sitters/
│   │   │   ├── SitterCard.tsx
│   │   │   ├── SitterProfileForm.tsx
│   │   │   ├── SitterPhotoGallery.tsx
│   │   │   ├── SitterFilters.tsx
│   │   │   └── AvailabilityCalendar.tsx
│   │   │
│   │   ├── bookings/
│   │   │   ├── BookingCard.tsx
│   │   │   ├── BookingForm.tsx
│   │   │   ├── BookingList.tsx
│   │   │   ├── BookingStatusBadge.tsx
│   │   │   └── BookingTimeline.tsx
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatList.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   └── UnreadBadge.tsx
│   │   │
│   │   ├── reviews/
│   │   │   ├── ReviewCard.tsx
│   │   │   ├── ReviewForm.tsx
│   │   │   ├── ReviewList.tsx
│   │   │   └── StarRating.tsx
│   │   │
│   │   ├── payments/
│   │   │   ├── PaymentForm.tsx
│   │   │   ├── StripeCheckout.tsx
│   │   │   └── TransactionCard.tsx
│   │   │
│   │   ├── notifications/
│   │   │   ├── NotificationBell.tsx
│   │   │   ├── NotificationDropdown.tsx
│   │   │   ├── NotificationItem.tsx
│   │   │   └── NotificationList.tsx
│   │   │
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   └── common/
│   │       ├── Loader.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── EmptyState.tsx
│   │       ├── Pagination.tsx
│   │       ├── SearchBar.tsx
│   │       ├── FileUpload.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   ├── hooks/                       # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useSocket.ts
│   │   ├── useChat.ts
│   │   ├── useNotifications.ts
│   │   ├── usePagination.ts
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   └── useFileUpload.ts
│   │
│   ├── context/                     # React Context
│   │   ├── AuthContext.tsx
│   │   ├── SocketContext.tsx
│   │   ├── NotificationContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── services/                    # API services
│   │   ├── api.ts                   # Axios instance
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   ├── pets.service.ts
│   │   ├── sitters.service.ts
│   │   ├── visits.service.ts
│   │   ├── chat.service.ts
│   │   ├── reviews.service.ts
│   │   ├── payments.service.ts
│   │   ├── notifications.service.ts
│   │   └── upload.service.ts
│   │
│   ├── store/                       # State management (Zustand)
│   │   ├── authStore.ts
│   │   ├── chatStore.ts
│   │   ├── notificationStore.ts
│   │   └── uiStore.ts
│   │
│   ├── types/                       # TypeScript types
│   │   ├── user.types.ts
│   │   ├── pet.types.ts
│   │   ├── sitter.types.ts
│   │   ├── visit.types.ts
│   │   ├── chat.types.ts
│   │   ├── review.types.ts
│   │   ├── payment.types.ts
│   │   ├── notification.types.ts
│   │   └── api.types.ts
│   │
│   ├── utils/                       # Utility functions
│   │   ├── format.ts                # Date, currency formatting
│   │   ├── validation.ts            # Form validation helpers
│   │   ├── storage.ts               # localStorage helpers
│   │   ├── constants.ts             # App constants
│   │   └── helpers.ts
│   │
│   ├── lib/                         # Third-party configs
│   │   ├── stripe.ts
│   │   └── socket.ts
│   │
│   └── assets/                      # Static assets
│       ├── images/
│       ├── icons/
│       └── fonts/
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
