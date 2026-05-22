@AGENTS.md

# Flight Management Web App

## Project Overview
A Next.js 16 flight booking application with Supabase auth, Zustand state management, and shadcn/ui components.

## Tech Stack
- **Framework**: Next.js 16 with App Router (React 19)
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Auth**: Supabase SSR (`@supabase/ssr`)
- **State**: Zustand v5 (`zustand`) with persist middleware
- **Forms**: React Hook Form + Zod v4 + `@hookform/resolvers`
- **Database**: Supabase (`@supabase/supabase-js`)
- **Icons**: Lucide React
- **Notifications**: Sonner

## File Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (main)/            # Booking flow routes (no auth required)
│   │   ├── flights/       # Flight search & selection
│   │   ├── booking/       # Booking review before payment
│   │   ├── passenger-details/  # Passenger info form
│   │   └── confirmation/  # Booking confirmation with PNR
│   ├── (protected)/       # Auth-gated routes
│   │   ├── bookings/      # User's bookings list
│   │   └── layout.tsx     # Auth guard + user context
│   └── auth/              # Login/logout/signup
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── SeatGrid.tsx       # Seat selection component
│   └── AuthProvider.tsx   # Supabase auth context
├── lib/
│   └── supabase/          # Supabase client (browser) + server helpers
├── store/                 # Zustand stores
│   ├── useFlightStore.ts  # Selected flight, passengers, seats
│   └── useUserStore.ts    # Auth user state
└── middleware.ts          # Supabase auth middleware
```

## Key Patterns

**Route groups**: `(main)` routes bypass auth; `(protected)` routes require auth via middleware.

**State management**: Zustand stores use `persist` to sync state across page navigation. `useFlightStore.ts` holds the booking flow state (selected flight, passenger details, seat selection). Always wait for rehydration before accessing persisted state — use `_hasHydrated` flag and read state directly via `getState()` on server to avoid SSR/hydration mismatches.

**Forms**: React Hook Form with Zod resolver and Zod v4 schemas defined inline or in a `lib/schemas/` file if reused.

**Supabase**: Client-side uses `createClient` from `lib/supabase/client.ts`. Server components use `createServerClient` from `@supabase/ssr`.

## Commands
- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run lint` — ESLint