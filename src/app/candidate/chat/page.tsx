'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

const TEMPLATES = [
  "Hi {recruiter}, I'd love to learn more about the {role} role — particularly the team culture and what success looks like in the first 90 days.",
  "Hi {recruiter}, your JD caught my attention. I think my background fits well and I'd love to explore this further.",
  "Hi {recruiter}, I applied for the {role} position and wanted to briefly introduce myself before we connect formally.",
]

interface Message {
  id: string
  session_id: string
  sender_email: string
  sender_role: string
  content: string
  read_at: string | null
  created_at: string
}

interface Session {
  id: string
  candidate_email: string
  recruiter_email: string
  jd_id: string
  status: string
  expires_at: string
  extended: boolean
  initiated_by: string
}

function CandidateChatInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jd_id = searchParams.get('jd_id')
  const recruiter_email = searchParams.get('recruiter_email')
  const jd_title = searchParams.get('jd_title') || 'this role'
  const recruiter_name = searchParams.get('recruiter_name') || 'the recruiter'

  const [email, setEmail] = useState('')
  const [session, setSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState(0)
  const [messageText, setMessageText] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [extending, setExtending] = useState(false)
  const [showExtend, setShowExtend] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: { session: { user: { email: string } } | null } }) => { const s = data.session
      if (!s?.user?.email) { router.push('/signin'); return }
      setEmail(s.user.email)
      loadSession(s.user.email)
    })
  }, [])

  async function loadSession(userEmail: string) {
    if (!jd_id || !recruiter_email) return
    setLoading(true)
    const res = await fetch(`/api/chat/sessions?email=${encodeURIComponent(userEmail)}`)
    const sessions: Session[] = await res.json()
    const existing = sessions.find(s => s.jd_id === jd_id && s.recruiter_email === recruiter_email)
    if (existing) {
      setSession(existing)
      loadMessages(existing.id, userEmail)
    }
    setLoading(false)

    // Set default message from template
    const tmpl = TEMPLATES[0]
      .replace('{recruiter}', recruiter_name.split(' ')[0])
      .replace('{role}', jd_title)
    setMessageText(tmpl)
  }

  async function loadMessages(session_id: string, userEmail: string) {
    const res = await fetch(`/api/chat/messages?session_id=${session_id}`)
    const msgs: Message[] = await res.json()
    setMessages(msgs)
    // Mark as read
    fetch('/api/chat/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, reader_email: userEmail })
    })
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  // Realtime subscription
  useEffect(() => {
    if (!session) return
    const channel = supabase
      .channel(`messages:${session.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${session.id}`
      }, (payload: { new: Message }) => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
        if (payload.new.sender_email !== email) {
          fetch('/api/chat/messages', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: session.id, reader_email: email })
          })
        }
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_sessions',
        filter: `id=eq.${session.id}`
      }, (payload: { new: Partial<Session> }) => {
        setSession(prev => prev ? { ...prev, ...payload.new } : prev)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session?.id, email])

  // Countdown timer
  useEffect(() => {
    if (!session?.expires_at) return
    const tick = () => {
      const diff = new Date(session.expires_at).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('00:00:00')
        setShowExtend(!session.extended)
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
      // Show extend option when under 2hrs
      if (diff < 2 * 3600000 && !session.extended) setShowExtend(true)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [session?.expires_at, session?.extended])

  function selectTemplate(i: number) {
    setSelectedTemplate(i)
    const tmpl = TEMPLATES[i]
      .replace('{recruiter}', recruiter_name.split(' ')[0])
      .replace('{role}', jd_title)
    setMessageText(tmpl)
  }

  async function sendOpeningMessage() {
    if (!messageText.trim() || !email || !recruiter_email || !jd_id) return
    setSending(true)
    const res = await fetch('/api/chat/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_email: email,
        recruiter_email,
        jd_id,
        initiated_by: 'candidate',
        message: messageText.trim(),
        recruiter_name,
        jd_title
      })
    })
    const data = await res.json()
    if (data.session_id) {
      await loadSession(email)
      // Notify recruiter
      fetch('/api/email/chat-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recruiter_email, type: 'new_message', role: jd_title })
      })
    }
    setSending(false)
  }

  async function sendMessage() {
    if (!newMessage.trim() || !session || !email) return
    setSending(true)
    await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.id,
        sender_email: email,
        sender_role: 'candidate',
        content: newMessage.trim()
      })
    })
    setNewMessage('')
    setSending(false)
  }

  async function extendTimer() {
    if (!session) return
    setExtending(true)
    await fetch('/api/chat/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: session.id, action: 'extend' })
    })
    setShowExtend(false)
    setExtending(false)
  }

  const recruiterFirstName = recruiter_name.split(' ')[0]
  const isActive = session?.status === 'active' || session?.status === 'matched'
  const isPending = session?.status === 'pending'

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading chat...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{maxWidth:'480px',margin:'0 auto'}}>
      {/* Header */}
      <div style={{background:'#4F46E5'}} className="px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => router.back()} className="text-white opacity-70 hover:opacity-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0" style={{background:'rgba(255,255,255,0.2)',color:'white'}}>
          {recruiter_name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{recruiter_name}</p>
          <p className="text-xs truncate" style={{color:'rgba(255,255,255,0.7)'}}>{jd_title}</p>
        </div>
        {isActive && <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />}
      </div>

      {/* No session yet — show opening message composer */}
      {!session && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 p-3 rounded-xl text-sm" style={{background:'#EEF2FF',color:'#4338CA'}}>
            You applied for <strong>{jd_title}</strong>. Send one message to introduce yourself. Most recruiters respond within 48 hours.
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Choose a starter</p>
          <div className="space-y-2 mb-4">
            {TEMPLATES.map((t, i) => {
              const filled = t.replace('{recruiter}', recruiterFirstName).replace('{role}', jd_title)
              return (
                <div key={i} onClick={() => selectTemplate(i)}
                  className="p-3 rounded-xl text-sm cursor-pointer transition-all"
                  style={{
                    border: selectedTemplate === i ? '1.5px solid #4F46E5' : '1px solid #E5E7EB',
                    background: selectedTemplate === i ? '#EEF2FF' : 'white',
                    color: selectedTemplate === i ? '#3730A3' : '#374151'
                  }}>
                  {filled}
                </div>
              )
            })}
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Edit your message</p>
          <textarea
            className="input w-full text-sm"
            rows={4}
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
          />
          <button className="btn-primary mt-3" onClick={sendOpeningMessage} disabled={sending || !messageText.trim()}>
            {sending ? 'Sending...' : 'Send message'}
          </button>
        </div>
      )}

      {/* Pending — waiting for recruiter */}
      {isPending && session && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4">
            {/* Countdown */}
            <div className="text-center p-6 mb-4 rounded-2xl" style={{background:'#F9FAFB'}}>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Recruiter has</p>
              <p className="text-4xl font-semibold tabular-nums" style={{color:'#4F46E5'}}>{timeLeft || '48:00:00'}</p>
              <p className="text-xs text-gray-400 mt-2">to respond</p>
            </div>
            <p className="text-xs text-gray-500 text-center leading-relaxed mb-4">
              Most recruiters respond within 48 hours — we'll notify you the moment they do.
            </p>
            {showExtend && !session.extended && (
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-center mb-4">
                <p className="text-sm text-amber-700 mb-2">Timer almost up — extend by 24 hours?</p>
                <button onClick={extendTimer} disabled={extending}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                  style={{background:'#D97706'}}>
                  {extending ? 'Extending...' : 'Extend 24 hours'}
                </button>
              </div>
            )}
            {/* Sent message */}
            <div className="flex justify-end">
              <div className="max-w-xs px-4 py-3 rounded-2xl rounded-br-sm text-sm text-white" style={{background:'#4F46E5'}}>
                {messages[0]?.content}
                <p className="text-xs mt-1 text-right" style={{color:'rgba(255,255,255,0.6)'}}>
                  ✓ Delivered
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active chat */}
      {isActive && session && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              const isMe = msg.sender_email === email
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-xs">
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isMe ? 'rounded-br-sm text-white' : 'rounded-bl-sm text-gray-900 border'}`}
                      style={{
                        background: isMe ? '#4F46E5' : 'white',
                        borderColor: isMe ? 'transparent' : '#E5E7EB'
                      }}>
                      {msg.content}
                    </div>
                    <p className={`text-xs mt-1 ${isMe ? 'text-right' : 'text-left'} text-gray-400`}>
                      {isMe ? (msg.read_at ? '✓✓ Seen' : '✓ Delivered') : new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex-shrink-0 p-3 border-t border-gray-100 flex gap-2 items-center">
            <input
              type="text"
              className="input flex-1 text-sm"
              placeholder="Type a message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            />
            <button onClick={sendMessage} disabled={sending || !newMessage.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white"
              style={{background:'#4F46E5'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CandidateChat() {
  return <Suspense><CandidateChatInner /></Suspense>
}
