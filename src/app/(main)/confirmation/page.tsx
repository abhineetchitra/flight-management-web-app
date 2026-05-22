import ConfirmationClient from './ConfirmationClient'

type Props = {
  searchParams: Promise<{ flightId?: string }>
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const params = await searchParams
  const flightId = params.flightId ?? null
  return <ConfirmationClient flightId={flightId} />
}