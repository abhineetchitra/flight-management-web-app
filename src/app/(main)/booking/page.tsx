import SeatGrid from '@/components/SeatGrid'

export default function BookingPage() {
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Select Your Seat</h1>
          <p className="text-sm text-gray-600">
            Static cabin layout first, live seat logic later.
          </p>
        </div>

        <SeatGrid />
      </div>
    </main>
  )
}