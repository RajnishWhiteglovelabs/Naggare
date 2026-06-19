'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email'|'otp'>('email')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSendOTP() {
    setError('')
    if (!email || !email.includes('@')) { setError('Please enter a valid email'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
    if (error) {
      setError("We couldn't find an account with that email. Please sign up first.")
    } else {
      setStep('otp')
    }
    setLoading(false)
  }

  async function handleVerifyOTP() {
    setError('')
    if (!otp || otp.length < 6) { setError('Please enter the 6-digit code'); return }
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    if (error) {
      setError('Invalid or expired code. Please try again.')
      setLoading(false)
      return
    }
    router.push('/home')
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
          {step === 'email' ? (
            <>
              <h2 className="text-2xl font-bold mb-2" style={{color:'#1E1B4B',fontFamily:'Georgia,serif'}}>Welcome back</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your email — we'll send you a sign-in code.</p>
              <div className="mb-4">
                <label className="label">Email address</label>
                <input className="input" type="email" placeholder="you@company.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendOTP()}/>
              </div>
              {error && <div className="mb-4 p-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}
              <button className="btn-primary mb-4" onClick={handleSendOTP} disabled={loading}>
                {loading ? 'Sending...' : 'Send sign-in code →'}
              </button>
              <p className="text-center text-sm text-gray-400">
                No account?{' '}
                <span className="text-indigo-600 font-semibold cursor-pointer" onClick={() => router.push('/')}>Sign up</span>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2" style={{color:'#1E1B4B',fontFamily:'Georgia,serif'}}>Check your email</h2>
              <p className="text-sm text-gray-500 mb-6">We sent a 6-digit code to <strong>{email}</strong></p>
              <div className="mb-4">
                <label className="label">Sign-in code</label>
                <input className="input text-center text-2xl tracking-widest" type="text" placeholder="000000"
                  maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,''))}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}/>
              </div>
              {error && <div className="mb-4 p-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}
              <button className="btn-primary mb-4" onClick={handleVerifyOTP} disabled={loading}>
                {loading ? 'Verifying...' : 'Sign in →'}
              </button>
              <button className="w-full text-center text-sm text-gray-400 hover:text-indigo-600" onClick={() => { setStep('email'); setOtp(''); setError('') }}>
                ← Use a different email
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
