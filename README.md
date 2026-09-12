# 🎬 CineBook — Production-Ready Cinema Ticket-Booking Platform

**CineBook** is an enterprise-grade, full-stack cinema ticket booking web application built for deployment on **Vercel** with **Neon Serverless PostgreSQL**, **Drizzle ORM**, **Tailwind CSS**, dynamic seat locking concurrency, test payment processing, cryptographically signed digital QR tickets, and a comprehensive cinema administration suite.

Built by the **CineBook Multi-Agent Engineering Team**:
- **Agent 1 (App Agent)**: Responsive Next.js App Router frontend, curved auditorium seat selection engine, live hold timers, checkout, digital boarding pass tickets, customer history, and the Cinema Admin Control Room.
- **Agent 2 (Database Engine Agent)**: Neon PostgreSQL schema, Drizzle ORM models, migration pipeline, seed data generator, atomic seat hold/reservation transactions (`FOR UPDATE` locking), payment idempotency, and automated expired-seat release engine.
- **Agent 3 (QA Agent)**: Complete automated verification suite testing auth, race conditions (concurrent double-booking prevention), hold TTL release, pricing/tax calculations, payment idempotency/webhooks, access control isolation, and build integrity.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14 App Router (TypeScript) | Full-stack server components, client interactivity, and Edge/Serverless APIs |
| **Styling** | Tailwind CSS + Vanilla CSS | Cinema dark mode (Obsidian, Amber Gold, Cinema Crimson, Glassmorphism) |
| **Database** | Neon Serverless PostgreSQL | Pooled serverless PostgreSQL with high-concurrency connection scaling |
| **ORM** | Drizzle ORM & Drizzle Kit | Type-safe schema definition, relations, migrations, and query builder |
| **Authentication** | Jose JWT & BcryptJS | Secure HTTP-only cookie sessions with role-based access control (Customer / Admin) |
| **Concurrency Engine** | Atomic Mutex & DB Row Locks | Zero double-bookings under concurrent race conditions; 10-minute hold TTL |
| **Payment Gateway** | Dual-Mode (Stripe Test / CinePay) | Test cards (Success, Declined, Insufficient Funds) + Idempotency keys |
| **Digital Tickets** | HMAC-Signed QR Engine | Scannable, tamper-proof admission passes with Apple Wallet-style UI |
| **Scheduled Tasks** | Vercel Cron | Automated expired seat-hold release endpoint protected by `CRON_SECRET` |

---

## 📊 Database Architecture (14 Tables)

