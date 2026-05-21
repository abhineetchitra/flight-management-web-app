import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Session, User } from '@supabase/supabase-js'

// Type for cached booking (from your bookings table)
interface CachedBooking {
  id: string
  pnr_code: string
  flight_id: string
  seat_id: string
  status: 'confirmed' | 'rescheduled' | 'cancelled'
  total_price: number
  booked_at: string
}

interface UserStore {
  // --- State ---
  session: Session | null         // full Supabase session (access_token, refresh_token, etc.)
  user: User | null               // Supabase user object
  bookings: CachedBooking[]       // cached bookings for My Bookings page

  // --- Actions ---
  setSession: (session: Session | null) => void
  setUser: (user: User | null) => void
  setBookings: (bookings: CachedBooking[]) => void
  reset: () => void               // triggered on logout or booking cancellation
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      bookings: [],

      setSession: (session) => set({ session }),
      setUser: (user) => set({ user }),
      setBookings: (bookings) => set({ bookings }),

      // Called on logout — clears everything
      reset: () => set({ session: null, user: null, bookings: [] }),
    }),
    {
      name: 'user-session-storage',

      // ✅ KEY: partialize — persist ONLY the session token
      // Do NOT persist: full booking data, user details, sensitive fields
      partialize: (state) => ({
        session: state.session
          ? { access_token: state.session.access_token }  // only the token
          : null,
        // user → NOT persisted (fetched fresh from Supabase on load)
        // bookings → NOT persisted (fetched fresh from DB on load)
      }),
    }
  )
)