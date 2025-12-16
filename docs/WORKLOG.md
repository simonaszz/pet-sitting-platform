# Worklog (KISS + File organization + lint/typing)

## Scope and intent

### Goals

- Make the codebase easier to understand and maintain (KISS).
- Improve file organization/classification (clear module boundaries, consistent placement of helpers).
- Fix TypeScript/ESLint issues (remove `any`, fix React hooks deps, resolve unsafe assignments).

### Explicit non-goals

- No new product features.
- No speculative abstractions (YAGNI is deferred unless needed to fix KISS/organization/lint).

---

## High-level outcome

- Backend: reduced Prisma query duplication, improved type safety around auth/current user, cleaned unsafe patterns; lint fixed.
- Frontend: fixed lint, removed `any` in pages, fixed `useEffect` deps, fixed Fast Refresh export rule for Toast, added a small helper for Axios error messages, aligned frontend types with backend response shapes; lint/build fixed.

---

## Backend changes (what / where / why)

### 1) Prisma query presets (reduce duplication)

**What**

Centralized repeated Prisma `include/select` objects into module-local preset files.

**Where**

- `backend/src/modules/visit/visit.prisma.ts`
  - `visitIncludeForOwnerList`
  - `visitIncludeForSitterList`
  - `visitIncludeForSitterStatusUpdate`
- `backend/src/modules/sitter-profile/sitter-profile.prisma.ts`
  - `sitterProfileIncludeWithUserPublic`
  - `sitterProfileIncludeForCreateOrUpdate`
  - `sitterProfileIncludeForList`

**Why (KISS + file org)**

- Removes copy/paste blocks.
- Makes query “shape” explicit and reusable.
- Keeps presets close to the module (no global dumping ground).

### 2) Visit service simplification

**What**

Refactored `VisitService` to use the query presets and extracted small helper methods.

**Where**

- `backend/src/modules/visit/visit.service.ts`
  - Uses presets from `visit.prisma.ts`
  - Extracted helpers:
    - `assertPetOwnedByOwner(...)`
    - `getSitterUserIdByProfileId(...)`

**Why (KISS)**

- `create()` becomes a readable linear flow.
- Validation/lookup logic is clearly named and unit-sized.

### 3) Current user typing (remove `any` in controllers/decorators)

**What**

Introduced a typed `CurrentUser` shape and used it in controllers and decorator.

**Where**

- `backend/src/common/types/current-user.type.ts`
- Controllers updated to use type-only import:
  - `backend/src/modules/auth/auth.controller.ts`
  - `backend/src/modules/visit/visit.controller.ts`
  - `backend/src/modules/pet/pet.controller.ts`
  - `backend/src/modules/sitter-profile/sitter-profile.controller.ts`
- Decorator typed request:
  - `backend/src/common/decorators/current-user.decorator.ts`

**Why (lint + TS correctness)**

- Eliminates `no-unsafe-assignment` / `no-unsafe-member-access`.
- Makes controller signatures reflect actual runtime data.

### 4) JWT strategy payload typing

**What**

Replaced `payload: any` with a typed `JwtPayload`.

**Where**

- `backend/src/modules/auth/strategies/jwt.strategy.ts`

**Why**

- Avoids unsafe access patterns.
- Documents what is inside the JWT.

### 5) Prisma JSON DTO typing

**What**

Replaced `availability?: any` with Prisma-compatible JSON type.

**Where**

- `backend/src/modules/sitter-profile/dto/create-sitter-profile.dto.ts` (`Prisma.InputJsonValue`)
- `backend/src/modules/sitter-profile/dto/update-sitter-profile.dto.ts` (`Prisma.InputJsonValue`)

**Why**

- Avoids type mismatch when passing DTOs to Prisma.

### 6) PrismaService cleanDatabase safety

**What**

Removed `as any` / unsafe dynamic access by using `unknown` + type guards.

**Where**

- `backend/src/database/prisma.service.ts`

---

## Frontend changes (what / where / why)

### 1) Toast: Fast Refresh export rule fix

