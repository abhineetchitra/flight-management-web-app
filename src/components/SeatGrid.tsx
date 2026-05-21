'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFlightStore } from '@/store/useFlightStore'

type SeatClass = 'first' | 'business' | 'economy'
type SeatState = 'available' | 'occupied' | 'selected' | 'your-seat'

interface SeatItem {
  id: string
  flight_id: string
  seat_number: string
  class: SeatClass
  is_available: boolean
  extra_fee: number
}

interface SeatGridProps {
  flightId: string
  bookedSeatId?: string | null
}

function parseSeat(seatNumber: string) {
  const match = seatNumber.match(/^(\d+)([A-Z])$/)

  if (!match) {
    return { row: 0, column: '' }
  }

  return {
    row: Number(match[1]),
    column: match[2],
  }
}

function getSeatState(
  seat: SeatItem,
  selectedSeatId: string | null,
  bookedSeatId: string | null
): SeatState {
  if (bookedSeatId === seat.id) return 'your-seat'
  if (!seat.is_available) return 'occupied'
  if (selectedSeatId === seat.id) return 'selected'
  return 'available'
}

function getSeatClasses(state: SeatState) {
  switch (state) {
    case 'occupied':
      return 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed opacity-70'
    case 'selected':
      return 'bg-blue-600 border-blue-700 text-white shadow-md ring-2 ring-blue-300'
    case 'your-seat':
      return 'bg-emerald-600 border-emerald-700 text-white shadow-md'
    default:
      return 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'
  }
}

