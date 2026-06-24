'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'credentials'|'otp'>('credentials')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    setError('')
    if (!email || !password) { setError('Please enter your email and password'); return }
    setLoading(true)
    try {
      // Step 1: Verify email + password with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      })
      if (signInError) {
        const msg = signInError.message?.toLowerCase() || ''
        if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
          // Check if account exists at all
          setError('Incorrect password. Forgot it? Use the link below.')
        } else if (msg.includes('email not confirmed')) {
          setError('Please verify your email first — check your inbox for the Naggare confirmation link.')
        } else if (msg.includes('user not found') || msg.includes('no user')) {
          setError('No account found with this email. Please sign up first.')
        } else {
          setError(signInError.message || 'Something went wrong')
        }
        setLoading(false); return
      }
      if (!data.session) { setError('Could not create session'); setLoading(false); return }

      // Step 2: Send OTP as second factor
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      })
      if (!res.ok) { setError('Could not send verification code'); setLoading(false); return }

      setStep('otp')
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP() {
    setError('')
    if (!otp || otp.length < 6) { setError('Please enter the 6-digit code'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), code: otp }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid code'); setLoading(false); return }

      // Store email for fallback
      localStorage.setItem('naggare_email', email.toLowerCase())
      const meRes = await fetch('/api/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      })
      const profile = meRes.ok ? await meRes.json() : null
      router.push(profile?.type === 'recruiter' ? '/recruiter/home' : '/home')
    } catch (e: any) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-white">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>
            <span className="text-base font-bold text-white" style={{fontFamily:'Raleway,sans-serif'}}>N</span>
          </div>
          <span className="text-xl font-bold" style={{fontFamily:'Raleway,sans-serif',color:'#6366F1'}}>Naggare</span>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          {step === 'credentials' ? (
            <>
              <h2 className="text-2xl font-bold mb-1" style={{color:'#1E1B4B',fontFamily:'Raleway,sans-serif'}}>Welcome back</h2>
              <p className="text-sm text-gray-500 mb-6">Sign in to your Naggare account.</p>
              <div className="mb-4">
                <label className="label">Email address</label>
                <input className="input" type="email" placeholder="you@gmail.com"
                  value={email} onChange={e => setEmail(e.target.value)}/>
              </div>
              <div className="mb-5">
                <label className="label">Password</label>
                <input className="input" type="password" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSignIn()}/>
              </div>
              {error && <div className="mb-4 p-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}
              <button className="btn-primary mb-3" onClick={handleSignIn} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
              <button className="w-full text-center text-sm text-gray-400 hover:text-indigo-600 py-2"
                onClick={() => router.push('/forgot-password')}>
                Forgot password?
              </button>
              <p className="text-center text-sm text-gray-400 mt-2">
                No account?{' '}
                <span className="text-indigo-600 font-semibold cursor-pointer" onClick={() => router.push('/signup')}>Sign up</span>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-1" style={{color:'#1E1B4B',fontFamily:'Raleway,sans-serif'}}>One more step</h2>
              <p className="text-sm text-gray-500 mb-6">We sent a 6-digit code to <strong>{email}</strong></p>
              <div className="mb-5">
                <label className="label">Verification code</label>
                <input className="input text-center text-2xl tracking-widest" type="text"
                  placeholder="000000" maxLength={6}
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,''))}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}/>
              </div>
              {error && <div className="mb-4 p-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}
              <button className="btn-primary mb-3" onClick={handleVerifyOTP} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & sign in →'}
              </button>
              <button className="w-full text-center text-sm text-gray-400 hover:text-indigo-600 py-2"
                onClick={() => { setStep('credentials'); setOtp(''); setError('') }}>
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
