'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AuthRedirect() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      // Preserve the full hash when redirecting
      router.replace('/reset-password' + hash)
    }
  }, [router, pathname])

  return null
}
