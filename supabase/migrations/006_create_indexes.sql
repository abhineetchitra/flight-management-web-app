create index idx_seats_flight_id
on public.seats(flight_id);

create index idx_bookings_user_id
on public.bookings(user_id);

create index idx_bookings_flight_id
on public.bookings(flight_id);

create index idx_bookings_seat_id
on public.bookings(seat_id);

create index idx_passengers_booking_id
on public.passengers(booking_id);

create index idx_reschedules_booking_id
on public.reschedules(booking_id);