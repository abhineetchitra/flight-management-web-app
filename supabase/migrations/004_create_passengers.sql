create table public.passengers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null
    references public.bookings (id)
    on delete cascade,
  full_name text not null,
  passport_no text not null,
  nationality text not null,
  dob date not null,
  created_at timestamptz default now()
);