# 🗺️ Implementation Roadmap

## Overview

Projektas suskirstytas į 9 etapus, kiekvieną galima užbaigti per ~1-2 savaites.
**Bendra trukmė: ~10-12 savaičių (MVP).**

---

## 📅 Etapai

### ✅ Etapas 0: Projektų Setup (1-2 dienos)
**Tikslas:** Paruošti darbo aplinką ir projektų struktūrą

**Backend:**
- [x] NestJS projekto inicializacija
- [x] Prisma ORM setup
- [x] PostgreSQL schema
- [x] Docker Compose konfigūracija
- [x] Environment variables
- [x] ESLint + Prettier
- [x] Git repository setup

**Frontend:**
- [x] Vite + React + TypeScript setup
- [x] Tailwind CSS + shadcn/ui
- [x] React Router
- [x] Axios setup
- [x] Environment variables
- [x] ESLint + Prettier

**Infrastructure:**
- [x] Docker Compose (Postgres, Redis, Backend, Frontend)
- [x] Initial Prisma migration
- [x] README.md su setup instrukcijomis

**Deliverables:**
- ✅ Veikiantis development environment
- ✅ Empty project structure
- ✅ Database schema defined

---

### ✅ Etapas 1: Authentication (5-7 dienos)
**Tikslas:** Pilnas auth flow su email verification

#### Backend Tasks:
- [ ] **Auth Module**
  - [ ] User model (Prisma)
  - [ ] Register endpoint
  - [ ] Login endpoint
  - [ ] JWT strategy (access + refresh)
  - [ ] Password hashing (bcrypt)
  - [ ] Refresh token endpoint
  - [ ] Get me endpoint
  - [ ] Logout endpoint

- [ ] **Email Verification**
  - [ ] Email service (Nodemailer)
  - [ ] Send verification email
  - [ ] Verify email endpoint
  - [ ] Resend verification endpoint

- [ ] **Password Reset**
  - [ ] Forgot password endpoint
  - [ ] Reset password endpoint
  - [ ] Email template

- [ ] **Guards & Decorators**
  - [ ] JWT Auth Guard
  - [ ] Roles Guard
  - [ ] Current User decorator

- [ ] **Validation**
  - [ ] Register DTO
  - [ ] Login DTO
  - [ ] Password validation (strength)

#### Frontend Tasks:
- [ ] **Auth Context**
  - [ ] Auth provider
  - [ ] useAuth hook
  - [ ] Token storage (localStorage)
  - [ ] Auto token refresh

- [ ] **Pages**
  - [ ] Login page
  - [ ] Register page
  - [ ] Forgot password page
  - [ ] Reset password page
  - [ ] Email verification page

- [ ] **Components**
  - [ ] Auth forms
  - [ ] Protected routes
  - [ ] Loading states

#### Testing:
- [ ] Unit tests: password hashing, JWT generation
- [ ] E2E tests: register → verify email → login flow

**Deliverables:**
- ✅ Vartotojai gali registruotis
- ✅ Email verification veikia
- ✅ Login/logout veikia
- ✅ Password reset veikia

---

### ✅ Etapas 2: User Profile & Pets CRUD (4-5 dienos)
**Tikslas:** Profilio valdymas ir gyvūnų CRUD

#### Backend Tasks:
- [ ] **Users Module**
  - [ ] Get profile endpoint
  - [ ] Update profile endpoint
  - [ ] Upload avatar endpoint
  - [ ] Delete avatar endpoint

- [ ] **Pets Module**
  - [ ] Pet model (Prisma relation)
  - [ ] Create pet endpoint
  - [ ] Get pets endpoint (paginated)
  - [ ] Get pet by ID endpoint
  - [ ] Update pet endpoint
  - [ ] Delete pet endpoint
  - [ ] Upload pet photo endpoint

- [ ] **File Upload**
  - [ ] Multer configuration
  - [ ] Image validation & processing (sharp)
  - [ ] Local storage setup
  - [ ] File size limits

#### Frontend Tasks:
- [ ] **Profile Page**
  - [ ] View profile
  - [ ] Edit profile form
  - [ ] Avatar upload
  - [ ] Role switch (OWNER ↔ SITTER ↔ BOTH)

