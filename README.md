# ✈️ SkyBook — Flight Management Web App

A full-stack, production-grade flight booking web application built as part of an internship technical assignment.

**Live Demo:** _Deploy to Vercel and add URL here_

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend & API | Next.js 14 (App Router) |
| Database & Auth | Supabase (PostgreSQL + Auth + Realtime) |
| State Management | Zustand with `persist` middleware |
| Styling | Tailwind CSS + shadcn/ui |
| Language | TypeScript |

---

## Features

- **Flight Search** — Search by origin, destination, date, and passenger count
- **Flight Results** — Browse flights with price, duration, and class options
- **Interactive Seat Map** — Visual cabin grid with live availability via Supabase Realtime
- **Passenger Details** — Collect name, passport number, nationality, and DOB
- **Booking Confirmation** — PNR code, flight details, and seat assignment
- **My Bookings** — View all bookings with status badges
- **Cancel Booking** — Atomic RPC with 2-hour departure rule enforced at DB level
- **Reschedule Booking** — Same-route alternative flight selection with fee calculation
- **Auth** — Supabase email/password authentication with protected routes
- **Responsive** — Mobile-first design, seat map scrollable on touch devices

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/abhineetchitra/flight-management-web-app.git
cd flight-management-web-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get both values from: **Supabase Dashboard → Project Settings → API**

### 4. Run migrations in Supabase

Go to your **Supabase SQL Editor** and run the files in `/supabase/migrations` in order:

```
001_create_flights.sql
002_create_seats.sql
003_create_bookings.sql
004_create_passengers.sql
005_create_reschedules.sql
006_create_indexes.sql
007_enable_rls.sql
008_create_policies.sql
009_create_rpc_reserve_seat.sql
010_create_rpc_cancel_booking.sql
011_create_rpc_reschedule_booking.sql
012_create_cancellation_trigger.sql
013_seed_flights.sql
014_seed_seats.sql
015_seed_test_user.sql
```

> **Important:** Disable "Confirm Email" in Supabase Auth settings for easier local testing:
> Supabase Dashboard → Authentication → Providers → Email → Disable "Confirm email"

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Test Account

A test user is seeded via `015_seed_test_user.sql`. After running that migration, you can also sign up manually at `/auth/signup`.

```
Email:    test@skybook.dev
Password: Test@1234
```

---

## Supabase Project Config

| Setting | Value |
|---|---|
| Auth Provider | Email / Password |
| Confirm Email | Disabled (for testing) |
| RLS | Enabled on all tables |
| Realtime | Enabled on `seats` table |

### Tables

- `flights` — flight details, routes, pricing
- `seats` — per-flight seat map with class and availability
- `bookings` — user bookings with status and PNR
- `passengers` — passenger details linked to bookings
- `reschedules` — reschedule history with fee tracking

### RPC Functions

| Function | Purpose |
|---|---|
| `reserve_seat_and_book` | Atomic seat lock + booking insert, prevents double-booking |
| `cancel_booking_and_free_seat` | Atomic cancel + seat release |
| `reschedule_booking_same_route` | Same-route rescheduling with fee calculation |

### DB Constraints

- Cancellation trigger (`012_create_cancellation_trigger.sql`) rejects cancellations within **2 hours of departure** at the database level.

---

## Zustand Store Structure

The app uses two separate Zustand stores.

### `useFlightStore` — `src/store/useFlightStore.ts`

Manages the entire booking journey state.

| Field | Type | Persisted | Notes |
|---|---|---|---|
| `searchQuery` | `SearchQuery \| null` | ✅ Yes | Origin, destination, date, passenger count |
| `selectedFlight` | `Flight \| null` | ✅ Yes | Full flight object selected from results |
| `selectedSeat` | `Seat \| null` | ✅ Yes | Optimistically selected before DB write confirms |
| `bookingStep` | `BookingStep` | ✅ Yes | Current step in the booking flow |
| `passengerData` | `PassengerData \| null` | ✅ Yes (partial) | `passport_no` **excluded** via `partialize` |
| `_hasHydrated` | `boolean` | ❌ No | Internal hydration flag — never stored |

**Key design decisions:**
- `partialize` excludes `passport_no` from `localStorage` to avoid storing sensitive data
- `onRehydrateStorage` sets `_hasHydrated: true` once localStorage is loaded — used with `useSyncExternalStore` to prevent SSR/CSR mismatch
- `reset()` clears all state — triggered on booking cancellation or logout
- Optimistic seat selection: `setSelectedSeat()` is called before the Supabase RPC write confirms

### `useUserStore` — `src/store/useUserStore.ts`

Manages Supabase auth session and cached bookings.

| Field | Type | Persisted | Notes |
|---|---|---|---|
| `session` | `Session \| null` | ✅ Partial | Only `access_token` stored, not full session |
| `user` | `User \| null` | ❌ No | Fetched fresh from Supabase on load |
| `bookings` | `CachedBooking[]` | ❌ No | Fetched fresh from DB on load |

**Key design decisions:**
- `partialize` persists **only** `access_token` — never stores full user data or bookings
- `reset()` clears session, user, and bookings — called on logout

---

## Project Structure

```
src/
├── app/
│   ├── (main)/              # Protected routes (layout with auth check)
│   │   ├── page.tsx         # Flight search
│   │   ├── flights/         # Flight results
│   │   ├── booking/         # Seat selection
│   │   ├── passenger-details/
│   │   ├── confirmation/
│   │   └── my-bookings/
│   └── auth/
│       ├── login/
│       ├── signup/
│       └── verify-email/
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── SeatGrid.tsx
│   ├── CancelBookingButton.tsx
│   ├── RescheduleBookingButton.tsx
│   └── LogoutButton.tsx
├── lib/
│   └── supabase/            # Supabase client (server + client)
├── store/
│   ├── useFlightStore.ts
│   └── useUserStore.ts
└── middleware.ts             # Auth route protection

supabase/
└── migrations/              # 15 SQL migration files
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

---

## Submission Checklist

- [x] Public GitHub repository with descriptive commit history
- [x] `.env.example` with all Supabase environment variables listed
- [x] Supabase migration SQL files in `/supabase/migrations`
- [x] Seed script with flights, seats, and test user (`013` → `015` migrations)
- [x] README with local setup steps, Supabase config, and Zustand store explanation
- [ ] Deployed Vercel link _(add after deployment)_
- [ ] Lighthouse PWA screenshot _(bonus task)_
