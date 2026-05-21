'use client'

import { useFlightStore } from '@/store/useFlightStore'

type SeatClass = 'first' | 'business' | 'economy'
type SeatState = 'available' | 'occupied' | 'selected' | 'your-seat'

interface SeatItem {
  id: string
  seatNumber: string
  row: number
  column: string
  class: SeatClass
  isAvailable: boolean
  extra_fee: number
}

interface SeatGridProps {
  bookedSeatId?: string | null
}

const seatColumns = ['A', 'B', 'C', 'D', 'E', 'F']

const staticSeats: SeatItem[] = [
  ...Array.from({ length: 2 }, (_, i) =>
    seatColumns.map((col) => ({
      id: `first-${i + 1}${col}`,
      seatNumber: `${i + 1}${col}`,
      row: i + 1,
      column: col,
      class: 'first' as SeatClass,
      isAvailable: !['1C', '2D'].includes(`${i + 1}${col}`),
      extra_fee: 5000,
    }))
  ).flat(),

  ...Array.from({ length: 4 }, (_, i) =>
    seatColumns.map((col) => ({
      id: `business-${i + 3}${col}`,
      seatNumber: `${i + 3}${col}`,
      row: i + 3,
      column: col,
      class: 'business' as SeatClass,
      isAvailable: !['3A', '4F'].includes(`${i + 3}${col}`),
      extra_fee: 2500,
    }))
  ).flat(),

  ...Array.from({ length: 12 }, (_, i) =>
    seatColumns.map((col) => ({
      id: `economy-${i + 7}${col}`,
      seatNumber: `${i + 7}${col}`,
      row: i + 7,
      column: col,
      class: 'economy' as SeatClass,
      isAvailable: !['7B', '8E', '10C', '12D'].includes(`${i + 7}${col}`),
      extra_fee: 0,
    }))
  ).flat(),
]

function getSeatState(
  seat: SeatItem,
  selectedSeatId: string | null,
  bookedSeatId: string | null
): SeatState {
  if (bookedSeatId === seat.id) return 'your-seat'
  if (!seat.isAvailable) return 'occupied'
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
  seatClass,
  seats,
  bookedSeatId,
}: {
  title: string
  seatClass: SeatClass
  seats: SeatItem[]
  bookedSeatId?: string | null
}) {
  const selectedSeat = useFlightStore((s) => s.selectedSeat)
  const setSelectedSeat = useFlightStore((s) => s.setSelectedSeat)
  const setBookingStep = useFlightStore((s) => s.setBookingStep)

  const rows = [...new Set(seats.map((seat) => seat.row))]

  function handleSeatClick(seat: SeatItem) {
    if (!seat.isAvailable) return
    if (bookedSeatId === seat.id) return

    // ✅ Optimistic selection: update Zustand immediately
    if (selectedSeat?.id === seat.id) {
      setSelectedSeat(null)
      return
    }

    setSelectedSeat({
      id: seat.id,
      flight_id: '',
      seat_number: seat.seatNumber,
      class: seat.class,
      is_available: seat.isAvailable,
      extra_fee: seat.extra_fee,
    })

    // Optional: move booking flow forward
    // setBookingStep('passenger-details')
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-gray-500">
          {seatClass.charAt(0).toUpperCase() + seatClass.slice(1)} cabin
        </p>
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

          {rows.map((row) => {
            const rowSeats = seats.filter((seat) => seat.row === row)

            return (
              <div
                key={row}
                className="grid grid-cols-[60px_repeat(3,1fr)_40px_repeat(3,1fr)] gap-2 items-center"
              >
                <div className="text-sm font-semibold text-center">{row}</div>

                {['A', 'B', 'C'].map((col) => {
                  const seat = rowSeats.find((s) => s.column === col)
                  if (!seat) return <div key={col} />

                  const seatState = getSeatState(
                    seat,
                    selectedSeat?.id ?? null,
                    bookedSeatId ?? null
                  )

                  const isDisabled = !seat.isAvailable || bookedSeatId === seat.id

                  return (
                    <button
                      key={col}
                      type="button"
                      disabled={isDisabled}
                      title={`${seat.class} • Extra fee ₹${seat.extra_fee}`}
                      onClick={() => handleSeatClick(seat)}
                      className={`rounded-md border px-2 py-3 text-center text-xs font-medium transition ${getSeatClasses(seatState)}`}
                    >
                      {seat.seatNumber}
                    </button>
                  )
                })}

                <div className="text-center text-xs text-gray-400">✈</div>

                {['D', 'E', 'F'].map((col) => {
                  const seat = rowSeats.find((s) => s.column === col)
                  if (!seat) return <div key={col} />

                  const seatState = getSeatState(
                    seat,
                    selectedSeat?.id ?? null,
                    bookedSeatId ?? null
                  )

                  const isDisabled = !seat.isAvailable || bookedSeatId === seat.id

                  return (
                    <button
                      key={col}
                      type="button"
                      disabled={isDisabled}
                      title={`${seat.class} • Extra fee ₹${seat.extra_fee}`}
                      onClick={() => handleSeatClick(seat)}
                      className={`rounded-md border px-2 py-3 text-center text-xs font-medium transition ${getSeatClasses(seatState)}`}
                    >
                      {seat.seatNumber}
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

export default function SeatGrid({ bookedSeatId = 'economy-9A' }: SeatGridProps) {
  const selectedSeat = useFlightStore((s) => s.selectedSeat)

  const firstClassSeats = staticSeats.filter((seat) => seat.class === 'first')
  const businessClassSeats = staticSeats.filter((seat) => seat.class === 'business')
  const economySeats = staticSeats.filter((seat) => seat.class === 'economy')

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
        seatClass="first"
        seats={firstClassSeats}
        bookedSeatId={bookedSeatId}
      />
      <SeatSection
        title="Business Class"
        seatClass="business"
        seats={businessClassSeats}
        bookedSeatId={bookedSeatId}
      />
      <SeatSection
        title="Economy Class"
        seatClass="economy"
        seats={economySeats}
        bookedSeatId={bookedSeatId}
      />
    </div>
  )
}