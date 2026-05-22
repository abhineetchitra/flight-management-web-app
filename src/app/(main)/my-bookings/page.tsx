import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CancelBookingButton from '@/components/CancelBookingButton'
import RescheduleBookingButton from '@/components/RescheduleBookingButton'

type BookingStatus = 'confirmed' | 'cancelled' | 'rescheduled'

interface FlightInfo {
  flight_number: string | null
  origin: string | null
  destination: string | null
  departure_time: string | null
}

interface SeatInfo {
  seat_number: string | null
}

interface BookingItem {
  id: string
  flight_id: string
  status: BookingStatus
  booking_reference: string | null
  passenger_name: string | null
  flights: FlightInfo | null
  seats: SeatInfo | null
}

function getStatusBadge(status: BookingStatus): string {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'cancelled':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'rescheduled':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export default async function MyBookingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-red-600">Please log in to view your bookings.</p>
        </div>
      </main>
    )
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      flight_id,
      status,
      booking_reference,
      passenger_name,
      flights (
        flight_number,
        origin,
        destination,
        departure_time
      ),
      seats (
        seat_number
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-red-600">Failed to load bookings.</p>
        </div>
      </main>
    )
  }

  const bookings: BookingItem[] = (data ?? []).map((item) => {
    const booking = item as {
      id: string
      flight_id: string
      status: BookingStatus
      booking_reference: string | null
      passenger_name: string | null
      flights: FlightInfo | FlightInfo[] | null
      seats: SeatInfo | SeatInfo[] | null
    }

    return {
      id: booking.id,
      flight_id: booking.flight_id,
      status: booking.status,
      booking_reference: booking.booking_reference,
      passenger_name: booking.passenger_name,
      flights: Array.isArray(booking.flights)
        ? (booking.flights[0] ?? null)
        : booking.flights,
      seats: Array.isArray(booking.seats)
        ? (booking.seats[0] ?? null)
        : booking.seats,
    }
  })

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">My Bookings</h1>
          <p className="text-sm text-gray-600">
            View your confirmed, cancelled, and rescheduled trips.
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-600">No bookings found.</p>
            <Link
              href="/flights"
              className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-white"
            >
              Search Flights
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">
                      {booking.flights?.origin ?? 'Unknown'} →{' '}
                      {booking.flights?.destination ?? 'Unknown'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Flight {booking.flights?.flight_number ?? '—'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {booking.flights?.departure_time ?? '—'}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${getStatusBadge(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                  <p>Passenger: {booking.passenger_name ?? '—'}</p>
                  <p>Seat: {booking.seats?.seat_number ?? '—'}</p>
                  <p>Booking Ref: {booking.booking_reference ?? '—'}</p>
                </div>

                {booking.status === 'confirmed' &&
                  booking.flights?.origin &&
                  booking.flights?.destination && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <CancelBookingButton bookingId={booking.id} />
                      <RescheduleBookingButton
                        bookingId={booking.id}
                        currentFlightId={booking.flight_id}
                        origin={booking.flights.origin}
                        destination={booking.flights.destination}
                      />
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}