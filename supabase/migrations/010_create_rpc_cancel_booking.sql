create or replace function public.cancel_booking(
  p_booking_id uuid
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.bookings%rowtype;
begin
  if v_user_id is null then
    raise exception 'not_authenticated'
      using errcode = 'P0001';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'booking_not_found'
      using errcode = 'P0002';
  end if;

  if v_booking.user_id <> v_user_id then
    raise exception 'not_owner'
      using errcode = 'P0003';
  end if;

  if v_booking.status = 'cancelled' then
    raise exception 'booking_already_cancelled'
      using errcode = 'P0004';
  end if;

  if v_booking.status not in ('pending', 'confirmed') then
    raise exception 'booking_not_cancellable'
      using errcode = 'P0005';
  end if;

  -- Lock the seat so cancel + reserve cannot race on the same row.
  perform 1
  from public.seats
  where id = v_booking.seat_id
  for update;

  update public.bookings
  set status = 'cancelled'
  where id = p_booking_id
    and user_id = v_user_id
    and status in ('pending', 'confirmed')
  returning * into v_booking;

  if not found then
    raise exception 'booking_not_cancellable'
      using errcode = 'P0005';
  end if;

  -- Free the seat only when no other active booking holds it.
  if not exists (
    select 1
    from public.bookings b
    where b.seat_id = v_booking.seat_id
      and b.status in ('pending', 'confirmed')
  ) then
    update public.seats
    set is_available = true
    where id = v_booking.seat_id;
  end if;

  return v_booking;
end;
$$;

revoke all on function public.cancel_booking(uuid) from public;
grant execute on function public.cancel_booking(uuid) to authenticated;
