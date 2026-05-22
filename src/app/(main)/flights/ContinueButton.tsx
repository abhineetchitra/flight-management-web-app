'use client'

import { useRouter } from 'next/navigation'
import { useFlightStore } from '@/store/useFlightStore'

interface Props {
  flight: {
    id: string
    flight_no: string
    origin: string
    destination: string
    departs_at: string
    arrives_at: string
    aircraft_type: string
    status: string
    base_price: number
  }
}

export default function ContinueButton({ flight }: Props) {
  const router = useRouter()
  const setSelectedFlight = useFlightStore((s) => s.setSelectedFlight)
  const setBookingStep = useFlightStore((s) => s.setBookingStep)

  function handleClick() {
    setSelectedFlight(flight)
    setBookingStep('seat-selection')
    router.push(`/booking?flightId=${flight.id}`)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-block rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-900"
    >
      Continue
    </button>
  )
}