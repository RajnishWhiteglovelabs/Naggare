'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

function SignUpInner() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [type, setType] = useState<'candidate'|'recruiter'>('candidate')
  const searchParams = useSearchParams()

  useEffect(() => {
    const t = searchParams.get('type')
    if (t === 'recruiter') setType('recruiter')
  }, [])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp() {
    setError('')
    if (!email || !email.includes('@')) { setError('Please enter a valid email'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }

    setLoading(true)
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/verified`,
          data: { type }
        }
      })

      if (signUpError) throw signUpError

      // Send welcome email fire-and-forget (don't block signup)
      fetch('/api/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), name: email.split('@')[0], type })
      }).catch(() => {}) // silently ignore email errors

      router.push('/verify-email')
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-white">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center relative"
            style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>
            <span className="text-base font-bold text-white" style={{fontFamily:'Raleway,sans-serif'}}>N</span>
          </div>
          <span className="text-xl font-bold" style={{fontFamily:'Raleway,sans-serif',color:'#6366F1'}}>Naggare</span>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold mb-1" style={{color:'#1E1B4B',fontFamily:'Raleway,sans-serif'}}>Create your account</h2>
          <p className="text-sm text-gray-500 mb-6">Join Naggare — Hiring, Humanised.</p>

          {/* Type selector */}
          <div className="flex gap-2 mb-5">
            <button onClick={() => setType('candidate')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${type==='candidate'?'border-indigo-500 bg-indigo-50 text-indigo-700':'border-gray-200 text-gray-500'}`}>
              👤 Candidate
            </button>
            <button onClick={() => setType('recruiter')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${type==='recruiter'?'border-green-500 bg-green-50 text-green-700':'border-gray-200 text-gray-500'}`}>
              🤝 Recruiter / TA
            </button>
          </div>

          <div className="mb-4">
            <label className="label">Email address</label>
            <input className="input" type="email" placeholder="you@gmail.com"
              value={email} onChange={e => setEmail(e.target.value)}/>
          </div>
          <div className="mb-4">
            <label className="label">Password <span className="text-gray-400 font-normal">(min 8 characters)</span></label>
            <input className="input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}/>
          </div>
          <div className="mb-5">
            <label className="label">Confirm password</label>
            <input className="input" type="password" placeholder="••••••••"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignUp()}/>
          </div>

          {error && <div className="mb-4 p-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

          <button className="btn-primary mb-4" onClick={handleSignUp} disabled={loading}>
            {loading ? 'Creating account...' : 'Create account →'}
          </button>
          <p className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <span className="text-indigo-600 font-semibold cursor-pointer" onClick={() => router.push('/signin')}>Sign in</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignUp() {
  return (
    <Suspense>
      <SignUpInner />
    </Suspense>
  )
}
