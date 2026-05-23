'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { format } from 'date-fns'
import { ArrowLeftRight, CalendarIcon, Search, Plane } from 'lucide-react'
import { useFlightStore } from '@/store/useFlightStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const router = useRouter()
  const setSearchQuery = useFlightStore((s) => s.setSearchQuery)
  const setBookingStep = useFlightStore((s) => s.setBookingStep)

  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [passengerCount, setPassengerCount] = useState('1')

  function handleSwap() {
    setOrigin(destination)
    setDestination(origin)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!origin || !destination || !date || !passengerCount) return
    const dateStr = format(date, 'yyyy-MM-dd')
    setSearchQuery({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      date: dateStr,
      passengerCount: Number(passengerCount),
    })
    setBookingStep('results')
    router.push(
      `/flights?origin=${origin.toUpperCase()}&destination=${destination.toUpperCase()}&date=${dateStr}&passengers=${passengerCount}`
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:py-20">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Plane className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Where to next?</h1>
        <p className="mt-2 text-muted-foreground">Search and book flights in seconds.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-muted-foreground" />
            Search Flights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Origin / Destination */}
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="origin">From</Label>
                <Input
                  id="origin"
                  placeholder="DEL"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  required
                  maxLength={3}
                  className="uppercase"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleSwap}
                className="mb-0.5 shrink-0"
                title="Swap airports"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
              <div className="flex-1 space-y-2">
                <Label htmlFor="destination">To</Label>
                <Input
                  id="destination"
                  placeholder="BOM"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                  maxLength={3}
                  className="uppercase"
                />
              </div>
            </div>

            {/* Date + Passengers */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Departure Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Passengers</Label>
                <Select value={passengerCount} onValueChange={setPassengerCount}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Passengers" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {n === 1 ? 'Passenger' : 'Passengers'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={!origin || !destination || !date}>
              <Search className="mr-2 h-4 w-4" />
              Search Flights
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}