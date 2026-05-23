'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFlightStore } from '@/store/useFlightStore'
import { CheckCircle2, Loader2, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface ConfirmationClientProps { flightId: string | null }
interface BookingResult { id: string; pnr_code: string; flight_id: string; seat_id: string; status: string; total_price: number; booked_at: string }
type PageState = 'idle' | 'loading' | 'success' | 'error'

export default function ConfirmationClient({ flightId }: ConfirmationClientProps) {
  const [supabase] = useState(() => createClient())
  const selectedFlight = useFlightStore((s) => s.selectedFlight)
  const reset = useFlightStore((s) => s.reset)

  const [pageState, setPageState] = useState<PageState>('idle')
  const [booking, setBooking] = useState<BookingResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const hasBooked = useRef(false)
  const _hasHydrated = useFlightStore((s) => s._hasHydrated)

  const handleBooking = useCallback(async () => {
    const state = useFlightStore.getState()
    if (!flightId || !state.selectedSeat || !state.passengerData) return
    setPageState('loading'); setErrorMessage('')
    try {
      const { data: bookingData, error: rpcError } = await supabase.rpc('reserve_seat', { p_flight_id: flightId, p_seat_id: state.selectedSeat.id })
      if (rpcError) throw new Error(getFriendlyError(rpcError.message))
      const newBooking = bookingData as BookingResult
      const { error: passengerError } = await supabase.from('passengers').insert({ booking_id: newBooking.id, full_name: state.passengerData.full_name, passport_no: state.passengerData.passport_no ?? '', nationality: state.passengerData.nationality, dob: state.passengerData.dob })
      if (passengerError) throw new Error('Failed to save passenger details.')
      const { error: updateError } = await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', newBooking.id)
      if (updateError) throw new Error('Failed to confirm booking.')
      setBooking({ ...newBooking, status: 'confirmed' })
      setPageState('success')
      toast.success('Booking confirmed!', { description: `PNR: ${newBooking.pnr_code}` })
      setTimeout(() => reset(), 100)
    } catch (err) {
      setPageState('error')
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setErrorMessage(msg)
      toast.error('Booking failed', { description: msg })
      hasBooked.current = false
    }
  }, [flightId, reset, supabase])

  useEffect(() => {
    const state = useFlightStore.getState()
    if (!_hasHydrated || hasBooked.current || !flightId || !state.selectedSeat || !state.passengerData) return
    hasBooked.current = true
    setTimeout(() => { void handleBooking() }, 0)
  }, [_hasHydrated, flightId, handleBooking])

  const selectedSeat = useFlightStore((s) => s.selectedSeat)
  const passengerData = useFlightStore((s) => s.passengerData)

  // Hydrating
  if (!_hasHydrated) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  // Missing data
  if (pageState !== 'success' && (!flightId || !selectedSeat || !passengerData)) return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-sm text-center">
        <CardContent className="py-8">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <p className="font-semibold">Incomplete booking information</p>
          <p className="mt-1 text-sm text-muted-foreground">We couldn&apos;t find your seat or passenger details.</p>
          <Button asChild className="mt-4">
            <Link href="/">Start Again</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  // Error
  if (pageState === 'error') return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardContent className="py-8 text-center">
          <XCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h1 className="text-lg font-bold">Booking Failed</h1>
          <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
          <div className="mt-4 flex gap-3 justify-center">
            <Button onClick={() => { setPageState('idle'); handleBooking() }}>Try Again</Button>
            <Button asChild variant="outline">
              <Link href={`/booking?flightId=${flightId}`}>Change Seat</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Loading
  if (pageState === 'loading' || pageState === 'idle') return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center space-y-3">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <div>
          <p className="font-semibold">Reserving your seat…</p>
          <p className="text-sm text-muted-foreground">Please don&apos;t close this page</p>
        </div>
      </div>
    </div>
  )

  // Success — guard against cleared store
  if (!selectedSeat || !passengerData) return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-sm text-center">
        <CardContent className="py-8">
          <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
          <p className="font-semibold">Booking confirmed!</p>
          <Button asChild className="mt-4">
            <Link href="/">Return home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="mx-auto max-w-md px-4 py-8 space-y-5">
      {/* Success header */}
      <div className="text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
        <h1 className="text-2xl font-bold">Booking Confirmed</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your seat has been reserved successfully.</p>
      </div>

      {/* PNR */}
      <Card>
        <CardContent className="py-5 text-center">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">Booking Reference</p>
          <p className="font-mono text-2xl font-bold tracking-widest">{booking?.pnr_code}</p>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardContent className="py-5">
          <h2 className="text-sm font-semibold mb-3">Booking Details</h2>
          <div className="space-y-2.5 text-sm">
            {selectedFlight && (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">Flight</span><span className="font-medium">{selectedFlight.flight_no}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Route</span><span className="font-medium">{selectedFlight.origin} → {selectedFlight.destination}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Departure</span><span className="font-medium">{new Date(selectedFlight.departs_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
              </>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">Seat</span><span className="font-medium">{selectedSeat.seat_number} <span className="capitalize text-muted-foreground">({selectedSeat.class})</span></span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Passenger</span><span className="font-medium">{passengerData.full_name}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Confirmed</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Paid</span><span className="text-lg font-bold">₹{booking?.total_price?.toLocaleString('en-IN')}</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button asChild className="flex-1">
          <Link href="/my-bookings">My Bookings</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/">Search More</Link>
        </Button>
      </div>
    </div>
  )
}

function getFriendlyError(message: string): string {
  if (message.includes('seat_unavailable') || message.includes('seat_already_booked')) return 'This seat was just booked. Please choose a different seat.'
  if (message.includes('not_authenticated')) return 'You must be logged in to complete a booking.'
  if (message.includes('flight_not_bookable')) return 'This flight is no longer available for booking.'
  if (message.includes('flight_not_found')) return 'Flight not found. Please search again.'
  if (message.includes('seat_not_on_flight')) return 'Seat does not belong to this flight.'
  return message
}