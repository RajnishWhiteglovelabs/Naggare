'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    setError('')
    if(!email || !email.includes('@')) { setError('Please enter a valid email'); return }
    setLoading(true)
    
    // Check candidates
    const { data: candidate } = await supabase
      .from('candidates')
      .select('*')
      .ilike('email', email)
      .single()
    
    if(candidate) {
      localStorage.setItem('naggare_user', JSON.stringify({type:'candidate', ...candidate}))
      router.push('/home')
      return
    }

    // Check recruiters
    const { data: recruiter } = await supabase
      .from('recruiters')
      .select('*')
      .ilike('email', email)
      .single()
    
    if(recruiter) {
      localStorage.setItem('naggare_user', JSON.stringify({type:'recruiter', ...recruiter}))
      router.push('/home')
      return
    }

    setError("We couldn't find an account with that email. Please sign up first.")
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{background:'linear-gradient(135deg,#1E1B4B,#312e81)'}}>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => router.push('/')}>
          <span className="text-2xl" style={{color:'#A5B4FC'}}>‹</span>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center relative"
            style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>
            <span className="text-base font-bold text-white" style={{fontFamily:'Georgia,serif'}}>N</span>
          </div>
          <span className="text-xl font-bold text-white" style={{fontFamily:'Georgia,serif'}}>Naggare</span>
        </div>
        
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-2" style={{color:'#1E1B4B',fontFamily:'Georgia,serif'}}>Welcome back</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your email to sign back in.</p>
          
          <div className="mb-4">
            <label className="label">Email address</label>
            <input className="input" type="email" placeholder="you@company.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignIn()}/>
          </div>
          
          {error && <div className="mb-4 p-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}
          
          <button className="btn-primary mb-4" onClick={handleSignIn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>
          
          <p className="text-center text-sm text-gray-400">
            No account?{' '}
            <span className="text-indigo-600 font-semibold cursor-pointer" onClick={() => router.push('/')}>Sign up</span>
          </p>
        </div>
      </div>
    </div>
  )
}
