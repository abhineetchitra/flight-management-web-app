'use client'

import SeatGrid from '@/components/SeatGrid'
import { useFlightStore } from '@/store/useFlightStore'
import { useRouter } from 'next/navigation'

interface BookingPageClientProps {
  flightId: string | null
}

export default function BookingPageClient({
  flightId,
}: BookingPageClientProps) {
  const router = useRouter()
  const selectedSeat = useFlightStore((s) => s.selectedSeat)
  const setBookingStep = useFlightStore((s) => s.setBookingStep)

  function handleContinue() {
    if (!selectedSeat || !flightId) return
    setBookingStep('passenger-details')
    // ✅ pass both flightId AND seatId
    router.push(
      `/passenger-details?flightId=${flightId}&seatId=${selectedSeat.id}`
    )
  }

  if (!flightId) {
    return (
      <main className="min-h-screen px-4 py-8">
        <p className="text-red-600">Missing flight ID.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Select Your Seat</h1>
          <p className="text-sm text-gray-600">
            Choose a seat before continuing to passenger details.
          </p>
        </div>

        <SeatGrid flightId={flightId} />

        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedSeat}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </main>
  )
}