'use client'

import { LogOut } from 'lucide-react'
import { logout } from '@/app/auth/logout/action'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="ghost" size="sm">
        <LogOut className="mr-1.5 h-4 w-4" />
        Sign out
      </Button>
    </form>
  )
}