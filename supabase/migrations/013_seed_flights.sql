-- 8 scheduled flights (mix of routes; BA401 departs in ~90 min for cancellation-window tests).
insert into public.flights (
  flight_no,
  origin,
  destination,
  departs_at,
  arrives_at,
  aircraft_type,
  status,
  base_price
)
values
  (
    'AI101',
    'DEL',
    'BOM',
    now() + interval '7 days',
    now() + interval '7 days 2 hours 15 minutes',
    'A320',
    'scheduled',
    4500.00
  ),
  (
    'AI102',
    'BOM',
    'DEL',
    now() + interval '7 days 4 hours',
    now() + interval '7 days 6 hours 20 minutes',
    'A320',
    'scheduled',
    4200.00
  ),
  (
    'AI201',
    'DEL',
    'BLR',
    now() + interval '4 days',
    now() + interval '4 days 1 hour 50 minutes',
    'A321',
    'scheduled',
    3800.00
  ),
  (
    'AI202',
    'BLR',
    'DEL',
    now() + interval '4 days 3 hours',
    now() + interval '4 days 4 hours 55 minutes',
    'A321',
    'scheduled',
    3900.00
  ),
  (
    'UA301',
    'JFK',
    'LAX',
    now() + interval '3 days',
    now() + interval '3 days 6 hours',
    'B737',
    'scheduled',
    12500.00
  ),
  (
    'UA302',
    'LAX',
    'JFK',
    now() + interval '3 days 8 hours',
    now() + interval '3 days 17 hours',
    'B737',
    'scheduled',
    12800.00
  ),
  (
    'BA401',
    'LHR',
    'JFK',
    now() + interval '90 minutes',
    now() + interval '8 hours 30 minutes',
    'B787',
    'scheduled',
    45000.00
  ),
  (
    'BA402',
    'JFK',
    'LHR',
    now() + interval '36 hours',
    now() + interval '1 day 20 hours',
    'B787',
    'scheduled',
    48000.00
  );