- [ ] **Pets Management**
  - [ ] Pets list page
  - [ ] Add pet modal/page
  - [ ] Edit pet modal
  - [ ] Delete pet confirmation
  - [ ] Pet photo upload

- [ ] **UI Components**
  - [ ] File upload component
  - [ ] Form components (shadcn)
  - [ ] Modal components
  - [ ] Delete confirmation dialog

#### Testing:
- [ ] Unit tests: file upload validation
- [ ] E2E tests: create pet → upload photo → edit → delete

**Deliverables:**
- ✅ Owner gali pridėti/redaguoti pets
- ✅ Avatar upload veikia
- ✅ Nuotraukų upload veikia

---

### ✅ Etapas 3: Sitter Profiles & Search (5-7 dienos)
**Tikslas:** Sitter profilio sistema ir paieška

#### Backend Tasks:
- [ ] **Sitter Module**
  - [ ] SitterProfile model
  - [ ] Create/update profile endpoint
  - [ ] Get sitter profile endpoint (public)
  - [ ] Upload sitter photos endpoint
  - [ ] Delete sitter photo endpoint
  - [ ] Availability management

- [ ] **Search & Filters**
  - [ ] Search sitters endpoint
  - [ ] City filter
  - [ ] Price range filter
  - [ ] Rating filter
  - [ ] Service type filter
  - [ ] Date availability filter
  - [ ] Distance-based search (geolocation)
  - [ ] Sorting (rating, price, distance)
  - [ ] Pagination

- [ ] **Geolocation**
  - [ ] Address → lat/lng (Google Maps API)
  - [ ] Distance calculation

#### Frontend Tasks:
- [ ] **Sitter Profile Creation**
  - [ ] Sitter profile form
  - [ ] Bio, hourly rate, services
  - [ ] Availability schedule
  - [ ] Photo gallery upload
  - [ ] Address input with autocomplete

- [ ] **Sitter Search**
  - [ ] Search page with filters
  - [ ] Sitter card component
  - [ ] Map view (optional MVP)
  - [ ] Sorting options
  - [ ] Pagination

- [ ] **Sitter Detail Page**
  - [ ] Full profile view
  - [ ] Photo gallery
  - [ ] Availability calendar
  - [ ] Reviews list
  - [ ] Book button

#### Testing:
- [ ] Unit tests: distance calculation, filters
- [ ] E2E tests: create sitter profile → search → view

**Deliverables:**
- ✅ Sitter gali sukurti profilį
- ✅ Owner gali ieškoti sitterių
- ✅ Filtrai veikia
- ✅ Geolocation veikia

---

### ✅ Etapas 4: Booking/Visit System (5-7 dienos)
**Tikslas:** Pilnas booking flow su statusais

#### Backend Tasks:
- [ ] **Visit Module**
  - [ ] Visit model
  - [ ] Create booking endpoint (OWNER)
  - [ ] Get visits endpoint (filtered by role)
  - [ ] Get visit by ID endpoint
  - [ ] Update visit status endpoint
  - [ ] Price calculation logic
  - [ ] Availability check

- [ ] **Status Flow**
  - [ ] PENDING → ACCEPTED (sitter)
  - [ ] PENDING → REJECTED (sitter)
  - [ ] ACCEPTED → CANCELED (owner or sitter)
  - [ ] PAID → COMPLETED (sitter)

- [ ] **Validation**
  - [ ] No double bookings
  - [ ] Sitter availability check
  - [ ] Owner pet verification
  - [ ] Price calculation validation

- [ ] **Cancellation Policy**
  - [ ] Cancellation logic
  - [ ] Refund calculation
  - [ ] Reason tracking

#### Frontend Tasks:
- [ ] **Booking Creation**
  - [ ] Booking form
  - [ ] Date/time picker
  - [ ] Pet selection
  - [ ] Address input
  - [ ] Price preview

- [ ] **Booking Management**
  - [ ] Owner bookings list
  - [ ] Sitter bookings list
  - [ ] Status badges
  - [ ] Accept/reject buttons (sitter)
  - [ ] Cancel button (owner)
  - [ ] Complete button (sitter)

