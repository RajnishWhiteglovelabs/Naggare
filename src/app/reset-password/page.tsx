'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'
import { Suspense } from 'react'
import type { Session } from '@supabase/supabase-js'

function ResetPasswordInner() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    // Supabase PKCE exchanges the code server-side before redirecting here.
    // The session is already in cookies — just check for it.
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (data.session) {
        setReady(true)
      } else {
        setInvalid(true)
      }
    })
  }, [])

  async function handleUpdate() {
    setError('')
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      await supabase.auth.signOut()
      setTimeout(() => router.push('/signin'), 2500)
    } catch (e: unknown) {
      setError((e as Error).message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-white">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
            <span className="text-base font-bold text-white" style={{ fontFamily: 'Raleway,sans-serif' }}>N</span>
          </div>
          <span className="text-xl font-bold" style={{ fontFamily: 'Raleway,sans-serif', color: '#6366F1' }}>Naggare</span>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          {done ? (
            <>
              <div className="text-4xl mb-4 text-center">✅</div>
              <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: '#1E1B4B', fontFamily: 'Raleway,sans-serif' }}>Password updated</h2>
              <p className="text-gray-500 text-sm text-center">Taking you to sign in...</p>
            </>
          ) : invalid ? (
            <>
              <div className="text-4xl mb-4 text-center">❌</div>
              <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: '#1E1B4B', fontFamily: 'Raleway,sans-serif' }}>Link expired</h2>
              <p className="text-gray-500 text-sm text-center mb-6">This reset link has expired or already been used.</p>
              <button className="btn-primary" onClick={() => router.push('/forgot-password')}>Request new link →</button>
            </>
          ) : !ready ? (
            <>
              <div className="text-4xl mb-4 text-center">🔐</div>
              <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: '#1E1B4B', fontFamily: 'Raleway,sans-serif' }}>Verifying...</h2>
              <p className="text-gray-500 text-sm text-center">Please wait a moment.</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-1" style={{ color: '#1E1B4B', fontFamily: 'Raleway,sans-serif' }}>Set new password</h2>
              <p className="text-sm text-gray-500 mb-6">Min 8 characters.</p>
              <div className="mb-4">
                <label className="label">New password</label>
                <input className="input" type="password" placeholder="Min 8 characters"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUpdate()} />
              </div>
              <div className="mb-5">
                <label className="label">Confirm password</label>
                <input className="input" type="password" placeholder="Same again"
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUpdate()} />
              </div>
              {error && <div className="mb-4 p-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}
              <button className="btn-primary mb-3" onClick={handleUpdate} disabled={loading}>
                {loading ? 'Updating...' : 'Update password →'}
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

export default function ResetPassword() {
  return <Suspense><ResetPasswordInner /></Suspense>
}
