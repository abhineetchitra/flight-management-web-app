'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface CancelBookingButtonProps {
  bookingId: string
}

export default function CancelBookingButton({
  bookingId,
}: CancelBookingButtonProps) {
  const supabase = createClient()
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancelBooking() {
    setLoading(true)
    setError(null)

    const { error } = await supabase.rpc('cancel_booking_and_free_seat', {
      p_booking_id: bookingId,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700"
      >
        Cancel Booking
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">
              Cancel this booking?
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              This will mark the booking as cancelled and free the selected seat.
            </p>

            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-md border px-4 py-2 text-sm text-gray-700"
              >
                Keep Booking
              </button>

              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={loading}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {loading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}