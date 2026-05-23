'use client'

import SeatGrid from '@/components/SeatGrid'
import { useFlightStore } from '@/store/useFlightStore'
import { useRouter } from 'next/navigation'
import { ArrowRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface BookingPageClientProps { flightId: string | null }

const steps = ['Search', 'Select Seat', 'Passenger Details', 'Confirm']

export default function BookingPageClient({ flightId }: BookingPageClientProps) {
  const router = useRouter()
  const selectedSeat = useFlightStore((s) => s.selectedSeat)
  const setBookingStep = useFlightStore((s) => s.setBookingStep)
  const selectedFlight = useFlightStore((s) => s.selectedFlight)

  function handleContinue() {
    if (!selectedSeat || !flightId) return
    setBookingStep('passenger-details')
    router.push(`/passenger-details?flightId=${flightId}&seatId=${selectedSeat.id}`)
  }

  if (!flightId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="max-w-sm text-center">
          <CardContent className="py-8">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <p className="font-semibold">Missing flight ID</p>
            <p className="mt-1 text-sm text-muted-foreground">Please search and select a flight first.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Step breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        {steps.map((step, i) => (
          <span key={step} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-border">›</span>}
            <span className={i === 1 ? 'font-medium text-foreground' : ''}>{step}</span>
          </span>
        ))}
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Select Your Seat</h1>
        {selectedFlight && (
          <p className="text-sm text-muted-foreground">
            {selectedFlight.flight_no} · {selectedFlight.origin} → {selectedFlight.destination}
          </p>
        )}
      </div>

      {/* Seat grid */}
      <SeatGrid flightId={flightId} />

      <Separator className="my-6" />

      {/* Bottom bar */}
      <div className="flex items-center justify-between">
        <div>
          {selectedSeat ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                Seat {selectedSeat.seat_number}
              </Badge>
              <span className="text-sm text-muted-foreground capitalize">
                {selectedSeat.class} · +₹{selectedSeat.extra_fee}
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Pick a seat to continue</p>
          )}
        </div>
        <Button onClick={handleContinue} disabled={!selectedSeat}>
          Continue
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}