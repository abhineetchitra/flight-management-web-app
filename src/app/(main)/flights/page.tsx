import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ContinueButton from './ContinueButton'

type FlightsPageProps = {
  searchParams: Promise<{
    origin?: string
    destination?: string
    date?: string
    passengers?: string
  }>
}

function formatDuration(departsAt: string, arrivesAt: string) {
  const start = new Date(departsAt).getTime()
  const end = new Date(arrivesAt).getTime()
  const diffMs = end - start

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  return `${hours}h ${minutes}m`
}

export default async function FlightsPage({ searchParams }: FlightsPageProps) {
  const params = await searchParams
  const origin = params.origin ?? ''
  const destination = params.destination ?? ''
  const date = params.date ?? ''

  const supabase = await createClient()

  const { data: flights, error } = await supabase
    .from('flights')
    .select('*')
    .eq('origin', origin)
    .eq('destination', destination)
    .eq('status', 'scheduled')
    .order('departs_at', { ascending: true })

  const filteredFlights =
    flights?.filter((flight) => {
      const flightDate = new Date(flight.departs_at).toISOString().split('T')[0]
      return flightDate === date
    }) ?? []

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Flight Results</h1>
          <p className="text-sm text-gray-600">
            {origin} → {destination} | {date}
          </p>
        </div>

        {error && (
          <p className="text-red-600">Failed to load flights: {error.message}</p>
        )}

        {filteredFlights.length === 0 ? (
          <div className="rounded-xl border p-6">
            <p>No matching flights found.</p>
            <Link href="/" className="mt-3 inline-block text-blue-600 underline">
              Back to search
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFlights.map((flight) => (
              <div
                key={flight.id}
                className="rounded-xl border p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">{flight.flight_no}</h2>
                    <p className="text-sm text-gray-600">
                      {flight.origin} → {flight.destination}
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-sm text-gray-500">Starting from</p>
                    <p className="text-2xl font-bold">₹{flight.base_price}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <p className="text-xs text-gray-500">Departure</p>
                    <p className="font-medium">
                      {new Date(flight.departs_at).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Arrival</p>
                    <p className="font-medium">
                      {new Date(flight.arrives_at).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="font-medium">
                      {formatDuration(flight.departs_at, flight.arrives_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Class</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border px-2 py-1 text-xs">
                        Economy
                      </span>
                      <span className="rounded-full border px-2 py-1 text-xs">
                        Business
                      </span>
                      <span className="rounded-full border px-2 py-1 text-xs">
                        First
                      </span>
                    </div>
                  </div>

                  <div className="flex items-end">
                  <ContinueButton flight={flight} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}