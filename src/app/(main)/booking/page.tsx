'use client'

import SeatGrid from '@/components/SeatGrid'
import { useFlightStore } from '@/store/useFlightStore'
import { useRouter } from 'next/navigation'

export default function BookingPage() {
  const router = useRouter()
  const selectedSeat = useFlightStore((s) => s.selectedSeat)
  const setBookingStep = useFlightStore((s) => s.setBookingStep)

  function handleContinue() {
    if (!selectedSeat) return
    setBookingStep('passenger-details')
    router.push('/passenger-details')
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

        <SeatGrid />

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