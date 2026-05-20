create table public.reschedules (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null
    references public.bookings (id)
    on delete cascade,
  old_flight_id uuid not null
    references public.flights (id)
    on delete restrict,
  new_flight_id uuid not null
    references public.flights (id)
    on delete restrict,
  requested_at timestamptz not null default now(),
  fee_charged numeric(12, 2) not null default 0
    check (fee_charged >= 0),
  created_at timestamptz default now(),
  constraint reschedules_different_flights_check
    check (old_flight_id <> new_flight_id)
);