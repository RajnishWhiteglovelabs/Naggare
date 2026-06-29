'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

const PHASES = [
  { id: 1, name: 'Refactoring', duration: 8 * 60, description: 'Review and improve code with Edna' },
  { id: 2, name: 'System Design', duration: 10 * 60, description: 'Design a system together' },
]

const ROLE_LEVELS = ['SDE 2', 'SDE 3', 'Staff Engineer', 'Engineering Manager', 'Senior EM']

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function EdnaSession() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stage, setStage] = useState<'welcome' | 'session' | 'score'>('welcome')
  const [roleLevel, setRoleLevel] = useState('SDE 2')
  const [phase, setPhase] = useState(1)
  const [messages, setMessages] = useState<Message[]>([])
  const [allMessages, setAllMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(PHASES[0].duration)
  const [scores, setScores] = useState<any>(null)
  const [scoring, setScoring] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      if (!session?.user) { router.push('/signin'); return }
      setUser(session.user)
    })
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function startTimer(duration: number) {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeLeft(duration)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handlePhaseEnd()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function startSession() {
    setStage('session')
    setPhase(1)
    await loadPhaseOpener(1, [])
    startTimer(PHASES[0].duration)
  }

  async function loadPhaseOpener(phaseNum: number, existingMessages: Message[]) {
    setLoading(true)
    try {
      const res = await fetch('/api/edna/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],
          candidateName: user?.user_metadata?.name || user?.email?.split('@')[0] || 'there',
          phase: phaseNum,
          roleLevel
        })
      })
      const data = await res.json()
      const ednaMsg: Message = { role: 'assistant', content: data.message, timestamp: new Date() }
      setMessages([ednaMsg])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/edna/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          candidateName: user?.user_metadata?.name || user?.email?.split('@')[0] || 'there',
          phase,
          roleLevel
        })
      })
      const data = await res.json()
      const ednaMsg: Message = { role: 'assistant', content: data.message, timestamp: new Date() }
      setMessages(prev => [...prev, ednaMsg])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function handlePhaseEnd() {
    const completed = [...allMessages, ...messages]
    setAllMessages(completed)

    if (phase === 1) {
      // Move to phase 2
      setPhase(2)
      setMessages([])
      loadPhaseOpener(2, completed)
      startTimer(PHASES[1].duration)
    } else {
      // End session - generate score
      generateScore(completed)
    }
  }

  async function generateScore(allMsgs: Message[]) {
    if (timerRef.current) clearInterval(timerRef.current)
    setScoring(true)
    setStage('score')
    try {
      const res = await fetch('/api/edna/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMsgs.map(m => ({ role: m.role, content: m.content })),
          candidateEmail: user?.email,
          candidateName: user?.user_metadata?.name || user?.email?.split('@')[0],
          roleLevel
        })
      })
      const data = await res.json()
      setScores(data)
    } catch (e) {
      console.error(e)
    }
    setScoring(false)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timerColor = timeLeft < 60 ? '#DC2626' : timeLeft < 120 ? '#F97316' : '#15803D'
  const candidateName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'there'

  // WELCOME SCREEN
  if (stage === 'welcome') return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F1F0FB', fontFamily: 'Raleway,sans-serif' }}>
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
          <span className="text-sm font-bold text-white" style={{ fontFamily: 'Georgia,serif' }}>N</span>
        </div>
        <span className="font-bold text-sm" style={{ color: '#1E1B4B' }}>Naggare Score</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-md mx-auto w-full">
        {/* Edna intro */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
          👩‍💻
        </div>
        <h1 className="text-2xl font-bold text-center mb-1" style={{ color: '#1E1B4B', fontFamily: 'Georgia,serif' }}>Meet Edna</h1>
        <p className="text-sm text-center mb-6" style={{ color: '#6B7280' }}>Your pair programming partner for today</p>

        <div className="bg-white rounded-3xl p-6 w-full mb-6 border border-gray-100 shadow-sm">
          <p className="text-sm font-semibold mb-4" style={{ color: '#1E1B4B' }}>What to expect:</p>
          <div className="flex flex-col gap-3">
            {[
              { icon: '💬', text: "Edna is a fellow engineer, not an examiner. Think of this as a working session with a colleague." },
              { icon: '⏱', text: "Two phases: 8 min refactoring + 10 min system design. 18 minutes total." },
              { icon: '🎯', text: "No trick questions. Real engineering problems. Your thinking matters more than perfect answers." },
              { icon: '📊', text: "Your Naggare Score is generated at the end. Valid for 3-6 months across all recruiters on the platform." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Role level selector */}
        <div className="w-full mb-6">
          <p className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: '#4F46E5' }}>Select your role level</p>
          <div className="flex flex-wrap gap-2">
            {ROLE_LEVELS.map(level => (
              <button key={level} onClick={() => setRoleLevel(level)}
                className="px-3 py-2 rounded-xl text-xs font-semibold border"
                style={{
                  background: roleLevel === level ? '#4F46E5' : 'white',
                  color: roleLevel === level ? 'white' : '#374151',
                  borderColor: roleLevel === level ? '#4F46E5' : '#E5E7EB'
                }}>
                {level}
              </button>
            ))}
          </div>
        </div>

        <button onClick={startSession}
          className="w-full py-4 rounded-2xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
          Start session with Edna →
        </button>
        <p className="text-xs mt-3 text-center" style={{ color: '#9CA3AF' }}>
          Make sure you&apos;re in a quiet place. Edna is waiting.
        </p>
      </div>
    </div>
  )

  // SCORING SCREEN
  if (stage === 'score') return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F1F0FB', fontFamily: 'Raleway,sans-serif' }}>
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
          <span className="text-sm font-bold text-white" style={{ fontFamily: 'Georgia,serif' }}>N</span>
        </div>
        <span className="font-bold text-sm" style={{ color: '#1E1B4B' }}>Your Naggare Score</span>
      </div>

      <div className="flex-1 px-6 py-8 max-w-md mx-auto w-full">
        {scoring ? (
          <div className="flex flex-col items-center justify-center min-h-80 gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl animate-pulse" style={{ background: '#EEF2FF' }}>⏳</div>
            <p className="text-sm font-semibold" style={{ color: '#4F46E5' }}>Edna is reviewing the session...</p>
            <p className="text-xs text-center" style={{ color: '#9CA3AF' }}>Generating your Naggare Score. This takes about 15 seconds.</p>
          </div>
        ) : scores ? (
          <div className="flex flex-col gap-4">
            {/* Overall score */}
            <div className="rounded-3xl p-6 text-center" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#C7D2FE' }}>Naggare Score · {roleLevel}</p>
              <p className="text-6xl font-bold text-white mb-1">{scores.overall_score}</p>
              <p className="text-sm" style={{ color: '#C7D2FE' }}>out of 100</p>
              <div className="mt-3 px-3 py-1 rounded-full inline-block" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <p className="text-xs font-semibold text-white">{scores.role_signal}</p>
              </div>
            </div>

            {/* Phase scores */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400 mb-1">Refactoring</p>
                <p className="text-2xl font-bold" style={{ color: '#4F46E5' }}>{scores.refactoring_score}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400 mb-1">System Design</p>
                <p className="text-2xl font-bold" style={{ color: '#7C3AED' }}>{scores.design_score}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4F46E5' }}>Edna&apos;s summary</p>
              <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{scores.summary}</p>
            </div>

            {/* Strengths */}
            {scores.strengths?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#15803D' }}>Strengths</p>
                {scores.strengths.map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 mb-2">
                    <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                    <p className="text-sm" style={{ color: '#374151' }}>{s}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Watch areas */}
            {scores.watch_areas?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#C2410C' }}>Areas to explore</p>
                {scores.watch_areas.map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 mb-2">
                    <span className="text-orange-400 flex-shrink-0 mt-0.5">→</span>
                    <p className="text-sm" style={{ color: '#374151' }}>{s}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Validity */}
            <div className="rounded-2xl p-4 text-center" style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
              <p className="text-xs" style={{ color: '#4F46E5' }}>
                ✓ Your Naggare Score is now visible to all recruiters on the platform
              </p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Valid for 6 months · Retake anytime to improve</p>
            </div>

            <button onClick={() => router.push('/home')}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
              Back to home →
            </button>
          </div>
        ) : (
          <p className="text-sm text-center text-gray-500">Something went wrong. Please try again.</p>
        )}
      </div>
    </div>
  )

  // SESSION SCREEN
  const currentPhase = PHASES[phase - 1]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F1F0FB', fontFamily: 'Raleway,sans-serif' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">👩‍💻</span>
          <div>
            <p className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Edna</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{currentPhase.name} · Phase {phase} of 2</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{currentPhase.name}</p>
            <p className="text-sm font-bold font-mono" style={{ color: timerColor }}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
          </div>
          <button onClick={handlePhaseEnd}
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: '#EEF2FF', color: '#4F46E5' }}>
            {phase === 1 ? 'Next phase →' : 'Finish →'}
          </button>
        </div>
      </div>

      {/* Phase indicator */}
      <div className="flex gap-0">
        {PHASES.map((p, i) => (
          <div key={i} className="flex-1 h-1" style={{
            background: i + 1 < phase ? '#4F46E5' : i + 1 === phase ? '#7C3AED' : '#E5E7EB'
          }} />
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ maxHeight: 'calc(100vh - 140px)' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
                👩‍💻
              </div>
            )}
            <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'text-white'
                : 'bg-white border border-gray-100 shadow-sm'
            }`}
              style={{
                background: msg.role === 'user' ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : undefined,
                color: msg.role === 'user' ? 'white' : '#374151',
                whiteSpace: 'pre-wrap',
                fontFamily: msg.content.includes('```') ? 'monospace' : 'Raleway,sans-serif'
              }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>👩‍💻</div>
            <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#4F46E5', animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#4F46E5', animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#4F46E5', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-100">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Type your response... (Shift+Enter for new line)"
            rows={2}
            className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none"
            style={{ color: '#1E1B4B', fontFamily: 'Raleway,sans-serif' }}
          />
          <button onClick={sendMessage} disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
            style={{ background: input.trim() && !loading ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : '#E5E7EB' }}>
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
