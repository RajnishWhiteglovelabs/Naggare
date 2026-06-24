import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const code = searchParams.get('code')

  // If Supabase sends a PKCE recovery code to the homepage, redirect immediately
  // before any client-side code can consume it
  if (pathname === '/' && code) {
    const url = request.nextUrl.clone()
    url.pathname = '/reset-password'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/'],
}
