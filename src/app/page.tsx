'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Landing() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/home')
      } else {
        setChecking(false)
      }
    }
    checkSession()
  }, [])

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-sm" style={{color:'#6366F1',fontFamily:'Raleway,sans-serif'}}>Loading Naggare...</div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center bg-white">
      
      <div className="mb-10">
        {/* Logo */}
        <div className="w-24 h-24 rounded-3xl mx-auto mb-5 flex items-center justify-center relative"
          style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)',boxShadow:'0 8px 32px rgba(79,70,229,0.25)'}}>
          <span className="text-5xl font-bold text-white" style={{fontFamily:'Raleway,sans-serif'}}>N</span>
          <div className="absolute top-2 right-2 w-3 h-3 rounded-sm rotate-45" style={{background:'#EAB308'}}></div>
        </div>

        {/* Naggare */}
        <h1 className="text-5xl font-bold mb-2" style={{fontFamily:'Raleway,sans-serif',color:'#6366F1',letterSpacing:'-0.5px'}}>
          Naggare
        </h1>

        {/* Hiring Humanised */}
        <p className="text-xs font-semibold tracking-widest" style={{fontFamily:'Raleway,sans-serif',color:'#6366F1',letterSpacing:'0.2em'}}>
          HIRING, HUMANISED.
        </p>
      </div>

      {/* Quote */}
      <p className="text-lg mb-12 max-w-sm leading-relaxed italic" style={{color:'#374151',fontFamily:'Raleway,sans-serif',fontWeight:400}}>
        "Persona. Craft. Learnability. Attitude.<br/>Visible before the first call."
      </p>

      <div className="w-full max-w-sm flex flex-col gap-3">
        <button className="btn-primary text-lg py-5" onClick={() => router.push('/candidate/register')}>
          👤 I'm a Candidate
        </button>
        <button className="btn-green text-base py-4" onClick={() => router.push('/recruiter/register')}>
          🤝 I'm a Recruiter / TA
        </button>
        <div className="h-px my-1" style={{background:'#E5E7EB'}}></div>
        <button className="btn-outline text-sm py-3" onClick={() => router.push('/signin')}>
          Already on Naggare? Sign in →
        </button>
      </div>
    </div>
  )
}
