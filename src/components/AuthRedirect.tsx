'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AuthRedirect() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // PKCE flow: Supabase sends ?code=... for password recovery
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const hash = window.location.hash

    // Already on reset-password — do nothing
    if (pathname === '/reset-password') return

    if (code) {
      // PKCE flow — preserve code param
      router.replace('/reset-password?code=' + code)
    } else if (hash && hash.includes('type=recovery')) {
      // Legacy implicit flow — preserve hash
      router.replace('/reset-password' + hash)
    }
  }, [router, pathname])

  return null
}
