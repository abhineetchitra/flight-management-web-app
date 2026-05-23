'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Plane, Menu, Search, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { LogoutButton } from '@/components/LogoutButton'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Search', icon: Search },
  { href: '/my-bookings', label: 'My Bookings', icon: BookOpen },
]

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
            <Plane className="h-5 w-5 text-primary" />
            <span>SkyBook</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 sm:flex">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  pathname === link.href && 'bg-accent text-accent-foreground'
                )}
              >
                <Link href={link.href}>
                  <link.icon className="mr-1.5 h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            ))}
            <Separator orientation="vertical" className="mx-1 h-6" />
            <LogoutButton />
          </nav>

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-primary" />
                  SkyBook
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 mt-4">
                {navLinks.map((link) => (
                  <Button
                    key={link.href}
                    variant={pathname === link.href ? 'secondary' : 'ghost'}
                    className="justify-start"
                    asChild
                    onClick={() => setOpen(false)}
                  >
                    <Link href={link.href}>
                      <link.icon className="mr-2 h-4 w-4" />
                      {link.label}
                    </Link>
                  </Button>
                ))}
                <Separator className="my-2" />
                <LogoutButton />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}