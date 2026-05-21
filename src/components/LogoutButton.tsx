'use client'
import { logout } from '@/app/auth/logout/action'

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="text-sm px-3 py-1 rounded-md border hover:bg-gray-100"
      >
        Logout
      </button>
    </form>
  )
}