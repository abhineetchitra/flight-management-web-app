import PassengerDetailsClient from './PassengerDetailsClient'

type Props = {
  searchParams: Promise<{
    flightId?: string
  }>
}

export default async function PassengerDetailsPage({ searchParams }: Props) {
  const params = await searchParams
  const flightId = params.flightId ?? null

  return <PassengerDetailsClient flightId={flightId} />
}