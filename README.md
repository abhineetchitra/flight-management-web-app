# ✈️ SkyBook — Flight Management Web App

A full-stack, production-grade flight booking web application built as part of an internship technical assignment.

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
Test User:
Email:    test@flight.test
Password: TestPassword123!
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

---

## Trade-offs & What I Would Have Done Differently

This section documents honest decisions made under time constraints, and how I would improve each one given more time.

### 1. PWA (Bonus Task) — Not Implemented

**What I did:** Focused on core functionality — search, booking, seat map, cancel, reschedule — over the PWA bonus.

**What I would have done:** Configured `next-pwa` with a `manifest.json` (name, icons at 192×192 and 512×512, `display: standalone`). Added a `StaleWhileRevalidate` cache strategy for flight search results and `CacheFirst` for static assets. Built an `/offline` fallback page and an install prompt banner for mobile visitors. The My Bookings page would cache the last API response so users can read it without connectivity.

**Trade-off:** PWA setup introduces `next-pwa` config complexity and service worker debugging that is time-consuming to get right. Given a full week, I would have implemented and Lighthouse-audited it properly.

---

### 2. Form Validation — Basic vs. Zod + react-hook-form

**What I did:** Used controlled inputs with manual state validation on the passenger details form.

**What I would have done:** Integrated `zod` schema validation with `react-hook-form` and shadcn's `Form` component. This gives field-level error messages, better accessibility (`aria-invalid`, `aria-describedby`), and a single source of truth for validation rules. The schema would also be shared with the RPC input types.

**Trade-off:** `react-hook-form` + `zod` adds setup time but pays off on any form with more than 3 fields. For a production app I would always use it.

---

### 3. Reschedule Fee — Hardcoded vs. Dynamic

**What I did:** The reschedule fee is hardcoded as ₹1500 in the RPC function.

**What I would have done:** Calculated the fee dynamically as the price difference between the old and new flight (`new_flight.base_price - old_flight.base_price`), with a minimum floor of ₹500. This surfaces the actual cost difference to the user before they confirm, making it a more honest UX.

**Trade-off:** Dynamic fee calculation requires the RPC to either preview the fee before committing, or return it in the same response. The current single-call design is simpler but less transparent to the user.

---

### 4. Seat Map — Flat Grid vs. Real Aircraft Layout

**What I did:** Rendered a flat grid of seats grouped by class (First / Business / Economy) with colour coding.

**What I would have done:** Modelled the actual aircraft layout — rows with an aisle gap between column groups (e.g. 3-3 for economy, 2-2 for business) — so the grid visually resembles a real cabin. Each seat would be labelled with its row number and column letter (1A, 1B, 1C | 1D, 1E, 1F).

**Trade-off:** A proper aisle-split layout requires knowing the aircraft configuration per flight, which is not in the current schema. I would add an `aircraft_config` JSON column to the `flights` table to drive it.

---

### 5. Multi-Passenger Booking — Not Implemented

**What I did:** The booking flow supports one passenger per booking.

**What I would have done:** If `passengerCount > 1` from the search query, looped through seat selection and passenger details once per passenger, collecting all into an array before a single batched RPC call that reserves all seats atomically. The `passengers` table already supports this — one row per passenger linked to a booking.

**Trade-off:** Multi-passenger flow significantly increases state complexity in `useFlightStore` (array of seats, array of passenger forms, multi-step validation). Scoping to single-passenger first was the right call for time, but the schema supports expansion.
