create or replace function public.reserve_seat(
  p_flight_id uuid,
  p_seat_id uuid
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_seat public.seats%rowtype;
  v_flight public.flights%rowtype;
  v_booking public.bookings%rowtype;
  v_pnr text;
  v_attempts int := 0;
  v_seat_claimed boolean := false;
begin
  if v_user_id is null then
    raise exception 'not_authenticated'
      using errcode = 'P0001';
  end if;

  select *
  into v_flight
  from public.flights
  where id = p_flight_id;

  if not found then
    raise exception 'flight_not_found'
      using errcode = 'P0002';
  end if;

  if v_flight.status <> 'scheduled' then
    raise exception 'flight_not_bookable'
      using errcode = 'P0003';
  end if;

  -- Lock the seat row so concurrent reservations serialize.
  select *
  into v_seat
  from public.seats
  where id = p_seat_id
  for update;

  if not found then
    raise exception 'seat_not_found'
      using errcode = 'P0004';
  end if;

  if v_seat.flight_id <> p_flight_id then
    raise exception 'seat_not_on_flight'
      using errcode = 'P0005';
  end if;

  if not v_seat.is_available then
    raise exception 'seat_unavailable'
      using errcode = 'P0006';
  end if;

  if exists (
    select 1
    from public.bookings b
    where b.seat_id = p_seat_id
      and b.status in ('pending', 'confirmed')
  ) then
    raise exception 'seat_already_booked'
      using errcode = 'P0007';
  end if;

  -- Atomic claim: only one session can flip is_available when still true.
  update public.seats
  set is_available = false
  where id = p_seat_id
    and is_available = true
  returning * into v_seat;

  if not found then
    raise exception 'seat_unavailable'
      using errcode = 'P0006';
  end if;

  v_seat_claimed := true;

  loop
    v_attempts := v_attempts + 1;
    v_pnr := upper(substring(md5(gen_random_uuid()::text) from 1 for 6));

    exit when not exists (
      select 1
      from public.bookings
      where pnr_code = v_pnr
    );

    if v_attempts >= 10 then
      raise exception 'pnr_generation_failed'
        using errcode = 'P0008';
    end if;
  end loop;

  insert into public.bookings (
    user_id,
    flight_id,
    seat_id,
    status,
    total_price,
    pnr_code
  )
  values (
    v_user_id,
    p_flight_id,
    p_seat_id,
    'pending',
    v_flight.base_price + v_seat.extra_fee,
    v_pnr
  )
  returning * into v_booking;

  return v_booking;
exception
  when others then
    if v_seat_claimed then
      update public.seats
      set is_available = true
      where id = v_seat.id;
    end if;
    raise;
end;
$$;

revoke all on function public.reserve_seat(uuid, uuid) from public;
grant execute on function public.reserve_seat(uuid, uuid) to authenticated;