- [ ] **Booking Detail Page**
  - [ ] Full booking info
  - [ ] Pet details
  - [ ] Sitter/owner info
  - [ ] Status timeline
  - [ ] Actions based on role

#### Testing:
- [ ] Unit tests: price calculation, availability
- [ ] E2E tests: create booking → accept → complete

**Deliverables:**
- ✅ Owner gali sukurti booking
- ✅ Sitter gali priimti/atmesti
- ✅ Status flow veikia
- ✅ Cancellation veikia

---

### ✅ Etapas 5: Payments (Stripe) (4-5 dienos)
**Tikslas:** Mokėjimų integracija

#### Backend Tasks:
- [ ] **Stripe Setup**
  - [ ] Stripe SDK integration
  - [ ] API keys configuration

- [ ] **Payment Module**
  - [ ] Transaction model
  - [ ] Create payment intent endpoint
  - [ ] Confirm payment endpoint
  - [ ] Refund endpoint
  - [ ] Get transaction history endpoint

- [ ] **Webhooks**
  - [ ] Stripe webhook handler
  - [ ] payment_intent.succeeded
  - [ ] payment_intent.payment_failed
  - [ ] Signature verification

- [ ] **Payment Logic**
  - [ ] Update visit status to PAID
  - [ ] Create transaction record
  - [ ] Send payment confirmation email

#### Frontend Tasks:
- [ ] **Stripe Elements**
  - [ ] Stripe provider setup
  - [ ] Payment form component
  - [ ] Card element styling

- [ ] **Payment Flow**
  - [ ] Payment page
  - [ ] Payment confirmation
  - [ ] Success/error handling
  - [ ] Receipt view

- [ ] **Transaction History**
  - [ ] Transactions list page
  - [ ] Transaction details

#### Testing:
- [ ] Unit tests: payment calculation
- [ ] E2E tests: test card → payment → confirmation
- [ ] Webhook testing (Stripe CLI)

**Deliverables:**
- ✅ Owner gali sumokėti už booking
- ✅ Stripe veikia (test mode)
- ✅ Webhook'ai veikia
- ✅ Refund veikia

---

### ✅ Etapas 6: Real-time Chat (Socket.IO) (5-7 dienos)
**Tikslas:** Real-time pranešimų sistema

#### Backend Tasks:
- [ ] **Chat Module**
  - [ ] Chat model
  - [ ] Message model
  - [ ] Create/get chat endpoint
  - [ ] Get messages endpoint
  - [ ] Message pagination

- [ ] **Socket.IO Setup**
  - [ ] Gateway configuration
  - [ ] JWT authentication for sockets
  - [ ] Redis adapter (multi-server support)

- [ ] **Chat Events**
  - [ ] join_chat
  - [ ] send_message
  - [ ] typing
  - [ ] mark_read
  - [ ] edit_message
  - [ ] delete_message

- [ ] **Rate Limiting**
  - [ ] Socket rate limiter
  - [ ] Message flood prevention

#### Frontend Tasks:
- [ ] **Socket.IO Client**
  - [ ] Socket provider
  - [ ] useSocket hook
  - [ ] Auto-reconnect logic

- [ ] **Chat UI**
  - [ ] Chat list (conversations)
  - [ ] Chat window
  - [ ] Message bubbles
  - [ ] Typing indicator
  - [ ] Read receipts
  - [ ] Unread count badges

- [ ] **Message Features**
  - [ ] Send text message
  - [ ] Send image/file
  - [ ] Edit message
  - [ ] Delete message
  - [ ] Message timestamps

#### Testing:
- [ ] Unit tests: message validation
- [ ] E2E tests: send message → receive → mark read
- [ ] Socket.IO client tests

**Deliverables:**
- ✅ Real-time chat veikia
- ✅ Typing indicators veikia
- ✅ Read receipts veikia
- ✅ Message history veikia

---

### ✅ Etapas 7: Reviews & Photos (3-4 dienos)
**Tikslas:** Review sistema ir vizito nuotraukos

#### Backend Tasks:
- [ ] **Review Module**
  - [ ] Review model
  - [ ] Create review endpoint (owner only)
  - [ ] Get reviews endpoint (public)
  - [ ] Sitter response endpoint
  - [ ] Delete review endpoint (within 24h)