function SeatSection({
  title,
  seats,
  bookedSeatId,
}: {
  title: string
  seats: SeatItem[]
  bookedSeatId?: string | null
}) {
  const selectedSeat = useFlightStore((s) => s.selectedSeat)
  const setSelectedSeat = useFlightStore((s) => s.setSelectedSeat)

  const parsedRows = [...new Set(seats.map((seat) => parseSeat(seat.seat_number).row))].sort(
    (a, b) => a - b
  )

  function handleSeatClick(seat: SeatItem) {
    if (!seat.is_available) return
    if (bookedSeatId === seat.id) return

    if (selectedSeat?.id === seat.id) {
      setSelectedSeat(null)
      return
    }

    setSelectedSeat({
      id: seat.id,
      flight_id: seat.flight_id,
      seat_number: seat.seat_number,
      class: seat.class,
      is_available: seat.is_available,
      extra_fee: seat.extra_fee,
    })
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-gray-500">{title} cabin</p>
      </div>

      <div className="overflow-x-auto rounded-xl border p-4">
        <div className="min-w-[720px] space-y-3">
          <div className="grid grid-cols-[60px_repeat(3,1fr)_40px_repeat(3,1fr)] gap-2 text-center text-xs font-medium text-gray-500">
            <div>Row</div>
            <div>A</div>
            <div>B</div>
            <div>C</div>
            <div></div>
            <div>D</div>
            <div>E</div>
            <div>F</div>
          </div>

          {parsedRows.map((row) => {
            const rowSeats = seats.filter(
              (seat) => parseSeat(seat.seat_number).row === row
            )

            return (
              <div
                key={row}
                className="grid grid-cols-[60px_repeat(3,1fr)_40px_repeat(3,1fr)] gap-2 items-center"
              >
                <div className="text-sm font-semibold text-center">{row}</div>

                {['A', 'B', 'C'].map((col) => {
                  const seat = rowSeats.find(
                    (s) => parseSeat(s.seat_number).column === col
                  )

                  if (!seat) return <div key={col} />

                  const seatState = getSeatState(
                    seat,
                    selectedSeat?.id ?? null,
                    bookedSeatId ?? null
                  )

                  const isDisabled = !seat.is_available || bookedSeatId === seat.id

                  return (
                    <button
                      key={col}
                      type="button"
                      disabled={isDisabled}
                      title={`${seat.class} • Extra fee ₹${seat.extra_fee}`}
                      onClick={() => handleSeatClick(seat)}
                      className={`rounded-md border px-2 py-3 text-center text-xs font-medium transition ${getSeatClasses(seatState)}`}
                    >
                      {seat.seat_number}
                    </button>
                  )
                })}

                <div className="text-center text-xs text-gray-400">✈</div>

                {['D', 'E', 'F'].map((col) => {
                  const seat = rowSeats.find(
                    (s) => parseSeat(s.seat_number).column === col
                  )

                  if (!seat) return <div key={col} />

                  const seatState = getSeatState(
                    seat,
                    selectedSeat?.id ?? null,
                    bookedSeatId ?? null
                  )

                  const isDisabled = !seat.is_available || bookedSeatId === seat.id

                  return (
                    <button
                      key={col}
                      type="button"
                      disabled={isDisabled}
                      title={`${seat.class} • Extra fee ₹${seat.extra_fee}`}
                      onClick={() => handleSeatClick(seat)}
                      className={`rounded-md border px-2 py-3 text-center text-xs font-medium transition ${getSeatClasses(seatState)}`}
                    >
                      {seat.seat_number}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default function SeatGrid({
  flightId,
  bookedSeatId = null,
}: SeatGridProps) {
  const [supabase] = useState(() => createClient())
  const selectedSeat = useFlightStore((s) => s.selectedSeat)
  const setSelectedSeat = useFlightStore((s) => s.setSelectedSeat)

  const [seats, setSeats] = useState<SeatItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSeats() {
      setLoading(true)

      const { data, error } = await supabase
        .from('seats')
        .select('id, flight_id, seat_number, class, is_available, extra_fee')
        .eq('flight_id', flightId)
        .order('seat_number', { ascending: true })

      if (!error && data) {
        setSeats(data as SeatItem[])
      }

      setLoading(false)
    }

    fetchSeats()

    const channel = supabase
      .channel(`seats-flight-${flightId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seats',
          filter: `flight_id=eq.${flightId}`,
        },
        (payload) => {
          const updatedSeat = payload.new as SeatItem

          setSeats((prevSeats) =>
            prevSeats.map((seat) =>
              seat.id === updatedSeat.id ? updatedSeat : seat
            )
          )

          const currentSelectedSeat = useFlightStore.getState().selectedSeat

          if (
            currentSelectedSeat?.id === updatedSeat.id &&
            updatedSeat.is_available === false
          ) {
            setSelectedSeat(null)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [flightId, setSelectedSeat, supabase])

  const firstClassSeats = seats.filter((seat) => seat.class === 'first')
  const businessClassSeats = seats.filter((seat) => seat.class === 'business')
  const economySeats = seats.filter((seat) => seat.class === 'economy')

  if (loading) {
    return <p className="text-sm text-gray-500">Loading seats...</p>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-full border border-gray-300 bg-white px-3 py-1 text-gray-700">
          Available
        </span>
        <span className="rounded-full border border-gray-300 bg-gray-200 px-3 py-1 text-gray-500">
          Occupied
        </span>
        <span className="rounded-full border border-blue-600 bg-blue-600 px-3 py-1 text-white">
          Selected
        </span>
        <span className="rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1 text-white">
          Your Seat
        </span>
      </div>

      <div className="rounded-xl border bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700">Temporary selection</p>
        {selectedSeat ? (
          <p className="mt-1 text-sm text-slate-600">
            Seat {selectedSeat.seat_number} selected • {selectedSeat.class} • Extra fee ₹
            {selectedSeat.extra_fee}
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-500">No seat selected yet.</p>
        )}
      </div>

      <SeatSection
        title="First Class"
        seats={firstClassSeats}
        bookedSeatId={bookedSeatId}
      />
      <SeatSection
        title="Business Class"
        seats={businessClassSeats}
        bookedSeatId={bookedSeatId}
      />
      <SeatSection
        title="Economy Class"
        seats={economySeats}
        bookedSeatId={bookedSeatId}
      />
    </div>
  )
}