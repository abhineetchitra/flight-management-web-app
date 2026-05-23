'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFlightStore } from '@/store/useFlightStore'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PassengerDetailsClientProps { flightId: string | null; seatId: string | null }
interface FormFields { fullName: string; passportNo: string; nationality: string; dob: string }
interface FormErrors { fullName?: string; passportNo?: string; nationality?: string; dob?: string }

const NATIONALITIES = [
  'Indian', 'American', 'British', 'Canadian', 'Australian', 'German', 'French',
  'Japanese', 'Chinese', 'Singaporean', 'UAE', 'Saudi Arabian', 'South African', 'Brazilian', 'Mexican', 'Other',
]

function validate(fields: FormFields): FormErrors {
  const errors: FormErrors = {}
  if (!fields.fullName.trim()) errors.fullName = 'Full name is required.'
  else if (!/^[a-zA-Z\s'-]{3,80}$/.test(fields.fullName.trim())) errors.fullName = 'Enter a valid full name (3–80 characters).'
  if (!fields.passportNo.trim()) errors.passportNo = 'Passport number is required.'
  else if (!/^[A-Z0-9]{6,9}$/.test(fields.passportNo.trim().toUpperCase())) errors.passportNo = 'Enter a valid passport number (6–9 characters).'
  if (!fields.nationality) errors.nationality = 'Please select your nationality.'
  if (!fields.dob) errors.dob = 'Date of birth is required.'
  else {
    const dobDate = new Date(fields.dob)
    const today = new Date()
    const minAge = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate())
    if (dobDate >= today) errors.dob = 'Date of birth must be in the past.'
    else if (dobDate > minAge) errors.dob = 'Passenger must be at least 2 years old.'
  }
  return errors
}

const steps = ['Search', 'Select Seat', 'Passenger Details', 'Confirm']

export default function PassengerDetailsClient({ flightId, seatId }: PassengerDetailsClientProps) {
  const router = useRouter()
  const setPassengerData = useFlightStore((s) => s.setPassengerData)
  const setBookingStep = useFlightStore((s) => s.setBookingStep)
  const selectedSeat = useFlightStore((s) => s.selectedSeat)
  const setSelectedSeat = useFlightStore((s) => s.setSelectedSeat)
  const [seatLoading, setSeatLoading] = useState(!selectedSeat && Boolean(seatId))
  const [seatError, setSeatError] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    if (!seatId || selectedSeat) { if (seatLoading) Promise.resolve().then(() => setSeatLoading(false)); return }
    let canceled = false
    async function loadSeat() {
      setSeatLoading(true)
      const { data, error } = await supabase.from('seats')
        .select('id, flight_id, seat_number, class, is_available, extra_fee').eq('id', seatId).single()
      if (canceled) return
      if (error || !data) { setSeatError('Unable to restore selected seat. Please go back.'); setSeatLoading(false); return }
      if (data.flight_id !== flightId) { setSeatError('Seat does not match flight.'); setSeatLoading(false); return }
      setSelectedSeat(data); setSeatLoading(false)
    }
    void loadSeat()
    return () => { canceled = true }
  }, [flightId, seatId, selectedSeat, setSelectedSeat, supabase, seatLoading])

  const [fields, setFields] = useState<FormFields>({ fullName: '', passportNo: '', nationality: '', dob: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState<Record<keyof FormFields, boolean>>({ fullName: false, passportNo: false, nationality: false, dob: false })

  if (!flightId) return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-sm text-center">
        <CardContent className="py-8">
          <p className="font-semibold text-destructive">Missing flight information.</p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/">Back to search</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  if (seatLoading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Restoring your selection…
      </div>
    </div>
  )

  if (!selectedSeat) return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-sm text-center">
        <CardContent className="py-8">
          <p className="font-semibold text-destructive">{seatError ?? 'No seat selected.'}</p>
          <Button asChild size="sm" className="mt-3">
            <Link href={`/booking?flightId=${flightId}`}>Select a seat</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    const updated = { ...fields, [name]: value }
    setFields(updated)
    if (touched[name as keyof FormFields]) {
      const newErrors = validate(updated)
      setErrors((prev) => ({ ...prev, [name]: newErrors[name as keyof FormErrors] }))
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const newErrors = validate(fields)
    setErrors((prev) => ({ ...prev, [name]: newErrors[name as keyof FormErrors] }))
  }

  function handleNationalityChange(value: string) {
    const updated = { ...fields, nationality: value }
    setFields(updated)
    if (touched.nationality) {
      const newErrors = validate(updated)
      setErrors((prev) => ({ ...prev, nationality: newErrors.nationality }))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ fullName: true, passportNo: true, nationality: true, dob: true })
    const validationErrors = validate(fields)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return
    setPassengerData({ full_name: fields.fullName.trim(), passport_no: fields.passportNo.trim().toUpperCase(), nationality: fields.nationality, dob: fields.dob })
    setBookingStep('confirmation')
    setSubmitting(true)
    setTimeout(() => { router.push(`/confirmation?flightId=${flightId}`) }, 150)
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Step breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        {steps.map((step, i) => (
          <span key={step} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-border">›</span>}
            <span className={i === 2 ? 'font-medium text-foreground' : ''}>{step}</span>
          </span>
        ))}
      </nav>

      <h1 className="mb-2 text-2xl font-bold">Passenger Details</h1>
      <p className="mb-6 text-sm text-muted-foreground">Fill in your information to complete the booking.</p>

      {/* Seat summary */}
      <div className="mb-6 flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Seat {selectedSeat.seat_number}</Badge>
          <span className="text-sm text-muted-foreground capitalize">{selectedSeat.class} class · +₹{selectedSeat.extra_fee}</span>
        </div>
        <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
          <Link href={`/booking?flightId=${flightId}`}>Change</Link>
        </Button>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
              <Input id="fullName" name="fullName" autoComplete="name" placeholder="e.g. Abhineet Chitra"
                value={fields.fullName} onChange={handleChange} onBlur={handleBlur}
                aria-invalid={!!errors.fullName} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
            </div>

            {/* Passport */}
            <div className="space-y-2">
              <Label htmlFor="passportNo">Passport Number <span className="text-destructive">*</span></Label>
              <Input id="passportNo" name="passportNo" autoComplete="off" placeholder="e.g. A1234567"
                value={fields.passportNo} onChange={handleChange} onBlur={handleBlur}
                className="uppercase" aria-invalid={!!errors.passportNo} />
              {errors.passportNo && <p className="text-xs text-destructive">{errors.passportNo}</p>}
            </div>

            {/* Nationality */}
            <div className="space-y-2">
              <Label>Nationality <span className="text-destructive">*</span></Label>
              <Select value={fields.nationality} onValueChange={handleNationalityChange}>
                <SelectTrigger aria-invalid={!!errors.nationality}>
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  {NATIONALITIES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.nationality && <p className="text-xs text-destructive">{errors.nationality}</p>}
            </div>

            {/* DOB */}
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth <span className="text-destructive">*</span></Label>
              <Input id="dob" name="dob" type="date" max={new Date().toISOString().split('T')[0]}
                value={fields.dob} onChange={handleChange} onBlur={handleBlur}
                aria-invalid={!!errors.dob} />
              {errors.dob && <p className="text-xs text-destructive">{errors.dob}</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/booking?flightId=${flightId}`}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back
                </Link>
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? (
                  <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Please wait…</>
                ) : (
                  <>Continue<ArrowRight className="ml-1.5 h-4 w-4" /></>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