- [ ] **Rating Calculation**
  - [ ] Update sitter avgRating
  - [ ] Update totalReviews count
  - [ ] Trigger after review creation/deletion

- [ ] **Visit Photos**
  - [ ] VisitPhoto model
  - [ ] Upload visit photos endpoint (sitter)
  - [ ] Get visit photos endpoint
  - [ ] Delete visit photo endpoint

- [ ] **Validation**
  - [ ] Only completed visits can be reviewed
  - [ ] One review per visit
  - [ ] Only visit sitter can upload photos

#### Frontend Tasks:
- [ ] **Review Form**
  - [ ] Star rating component
  - [ ] Comment textarea
  - [ ] Submit review

- [ ] **Reviews Display**
  - [ ] Review card component
  - [ ] Sitter response
  - [ ] Review list on sitter page
  - [ ] Average rating display

- [ ] **Visit Photos**
  - [ ] Photo upload (sitter during/after visit)
  - [ ] Photo gallery
  - [ ] Caption input

#### Testing:
- [ ] Unit tests: rating calculation
- [ ] E2E tests: complete visit → leave review → sitter responds

**Deliverables:**
- ✅ Owner gali palikti review
- ✅ Sitter gali atsakyti
- ✅ Sitter gali įkelti visit photos
- ✅ Rating calculation veikia

---

### ✅ Etapas 8: Notifications (3-4 dienos)
**Tikslas:** In-app ir email pranešimai

#### Backend Tasks:
- [ ] **Notification Module**
  - [ ] Notification model
  - [ ] Create notification service
  - [ ] Get notifications endpoint
  - [ ] Mark as read endpoint
  - [ ] Mark all as read endpoint

- [ ] **Notification Types**
  - [ ] New booking request
  - [ ] Booking status changed
  - [ ] New message
  - [ ] New review
  - [ ] Payment confirmation

- [ ] **Email Notifications**
  - [ ] Email templates
  - [ ] Send email on important events
  - [ ] User notification preferences

- [ ] **WebSocket Integration**
  - [ ] Emit notification event
  - [ ] Real-time notification delivery

#### Frontend Tasks:
- [ ] **Notification UI**
  - [ ] Notification bell icon
  - [ ] Unread count badge
  - [ ] Notification dropdown
  - [ ] Notification item component

- [ ] **Notification Center**
  - [ ] Full notifications page
  - [ ] Mark as read
  - [ ] Clear all
  - [ ] Notification filters

- [ ] **Real-time Updates**
  - [ ] Socket listener for notifications
  - [ ] Toast notifications
  - [ ] Sound/vibration (optional)

#### Testing:
- [ ] Unit tests: notification creation
- [ ] E2E tests: trigger event → receive notification

**Deliverables:**
- ✅ In-app notifications veikia
- ✅ Email notifications veikia
- ✅ Real-time delivery veikia

---

### ✅ Etapas 9: Admin Panel (3-4 dienos)
**Tikslas:** Admin panelė valdymui

#### Backend Tasks:
- [ ] **Admin Module**
  - [ ] Admin guard (role check)
  - [ ] Get users endpoint
  - [ ] Block/unblock user endpoint
  - [ ] Verify sitter endpoint
  - [ ] Hide/unhide review endpoint
  - [ ] Dashboard stats endpoint

- [ ] **Statistics**
  - [ ] Total users, sitters, visits
  - [ ] Revenue stats
  - [ ] Active bookings
  - [ ] Recent signups

#### Frontend Tasks:
- [ ] **Admin Dashboard**
  - [ ] Stats cards
  - [ ] Charts (optional - recharts)
  - [ ] Recent activity

- [ ] **User Management**
  - [ ] Users table
  - [ ] Search users
  - [ ] Block/unblock button
  - [ ] User details modal

- [ ] **Sitter Verification**
  - [ ] Pending sitters list
  - [ ] Verify button
  - [ ] Rejection reason

- [ ] **Review Moderation**
  - [ ] Flagged reviews list
  - [ ] Hide/unhide review

#### Testing:
- [ ] Unit tests: admin authorization
- [ ] E2E tests: admin actions

