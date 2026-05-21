import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

interface PassengerData {
  full_name: string
  nationality: string
  dob: string
  passport_no?: string
}

type BookingStep =
  | 'search'
  | 'results'
  | 'seat-selection'
  | 'passenger-details'
  | 'confirmation'

interface FlightStore {
  searchQuery: SearchQuery | null
  selectedFlight: Flight | null
  selectedSeat: Seat | null
  bookingStep: BookingStep
  passengerData: PassengerData | null

  setSearchQuery: (query: SearchQuery | null) => void
  setSelectedFlight: (flight: Flight | null) => void
  setSelectedSeat: (seat: Seat | null) => void
  setBookingStep: (step: BookingStep) => void
  setPassengerData: (data: PassengerData | null) => void
  reset: () => void
}

const initialState = {
  searchQuery: null,
  selectedFlight: null,
  selectedSeat: null,
  bookingStep: 'search' as BookingStep,
  passengerData: null,
}

export const useFlightStore = create<FlightStore>()(
  persist(
    (set) => ({
      ...initialState,

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedFlight: (flight) => set({ selectedFlight: flight }),
      setSelectedSeat: (seat) => set({ selectedSeat: seat }),
      setBookingStep: (step) => set({ bookingStep: step }),
      setPassengerData: (data) => set({ passengerData: data }),

      reset: () => set(initialState),
    }),
    {
      name: 'flight-store',
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeat: state.selectedSeat,
        bookingStep: state.bookingStep,
        passengerData: state.passengerData
          ? {
              full_name: state.passengerData.full_name,
              nationality: state.passengerData.nationality,
              dob: state.passengerData.dob,
            }
          : null,
      }),
    }
  )
)