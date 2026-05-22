'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/useUserStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface BookingWithDetails {
  id: string
  pnr_code: string
  status: 'confirmed' | 'cancelled' | 'rescheduled'
  total_price: number
  booked_at: string
  flights: {
    flight_no: string
    origin: string
    destination: string
    departs_at: string
  }
  seats: {
    seat_number: string
    class: string
  }
}

export default function BookingsPage() {
  const { user } = useUserStore()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchBookings = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        pnr_code,
        status,
        total_price,
        booked_at,
        flights (flight_no, origin, destination, departs_at),
        seats (seat_number, class)
      `)
      .eq('user_id', user.id)
      .order('booked_at', { ascending: false })

    if (!error && data) {
      setBookings(data as any)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBookings()
  }, [user])

  async function handleCancelBooking(bookingId: string) {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    const { error } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
    })

    if (error) {
      alert('Cancellation failed: ' + error.message)
      return
    }

    fetchBookings()
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'secondary' // Using secondary as a success-like color
      case 'cancelled': return 'destructive'
      case 'rescheduled': return 'outline'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <p className="text-gray-500">Loading your bookings...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <Link href="/">
            <Button variant="outline">Search Flights</Button>
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-20 border rounded-xl bg-slate-50">
            <p className="text-gray-500">You have no bookings yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold">
                      {booking.flights.flight_no}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      PNR: <span className="font-mono font-medium">{booking.pnr_code}</span>
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(booking.status)} className="capitalize">
                    {booking.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div>
                      <p className="text-muted-foreground">Route</p>
                      <p className="font-medium">
                        {booking.flights.origin} → {booking.flights.destination}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Departure</p>
                      <p className="font-medium">
                        {new Date(booking.flights.departs_at).toLocaleDateString('en-IN', {
                          dateStyle: 'medium',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Seat</p>
                      <p className="font-medium">
                        {booking.seats.seat_number} ({booking.seats.class})
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Paid</p>
                      <p className="font-bold">₹{booking.total_price}</p>
                    </div>
                  </div>
                  
                  {booking.status === 'confirmed' && (
                    <div className="mt-4 flex justify-end">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel Booking
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}