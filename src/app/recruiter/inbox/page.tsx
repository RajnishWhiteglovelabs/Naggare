'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

interface Message {
  id: string
  content: string
  sender_role: string
  created_at: string
  read_at: string | null
}

interface Session {
  id: string
  recruiter_email: string
  candidate_email: string
  jd_id: string
  jd_title: string
  status: string
  expires_at: string
  initiated_by: string
  messages: Message[]
}

function RecruiterInboxInner() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [candidates, setCandidates] = useState<Record<string, {name:string, photo_url:string|null}>>({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: { session: { user: { email: string } } | null } }) => {
      const s = data.session
      if (!s?.user?.email) { router.push('/signin'); return }
      setEmail(s.user.email)
      loadSessions(s.user.email)
    })
  }, [])

  async function loadSessions(userEmail: string) {
    const res = await fetch(`/api/chat/sessions?email=${encodeURIComponent(userEmail)}`)
    const data: Session[] = await res.json()
    setSessions(data || [])

    // Load candidate names and photos
    const emails = [...new Set((data || []).map(s => s.candidate_email))]
    if (emails.length > 0) {
      const { data: cands } = await supabase
        .from('candidates')
        .select('email, name, photo_url')
        .in('email', emails)
      if (cands) {
        const map: Record<string, {name:string, photo_url:string|null}> = {}
        cands.forEach((c: {email:string, name:string, photo_url:string|null}) => { map[c.email] = { name: c.name, photo_url: c.photo_url } })
        setCandidates(map)
      }
    }
    setLoading(false)
  }

  function getLastMessage(session: Session) {
    if (!session.messages?.length) return 'No messages yet'
    return session.messages[session.messages.length - 1].content
  }

  function getUnreadCount(session: Session) {
    if (!session.messages?.length) return 0
    return session.messages.filter(m => m.sender_role === 'candidate' && !m.read_at).length
  }

  function getTimeLeft(session: Session) {
    if (session.status === 'active' || session.status === 'matched') return null
    const diff = new Date(session.expires_at).getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}h ${m}m left`
  }

  function openChat(session: Session) {
    const cand = candidates[session.candidate_email]
    const params = new URLSearchParams({
      session_id: session.id,
      candidate_email: session.candidate_email,
      candidate_name: cand?.name || session.candidate_email,
      jd_title: session.jd_title || 'this role',
      jd_id: session.jd_id || ''
    })
    router.push('/recruiter/chat?' + params.toString())
  }

  const statusColor = (status: string) => {
    if (status === 'active' || status === 'matched') return '#16A34A'
    if (status === 'expired') return '#9CA3AF'
    return '#D97706'
  }

  return (
    <div className="min-h-screen bg-white" style={{maxWidth:'480px',margin:'0 auto'}}>
      <div style={{background:'#15803D'}} className="px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white opacity-70 hover:opacity-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-white font-semibold text-lg">Inbox</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="text-4xl mb-4">💬</div>
          <p className="font-semibold text-gray-900 mb-1">No messages yet</p>
          <p className="text-sm text-gray-500">When candidates apply to your JDs and message you, they'll appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {sessions.map(session => {
            const cand = candidates[session.candidate_email]
            const name = cand?.name || session.candidate_email
            const photo = cand?.photo_url
            const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()
            const unread = getUnreadCount(session)
            const timeLeft = getTimeLeft(session)
            const last = getLastMessage(session)

            return (
              <div key={session.id} onClick={() => openChat(session)}
                className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden"
                  style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>
                  {photo
                    ? <img src={photo} className="w-full h-full object-cover" alt={name} />
                    : <div className="w-full h-full flex items-center justify-center text-white font-semibold text-sm">{initials}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-sm text-gray-900 truncate">{name}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {timeLeft && <span className="text-xs text-amber-600">{timeLeft}</span>}
                      {unread > 0 && (
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{background:'#15803D'}}>{unread}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs font-medium truncate mb-0.5" style={{color:'#15803D'}}>{session.jd_title || 'Role'}</p>
                  <p className="text-xs text-gray-500 truncate">{last}</p>
                </div>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background: statusColor(session.status)}} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function RecruiterInbox() {
  return <Suspense><RecruiterInboxInner /></Suspense>
}
