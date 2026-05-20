-- Full narrow-body seat map per flight:
--   First:    rows 1–2,  seats A–B  (4 seats,  +200 fee)
--   Business: rows 3–6,  seats A–D  (16 seats, +80 fee)
--   Economy:  rows 7–28, seats A–F  (132 seats)

-- First class
insert into public.seats (flight_id, seat_number, class, extra_fee)
select
  f.id,
  r.row_num::text || chr(64 + s.seat_idx),
  'first',
  200.00
from public.flights f
cross join generate_series(1, 2) as r (row_num)
cross join generate_series(1, 2) as s (seat_idx);

-- Business class
insert into public.seats (flight_id, seat_number, class, extra_fee)
select
  f.id,
  r.row_num::text || chr(64 + s.seat_idx),
  'business',
  80.00
from public.flights f
cross join generate_series(3, 6) as r (row_num)
cross join generate_series(1, 4) as s (seat_idx);

-- Economy class
insert into public.seats (flight_id, seat_number, class, extra_fee)
select
  f.id,
  r.row_num::text || chr(64 + s.seat_idx),
  'economy',
  0.00
from public.flights f
cross join generate_series(7, 28) as r (row_num)
cross join generate_series(1, 6) as s (seat_idx);
