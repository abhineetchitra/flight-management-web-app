'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFlightStore } from '@/store/useFlightStore'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type SeatClass = 'first' | 'business' | 'economy'
type SeatState = 'available' | 'occupied' | 'selected' | 'your-seat'

interface SeatItem {
  id: string; flight_id: string; seat_number: string
  class: SeatClass; is_available: boolean; extra_fee: number
}

interface SeatGridProps { flightId: string; bookedSeatId?: string | null }

function parseSeat(seatNumber: string) {
  const match = seatNumber.match(/^(\d+)([A-Z])$/)
  if (!match) return { row: 0, column: '' }
  return { row: Number(match[1]), column: match[2] }
}

function getSeatState(seat: SeatItem, selectedSeatId: string | null, bookedSeatId: string | null): SeatState {
  if (bookedSeatId === seat.id) return 'your-seat'
  if (!seat.is_available) return 'occupied'
  if (selectedSeatId === seat.id) return 'selected'
  return 'available'
}

function getSeatClasses(state: SeatState): string {
  switch (state) {
    case 'occupied':
      return 'bg-red-100 border-red-300 text-red-400 cursor-not-allowed'
    case 'selected':
      return 'bg-blue-500 border-blue-600 text-white ring-2 ring-blue-300 scale-105'
    case 'your-seat':
      return 'bg-yellow-100 border-yellow-400 text-yellow-700'
    default:
      return 'bg-emerald-100 border-emerald-400 text-emerald-700 hover:bg-emerald-200 cursor-pointer'
  }
}

