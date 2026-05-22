import PassengerDetailsClient from './PassengerDetailsClient'

type Props = {
  searchParams: Promise<{
    flightId?: string
    seatId?: string
  }>
}

export default async function PassengerDetailsPage({ searchParams }: Props) {
  const params = await searchParams
  const flightId = params.flightId ?? null
  const seatId = params.seatId ?? null

  return <PassengerDetailsClient flightId={flightId} seatId={seatId} />
}