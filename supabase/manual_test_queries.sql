-- Run after: supabase db reset
-- Test user: test@flight.test / TestPassword123!
-- User id: a0000000-0000-4000-8000-000000000001

-- ---------------------------------------------------------------------------
-- 1. Verify seed counts
-- ---------------------------------------------------------------------------
select count(*) as flights from public.flights;
select count(*) as seats from public.seats;
select flight_no, count(*) as seat_count
from public.flights f
join public.seats s on s.flight_id = f.id
group by f.flight_no
order by f.flight_no;

-- ---------------------------------------------------------------------------
-- 2. Browse catalog (anon/authenticated)
-- ---------------------------------------------------------------------------
select flight_no, origin, destination, departs_at, base_price, status
from public.flights
order by departs_at;

select f.flight_no, s.seat_number, s.class, s.is_available, s.extra_fee
from public.seats s
join public.flights f on f.id = s.flight_id
where f.flight_no = 'AI101'
order by s.seat_number;

-- ---------------------------------------------------------------------------
-- 3. Reserve seat (run as test user via API/SQL editor with JWT)
--    In SQL editor, set role: SET request.jwt.claim.sub = 'a0000000-...';
--    Or call from app after sign-in.
-- ---------------------------------------------------------------------------
-- select public.reserve_seat(
--   (select f.id from public.flights f where f.flight_no = 'AI101'),
--   (select s.id from public.seats s
--    join public.flights f on f.id = s.flight_id
--    where f.flight_no = 'AI101' and s.seat_number = '12A')
-- );

-- ---------------------------------------------------------------------------
-- 4. Cancel booking — should succeed (>2h before departure)
-- ---------------------------------------------------------------------------
-- select public.cancel_booking('<booking_id_from_ai101>');

-- ---------------------------------------------------------------------------
-- 5. Cancel booking — should fail (BA401 departs in ~90 minutes)
--    First reserve on BA401, then:
-- ---------------------------------------------------------------------------
-- select public.cancel_booking('<ba401_booking_id>');
-- Expected: cancellation_too_late

-- ---------------------------------------------------------------------------
-- 6. Reschedule (AI101 -> AI201, same seat number if exists)
-- ---------------------------------------------------------------------------
-- select public.reschedule_booking(
--   '<booking_id>',
--   (select id from public.flights where flight_no = 'AI201'),
--   null,
--   25.00
-- );

-- ---------------------------------------------------------------------------
-- 7. Seat availability after booking
-- ---------------------------------------------------------------------------
-- select seat_number, is_available
-- from public.seats s
-- join public.flights f on f.id = s.flight_id
-- where f.flight_no = 'AI101'
-- order by seat_number;
