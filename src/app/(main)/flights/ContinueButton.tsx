'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { useFlightStore } from '@/store/useFlightStore'
import { Button } from '@/components/ui/button'

interface Props {
  flight: {
    id: string; flight_no: string; origin: string; destination: string
    departs_at: string; arrives_at: string; aircraft_type: string; status: string; base_price: number
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
    <Button size="sm" onClick={handleClick}>
      Book Now
      <ArrowRight className="ml-1.5 h-4 w-4" />
    </Button>
  )
}