**Deliverables:**
- ✅ Admin gali blokuoti vartotojus
- ✅ Admin gali verifikuoti sitterius
- ✅ Admin gali matyti statistiką

---

### ✅ Etapas 10: Polish & Deployment (5-7 dienos)
**Tikslas:** Užbaigti MVP ir deploy'inti

#### Backend Tasks:
- [ ] **Error Handling**
  - [ ] Global exception filter
  - [ ] Custom error messages
  - [ ] Logging

- [ ] **Performance**
  - [ ] Query optimization
  - [ ] Caching (Redis)
  - [ ] Image optimization

- [ ] **Documentation**
  - [ ] API documentation (Swagger)
  - [ ] README update
  - [ ] Environment setup guide

- [ ] **Production Config**
  - [ ] Environment variables
  - [ ] Database backups
  - [ ] HTTPS configuration

#### Frontend Tasks:
- [ ] **UI Polish**
  - [ ] Responsive design
  - [ ] Loading states
  - [ ] Error boundaries
  - [ ] Empty states
  - [ ] Animations (Framer Motion)

- [ ] **Accessibility**
  - [ ] Keyboard navigation
  - [ ] ARIA labels
  - [ ] Color contrast

- [ ] **Performance**
  - [ ] Code splitting
  - [ ] Lazy loading
  - [ ] Image optimization

- [ ] **SEO**
  - [ ] Meta tags
  - [ ] Open Graph
  - [ ] Sitemap

#### Deployment:
- [ ] **Backend**
  - [ ] Build Docker image
  - [ ] Deploy to Railway/Render/AWS
  - [ ] Configure environment
  - [ ] Database migration

- [ ] **Frontend**
  - [ ] Build production
  - [ ] Deploy to Vercel/Netlify
  - [ ] Configure environment

- [ ] **Infrastructure**
  - [ ] SSL certificates
  - [ ] Domain setup
  - [ ] Monitoring (Sentry)

#### Testing:
- [ ] Full E2E test suite
- [ ] Load testing
- [ ] Security audit

**Deliverables:**
- ✅ Production-ready MVP
- ✅ Deployed ir veikiantis
- ✅ Documentation užbaigta

---

## 📊 Timeline Summary

| Etapas | Trukmė | Akumuliuota |
|--------|--------|-------------|
| 0. Setup | 1-2 d | 1-2 d |
| 1. Auth | 5-7 d | 6-9 d |
| 2. Profile & Pets | 4-5 d | 10-14 d |
| 3. Sitters & Search | 5-7 d | 15-21 d |
| 4. Bookings | 5-7 d | 20-28 d |
| 5. Payments | 4-5 d | 24-33 d |
| 6. Chat | 5-7 d | 29-40 d |
| 7. Reviews & Photos | 3-4 d | 32-44 d |
| 8. Notifications | 3-4 d | 35-48 d |
| 9. Admin | 3-4 d | 38-52 d |
| 10. Polish & Deploy | 5-7 d | 43-59 d |

**Total: ~43-59 darbo dienų (~9-12 savaičių)**

---

## 🎯 MVP Scope Decision

### Must Have (MVP):
- ✅ Auth + Email verification
- ✅ Profile + Pets
- ✅ Sitter search
- ✅ Bookings
- ✅ Payments (Stripe test mode)
- ✅ Chat
- ✅ Reviews
- ✅ Notifications (in-app + email)
- ✅ Admin panel (basic)

### Should Have (Post-MVP):
- Map view
- Advanced analytics
- Push notifications
- SMS notifications
- Multiple languages
- Advanced availability (recurring schedules)
- Background checks for sitters
- Insurance integration

### Could Have (Future):
- Mobile app (React Native)
- Video calls
- AI matching algorithm
- Subscription plans
- Referral program
- Pet health tracking

---

## 🚀 Next Steps

1. **Pradėti Etapą 0** - Setup
2. **Sekti roadmap** nuo 1 iki 10
3. **Testing** po kiekvieno etapo
4. **Code review** prieš merginant
5. **Deploy** MVP po Etapo 10

Ar pasiruošęs pradėti kurti? 🎉
