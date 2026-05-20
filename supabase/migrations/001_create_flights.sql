create table public.flights (
  id uuid primary key default gen_random_uuid(),
  flight_no text not null unique,
  origin text not null,
  destination text not null,

  departs_at timestamptz not null,
  arrives_at timestamptz not null,
  aircraft_type text,

  status text not null default 'scheduled',
  base_price numeric(12, 2) not null check (base_price >= 0),
  created_at timestamptz default now(),

  constraint flights_arrives_after_departs
    check (arrives_at > departs_at)
);