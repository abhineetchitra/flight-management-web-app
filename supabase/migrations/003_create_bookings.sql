create table public.bookings (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users (id)
    on delete cascade,

  flight_id uuid not null
    references public.flights (id)
    on delete restrict,

  seat_id uuid not null
    references public.seats (id)
    on delete restrict,

  status text not null default 'pending',

  booked_at timestamptz not null default now(),

  total_price numeric(12, 2) not null
    check (total_price >= 0),

  pnr_code text not null unique,

  created_at timestamptz default now(),

  constraint bookings_status_check
    check (status in ('pending', 'confirmed', 'cancelled'))
);