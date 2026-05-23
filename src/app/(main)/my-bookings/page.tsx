import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PlaneTakeoff, Search, Lock, Ticket } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import CancelBookingButton from '@/components/CancelBookingButton'
import RescheduleBookingButton from '@/components/RescheduleBookingButton'

type BookingStatus = 'confirmed' | 'cancelled' | 'rescheduled'

interface FlightInfo { flight_number: string | null; origin: string | null; destination: string | null; departure_time: string | null }
interface SeatInfo { seat_number: string | null }
interface BookingItem { id: string; flight_id: string; status: BookingStatus; booking_reference: string | null; passenger_name: string | null; flights: FlightInfo | null; seats: SeatInfo | null }

function getStatusBadge(status: BookingStatus) {
  switch (status) {
    case 'confirmed': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Confirmed</Badge>
    case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>
    case 'rescheduled': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Rescheduled</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

export default async function MyBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-sm text-center">
        <CardContent className="py-8">
          <Lock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-semibold">Authentication required</p>
          <p className="mt-1 text-sm text-muted-foreground">Please sign in to view your bookings.</p>
          <Button asChild className="mt-4">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const { data, error } = await supabase.from('bookings')
    .select(`id, flight_id, status, booking_reference, passenger_name, flights(flight_number, origin, destination, departure_time), seats(seat_number)`)
    .eq('user_id', user.id).order('created_at', { ascending: false })

  if (error) return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-sm text-center border-destructive">
        <CardContent className="py-8">
          <p className="font-semibold text-destructive">Failed to load bookings.</p>
          <p className="mt-1 text-sm text-muted-foreground">Please try refreshing the page.</p>
        </CardContent>
      </Card>
    </div>
  )

  const bookings: BookingItem[] = (data ?? []).map((item) => {
    const booking = item as { id: string; flight_id: string; status: BookingStatus; booking_reference: string | null; passenger_name: string | null; flights: FlightInfo | FlightInfo[] | null; seats: SeatInfo | SeatInfo[] | null }
    return { ...booking, flights: Array.isArray(booking.flights) ? (booking.flights[0] ?? null) : booking.flights, seats: Array.isArray(booking.seats) ? (booking.seats[0] ?? null) : booking.seats }
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="text-sm text-muted-foreground">
            {bookings.length > 0 ? `${bookings.length} booking${bookings.length !== 1 ? 's' : ''}` : 'Your travel history will appear here.'}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/">
            <Search className="mr-1.5 h-4 w-4" />
            New Search
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold">No bookings yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Book your first flight and it will appear here.</p>
            <Button asChild className="mt-4">
              <Link href="/">Search Flights</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4 sm:p-5">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <PlaneTakeoff className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold">
                        {booking.flights?.origin ?? '—'} → {booking.flights?.destination ?? '—'}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {booking.flights?.flight_number ?? '—'}
                        {booking.flights?.departure_time && <> · {new Date(booking.flights.departure_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                {/* Detail grid */}
                <div className="grid gap-3 text-sm sm:grid-cols-3 mb-4 rounded-lg border bg-muted/30 px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Passenger</p>
                    <p className="font-medium">{booking.passenger_name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Seat</p>
                    <p className="font-medium">{booking.seats?.seat_number ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Reference</p>
                    <p className="font-medium font-mono text-sm">{booking.booking_reference ?? '—'}</p>
                  </div>
                </div>

                {/* Actions */}
                {booking.status === 'confirmed' && booking.flights?.origin && booking.flights?.destination && (
                  <>
                    <Separator className="mb-3" />
                    <div className="flex flex-wrap gap-2">
                      <CancelBookingButton bookingId={booking.id} />
                      <RescheduleBookingButton bookingId={booking.id} currentFlightId={booking.flight_id} origin={booking.flights.origin} destination={booking.flights.destination} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}