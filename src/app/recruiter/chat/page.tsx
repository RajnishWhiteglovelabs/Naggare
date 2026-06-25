'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

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
  messages?: Message[]
}

function RecruiterChatInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const session_id = searchParams.get('session_id')
  const candidate_email = searchParams.get('candidate_email')
  const candidate_name = searchParams.get('candidate_name') || 'Candidate'
  const candidate_title = searchParams.get('candidate_title') || ''
  const candidate_company = searchParams.get('candidate_company') || ''
  const jd_title = searchParams.get('jd_title') || 'this role'
  const jd_id = searchParams.get('jd_id') || ''

  const [email, setEmail] = useState('')
  const [session, setSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [aiDraft, setAiDraft] = useState('')
  const [inmail, setInmail] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [candidatePhoto, setCandidatePhoto] = useState<string|null>(null)
  const [sending, setSending] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [extending, setExtending] = useState(false)
  const [showExtend, setShowExtend] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }: { data: { session: { user: { email: string } } | null } }) => { const s = data.session
      if (!s?.user?.email) { router.push('/signin'); return }
      setEmail(s.user.email)

      if (session_id) {
        loadMessages(s      // Fetch candidate photo
      if (cEmail) {
        supabase.from('candidates').select('photo_url').eq('email', cEmail).maybeSingle()
          .then(({ data }: { data: { photo_url: string | null } | null }) => {
            if (data?.photo_url) setCandidatePhoto(data.photo_url)
          })
      }
ession_id, s.user.email)
        const res = await fetch(`/api/chat/sessions?email=${encodeURIComponent(s.user.email)}`)
        const sessions: Session[] = await res.json()
        const found = sessions.find(x => x.id === session_id)
        if (found) setSession(found)
      } else {
        // New inmail — generate AI draft
        generateDraft(s.user.email)
      }
      setLoading(false)
    })
  }, [])

  async function generateDraft(recruiterEmail: string) {
    setDrafting(true)
    const { data: recruiter } = await supabase.from('recruiters').select('name').eq('email', recruiterEmail).single()
    const { data: candidate } = await supabase.from('candidates').select('name,title,company,skills').eq('email', candidate_email).single()

    const res = await fetch('/api/chat/ai-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_name: candidate?.name || candidate_name,
        candidate_title: candidate?.title || candidate_title,
        candidate_company: candidate?.company || candidate_company,
        candidate_skills: candidate?.skills || [],
        jd_title,
        jd_company: recruiter?.name || '',
        recruiter_name: recruiter?.name || ''
      })
    })
    const data = await res.json()
    setInmail(data.draft || '')
    setAiDraft(data.draft || '')
    setDrafting(false)
  }

  async function loadMessages(sid: string, userEmail: string) {
    const res = await fetch(`/api/chat/messages?session_id=${sid}`)
    const msgs: Message[] = await res.json()
    setMessages(msgs)
    fetch('/api/chat/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sid, reader_email: userEmail })
    })
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  // Realtime
  useEffect(() => {
    if (!session_id) return
    const channel = supabase
      .channel(`recruiter-messages:${session_id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `session_id=eq.${session_id}`
      }, (payload: { new: Message }) => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
        if (payload.new.sender_email !== email) {
          fetch('/api/chat/messages', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id, reader_email: email })
          })
        }
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session_id, email])

  // Countdown
  useEffect(() => {
    if (!session?.expires_at) return
    const tick = () => {
      const diff = new Date(session.expires_at).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('00:00:00'); setShowExtend(!session.extended); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
      if (diff < 2 * 3600000 && !session.extended) setShowExtend(true)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [session?.expires_at, session?.extended])

  async function sendInmail() {
    if (!inmail.trim() || !email || !candidate_email) return
    setSending(true)
    const res = await fetch('/api/chat/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_email,
        recruiter_email: email,
        jd_id,
        initiated_by: 'recruiter',
        message: inmail.trim()
      })
    })
    const data = await res.json()
    if (data.session_id) {
      router.replace(`/recruiter/chat?session_id=${data.session_id}&candidate_email=${candidate_email}&candidate_name=${candidate_name}&jd_title=${jd_title}`)
    }
    setSending(false)
  }

  async function sendMessage() {
    if (!newMessage.trim() || !session_id || !email) return
    setSending(true)
    await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id,
        sender_email: email,
        sender_role: 'recruiter',
        content: newMessage.trim()
      })
    })
    setNewMessage('')
    setSending(false)
  }

  async function extendTimer() {
    if (!session_id) return
    setExtending(true)
    await fetch('/api/chat/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, action: 'extend' })
    })
    setShowExtend(false)
    setExtending(false)
  }

  const candidateInitials = candidate_name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()
  const isActive = session?.status === 'active' || session?.status === 'matched'

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{maxWidth:'480px',margin:'0 auto'}}>
      {/* Header */}
      <div style={{background:'#15803D'}} className="px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => router.back()} className="text-white opacity-70 hover:opacity-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        {candidatePhoto
          ? <img src={candidatePhoto} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt={candidateInitials}/>
          : <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0" style={{background:'rgba(255,255,255,0.2)',color:'white'}}>
              {candidateInitials}
            </div>}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{candidate_name}</p>
          <p className="text-xs truncate" style={{color:'rgba(255,255,255,0.7)'}}>{candidate_title}{candidate_company ? ` · ${candidate_company}` : ''}</p>
        </div>
      </div>

      {/* New inmail composer */}
      {!session_id && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 p-3 rounded-xl border-l-4 text-sm" style={{background:'#F0FDF4',borderColor:'#15803D'}}>
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">AI drafted</p>
            <p className="text-xs text-green-700">Based on {candidate_name.split(' ')[0]}'s profile and the {jd_title} role</p>
          </div>
          {drafting ? (
            <div className="text-center py-8 text-gray-400 text-sm">Drafting message...</div>
          ) : (
            <>
              <textarea className="input w-full text-sm mb-3" rows={6} value={inmail} onChange={e => setInmail(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => generateDraft(email)} disabled={drafting}
                  className="flex-1 py-2.5 rounded-full text-sm border border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600 transition-all">
                  Regenerate
                </button>
                <button onClick={sendInmail} disabled={sending || !inmail.trim()}
                  className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white"
                  style={{background:'#15803D'}}>
                  {sending ? 'Sending...' : 'Send inmail'}
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">Candidate has 48 hours to respond</p>
            </>
          )}
        </div>
      )}

      {/* Active / pending chat */}
      {session_id && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Timer for pending sessions */}
          {session && session.status === 'pending' && (
            <div className="px-4 py-3 border-b border-gray-100 text-center" style={{background:'#F9FAFB'}}>
              <p className="text-xs text-gray-400 mb-1">Candidate has {timeLeft || '48:00:00'} to respond</p>
              {showExtend && !session.extended && (
                <button onClick={extendTimer} disabled={extending}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700">
                  {extending ? 'Extending...' : 'Extend +24 hours'}
                </button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              const isMe = msg.sender_email === email
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-xs">
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isMe ? 'rounded-br-sm text-white' : 'rounded-bl-sm text-gray-900 border border-gray-100'}`}
                      style={{background: isMe ? '#15803D' : 'white'}}>
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

          {session_id && (
            <div className="flex-shrink-0 p-3 border-t border-gray-100 flex gap-2 items-center">
              <input type="text" className="input flex-1 text-sm" placeholder="Type a message..."
                value={newMessage} onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} />
              <button onClick={sendMessage} disabled={sending || !newMessage.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white flex-shrink-0"
                style={{background:'#15803D'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z"/></svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function RecruiterChat() {
  return <Suspense><RecruiterChatInner /></Suspense>
}
