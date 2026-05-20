create or replace function public.reject_late_cancellation()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_departs_at timestamptz;
begin
  if old.status is distinct from 'cancelled'
    and new.status = 'cancelled' then
    select f.departs_at
    into v_departs_at
    from public.flights f
    where f.id = new.flight_id;

    if not found then
      raise exception 'flight_not_found'
        using errcode = 'P0010';
    end if;

    if now() >= v_departs_at - interval '2 hours' then
      raise exception 'cancellation_too_late'
        using errcode = 'P0011',
        hint = 'Cancellations are not allowed within 2 hours of departure.';
    end if;
  end if;

  return new;
end;
$$;

create trigger bookings_reject_late_cancellation
  before update on public.bookings
  for each row
  execute function public.reject_late_cancellation();
