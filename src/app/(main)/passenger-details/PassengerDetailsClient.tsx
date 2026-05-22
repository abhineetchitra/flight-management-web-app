'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFlightStore } from '@/store/useFlightStore'

interface PassengerDetailsClientProps {
  flightId: string | null
  seatId: string | null
}

interface FormFields {
  fullName: string
  passportNo: string
  nationality: string
  dob: string
}

interface FormErrors {
  fullName?: string
  passportNo?: string
  nationality?: string
  dob?: string
}

const NATIONALITIES = [
  'Indian', 'American', 'British', 'Canadian', 'Australian',
  'German', 'French', 'Japanese', 'Chinese', 'Singaporean',
  'UAE', 'Saudi Arabian', 'South African', 'Brazilian', 'Mexican',
  'Other',
]

function validate(fields: FormFields): FormErrors {
  const errors: FormErrors = {}

  if (!fields.fullName.trim()) {
    errors.fullName = 'Full name is required.'
  } else if (!/^[a-zA-Z\s'-]{3,80}$/.test(fields.fullName.trim())) {
    errors.fullName = 'Enter a valid full name (letters only, 3–80 characters).'
  }

  if (!fields.passportNo.trim()) {
    errors.passportNo = 'Passport number is required.'
  } else if (!/^[A-Z0-9]{6,9}$/.test(fields.passportNo.trim().toUpperCase())) {
    errors.passportNo = 'Enter a valid passport number (6–9 uppercase letters/digits).'
  }

  if (!fields.nationality) {
    errors.nationality = 'Please select your nationality.'
  }

  if (!fields.dob) {
    errors.dob = 'Date of birth is required.'
  } else {
    const dobDate = new Date(fields.dob)
    const today = new Date()
    const minAge = new Date(
      today.getFullYear() - 2,
      today.getMonth(),
      today.getDate()
    )
    if (dobDate >= today) {
      errors.dob = 'Date of birth must be in the past.'
    } else if (dobDate > minAge) {
      errors.dob = 'Passenger must be at least 2 years old.'
    }
  }

  return errors
}

export default function PassengerDetailsClient({
  flightId,
  seatId,
}: PassengerDetailsClientProps) {
  const router = useRouter()
  const setPassengerData = useFlightStore((s) => s.setPassengerData)
  const setBookingStep = useFlightStore((s) => s.setBookingStep)
  const selectedSeat = useFlightStore((s) => s.selectedSeat)
  const setSelectedSeat = useFlightStore((s) => s.setSelectedSeat)

  const [seatLoading, setSeatLoading] = useState(!selectedSeat && Boolean(seatId))
  const [seatError, setSeatError] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    if (!seatId || selectedSeat) {
      if (seatLoading) {
        Promise.resolve().then(() => setSeatLoading(false))
      }
      return
    }

    let canceled = false

    async function loadSeat() {
      setSeatLoading(true)
      const { data, error } = await supabase
        .from('seats')
        .select('id, flight_id, seat_number, class, is_available, extra_fee')
        .eq('id', seatId)
        .single()

      if (canceled) return
      if (error || !data) {
        setSeatError('Unable to restore the selected seat. Please go back and choose a seat again.')
        setSeatLoading(false)
        return
      }

      if (data.flight_id !== flightId) {
        setSeatError('Selected seat does not match the current flight.')
        setSeatLoading(false)
        return
      }

      setSelectedSeat(data)
      setSeatLoading(false)
    }

    void loadSeat()

    return () => {
      canceled = true
    }
  }, [flightId, seatId, selectedSeat, setSelectedSeat, supabase, seatLoading])

  const [fields, setFields] = useState<FormFields>({
    fullName: '',
    passportNo: '',
    nationality: '',
    dob: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState<Record<keyof FormFields, boolean>>({
    fullName: false,
    passportNo: false,
    nationality: false,
    dob: false,
  })

  if (!flightId) {
    return (
      <main className="min-h-screen px-4 py-8">
        <div className="space-y-2">
          <p className="text-red-600">Missing flight information.</p>
          <Link href="/" className="text-blue-600 underline">
            Back to search
          </Link>
        </div>
      </main>
    )
  }

  if (seatLoading) {
    return (
      <main className="min-h-screen px-4 py-8">
        <div className="space-y-2">
          <p className="text-gray-700">Restoring your seat selection…</p>
        </div>
      </main>
    )
  }

  if (!selectedSeat) {
    return (
      <main className="min-h-screen px-4 py-8">
        <div className="space-y-2">
          <p className="text-red-600">{seatError ?? 'No seat selected.'}</p>
          <Link
            href={`/booking?flightId=${flightId}`}
            className="text-blue-600 underline"
          >
            Go back and select a seat
          </Link>
        </div>
      </main>
    )
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    const updated = { ...fields, [name]: value }
    setFields(updated)

    if (touched[name as keyof FormFields]) {
      const newErrors = validate(updated)
      setErrors((prev) => ({
        ...prev,
        [name]: newErrors[name as keyof FormErrors],
      }))
    }
  }

  function handleBlur(
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const newErrors = validate(fields)
    setErrors((prev) => ({
      ...prev,
      [name]: newErrors[name as keyof FormErrors],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({
      fullName: true,
      passportNo: true,
      nationality: true,
      dob: true,
    })

    const validationErrors = validate(fields)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    // Write to Zustand (which persists to localStorage via zustand/persist)
    setPassengerData({
      full_name: fields.fullName.trim(),
      passport_no: fields.passportNo.trim().toUpperCase(),
      nationality: fields.nationality,
      dob: fields.dob,
    })
    setBookingStep('confirmation')

    // Wait for Zustand persist middleware to flush to localStorage
    // before navigating — prevents "Incomplete booking information" on confirmation page
    setSubmitting(true)
    setTimeout(() => {
      router.push(`/confirmation?flightId=${flightId}`)
    }, 150)
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold">Passenger Details</h1>
          <p className="text-sm text-gray-500">
            Fill in the passenger information to complete your booking.
          </p>
        </div>

        {/* Selected seat summary */}
        <div className="rounded-xl border bg-slate-50 p-4 text-sm">
          <p className="font-medium text-slate-700">Selected Seat</p>
          <p className="mt-1 text-slate-600">
            Seat{' '}
            <span className="font-semibold">
              {selectedSeat.seat_number}
            </span>{' '}
            &bull; {selectedSeat.class} &bull; Extra fee ₹
            {selectedSeat.extra_fee}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="mb-1 block text-sm font-medium"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={fields.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. Abhineet Chitra"
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black ${
                errors.fullName
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white'
              }`}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
            )}
          </div>

          {/* Passport Number */}
          <div>
            <label
              htmlFor="passportNo"
              className="mb-1 block text-sm font-medium"
            >
              Passport Number <span className="text-red-500">*</span>
            </label>
            <input
              id="passportNo"
              name="passportNo"
              type="text"
              autoComplete="off"
              value={fields.passportNo}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. A1234567"
              className={`w-full rounded-md border px-3 py-2 text-sm uppercase outline-none transition focus:ring-2 focus:ring-black ${
                errors.passportNo
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white'
              }`}
            />
            {errors.passportNo && (
              <p className="mt-1 text-xs text-red-600">{errors.passportNo}</p>
            )}
          </div>

          {/* Nationality */}
          <div>
            <label
              htmlFor="nationality"
              className="mb-1 block text-sm font-medium"
            >
              Nationality <span className="text-red-500">*</span>
            </label>
            <select
              id="nationality"
              name="nationality"
              value={fields.nationality}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black ${
                errors.nationality
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white'
              }`}
            >
              <option value="">Select nationality</option>
              {NATIONALITIES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            {errors.nationality && (
              <p className="mt-1 text-xs text-red-600">{errors.nationality}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label
              htmlFor="dob"
              className="mb-1 block text-sm font-medium"
            >
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              id="dob"
              name="dob"
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={fields.dob}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-black ${
                errors.dob
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white'
              }`}
            />
            {errors.dob && (
              <p className="mt-1 text-xs text-red-600">{errors.dob}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Link
              href={`/booking?flightId=${flightId}`}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Back
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-black px-5 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-60"
            >
              {submitting ? 'Please wait...' : 'Continue to Confirmation'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
