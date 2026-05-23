'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface FlightOption { id: string; flight_number: string; origin: string; destination: string; departure_time: string }
interface RpcResponse { success: boolean; reschedule_fee: number }
interface Props { bookingId: string; currentFlightId: string; origin: string; destination: string }

export default function RescheduleBookingButton({ bookingId, currentFlightId, origin, destination }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [loadingFlights, setLoadingFlights] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [flights, setFlights] = useState<FlightOption[]>([])
  const [selectedFlightId, setSelectedFlightId] = useState('')
  const [fee] = useState<number>(1500)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadFlights() {
      if (!open) return
      setLoadingFlights(true); setError(null)
      const { data, error } = await supabase.from('flights')
        .select('id, flight_number, origin, destination, departure_time')
        .eq('origin', origin).eq('destination', destination)
        .neq('id', currentFlightId).order('departure_time', { ascending: true })
      if (error) { setError(error.message); setLoadingFlights(false); return }
      setFlights((data ?? []) as FlightOption[]); setLoadingFlights(false)
    }
    loadFlights()
  }, [open, origin, destination, currentFlightId, supabase])

  async function handleReschedule() {
    if (!selectedFlightId) { setError('Please select a different flight.'); return }
    setSubmitting(true); setError(null)
    const { data, error } = await supabase.rpc('reschedule_booking_same_route', { p_booking_id: bookingId, p_new_flight_id: selectedFlightId })
    if (error) {
      toast.error('Reschedule failed', { description: error.message })
      setSubmitting(false)
      return
    }
    const result = data as RpcResponse | null
    void result
    toast.success('Booking rescheduled', { description: 'Your flight has been updated.' })
    setSubmitting(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Reschedule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Booking</DialogTitle>
          <DialogDescription>{origin} → {destination}</DialogDescription>
        </DialogHeader>

        {/* Fee */}
        <Badge variant="outline" className="w-fit">
          Reschedule fee: ₹{fee.toLocaleString('en-IN')}
        </Badge>

        <Separator />

        {/* Flight list */}
        {loadingFlights ? (
          <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading flights…
          </div>
        ) : flights.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No alternate flights found for this route.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {flights.map((flight) => (
              <label key={flight.id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                  selectedFlightId === flight.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                )}>
                <input type="radio" name="reschedule-flight" value={flight.id}
                  checked={selectedFlightId === flight.id} onChange={(e) => setSelectedFlightId(e.target.value)}
                  className="accent-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{flight.flight_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(flight.departure_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {selectedFlightId === flight.id && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </label>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Close</Button>
          <Button onClick={handleReschedule} disabled={submitting || !selectedFlightId}>
            {submitting ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Updating…</>
            ) : 'Confirm Reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}