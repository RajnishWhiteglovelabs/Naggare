'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

export default function Verified() {
  const router = useRouter()

  useEffect(() => {
    async function route() {
      await new Promise(r => setTimeout(r, 1500))
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.email) { router.push('/signin'); return }

        const email = session.user.email

        // Check if already has profile
        const res = await fetch('/api/me', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })

        if (res.ok) {
          const profile = await res.json()
          // Already completed profile - send to home
          router.push(profile.type === 'recruiter' ? '/recruiter/home' : '/home')
          return
        }

        // No profile yet - determine type from multiple sources
        const meData = await res.json().catch(() => ({}))
        const metaType = session.user.user_metadata?.type  // set during signUp
        const intendedType = meData?.intended_type          // from auth metadata via /api/me
        const lsType = typeof window !== 'undefined' ? localStorage.getItem('naggare_signup_type') : null

        const type = metaType || intendedType || lsType || 'candidate'

        console.log('[verified] routing as:', type, { metaType, intendedType, lsType })

        router.push(type === 'recruiter' ? '/recruiter/register' : '/candidate/register')
      } catch {
        router.push('/signin')
      }
    }
    route()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-white">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>
            <span className="text-base font-bold text-white" style={{fontFamily:'Georgia,serif'}}>N</span>
          </div>
          <span className="text-xl font-bold" style={{fontFamily:'Georgia,serif',color:'#6366F1'}}>Naggare</span>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2" style={{color:'#1E1B4B',fontFamily:'Georgia,serif'}}>Email verified!</h2>
          <p className="text-gray-500 text-sm mb-2">Taking you to build your profile...</p>
          <p className="text-xs text-indigo-500 font-semibold">It takes under 5 minutes</p>
        </div>
      </div>
    </div>
  )
}
