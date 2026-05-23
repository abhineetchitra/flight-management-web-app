import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Clock, PlaneTakeoff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import ContinueButton from './ContinueButton'

type FlightsPageProps = {
  searchParams: Promise<{ origin?: string; destination?: string; date?: string; passengers?: string }>
}

function formatDuration(departsAt: string, arrivesAt: string) {
  const diffMs = new Date(arrivesAt).getTime() - new Date(departsAt).getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default async function FlightsPage({ searchParams }: FlightsPageProps) {
  const params = await searchParams
  const origin = params.origin ?? ''
  const destination = params.destination ?? ''
  const date = params.date ?? ''

  const supabase = await createClient()
  const startDate = new Date(`${date}T00:00:00`)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 1)

  const { data: flights, error } = await supabase
    .from('flights').select('*')
    .eq('origin', origin).eq('destination', destination).eq('status', 'scheduled')
    .gte('departs_at', startDate.toISOString()).lt('departs_at', endDate.toISOString())
    .order('departs_at', { ascending: true })

  const filteredFlights = flights ?? []

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/"><ArrowLeft className="mr-1 h-4 w-4" />Back to search</Link>
        </Button>
        <h1 className="text-2xl font-bold">
          {origin} → {destination}
        </h1>
        <p className="text-sm text-muted-foreground">
          {date} · {filteredFlights.length} flight{filteredFlights.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            Failed to load flights: {error.message}
          </CardContent>
        </Card>
      )}

      {/* No results */}
      {filteredFlights.length === 0 && !error && (
        <Card>
          <CardContent className="py-12 text-center">
            <PlaneTakeoff className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold">No flights found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              No flights from {origin} to {destination} on {date}.
            </p>
            <Button asChild className="mt-4">
              <Link href="/">Modify Search</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Flight cards */}
      <div className="space-y-3">
        {filteredFlights.map((flight) => (
          <Card key={flight.id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-4 sm:p-5">
              {/* Top row: flight info + price */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="font-semibold">{flight.flight_no}</p>
                  <p className="text-xs text-muted-foreground">{flight.aircraft_type || 'Commercial Aircraft'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">₹{flight.base_price.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-muted-foreground">per person</p>
                </div>
              </div>

              <Separator className="mb-4" />

              {/* Timeline row */}
              <div className="flex items-center gap-3 mb-4">
                <div className="text-center">
                  <p className="text-lg font-semibold tabular-nums">{formatTime(flight.departs_at)}</p>
                  <p className="text-xs font-medium text-muted-foreground">{flight.origin}</p>
                </div>

                <div className="flex flex-1 flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDuration(flight.departs_at, flight.arrives_at)}
                  </div>
                  <div className="flex w-full items-center">
                    <div className="h-px flex-1 bg-border" />
                    <PlaneTakeoff className="mx-1.5 h-3.5 w-3.5 text-primary" />
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <p className="text-xs text-muted-foreground">Non-stop</p>
                </div>

                <div className="text-center">
                  <p className="text-lg font-semibold tabular-nums">{formatTime(flight.arrives_at)}</p>
                  <p className="text-xs font-medium text-muted-foreground">{flight.destination}</p>
                </div>
              </div>

              {/* Bottom: badges + button */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs">Economy</Badge>
                  <Badge variant="outline" className="text-xs">Business</Badge>
                  <Badge variant="outline" className="text-xs">First</Badge>
                </div>
                <ContinueButton flight={flight} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}