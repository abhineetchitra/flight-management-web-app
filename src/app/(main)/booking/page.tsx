import BookingPageClient from './BookingPageClient'

type BookingPageProps = {
  searchParams: Promise<{
    flightId?: string
  }>
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const params = await searchParams
  const flightId = params.flightId ?? null

  return <BookingPageClient flightId={flightId} />
}