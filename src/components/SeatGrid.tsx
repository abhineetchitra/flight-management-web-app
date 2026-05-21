'use client'

type SeatClass = 'first' | 'business' | 'economy'

interface SeatItem {
  id: string
  seatNumber: string
  row: number
  column: string
  class: SeatClass
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
    }))
  ).flat(),

  ...Array.from({ length: 4 }, (_, i) =>
    seatColumns.map((col) => ({
      id: `business-${i + 3}${col}`,
      seatNumber: `${i + 3}${col}`,
      row: i + 3,
      column: col,
      class: 'business' as SeatClass,
    }))
  ).flat(),

  ...Array.from({ length: 12 }, (_, i) =>
    seatColumns.map((col) => ({
      id: `economy-${i + 7}${col}`,
      seatNumber: `${i + 7}${col}`,
      row: i + 7,
      column: col,
      class: 'economy' as SeatClass,
    }))
  ).flat(),
]

function getSeatStyle(seatClass: SeatClass) {
  if (seatClass === 'first') {
    return 'bg-purple-100 border-purple-300 text-purple-700'
  }

  if (seatClass === 'business') {
    return 'bg-blue-100 border-blue-300 text-blue-700'
  }

  return 'bg-green-100 border-green-300 text-green-700'
}

function SeatSection({
  title,
  seatClass,
  seats,
}: {
  title: string
  seatClass: SeatClass
  seats: SeatItem[]
}) {
  const rows = [...new Set(seats.map((seat) => seat.row))]

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
                  return (
                    <div
                      key={col}
                      className={`rounded-md border px-2 py-3 text-center text-xs font-medium ${seat ? getSeatStyle(seat.class) : 'invisible'}`}
                    >
                      {seat?.seatNumber}
                    </div>
                  )
                })}

                <div className="text-center text-xs text-gray-400">✈</div>

                {['D', 'E', 'F'].map((col) => {
                  const seat = rowSeats.find((s) => s.column === col)
                  return (
                    <div
                      key={col}
                      className={`rounded-md border px-2 py-3 text-center text-xs font-medium ${seat ? getSeatStyle(seat.class) : 'invisible'}`}
                    >
                      {seat?.seatNumber}
                    </div>
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

export default function SeatGrid() {
  const firstClassSeats = staticSeats.filter((seat) => seat.class === 'first')
  const businessClassSeats = staticSeats.filter((seat) => seat.class === 'business')
  const economySeats = staticSeats.filter((seat) => seat.class === 'economy')

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-full border border-purple-300 bg-purple-100 px-3 py-1 text-purple-700">
          First Class
        </span>
        <span className="rounded-full border border-blue-300 bg-blue-100 px-3 py-1 text-blue-700">
          Business
        </span>
        <span className="rounded-full border border-green-300 bg-green-100 px-3 py-1 text-green-700">
          Economy
        </span>
      </div>

      <SeatSection title="First Class" seatClass="first" seats={firstClassSeats} />
      <SeatSection title="Business Class" seatClass="business" seats={businessClassSeats} />
      <SeatSection title="Economy Class" seatClass="economy" seats={economySeats} />
    </div>
  )
}