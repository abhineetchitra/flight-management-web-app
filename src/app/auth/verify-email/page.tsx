import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4 rounded-xl border p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="text-gray-600">
          We've sent a verification link to your email address. Please click the link to verify your account.
        </p>
        <div className="pt-4">
          <Link
            href="/auth/login"
            className="inline-block rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-900"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  )
}
