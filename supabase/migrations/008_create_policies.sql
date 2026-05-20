-- Flights & seats: catalog data — readable by anyone browsing/searching.
create policy "flights_select_public"
  on public.flights
  for select
  to authenticated, anon
  using (true);

create policy "seats_select_public"
  on public.seats
  for select
  to authenticated, anon
  using (true);

-- Bookings: users only see and manage their own.
create policy "bookings_select_own"
  on public.bookings
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "bookings_insert_own"
  on public.bookings
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "bookings_update_own"
  on public.bookings
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "bookings_delete_own"
  on public.bookings
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Passengers: tied to a booking the user owns.
create policy "passengers_select_own"
  on public.passengers
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.bookings b
      where b.id = passengers.booking_id
        and b.user_id = auth.uid()
    )
  );

create policy "passengers_insert_own"
  on public.passengers
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.bookings b
      where b.id = passengers.booking_id
        and b.user_id = auth.uid()
    )
  );

create policy "passengers_update_own"
  on public.passengers
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.bookings b
      where b.id = passengers.booking_id
        and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.bookings b
      where b.id = passengers.booking_id
        and b.user_id =  auth.uid()
    )
  );

create policy "passengers_delete_own"
  on public.passengers
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.bookings b
      where b.id = passengers.booking_id
        and b.user_id = auth.uid()
    )
  );

-- Reschedules: only for the user's bookings.
create policy "reschedules_select_own"
  on public.reschedules
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.bookings b
      where b.id = reschedules.booking_id
        and b.user_id = auth.uid()
    )
  );

create policy "reschedules_insert_own"
  on public.reschedules
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.bookings b
      where b.id = reschedules.booking_id
        and b.user_id = auth.uid()
    )
  );

create policy "reschedules_update_own"
  on public.reschedules
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.bookings b
      where b.id = reschedules.booking_id
        and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.bookings b
      where b.id = reschedules.booking_id
        and b.user_id = auth.uid()
    )
  );

create policy "reschedules_delete_own"
  on public.reschedules
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.bookings b
      where b.id = reschedules.booking_id
        and b.user_id = auth.uid()
    )
  );
