create table public.seats (
  id uuid primary key default gen_random_uuid(),

  flight_id uuid not null
    references public.flights (id)
    on delete cascade,
  seat_number text not null,
  class text not null,
  is_available boolean not null default true,
  extra_fee numeric(12, 2) not null default 0
    check (extra_fee >= 0),
  created_at timestamptz default now(),

  constraint seats_class_check
    check (class in ('economy', 'business', 'first')),
  constraint seats_flight_seat_unique
    unique (flight_id, seat_number)
);