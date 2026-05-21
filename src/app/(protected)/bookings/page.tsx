'use client'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/useUserStore'
import { useFlightStore } from '@/store/useFlightStore'

export default function BookingsPage() {
  const { bookings, setBookings } = useUserStore()
  const resetFlight = useFlightStore((s) => s.reset)

  async function handleCancelBooking(bookingId: string) {
    const supabase = createClient()

    // Call your Supabase RPC to cancel atomically
    const { error } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
    })

    if (error) {
      alert('Cancellation failed: ' + error.message)
      return
    }

    // ✅ Reset flight store (clears seat selection, booking step, form data)
    resetFlight()

    // ✅ Refresh bookings list in store (do NOT call resetUser — that logs them out)
    const { data } = await supabase
      .from('bookings')
      .select('id, pnr_code, flight_id, seat_id, status, total_price, booked_at')
      .order('booked_at', { ascending: false })

    setBookings(data ?? [])
  }

  return (
    <div>
      <h1>My Bookings</h1>
      {bookings.map((booking) => (
        <div key={booking.id}>
          <p>PNR: {booking.pnr_code}</p>
          <p>Status: {booking.status}</p>
          <button onClick={() => handleCancelBooking(booking.id)}>
            Cancel Booking
          </button>
        </div>
      ))}
    </div>
  )
}