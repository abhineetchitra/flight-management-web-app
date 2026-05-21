'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignupPage() {
  const supabase = createClient()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function handleSignup(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); return }
    router.push('/auth/verify-email') // tell user to check inbox
  }

  return (
    <form action={handleSignup}>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" minLength={6} required />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit">Sign Up</button>
    </form>
  )
}