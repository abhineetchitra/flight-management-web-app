import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold">
          ✈ FlightApp
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/">Search</Link>
          <Link href="/bookings">My Bookings</Link>
          <LogoutButton />
        </nav>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}