'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); return }
    router.push('/dashboard')
    router.refresh() // ← IMPORTANT: forces Server Components to re-read session
  }

  return (
    <form action={handleLogin}>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit">Log In</button>
    </form>
  )
}