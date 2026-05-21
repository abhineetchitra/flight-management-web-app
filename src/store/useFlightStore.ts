import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ──────────────────────────────────────────────────────────────────

interface SearchQuery {
  origin: string
  destination: string
  date: string
  passengerCount: number
}

interface Flight {
  id: string
  flight_no: string
  origin: string
  destination: string
  departs_at: string
  arrives_at: string
  aircraft_type: string
  status: string
  base_price: number
}

interface Seat {
  id: string
  flight_id: string
  seat_number: string
  class: 'economy' | 'business' | 'first'
  is_available: boolean
  extra_fee: number
}

interface PassengerFormData {
  full_name: string
  nationality: string
  dob: string
  // ⚠️ passport_no is intentionally NOT here — excluded from store (sensitive)
}

type BookingStep = 'search' | 'results' | 'seats' | 'passenger-details' | 'confirmation'

// ── Store Interface ────────────────────────────────────────────────────────

interface FlightStore {
  // State
  searchQuery: SearchQuery | null
  selectedFlight: Flight | null
  selectedSeat: Seat | null
  bookingStep: BookingStep
  passengerFormData: PassengerFormData | null

  // Actions
  setSearchQuery: (query: SearchQuery) => void
  setSelectedFlight: (flight: Flight | null) => void
  setSelectedSeat: (seat: Seat | null) => void   // ✅ optimistic seat selection
  setBookingStep: (step: BookingStep) => void
  setPassengerFormData: (data: PassengerFormData) => void
  reset: () => void  // triggered on cancellation or logout
}


const initialState = {
  searchQuery: null,
  selectedFlight: null,
  selectedSeat: null,
  bookingStep: 'search' as BookingStep,
  passengerFormData: null,
}


export const useFlightStore = create<FlightStore>()(
  persist(
    (set) => ({
      ...initialState,

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedFlight: (flight) => set({ selectedFlight: flight }),

      setSelectedSeat: (seat) => set({ selectedSeat: seat }),

      setBookingStep: (step) => set({ bookingStep: step }),
      setPassengerFormData: (data) => set({ passengerFormData: data }),

      reset: () => set(initialState),
    }),
    {
      name: 'flight-booking-storage',
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeat: state.selectedSeat,
        bookingStep: state.bookingStep,
    
      }),
    }
  )
)