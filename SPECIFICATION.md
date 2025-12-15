# 🐾 Pet-Sitting Platform - Patobulinta Specifikacija

## 📋 Turinys
1. [Produkto vizija](#produkto-vizija)
2. [Technologijų stack'as](#technologijų-stackas)
3. [Rolės ir teisės](#rolės-ir-teisės)
4. [Funkcionalumas](#funkcionalumas)
5. [Duomenų bazės schema](#duomenų-bazės-schema)
6. [API specifikacija](#api-specifikacija)
7. [WebSocket events](#websocket-events)
8. [Saugumas](#saugumas)
9. [Failų struktūra](#failų-struktūra)
10. [Environment variables](#environment-variables)
11. [Roadmap](#roadmap)

---

## 🎯 Produkto vizija

Pet-sitting platforma, leidžianti gyvūnų savininkams rasti patikimus prižiūrėtojus. Platforma siūlo:
- **Owner** gali ieškoti sitterių pagal vietovę, kainą, reitingą
- **Sitter** gali priimti užsakymus, tvarkyti grafiką
- Real-time komunikacija
- Mokėjimai (Stripe)
- Nuotraukų įkėlimas
- Review sistema
- Admin panelė

---

## 🛠 Technologijų stack'as

### Frontend
- **React 18** + TypeScript
- **Vite** (build tool)
- **Tailwind CSS** + **shadcn/ui**
- **React Router v6**
- **React Query** (server state)
- **Zustand** (client state)
- **Socket.IO Client**
- **React Hook Form** + **Zod** (validation)
- **Axios** (HTTP)
- **date-fns** (dates)
- **Lucide React** (icons)

### Backend
- **Node.js 20+** + TypeScript
- **NestJS** (framework)
- **Prisma ORM**
- **PostgreSQL 15**
- **Socket.IO** (WebSocket)
- **JWT** (authentication)
- **bcrypt** (hashing)
- **class-validator** + **class-transformer**
- **Stripe** (payments)
- **Nodemailer** (emails)
- **Winston** (logging)
- **multer** (file uploads)

### Infrastructure
- **Docker** + **Docker Compose**
- **Redis** (cache + Socket.IO adapter)
- **Nginx** (reverse proxy)
- **PostgreSQL** (database)

### Development
- **ESLint** + **Prettier**
- **Husky** (git hooks)
- **Vitest** (unit tests)
- **Supertest** (API tests)
- **Playwright** (E2E tests)

---

## 👥 Rolės ir teisės

### Rolės
```typescript
enum UserRole {
  OWNER = 'OWNER',
  SITTER = 'SITTER',
  BOTH = 'BOTH',
  ADMIN = 'ADMIN'
}
```

### Teisės matrica

| Funkcija | OWNER | SITTER | BOTH | ADMIN |
|----------|-------|--------|------|-------|
| Sukurti pet | ✅ | ❌ | ✅ | ✅ |
| Sukurti sitter profilį | ❌ | ✅ | ✅ | ✅ |
| Ieškoti sitterių | ✅ | ❌ | ✅ | ✅ |
| Sukurti booking | ✅ | ❌ | ✅ | ✅ |
| Priimti booking | ❌ | ✅ | ✅ | ✅ |
| Chat | ✅ | ✅ | ✅ | ✅ |
| Rašyti review | ✅ | ❌ | ✅ (kaip owner) | ❌ |
| Atsakyti į review | ❌ | ✅ | ✅ (kaip sitter) | ❌ |
| Blokuoti vartotojus | ❌ | ❌ | ❌ | ✅ |
| Verifikuoti sitterius | ❌ | ❌ | ❌ | ✅ |

---

## 🎯 Funkcionalumas

### MVP Features

#### 1. Autentifikacija ✅
- ✅ Registracija (email + password)
- ✅ Email verifikacija
- ✅ Prisijungimas
- ✅ JWT access + refresh tokens
- ✅ Slaptažodžio atkūrimas
- ✅ Logout

#### 2. Profilis ✅
- ✅ Profilio redagavimas
- ✅ Avatar upload
- ✅ Role switch (OWNER ↔ SITTER ↔ BOTH)

#### 3. Pets (OWNER) ✅
- ✅ CRUD operacijos
- ✅ Pet foto upload
- ✅ Medicininiai užrašai

#### 4. Sitter profilis ✅
- ✅ Profilio kūrimas/redagavimas
- ✅ Nuotraukų galerija
- ✅ Darbo valandų nustatymas
- ✅ Paslaugų sąrašas
- ✅ Kainodara (valandinis)
- ✅ Verifikacijos statusas

#### 5. Paieška ✅
- ✅ Filtrai: miestas, reitingas, kaina
- ✅ Availability pagal datą
- ✅ Distance-based (geolocation)
- ✅ Sorting: rating, price, distance

#### 6. Booking/Visit sistema ✅
- ✅ Booking sukūrimas
- ✅ Kainos apskaičiavimas
- ✅ Statusų flow:
  - `PENDING` → sitter dar nepatvirtino
  - `ACCEPTED` → sitter patvirtino
  - `REJECTED` → sitter atmetė
  - `PAID` → owner sumokėjo
  - `CANCELED` → atšaukta
  - `COMPLETED` → pabaigta
- ✅ Cancellation policy
- ✅ Sitter kalendorius (availability)

#### 7. Mokėjimai (Stripe) 💳
- ✅ Payment intent sukūrimas
- ✅ Payment confirmation
- ✅ Refund logika
- ✅ Webhook handling
- ✅ Transaction history

#### 8. Real-time Chat 💬
- ✅ 1-on-1 chat
- ✅ Message history
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Image/file sharing
- ✅ Message editing/deletion
- ✅ Unread count

#### 9. Nuotraukos 📸
- ✅ Visit foto įkėlimas (sitter)
- ✅ Gallery view
- ✅ Caption'ai
- ✅ Image compression

#### 10. Reviews ⭐
- ✅ Owner → Sitter review
- ✅ Rating (1-5)
- ✅ Comment
- ✅ Sitter response
- ✅ Average rating calculation

#### 11. Notifications 🔔
- ✅ In-app notifications
- ✅ Email notifications
- ✅ Notification types:
  - New booking request
  - Booking status change
  - New message
  - New review
  - Payment confirmation
- ✅ Mark as read
- ✅ Notification preferences

#### 12. Admin panelė 👨‍💼
- ✅ Vartotojų sąrašas
- ✅ Sitterių verifikavimas
- ✅ Vartotojų blokavimas
- ✅ Statistika (dashboard)
- ✅ Review moderation

---

## 🗄️ Duomenų bazės schema

Pilna Prisma schema: žiūrėk [`prisma/schema.prisma`](./backend/prisma/schema.prisma)

### Core entities

```prisma
model User {
  id                String    @id @default(uuid())
  email             String    @unique
  passwordHash      String
  name              String
  phone             String?
  role              UserRole  @default(OWNER)
  avatar            String?
  isBlocked         Boolean   @default(false)
  isEmailVerified   Boolean   @default(false)
  emailVerifyToken  String?   @unique
  passwordResetToken String?  @unique
  passwordResetExp  DateTime?
  lastLoginAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  pets              Pet[]
  sitterProfile     SitterProfile?
  ownedVisits       Visit[]        @relation("OwnerVisits")
  sitterVisits      Visit[]        @relation("SitterVisits")
  sentMessages      Message[]      @relation("SentMessages")
  chatsAsUser1      Chat[]         @relation("User1")
  chatsAsUser2      Chat[]         @relation("User2")
  reviewsGiven      Review[]       @relation("ReviewAuthor")
  reviewsReceived   Review[]       @relation("ReviewSitter")
  notifications     Notification[]
  transactions      Transaction[]
}

model Pet {
  id            String   @id @default(uuid())
  ownerId       String
  name          String
  type          PetType
  breed         String?
  age           Int?
  photo         String?
  notes         String?
  medicalNotes  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  owner         User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  visits        Visit[]
}

model SitterProfile {
  id              String   @id @default(uuid())
  userId          String   @unique
  bio             String?
  city            String
  address         String?
  latitude        Float?
  longitude       Float?
  hourlyRate      Decimal  @db.Decimal(10, 2)
  services        String[] // ["DOG_WALKING", "PET_SITTING", "HOME_VISITS"]
  photos          String[] // array of URLs
  availability    Json?    // { "monday": { "start": "09:00", "end": "18:00" }, ... }
  maxPets         Int      @default(1)
  experienceYears Int?
  isVerified      Boolean  @default(false)
  avgRating       Float    @default(0)
  totalReviews    Int      @default(0)
  responseTime    Int?     // average minutes
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  visits          Visit[]
  reviews         Review[]
}

model Visit {
  id              String      @id @default(uuid())
  ownerId         String
  sitterId        String
  petId           String
  address         String
  date            DateTime
  timeStart       String      // "09:00"
  timeEnd         String      // "17:00"
  status          VisitStatus @default(PENDING)
  notesForSitter  String?
  totalPrice      Decimal     @db.Decimal(10, 2)
  paidAt          DateTime?
  canceledBy      String?
  cancelReason    String?
  completedAt     DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  owner           User          @relation("OwnerVisits", fields: [ownerId], references: [id], onDelete: Cascade)
  sitter          SitterProfile @relation(fields: [sitterId], references: [id], onDelete: Cascade)
  pet             Pet           @relation(fields: [petId], references: [id], onDelete: Cascade)
  photos          VisitPhoto[]
  reviews         Review[]
  transactions    Transaction[]
}

model VisitPhoto {
  id        String   @id @default(uuid())
  visitId   String
  url       String
  caption   String?
  createdAt DateTime @default(now())

  visit     Visit    @relation(fields: [visitId], references: [id], onDelete: Cascade)
}

model Chat {
  id            String    @id @default(uuid())
  user1Id       String
  user2Id       String
  lastMessageAt DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user1         User      @relation("User1", fields: [user1Id], references: [id], onDelete: Cascade)
  user2         User      @relation("User2", fields: [user2Id], references: [id], onDelete: Cascade)
  messages      Message[]

  @@unique([user1Id, user2Id])
}

model Message {
  id            String    @id @default(uuid())
  chatId        String
  senderId      String
  text          String?
  attachmentUrl String?
  isRead        Boolean   @default(false)
  readAt        DateTime?
  editedAt      DateTime?
  deletedAt     DateTime?
  createdAt     DateTime  @default(now())

  chat          Chat      @relation(fields: [chatId], references: [id], onDelete: Cascade)
  sender        User      @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)
}

model Review {
  id          String    @id @default(uuid())
  authorId    String
  sitterId    String
  visitId     String    @unique
  rating      Int       // 1-5
  comment     String?
  response    String?
  respondedAt DateTime?
  isHidden    Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  author      User          @relation("ReviewAuthor", fields: [authorId], references: [id], onDelete: Cascade)
  sitter      SitterProfile @relation(fields: [sitterId], references: [id], onDelete: Cascade)
  visit       Visit         @relation(fields: [visitId], references: [id], onDelete: Cascade)
}

model Notification {
  id              String           @id @default(uuid())
  userId          String
  type            NotificationType
  title           String
  body            String
  isRead          Boolean          @default(false)
  relatedEntityId String?
  createdAt       DateTime         @default(now())

  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Transaction {
  id                String            @id @default(uuid())
  visitId           String
  userId            String
  amount            Decimal           @db.Decimal(10, 2)
  status            TransactionStatus @default(PENDING)
  stripePaymentId   String?           @unique
  stripeRefundId    String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  visit             Visit             @relation(fields: [visitId], references: [id], onDelete: Cascade)
  user              User              @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Enums
enum UserRole {
  OWNER
  SITTER
  BOTH
  ADMIN
}

enum PetType {
  DOG
  CAT
  BIRD
  RABBIT
  OTHER
}

enum VisitStatus {
  PENDING
  ACCEPTED
  REJECTED
  PAID
  CANCELED
  COMPLETED
}

enum NotificationType {
  BOOKING_REQUEST
  BOOKING_ACCEPTED
  BOOKING_REJECTED
  BOOKING_CANCELED
  BOOKING_COMPLETED
  MESSAGE
  REVIEW
  PAYMENT
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
```