function SeatSection({ title, seats, bookedSeatId }: {
  title: string; seats: SeatItem[]; bookedSeatId?: string | null
}) {
  const selectedSeat = useFlightStore((s) => s.selectedSeat)
  const setSelectedSeat = useFlightStore((s) => s.setSelectedSeat)
  const parsedRows = [...new Set(seats.map((s) => parseSeat(s.seat_number).row))].sort((a, b) => a - b)

  function handleSeatClick(seat: SeatItem) {
    if (!seat.is_available || bookedSeatId === seat.id) return
    if (selectedSeat?.id === seat.id) { setSelectedSeat(null); return }
    setSelectedSeat({ id: seat.id, flight_id: seat.flight_id, seat_number: seat.seat_number, class: seat.class, is_available: seat.is_available, extra_fee: seat.extra_fee })
  }

  if (seats.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">{seats.length} seats</span>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card p-3 sm:p-4">
        <div className="min-w-[360px] space-y-1.5">
          {/* Column headers */}
          <div className="grid grid-cols-8 gap-1.5 text-center text-xs font-medium text-muted-foreground mb-2">
            <div></div><div>A</div><div>B</div><div>C</div>
            <div></div>
            <div>D</div><div>E</div><div>F</div>
          </div>
          {parsedRows.map((row) => {
            const rowSeats = seats.filter((s) => parseSeat(s.seat_number).row === row)
            return (
              <div key={row} className="grid grid-cols-8 items-center gap-1.5">
                <div className="text-center text-xs font-medium text-muted-foreground">{row}</div>
                {['A', 'B', 'C'].map((col) => {
                  const seat = rowSeats.find((s) => parseSeat(s.seat_number).column === col)
                  if (!seat) return <div key={col} />
                  const seatState = getSeatState(seat, selectedSeat?.id ?? null, bookedSeatId ?? null)
                  return (
                    <button key={col} type="button" disabled={!seat.is_available || bookedSeatId === seat.id}
                      title={`${seat.seat_number} · ${seat.class} · ₹${seat.extra_fee}`}
                      onClick={() => handleSeatClick(seat)}
                      className={cn(
                        'rounded-md border px-1 py-2.5 text-center text-xs font-semibold transition-all duration-150',
                        getSeatClasses(seatState)
                      )}>
                      {seat.seat_number}
                    </button>
                  )
                })}
                <div className="flex items-center justify-center">
                  <div className="h-6 w-px bg-border" />
                </div>
                {['D', 'E', 'F'].map((col) => {
                  const seat = rowSeats.find((s) => parseSeat(s.seat_number).column === col)
                  if (!seat) return <div key={col} />
                  const seatState = getSeatState(seat, selectedSeat?.id ?? null, bookedSeatId ?? null)
                  return (
                    <button key={col} type="button" disabled={!seat.is_available || bookedSeatId === seat.id}
                      title={`${seat.seat_number} · ${seat.class} · ₹${seat.extra_fee}`}
                      onClick={() => handleSeatClick(seat)}
                      className={cn(
                        'rounded-md border px-1 py-2.5 text-center text-xs font-semibold transition-all duration-150',
                        getSeatClasses(seatState)
                      )}>
                      {seat.seat_number}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* Skeleton for loading state */
function SeatGridSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <div className="rounded-lg border p-4 space-y-2">
            {[1, 2, 3].map((row) => (
              <div key={row} className="grid grid-cols-8 gap-1.5">
                <Skeleton className="h-3 w-3 mx-auto" />
                {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                  <Skeleton key={col} className="h-9 rounded-md" />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SeatGrid({ flightId, bookedSeatId = null }: SeatGridProps) {
  const selectedSeat = useFlightStore((s) => s.selectedSeat)
  const setSelectedSeat = useFlightStore((s) => s.setSelectedSeat)
  const [seats, setSeats] = useState<SeatItem[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    async function fetchSeats() {
      setLoading(true); setFetchError(null)
      try {
        const { data, error } = await supabase.from('seats')
          .select('id, flight_id, seat_number, class, is_available, extra_fee')
          .eq('flight_id', flightId).order('seat_number', { ascending: true })
        if (error) { setFetchError('Unable to load seats. Please refresh.'); setSeats([]) }
        else setSeats((data as SeatItem[]) ?? [])
      } catch { setFetchError('Unable to load seats. Please refresh.'); setSeats([]) }
      finally { setLoading(false) }
    }
    fetchSeats()
    const channel = supabase.channel(`seats-flight-${flightId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'seats', filter: `flight_id=eq.${flightId}` },
        (payload: RealtimePostgresChangesPayload<SeatItem>) => {
          const updatedSeat = payload.new as SeatItem
          setSeats((prev) => prev.map((s) => (s.id === updatedSeat.id ? updatedSeat : s)))
          const cur = useFlightStore.getState().selectedSeat
          if (cur?.id === updatedSeat.id && !updatedSeat.is_available) setSelectedSeat(null)
        }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [flightId, setSelectedSeat])

  const firstClassSeats = seats.filter((s) => s.class === 'first')
  const businessClassSeats = seats.filter((s) => s.class === 'business')
  const economySeats = seats.filter((s) => s.class === 'economy')

  if (loading) return <SeatGridSkeleton />

  if (fetchError) return (
    <div className="rounded-lg border border-destructive bg-destructive/5 p-4 text-center text-sm text-destructive">
      {fetchError}
    </div>
  )

  if (seats.length === 0) return (
    <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
      No seats available for this flight.
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { label: 'Available', cls: 'bg-emerald-100 border-emerald-400' },
          { label: 'Selected', cls: 'bg-blue-500 border-blue-600' },
          { label: 'Occupied', cls: 'bg-red-100 border-red-300' },
          ...(bookedSeatId ? [{ label: 'Your Seat', cls: 'bg-yellow-100 border-yellow-400' }] : []),
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={cn('h-3.5 w-3.5 rounded-sm border', l.cls)} />
            <span className="text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Selected seat banner */}
      {selectedSeat && (
        <div className="flex items-center justify-between rounded-lg border bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Badge>Seat {selectedSeat.seat_number}</Badge>
            <span className="text-sm text-muted-foreground capitalize">{selectedSeat.class} class · +₹{selectedSeat.extra_fee}</span>
          </div>
          <button onClick={() => setSelectedSeat(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Clear
          </button>
        </div>
      )}

      {/* Sections */}
      <SeatSection title="First Class" seats={firstClassSeats} bookedSeatId={bookedSeatId} />
      {firstClassSeats.length > 0 && businessClassSeats.length > 0 && <Separator />}
      <SeatSection title="Business" seats={businessClassSeats} bookedSeatId={bookedSeatId} />
      {businessClassSeats.length > 0 && economySeats.length > 0 && <Separator />}
      <SeatSection title="Economy" seats={economySeats} bookedSeatId={bookedSeatId} />
    </div>
  )
}