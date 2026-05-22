'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFlightStore } from '@/store/useFlightStore'

interface ConfirmationClientProps {
  flightId: string | null
}

interface BookingResult {
  id: string
  pnr_code: string
  flight_id: string
  seat_id: string
  status: string
  total_price: number
  booked_at: string
}

type PageState = 'idle' | 'loading' | 'success' | 'error'

export default function ConfirmationClient({ flightId }: ConfirmationClientProps) {
  const [supabase] = useState(() => createClient())

  const selectedFlight = useFlightStore((s) => s.selectedFlight)
  const reset          = useFlightStore((s) => s.reset)

  const [pageState, setPageState]       = useState<PageState>('idle')
  const [booking, setBooking]           = useState<BookingResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const hasBooked = useRef(false)

  const _hasHydrated = useFlightStore((s) => s._hasHydrated)

  const handleBooking = useCallback(async () => {
    const state = useFlightStore.getState()
    if (!flightId || !state.selectedSeat || !state.passengerData) return

    setPageState('loading')
    setErrorMessage('')

    try {
      // Step 1 — RPC: lock seat, generate PNR, create booking (pending)
      const { data: bookingData, error: rpcError } = await supabase.rpc(
        'reserve_seat',
        {
          p_flight_id: flightId,
          p_seat_id: state.selectedSeat.id,
        }
      )

      if (rpcError) throw new Error(getFriendlyError(rpcError.message))

      const newBooking = bookingData as BookingResult

      // Step 2 — Insert passenger record
      const { error: passengerError } = await supabase
        .from('passengers')
        .insert({
          booking_id:  newBooking.id,
          full_name:   state.passengerData.full_name,
          passport_no: state.passengerData.passport_no ?? '',
          nationality: state.passengerData.nationality,
          dob:         state.passengerData.dob,
        })

      if (passengerError)
        throw new Error('Failed to save passenger details. Please contact support.')

      // Step 3 — Confirm booking: pending → confirmed
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', newBooking.id)

      if (updateError)
        throw new Error('Failed to confirm booking. Please contact support.')

      setBooking({ ...newBooking, status: 'confirmed' })
      setPageState('success')
      setTimeout(() => reset(), 100)

    } catch (err) {
      setPageState('error')
      setErrorMessage(
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      )
      useFlightStore.getState().setSelectedSeat(null)
      hasBooked.current = false
    }
  }, [flightId, reset, supabase])

  useEffect(() => {
    const state = useFlightStore.getState()
    if (!state._hasHydrated) return
    if (hasBooked.current) return
    if (!flightId || !state.selectedSeat || !state.passengerData) return

    hasBooked.current = true
    setTimeout(() => {
      void handleBooking()
    }, 0)
  }, [flightId, handleBooking])

  // --- Hydration spinner ---
if (!_hasHydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
      </main>
    )
  }

  // --- Guard ---
  const storeState = useFlightStore.getState()
  if (!flightId || !storeState.selectedSeat || !storeState.passengerData) {
    return (
      <main className="min-h-screen px-4 py-8">
        <div className="space-y-2">
          <p className="text-red-600">Incomplete booking information.</p>
          <Link href="/" className="text-blue-600 underline">Start again</Link>
        </div>
      </main>
    )
  }

  const selectedSeat = storeState.selectedSeat
  const passengerData = storeState.passengerData

  // --- Loading ---
  if (pageState === 'loading' || pageState === 'idle') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
          <p className="text-sm text-gray-600">Reserving your seat...</p>
        </div>
      </main>
    )
  }

  // --- Error ---
  if (pageState === 'error') {
    return (
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-md space-y-4 rounded-xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-700">Booking Failed</h1>
          <p className="text-sm text-red-600">{errorMessage}</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setPageState('idle')
                handleBooking()
              }}
              className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-900"
            >
              Try Again
            </button>
            <Link
              href={`/booking?flightId=${flightId}`}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Choose Different Seat
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // --- Success ---
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-xl space-y-6">

        {/* Success Banner */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
            ✓
          </div>
          <h1 className="text-xl font-semibold text-emerald-800">Booking Confirmed!</h1>
          <p className="mt-1 text-sm text-emerald-600">
            Your seat has been reserved successfully.
          </p>
        </div>

        {/* PNR */}
        <div className="rounded-xl border bg-white p-6 text-center shadow-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
            PNR Code
          </p>
          <p className="mt-2 font-mono text-4xl font-bold tracking-widest text-black">
            {booking?.pnr_code}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Save this code to manage your booking
          </p>
        </div>

        {/* Full Details */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Booking Details</h2>

          <div className="divide-y text-sm">

            {/* Flight */}
            {selectedFlight && (
              <>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Flight</span>
                  <span className="font-medium">{selectedFlight.flight_no}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Route</span>
                  <span className="font-medium">
                    {selectedFlight.origin} → {selectedFlight.destination}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Departure</span>
                  <span className="font-medium">
                    {new Date(selectedFlight.departs_at).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Arrival</span>
                  <span className="font-medium">
                    {new Date(selectedFlight.arrives_at).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </>
            )}

            {/* Seat */}
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Seat</span>
              <span className="font-medium">
                {selectedSeat.seat_number}{' '}
                <span className="capitalize text-gray-400">({selectedSeat.class})</span>
              </span>
            </div>

            {/* Passenger */}
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Passenger</span>
              <span className="font-medium">{passengerData.full_name}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Nationality</span>
              <span className="font-medium">{passengerData.nationality}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Date of Birth</span>
              <span className="font-medium">
                {new Date(passengerData.dob).toLocaleDateString('en-IN', {
                  dateStyle: 'medium',
                })}
              </span>
            </div>

            {/* Status + Price */}
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Status</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Confirmed
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Total Paid</span>
              <span className="font-semibold text-black">₹{booking?.total_price}</span>
            </div>

          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/bookings"
            className="flex-1 rounded-md bg-black px-4 py-2 text-center text-sm text-white hover:bg-gray-900"
          >
            My Bookings
          </Link>
          <Link
            href="/"
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-center text-sm text-gray-700 hover:bg-gray-50"
          >
            Search More Flights
          </Link>
        </div>

      </div>
    </main>
  )
}

function getFriendlyError(message: string): string {
  if (message.includes('seat_unavailable') || message.includes('seat_already_booked'))
    return 'This seat was just booked by someone else. Please choose a different seat.'
  if (message.includes('not_authenticated'))
    return 'You must be logged in to complete a booking.'
  if (message.includes('flight_not_bookable'))
    return 'This flight is no longer available for booking.'
  if (message.includes('flight_not_found'))
    return 'Flight not found. Please search again.'
  if (message.includes('seat_not_on_flight'))
    return 'Seat does not belong to this flight. Please try again.'
  return message
}