All primary keys use **UUIDs (`gen_random_uuid()`)**, timestamps are stored in **UTC**, and currency amounts are strictly stored as **integer minor units (cents)** to eliminate floating-point rounding errors.

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : places
    USERS ||--o{ PAYMENTS : executes
    CINEMAS ||--o{ AUDITORIUMS : contains
    AUDITORIUMS ||--o{ SEATS : has
    MOVIES ||--o{ MOVIE_GENRES : categorized_by
    GENRES ||--o{ MOVIE_GENRES : belongs_to
    MOVIES ||--o{ SHOWTIMES : scheduled_for
    AUDITORIUMS ||--o{ SHOWTIMES : hosts
    SHOWTIMES ||--o{ SHOWTIME_SEATS : initializes
    SEATS ||--o{ SHOWTIME_SEATS : maps_to
    BOOKINGS ||--o{ BOOKING_ITEMS : contains
    SHOWTIME_SEATS ||--o{ BOOKING_ITEMS : reserves
    BOOKINGS ||--o{ PAYMENTS : billed_for
    BOOKINGS ||--o{ TICKETS : issues
    BOOKING_ITEMS ||--o{ TICKETS : pairs_with
```

### Relational Tables Summary
1. `users`: UUID PK, unique email, bcrypt password hash, role (`CUSTOMER`, `ADMIN`).
2. `genres`: UUID PK, name, unique slug.
3. `movies`: UUID PK, title, slug, synopsis, poster URL, backdrop URL, trailer URL, duration, rating (`PG`, `PG-13`, `R`), language, release date.
4. `movie_genres`: Composite PK (`movieId`, `genreId`).
5. `cinemas`: UUID PK, name, slug, address, city, state, postal code, phone, email, amenities.
6. `auditoriums`: UUID PK, `cinemaId`, name, screen type (`IMAX`, `DOLBY_CINEMA`, `2D`), total seats. **Unique on `(cinemaId, name)`**.
7. `seats`: UUID PK, `auditoriumId`, row, number, seat type (`STANDARD`, `VIP`, `RECLINER`, `ACCESSIBLE`). **Unique on `(auditoriumId, row, number)`**.
8. `showtimes`: UUID PK, `movieId`, `auditoriumId`, start time, end time, base price in cents, format.
9. `showtime_seats`: UUID PK, `showtimeId`, `seatId`, status (`AVAILABLE`, `HELD`, `BOOKED`, `BLOCKED`), `heldUntil`, `heldByBookingId`, `version`. **Unique on `(showtimeId, seatId)`**.
10. `bookings`: UUID PK, unique reference (`CB-XXXXXX`), `userId`, `showtimeId`, subtotal, fees ($1.50/seat), taxes (8%), total cents, status (`PENDING`, `CONFIRMED`, `CANCELLED`, `EXPIRED`, `REFUNDED`), `expiresAt`, `idempotencyKey`.
11. `booking_items`: UUID PK, `bookingId`, `showtimeSeatId`, `seatId`, price in cents, seat label.
12. `payments`: UUID PK, `bookingId`, `userId`, amount in cents, currency, provider (`STRIPE`, `TEST_PAYMENT`), transaction ID, status (`PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED`), `idempotencyKey`.
13. `tickets`: UUID PK, `bookingId`, `bookingItemId`, unique code (`TCK-XXXX-YY`), HMAC signed QR payload, `isUsed`, `usedAt`.
14. `audit_logs`: UUID PK, `userId`, action, entity type, entity ID, metadata JSON, IP address, timestamp.

---

## 🔒 Concurrency & 10-Minute Hold TTL Protocol

1. **Step 1 (Hold Request)**: A patron selects up to 8 seats on the interactive curved seat map and clicks **Hold & Checkout**.
2. **Step 2 (Atomic Lock & Validation)**: The server runs an atomic transaction with row locking on `showtime_seats`. It verifies that every requested seat is currently `AVAILABLE` (or has an expired hold `held_until < NOW()`).
3. **Step 3 (Conflict Rejection)**: If another user took any of the seats a millisecond earlier, the transaction immediately rolls back and returns **HTTP 409 Conflict**.
4. **Step 4 (Hold Creation)**: The server locks the seats to `HELD`, sets `held_until = NOW() + 10 minutes`, creates a `PENDING` booking with `expires_at = NOW() + 10 minutes`, and returns the booking ID.
5. **Step 5 (Hold Countdown)**: On the checkout page, a visual countdown timer tracks the remaining time. If the timer expires before payment, the session is invalidated and seats are restored.
6. **Step 6 (Payment & Ticket Issuance)**: Upon verified payment, the server locks the seats permanently to `BOOKED`, marks the booking `CONFIRMED`, and mints cryptographically signed QR admission passes.
7. **Step 7 (Automated Expired Release Cron)**: An idempotent endpoint (`/api/cron/release-holds`) runs every minute via Vercel Cron (protected by `CRON_SECRET`), unlocking abandoned seats back to `AVAILABLE`.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js 18+ (tested on Node v20 & v24)
- npm or pnpm

### 2. Installation
```bash
git clone <repository-url>
cd cinebook
npm install
```

### 3. Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```

Environment variables:
```env
# Database (Neon PostgreSQL connection pooled for Vercel Functions)
DATABASE_URL="postgresql://neondb_owner:mock_secret@localhost:5432/cinebook"
DIRECT_URL="postgresql://neondb_owner:mock_secret@localhost:5432/cinebook"

# Authentication & Session Security
JWT_SECRET="cinebook_super_secret_jwt_key_production_grade_32chars_minimum"

# Vercel Cron Security Secret
CRON_SECRET="cinebook_cron_secret_auth_token_99482"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Payments (Dual-mode: Built-in CinePay Sandbox active by default)
STRIPE_SECRET_KEY="sk_test_mock_stripe_key"
STRIPE_WEBHOOK_SECRET="whsec_mock_stripe_webhook_key"
```

### 4. Seed Realistic Data
Populate blockbusters (Dune: Part Two, Oppenheimer, Interstellar), multiplex cinemas, auditoriums, 400+ seats, and upcoming showtimes:
```bash
npm run db:seed
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated QA Verification Suite (Agent 3)

Run the comprehensive automated test harness:
```bash
npm run test:qa
```

### Test Suites Included:
1. **`test-concurrency.ts`**: Fires 10 simultaneous parallel async requests attempting to reserve the exact same seat (`Showtime S1, Seat Row A Seat 1`). Confirms strictly 1 succeeds (HTTP 201) and 9 are rejected (HTTP 409).
2. **`test-hold-expiration.ts`**: Creates a 10-minute hold, simulates expiration, executes the release cron, and confirms seats return to `AVAILABLE`.
3. **`test-payment-idempotency.ts`**: Tests successful payments, declined cards, and duplicate webhook delivery with idempotency keys.
4. **`test-rbac.ts`**: Verifies user isolation (User B cannot access or cancel User A's booking) and tests cancellation eligibility rules (>2h before showtime).
5. **`End-to-End Lifecycle`**: Complete journey (Browse -> Seat Selection -> Hold -> Checkout -> Pay -> Ticket Generation -> Admin QR Scanner Check-in).

---

## 🌐 Deploying to Vercel

### Step 1: Push Repository to GitHub / GitLab
```bash
git init
git add .
git commit -m "feat: CineBook production release"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 2: Import Project in Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and select your repository.
2. Select **Next.js** as Framework Preset.

### Step 3: Provision Neon Serverless PostgreSQL
1. In the Vercel project dashboard, navigate to the **Storage** tab.
2. Click **Create Database** and choose **Neon (Serverless Postgres)** from the Vercel Marketplace.
3. Select your preferred region (e.g. `us-east-1` / `us-east-2`).
4. Vercel will automatically inject:
   - `DATABASE_URL` (Connection Pooled URL for Vercel Functions)
   - `DIRECT_URL` (Unpooled URL for Drizzle Migrations)

### Step 4: Configure Production Environment Variables
In **Project Settings -> Environment Variables**, add:
- `JWT_SECRET`: A secure 32+ character random string.
- `CRON_SECRET`: A secure random secret matching your Vercel Cron header.
- `NEXT_PUBLIC_APP_URL`: Your production Vercel domain (e.g., `https://cinebook.vercel.app`).
- `STRIPE_SECRET_KEY`: (Optional) Your Stripe test or live secret key.
- `STRIPE_WEBHOOK_SECRET`: (Optional) Your Stripe webhook signing secret.

### Step 5: Deploy
Click **Deploy**. Vercel will build the production bundle and configure the cron job specified in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/release-holds",
      "schedule": "* * * * *"
    }
  ]
}
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Customer** | `user@cinebook.com` | `UserPassword123!` | Seat booking, checkout, QR tickets, history, cancellations |
| **Cinema Admin** | `admin@cinebook.com` | `AdminPassword123!` | Executive dashboard, analytics, live QR admission scanner, audit logs |

*(One-click instant credential buttons are also provided on the `/login` screen).*
