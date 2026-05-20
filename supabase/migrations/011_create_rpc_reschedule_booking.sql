create or replace function public.reschedule_booking(
  p_booking_id uuid,
  p_new_flight_id uuid,
  p_new_seat_id uuid default null,
  p_fee_charged numeric default 0
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_old_seat public.seats%rowtype;
  v_new_seat public.seats%rowtype;
  v_new_flight public.flights%rowtype;
  v_new_seat_id uuid;
  v_old_flight_id uuid;
  v_old_seat_id uuid;
  v_lock_first uuid;
  v_lock_second uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated'
      using errcode = 'P0001';
  end if;

  if p_fee_charged < 0 then
    raise exception 'invalid_fee'
      using errcode = 'P0002';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'booking_not_found'
      using errcode = 'P0003';
  end if;

  if v_booking.user_id <> v_user_id then
    raise exception 'not_owner'
      using errcode = 'P0004';
  end if;

  if v_booking.status not in ('pending', 'confirmed') then
    raise exception 'booking_not_reschedulable'
      using errcode = 'P0005';
  end if;

  v_old_flight_id := v_booking.flight_id;
  v_old_seat_id := v_booking.seat_id;

  if p_new_flight_id = v_old_flight_id then
    raise exception 'same_flight'
      using errcode = 'P0006';
  end if;

  select *
  into v_new_flight
  from public.flights
  where id = p_new_flight_id;

  if not found then
    raise exception 'new_flight_not_found'
      using errcode = 'P0007';
  end if;

  if v_new_flight.status <> 'scheduled' then
    raise exception 'new_flight_not_bookable'
      using errcode = 'P0008';
  end if;

  select *
  into v_old_seat
  from public.seats
  where id = v_old_seat_id;

  if p_new_seat_id is not null then
    v_new_seat_id := p_new_seat_id;
  else
    select s.id
    into v_new_seat_id
    from public.seats s
    where s.flight_id = p_new_flight_id
      and s.seat_number = v_old_seat.seat_number;

    if not found then
      raise exception 'new_seat_not_found'
        using errcode = 'P0009';
    end if;
  end if;

  if v_old_seat_id < v_new_seat_id then
    v_lock_first := v_old_seat_id;
    v_lock_second := v_new_seat_id;
  else
    v_lock_first := v_new_seat_id;
    v_lock_second := v_old_seat_id;
  end if;

  perform 1
  from public.seats
  where id = v_lock_first
  for update;

  perform 1
  from public.seats
  where id = v_lock_second
  for update;

  select *
  into v_old_seat
  from public.seats
  where id = v_old_seat_id;

  select *
  into v_new_seat
  from public.seats
  where id = v_new_seat_id;

  if v_new_seat.flight_id <> p_new_flight_id then
    raise exception 'new_seat_not_on_flight'
      using errcode = 'P0010';
  end if;

  if not v_new_seat.is_available then
    raise exception 'new_seat_unavailable'
      using errcode = 'P0011';
  end if;

  if exists (
    select 1
    from public.bookings b
    where b.seat_id = v_new_seat_id
      and b.id <> p_booking_id
      and b.status in ('pending', 'confirmed')
  ) then
    raise exception 'new_seat_already_booked'
      using errcode = 'P0012';
  end if;

  update public.seats
  set is_available = false
  where id = v_new_seat_id
    and is_available = true
  returning * into v_new_seat;

  if not found then
    raise exception 'new_seat_unavailable'
      using errcode = 'P0011';
  end if;

  update public.bookings
  set
    flight_id = p_new_flight_id,
    seat_id = v_new_seat_id,
    total_price = v_new_flight.base_price + v_new_seat.extra_fee + p_fee_charged
  where id = p_booking_id
  returning * into v_booking;

  insert into public.reschedules (
    booking_id,
    old_flight_id,
    new_flight_id,
    fee_charged
  )
  values (
    p_booking_id,
    v_old_flight_id,
    p_new_flight_id,
    p_fee_charged
  );

  if not exists (
    select 1
    from public.bookings b
    where b.seat_id = v_old_seat_id
      and b.status in ('pending', 'confirmed')
  ) then
    update public.seats
    set is_available = true
    where id = v_old_seat_id;
  end if;

  return v_booking;
end;
$$;

revoke all on function public.reschedule_booking(uuid, uuid, uuid, numeric) from public;
grant execute on function public.reschedule_booking(uuid, uuid, uuid, numeric) to authenticated;
