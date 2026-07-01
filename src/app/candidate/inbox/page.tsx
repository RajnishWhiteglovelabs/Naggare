'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'
import RecruiterProfileCard from '@/components/RecruiterProfileCard'

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
  status: string
  expires_at: string
  initiated_by: string
  messages: Message[]
  recruiter_name?: string
  jd_title?: string
  recruiter_photo?: string
}

function CandidateInboxInner() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [recruiterProfiles, setRecruiterProfiles] = useState<Record<string, any>>({})
  const [viewRecruiter, setViewRecruiter] = useState<any|null>(null)

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
    const data = await res.json()
    setSessions(data || [])

    // Load full recruiter profiles so tapping a name/photo opens the same card as candidate home
    const recruiterEmails = [...new Set((data || []).map((s: Session) => s.recruiter_email).filter(Boolean))]
    if (recruiterEmails.length > 0) {
      const { data: recs } = await supabase
        .from('recruiters')
        .select('email,name,title,company,photo_url,looking_for,skills,prompt_1_q,prompt_1_a,prompt_2_q,prompt_2_a')
        .in('email', recruiterEmails)
      if (recs) {
        const map: Record<string, any> = {}
        ;(recs as any[]).forEach((r: any) => { map[r.email] = r })
        setRecruiterProfiles(map)
      }
    }
    setLoading(false)
  }

  function openProfile(session: Session) {
    const rec = recruiterProfiles[session.recruiter_email] || {
      name: session.recruiter_name || session.recruiter_email,
      photo_url: session.recruiter_photo,
    }
    setViewRecruiter(rec)
  }

  function getLastMessage(session: Session) {
    if (!session.messages?.length) return 'No messages yet'
    return session.messages[session.messages.length - 1].content
  }

  function getUnreadCount(session: Session) {
    if (!session.messages?.length) return 0
    return session.messages.filter(m => m.sender_role === 'recruiter' && !m.read_at).length
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
    const params = new URLSearchParams({
      jd_id: session.jd_id || '',
      recruiter_email: session.recruiter_email || '',
      jd_title: session.jd_title || 'this role',
      recruiter_name: session.recruiter_name || session.recruiter_email || 'Recruiter'
    })
    router.push('/candidate/chat?' + params.toString())
  }

  const statusColor = (status: string) => {
    if (status === 'active' || status === 'matched') return '#16A34A'
    if (status === 'expired') return '#9CA3AF'
    return '#D97706'
  }

  const statusLabel = (status: string) => {
    if (status === 'active') return 'Active'
    if (status === 'matched') return 'Matched'
    if (status === 'expired') return 'Expired'
    return 'Pending'
  }

  return (
    <div className="min-h-screen bg-white" style={{maxWidth:'480px',margin:'0 auto'}}>
      <div style={{background:'#4F46E5'}} className="px-4 py-4 flex items-center gap-3">
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
          <p className="text-sm text-gray-500">When you apply to a JD and send a message, it will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {sessions.map(session => {
            const unread = getUnreadCount(session)
            const timeLeft = getTimeLeft(session)
            const last = getLastMessage(session)
            const initials = (session.recruiter_name || session.recruiter_email || 'R').split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()
            return (
              <div key={session.id} onClick={() => openChat(session)}
                className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors">
                <div onClick={(e) => { e.stopPropagation(); openProfile(session) }} className="flex-shrink-0 cursor-pointer">
                {session.recruiter_photo ? (
                  <img src={session.recruiter_photo} alt={initials}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                    style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>
                    {initials}
                  </div>
                )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p onClick={(e) => { e.stopPropagation(); openProfile(session) }}
                      className="font-semibold text-sm text-gray-900 truncate cursor-pointer hover:underline">{session.recruiter_name || session.recruiter_email}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {timeLeft && <span className="text-xs text-amber-600">{timeLeft}</span>}
                      {unread > 0 && (
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{background:'#4F46E5'}}>{unread}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-indigo-600 font-medium truncate mb-0.5">{session.jd_title || 'Role'}</p>
                  <p className="text-xs text-gray-500 truncate">{last}</p>
                </div>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background: statusColor(session.status)}} />
              </div>
            )
          })}
        </div>
      )}

      {viewRecruiter && (
        <RecruiterProfileCard recruiter={viewRecruiter} onClose={() => setViewRecruiter(null)} />
      )}
    </div>
  )
}

export default function CandidateInbox() {
  return <Suspense><CandidateInboxInner /></Suspense>
}