**Problem**

ESLint `react-refresh/only-export-components` triggers if a file exports a React component plus non-component utilities.

**What**

Split Toast implementation into a provider file + hook file + context file.

**Where**

- `frontend/src/hooks/ToastContext.ts` (context + types)
- `frontend/src/hooks/ToastProvider.tsx` (exports only `ToastProvider`)
- `frontend/src/hooks/useToast.tsx` (exports only `useToast`)
- `frontend/src/main.tsx` updated to import `ToastProvider` from `./hooks/ToastProvider`

**Why (KISS + correct tooling)**

- Avoids Fast Refresh issues.
- Keeps hook logic separate from component exports.

### 2) Unified API error message helper

**What**

Added a small helper to consistently extract Axios backend messages without using `any`.

**Where**

- `frontend/src/utils/apiError.ts` (`getApiErrorMessage(error: unknown, fallback: string)`)

**Why**

- Removes repeated `err.response?.data?.message` logic.
- Eliminates `catch (err: any)`.

### 3) Pages: remove `any`, fix `useEffect` dependency warnings

**What**

- `catch (err: any)` → `catch (err: unknown)` + `getApiErrorMessage(...)`
- `useEffect` warnings fixed via `useCallback` loaders and correct deps.
- Removed unused variables.

**Where**

- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`
- `frontend/src/pages/MyBookingsPage.tsx`
- `frontend/src/pages/MyJobsPage.tsx`
- `frontend/src/pages/MySitterProfilePage.tsx`
- `frontend/src/pages/PetsPage.tsx`
- `frontend/src/pages/SitterDetailPage.tsx`
- `frontend/src/pages/SittersPage.tsx`

### 4) Frontend type alignment (fix “type mismatches”)

#### 4.1 Sitter profile fields used by UI

**What**

Made missing fields optional on the frontend type (no new features; just type alignment).

**Where**

- `frontend/src/services/sitter.service.ts`
  - `isVerified?: boolean`
  - `responseTime?: number`
  - `availability?: unknown`

#### 4.2 Auth user response shape alignment

**Problem**

Backend returns different user shapes:

- `/auth/login` and `/auth/register`: `user { id, email, name, role }`
- `/auth/me`: includes `phone`, `avatar`, `isEmailVerified`, `createdAt`.

**What**

- Made `phone/avatar/isEmailVerified` optional in the frontend `AuthResponse` and store `User` type.
- Typed `/auth/me` response explicitly.

**Where**

- `frontend/src/store/auth.store.ts`
  - `phone?: string | null`
  - `avatar?: string | null`
  - `isEmailVerified?: boolean`
- `frontend/src/services/auth.service.ts`
  - `AuthResponse.user` optional fields
  - `CurrentUserResponse` type used in `getCurrentUser()`

**Why (KISS + correctness)**

- Matches real backend behavior.
- Avoids lying types or `any`.

---

## Verification checklist (commands)

### Frontend

Run in `frontend/`:

- `npm run lint`
- `npm run build`

Notes:

- If you run these in repo root, you will get `ENOENT package.json`.
- `npm install` must be run inside `frontend/` when dependencies are missing.

### Backend

Run in `backend/`:

- `npm run lint`
- `npm run build`

---

## How to keep following these rules (daily checklist)

### KISS

- If a method is > ~30–40 lines and does validation + DB + mapping, split into helpers.
- If the same object literal appears 2+ times (e.g., Prisma `include/select`), centralize it.

### File organization

- Backend: keep module-specific helpers inside that module (`modules/<feature>/...`).
- Frontend: keep API logic in `services/`, UI logic in `pages/`, reusable UI in `components/`, hooks in `hooks/`, helpers in `utils/`.

### Lint/typing hygiene

- Prefer `unknown` over `any` and narrow with guards (`axios.isAxiosError`).
- Fix `useEffect` deps warnings properly: `useCallback` for loaders + include deps.

---

## Notes

- This document describes refactors and lint/type fixes only. No product functionality was added.
