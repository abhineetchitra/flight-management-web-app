import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Fetch the user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname, search } = request.nextUrl

  // 1. Define the routes that strictly require a logged-in user
  const isProtectedRoute = 
    pathname.startsWith('/booking') || 
    pathname.startsWith('/passenger-details') ||
    pathname.startsWith('/confirmation')

  // 2. If a guest tries to access a protected page, bounce them to login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    
    // Optional: Pass their intended destination so your login page can send them back after!
    url.searchParams.set('next', `${pathname}${search}`)
    
    return NextResponse.redirect(url)
  }

  // 3. Optional: If an already-logged-in user tries to visit the login page, bounce them to the home page
  const isAuthRoute = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup')
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}