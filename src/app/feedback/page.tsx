'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

export default function Feedback() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [isRecruiter, setIsRecruiter] = useState(false)

  useEffect(() => {
    async function detectType() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) return
      const res = await fetch('/api/me', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: session.user.email }) })
      if (res.ok) { const p = await res.json(); setIsRecruiter(p.type === 'recruiter') }
    }
    detectType()
  }, [])

  async function submit() {
    if (!message.trim()) { setError('Please write your feedback before sending'); return }
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const email = session?.user?.email || 'Unknown'

      await fetch('/api/email/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message }),
      })
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: isRecruiter ? 'linear-gradient(135deg,#1E1B4B,#312e81)' : 'linear-gradient(135deg,#1E1B4B,#312e81)' }}>
      {/* Header */}
      <div className="bg-white/10 backdrop-blur px-5 h-14 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.push('/home')} className="text-2xl text-white">‹</button>
        <span className="font-bold text-white" style={{ fontFamily: 'Georgia,serif' }}>Feedback</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {sent ? (
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center">
            <div className="text-5xl mb-4">🙏</div>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Georgia,serif', color: '#1E1B4B' }}>
              Thank you!
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Your feedback means a lot. Rajnish reads every message personally.
            </p>
            <button className="btn-primary py-4" onClick={() => router.push('/home')}>
              Back to Home
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-5 shadow-2xl">
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Georgia,serif', color: '#1E1B4B' }}>
              Share your thoughts
            </h2>
            <p className="text-sm text-gray-400 mb-5">
              Bug, idea, or just something that felt off — Rajnish reads every message.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>
            )}

            <div className="mb-5">
              <label className="label">Your feedback</label>
              <textarea
                className="input"
                rows={7}
                placeholder="e.g. The prompts step was confusing because..."
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{message.length} characters</p>
            </div>

            <button className="btn-primary py-4" onClick={submit} disabled={loading}>
              {loading ? 'Sending...' : 'Send Feedback →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
