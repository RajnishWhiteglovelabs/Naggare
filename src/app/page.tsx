'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Landing() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/home')
    })
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center"
      style={{background: 'linear-gradient(135deg, #1E1B4B, #312e81)'}}>
      
      {/* Logo */}
      <div className="mb-12">
        <div className="w-24 h-24 rounded-3xl mx-auto mb-4 flex items-center justify-center relative"
          style={{background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 8px 32px rgba(79,70,229,0.4)'}}>
          <span className="text-5xl font-bold text-white" style={{fontFamily:'Georgia,serif'}}>N</span>
          <div className="absolute top-2 right-2 w-3 h-3 rounded-sm rotate-45" style={{background:'#EAB308'}}></div>
        </div>
        <h1 className="text-5xl font-bold text-white mb-2" style={{fontFamily:'Georgia,serif'}}>Naggare</h1>
        <p className="text-sm font-medium tracking-widest" style={{color:'#A5B4FC'}}>HIRING, HUMANISED.</p>
      </div>

      <p className="text-lg mb-14 max-w-sm leading-relaxed italic" style={{color:'#E0E7FF', fontFamily:'Georgia,serif'}}>
        "Persona. Craft. Learnability. Attitude.<br/>Visible before the first call."
      </p>

      <div className="w-full max-w-sm flex flex-col gap-3">
        <button className="btn-primary text-lg py-5" onClick={() => router.push('/candidate/register')}>
          👤 I'm a Candidate
        </button>
        <button className="btn-green text-base py-4" onClick={() => router.push('/recruiter/register')}>
          🤝 I'm a Recruiter / TA
        </button>
        <div className="h-px my-1" style={{background:'rgba(255,255,255,0.1)'}}></div>
        <button className="btn-outline text-sm py-3"
          style={{background:'rgba(255,255,255,0.08)',color:'white',borderColor:'rgba(255,255,255,0.2)'}}
          onClick={() => router.push('/signin')}>
          Already on Naggare? Sign in →
        </button>
      </div>
    </div>
  )
}
