'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/useUserStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setUser, setBookings, reset } = useUserStore()

  useEffect(() => {
    const supabase = createClient()

    // On mount: load current session + user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          reset()  // ✅ clears session + user + bookings
        } else if (session) {
          setSession(session)
          setUser(session.user)

          // ✅ Load and cache bookings into store
          const { data: bookings } = await supabase
            .from('bookings')
            .select('id, pnr_code, flight_id, seat_id, status, total_price, booked_at')
            .eq('user_id', session.user.id)
            .order('booked_at', { ascending: false })

          if (bookings) setBookings(bookings)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setSession, setUser, setBookings, reset])

  return <>{children}</>
}