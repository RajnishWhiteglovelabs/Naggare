'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

export default function ForgotPassword() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset() {
    setError('')
    if (!email || !email.includes('@')) { setError('Please enter your email'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
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
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>
            <span className="text-base font-bold text-white" style={{fontFamily:'Raleway,sans-serif'}}>N</span>
          </div>
          <span className="text-xl font-bold" style={{fontFamily:'Raleway,sans-serif',color:'#6366F1'}}>Naggare</span>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          {sent ? (
            <>
              <div className="text-4xl mb-4 text-center">📬</div>
              <h2 className="text-2xl font-bold mb-2 text-center" style={{color:'#1E1B4B',fontFamily:'Raleway,sans-serif'}}>Check your inbox</h2>
              <p className="text-gray-500 text-sm text-center mb-6">We've sent a password reset link to <strong>{email}</strong></p>
              <button className="btn-primary" onClick={() => router.push('/signin')}>Back to sign in →</button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-1" style={{color:'#1E1B4B',fontFamily:'Raleway,sans-serif'}}>Reset password</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your email and we'll send a reset link.</p>
              <div className="mb-5">
                <label className="label">Email address</label>
                <input className="input" type="email" placeholder="you@gmail.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReset()}/>
              </div>
              {error && <div className="mb-4 p-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}
              <button className="btn-primary mb-3" onClick={handleReset} disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link →'}
              </button>
              <button className="w-full text-center text-sm text-gray-400 hover:text-indigo-600 py-2" onClick={() => router.push('/signin')}>
                ← Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
