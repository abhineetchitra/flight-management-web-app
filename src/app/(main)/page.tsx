'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useFlightStore } from '@/store/useFlightStore'

export default function HomePage() {
  const router = useRouter()
  const setSearchQuery = useFlightStore((s) => s.setSearchQuery)
  const setBookingStep = useFlightStore((s) => s.setBookingStep)

  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [passengerCount, setPassengerCount] = useState(1)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!origin || !destination || !date || passengerCount < 1) return

    setSearchQuery({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      date,
      passengerCount,
    })

    setBookingStep('results')
    router.push('/flights')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-xl border p-6 shadow-sm"
      >
        <h1 className="text-2xl font-semibold">Search Flights</h1>

        <div className="space-y-2">
          <label htmlFor="origin" className="block text-sm font-medium">
            Origin
          </label>
          <input
            id="origin"
            type="text"
            placeholder="DEL"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="destination" className="block text-sm font-medium">
            Destination
          </label>
          <input
            id="destination"
            type="text"
            placeholder="BOM"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="date" className="block text-sm font-medium">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="passengerCount" className="block text-sm font-medium">
            Passenger Count
          </label>
          <input
            id="passengerCount"
            type="number"
            min={1}
            value={passengerCount}
            onChange={(e) => setPassengerCount(Number(e.target.value))}
            className="w-full rounded-md border px-3 py-2"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-black px-4 py-2 text-white"
        >
          Search Flights
        </button>
      </form>
    </main>
  )
}