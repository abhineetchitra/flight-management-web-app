'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    setLoading(true)
    const { error } = await supabase.rpc('cancel_booking_and_free_seat', { p_booking_id: bookingId })
    if (error) {
      toast.error('Failed to cancel booking', { description: error.message })
      setLoading(false)
      return
    }
    toast.success('Booking cancelled', { description: 'Your seat has been released.' })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <X className="mr-1.5 h-3.5 w-3.5" />
          Cancel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The booking will be marked as cancelled and the seat will be released for other passengers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Keep Booking</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel} disabled={loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {loading ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Cancelling…</>
            ) : 'Cancel Booking'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}