'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface FlightOption {
  id: string
  flight_number: string
  origin: string
  destination: string
  departure_time: string
}

interface RpcResponse {
  success: boolean
  reschedule_fee: number
}

interface RescheduleBookingButtonProps {
  bookingId: string
  currentFlightId: string
  origin: string
  destination: string
}

export default function RescheduleBookingButton({
  bookingId,
  currentFlightId,
  origin,
  destination,
}: RescheduleBookingButtonProps) {
  const supabase = createClient()
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [loadingFlights, setLoadingFlights] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [flights, setFlights] = useState<FlightOption[]>([])
  const [selectedFlightId, setSelectedFlightId] = useState('')
  const [fee, setFee] = useState<number>(1500)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadFlights() {
      if (!open) return

      setLoadingFlights(true)
      setError(null)

      const { data, error } = await supabase
        .from('flights')
        .select('id, flight_number, origin, destination, departure_time')
        .eq('origin', origin)
        .eq('destination', destination)
        .neq('id', currentFlightId)
        .order('departure_time', { ascending: true })

      if (error) {
        setError(error.message)
        setLoadingFlights(false)
        return
      }

      setFlights((data ?? []) as FlightOption[])
      setLoadingFlights(false)
    }

    loadFlights()
  }, [open, origin, destination, currentFlightId, supabase])

  async function handleReschedule() {
    if (!selectedFlightId) {
      setError('Please select a different flight.')
      return
    }

    setSubmitting(true)
    setError(null)

    const { data, error } = await supabase.rpc('reschedule_booking_same_route', {
      p_booking_id: bookingId,
      p_new_flight_id: selectedFlightId,
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    const result = data as RpcResponse | null
    if (result?.reschedule_fee !== undefined) {
      setFee(result.reschedule_fee)
    }

    setSubmitting(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700"
      >
        Reschedule
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">
              Reschedule booking
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Choose another flight on the same route.
            </p>

            {loadingFlights ? (
              <p className="mt-4 text-sm text-gray-500">Loading flights...</p>
            ) : (
              <div className="mt-4 space-y-3">
                {flights.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No alternate flights found for this route.
                  </p>
                ) : (
                  flights.map((flight) => (
                    <label
                      key={flight.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border p-3"
                    >
                      <input
                        type="radio"
                        name="reschedule-flight"
                        value={flight.id}
                        checked={selectedFlightId === flight.id}
                        onChange={(e) => setSelectedFlightId(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">
                          {flight.origin} → {flight.destination}
                        </p>
                        <p className="text-sm text-gray-500">
                          {flight.flight_number} • {flight.departure_time}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}

            <p className="mt-4 text-sm text-gray-600">
              Reschedule fee: ₹{fee}
            </p>

            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="rounded-md border px-4 py-2 text-sm text-gray-700"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleReschedule}
                disabled={submitting || !selectedFlightId}
                className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? 'Updating...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}