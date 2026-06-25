'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

export default function RecruiterHome() {
  const router = useRouter()
  const [recruiter, setRecruiter] = useState<any>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [view, setView] = useState<'home'|'browse'|'myjds'>('home')
  const [myJds, setMyJds] = useState<any[]>([])
  const [expandedJd, setExpandedJd] = useState<string|null>(null)
  const [closingJd, setClosingJd] = useState<any|null>(null)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'pass'|'pursue'|'buzzer'>('pursue')
  const [actionDone, setActionDone] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) { router.push('/signin'); return }

      const res = await fetch('/api/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email }),
      })
      if (!res.ok) { router.push('/recruiter/register'); return }
      const profile = await res.json()
      if (profile.type !== 'recruiter') { router.push('/home'); return }
      // If profile missing critical fields, send to register to complete it
      if (!profile.name || !profile.company || !profile.title) {
        router.push('/recruiter/register'); return
      }
      setRecruiter(profile)

      // Load recruiter's own JDs
      const jdRes = await fetch(`/api/jds?recruiter_email=${encodeURIComponent(profile.email)}`)
      if (jdRes.ok) setMyJds(await jdRes.json())

      // Load active candidates
      const { createClient } = await import('@supabase/supabase-js')
      const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await admin.from('candidates').select('*').eq('status', 'active').order('created_at', { ascending: false })
      setCandidates(data || [])
    }
    load()
  }, [])

  function showToast(msg: string, type: 'pass'|'pursue'|'buzzer') {
    setToast(msg)
    setToastType(type)
    setTimeout(() => setToast(''), 2500)
  }

  async function takeAction(action: 'pass'|'pursue'|'golden_buzzer') {
    const candidate = candidates[currentIdx]
    if (!candidate || !recruiter) return

    setActionDone(true)
    setTimeout(() => {
      setCurrentIdx(prev => prev + 1)
      setActionDone(false)
    }, 300)

    if (action === 'pass') {
      showToast('Passed', 'pass')
      return
    }

    const res = await fetch('/api/recruiter/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recruiter_email: recruiter.email,
        candidate_email: candidate.email,
        action,
      }),
    })
    const data = await res.json()

    if (action === 'golden_buzzer') {
      showToast('Golden Buzzer sent! They will be notified.', 'buzzer')
    } else if (data.mutual) {
      showToast('Match! You both expressed interest.', 'pursue')
    } else {
      showToast('Pursuing — they will see your interest.', 'pursue')
    }
  }

  async function signOut() {
    if (!confirm('Sign out?')) return
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!recruiter) return null

  const firstName = recruiter?.name?.split(' ')[0] || 'there'
  const initials = recruiter?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const candidate = candidates[currentIdx]
  const candidateInitials = candidate?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const prompts = candidate ? [
    candidate.prompt_1_q ? { q: candidate.prompt_1_q, a: candidate.prompt_1_a } : null,
    candidate.prompt_2_q ? { q: candidate.prompt_2_q, a: candidate.prompt_2_a } : null,
    candidate.prompt_3_q ? { q: candidate.prompt_3_q, a: candidate.prompt_3_a } : null,
  ].filter(Boolean) as { q: string; a: string }[] : []

  function formatDate(d: string) {
    if (!d) return ''
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const parts = d.split('-')
    if (parts.length === 2) return `${months[parseInt(parts[1])-1] || ''} ${parts[0]}`
    return parts[0] // just year
  }

  const GREEN = '#4F46E5'
  const GREEN_BG = 'linear-gradient(135deg,#4F46E5,#7C3AED)'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F3FF' }}>

      {/* NAV */}
      <nav className="bg-white border-b px-4 h-14 flex items-center justify-between sticky top-0 z-50 shadow-sm" style={{ borderColor: '#E0E7FF' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: GREEN_BG }}>
            <span className="text-sm font-bold text-white" style={{ fontFamily: 'Georgia,serif' }}>N</span>
          </div>
          <span className="font-bold text-lg" style={{ fontFamily: 'Georgia,serif', color: '#1E1B4B' }}>Naggare</span>
        </div>

        <div className="flex items-center gap-2 relative">
          <span className="text-sm font-semibold text-gray-600 hidden sm:block">{firstName}</span>
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-bold cursor-pointer flex-shrink-0"
            style={{ background: GREEN_BG }}
            onClick={() => setMenuOpen(prev => !prev)}>
            {recruiter?.photo_url
              ? <img src={recruiter.photo_url} className="w-full h-full object-cover" alt={firstName} />
              : <span className="text-xs font-bold">{initials}</span>}
          </div>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl shadow-2xl overflow-hidden bg-white border border-gray-100">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-sm font-bold text-gray-900 truncate">{recruiter?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{recruiter?.company}</p>
                </div>
                {[
                  { icon: '✏️', label: 'Edit Profile', action: () => { router.push('/recruiter/register?edit=true'); setMenuOpen(false) } },
                  { icon: '📋', label: 'My JDs', action: () => { setView('myjds'); setMenuOpen(false) } },
                  { icon: '📋', label: 'Post a JD', action: () => { router.push('/recruiter/jd-builder'); setMenuOpen(false) } },
                  { icon: '💬', label: 'Inbox', action: () => { router.push('/recruiter/inbox'); setMenuOpen(false) } },
                  { icon: '💚', label: 'My Matches', action: () => { showToast('Coming soon!', 'pursue'); setMenuOpen(false) } },
                  { icon: '⚙️', label: 'Account Settings', action: () => { router.push('/account-settings'); setMenuOpen(false) } },
                  { icon: '💬', label: 'Feedback', action: () => { router.push('/feedback'); setMenuOpen(false) } },
                ].map(item => (
                  <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors text-left" onClick={item.action}>
                    <span>{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
                <div className="border-t border-gray-100">
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors text-left" onClick={() => { setMenuOpen(false); signOut() }}>
                    <span>🚪</span>
                    <span className="font-medium">Sign out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto">

        {/* HOME VIEW - Recruiter's own profile */}
        {view === 'home' && (
          <div>
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-14 z-10">
              <h2 className="text-base font-bold">My Profile</h2>
              <button className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{background:'#EEF2FF',color:'#4F46E5',border:'0.5px solid #C7D2FE'}}
                onClick={()=>showToast('Share naggare.com 🔗', 'pursue')}>Share 🔗</button>
            </div>

            <div className="px-4 py-5" style={{maxWidth:'420px',margin:'0 auto'}}>
              <div className="rounded-3xl overflow-hidden shadow-xl mb-4" style={{border:'1px solid #E0E7FF'}}>

                {/* Hero */}
                <div className="flex flex-col items-center pt-8 pb-6 px-4 text-center"
                  style={{background:'linear-gradient(160deg,#4F46E5,#7C3AED)'}}>
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-3 flex items-center justify-center text-white font-bold text-2xl"
                    style={{background:'rgba(255,255,255,0.2)'}}>
                    {recruiter?.photo_url
                      ? <img src={recruiter.photo_url} className="w-full h-full object-cover" alt={recruiter.name}/>
                      : <span>{initials}</span>}
                  </div>
                  <p className="text-xl font-bold text-white mb-0.5" style={{fontFamily:'Georgia,serif'}}>{recruiter.name}</p>
                  <p className="text-sm font-semibold" style={{color:'#C7D2FE'}}>{recruiter.title}</p>
                  <p className="text-xs mt-0.5" style={{color:'#A5B4FC'}}>{recruiter.company}</p>
                </div>

                {/* Hiring philosophy */}
                {recruiter.looking_for && (
                  <div className="p-4 border-b border-gray-100 bg-white">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">My Hiring Philosophy</p>
                    <p className="text-sm leading-relaxed text-gray-800">{recruiter.looking_for}</p>
                  </div>
                )}

                {/* Skills */}
                {recruiter.skills?.length > 0 && (
                  <div className="p-4 border-b border-gray-100 bg-white">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Skills I hire for · {recruiter.skills.length}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {recruiter.skills.map((s:string) => <span key={s} className="tag">{s}</span>)}
                    </div>
                  </div>
                )}

                {/* Prompts */}
                {[recruiter.prompt_1_q, recruiter.prompt_2_q, recruiter.prompt_3_q].filter(Boolean).length > 0 && (
                  <div className="p-4 bg-white">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">In My Own Words</p>
                    {[
                      {q:recruiter.prompt_1_q, a:recruiter.prompt_1_a},
                      {q:recruiter.prompt_2_q, a:recruiter.prompt_2_a},
                      {q:recruiter.prompt_3_q, a:recruiter.prompt_3_a},
                    ].filter(p=>p.q&&p.a).map((p,i)=>(
                      <div key={i} className="mb-3 p-4 rounded-2xl" style={{background:'#EEF2FF',border:'0.5px solid #C7D2FE'}}>
                        <p className="text-xs font-bold mb-2" style={{color:'#3730A3'}}>{p.q}</p>
                        <p className="text-sm leading-relaxed text-gray-800">{p.a}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button className="btn-primary py-3 mb-3" onClick={()=>setView('browse')}>
                👥 Browse Candidates
              </button>
              <button className="btn-primary py-3 mb-3" onClick={()=>router.push('/recruiter/jd-builder')}
                style={{background:'linear-gradient(135deg,#7C3AED,#4F46E5)'}}>
                📋 Post a JD
              </button>
              <button className="btn-outline py-3 mb-3 text-sm" onClick={()=>setView('myjds')}>
                📁 My JDs
              </button>
              <button className="btn-outline py-3 text-sm" onClick={()=>router.push('/recruiter/register?edit=true')}>
                ✏️ Edit profile
              </button>
            </div>
          </div>
        )}

        {/* BROWSE VIEW */}
        {view === 'browse' && (
          <div className="px-4 py-4" style={{ maxWidth: '460px', margin: '0 auto' }}>
            <div className="flex items-center justify-between mb-3 px-1">
              <button className="text-2xl" style={{ color: GREEN }} onClick={() => setView('home')}>‹</button>
              <p className="text-xs text-gray-400">{currentIdx + 1} of {candidates.length} candidates</p>
              <div className="flex gap-1">
                {candidates.slice(0, Math.min(candidates.length, 5)).map((_, i) => (
                  <div key={i} className="h-1 w-5 rounded-full" style={{ background: i <= currentIdx ? GREEN : '#E0E7FF' }} />
                ))}
              </div>
            </div>

        {/* No more candidates */}
        {!candidate && candidates.length > 0 && (
          <div className="flex flex-col items-center justify-center min-h-96 px-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#1E1B4B', fontFamily: 'Georgia,serif' }}>You've seen everyone!</h2>
            <p className="text-sm text-gray-500 mb-6">New candidates join every day. Check back tomorrow.</p>
            <button className="btn-primary py-3 px-8 w-auto rounded-full" style={{ background: GREEN_BG }} onClick={() => { setCurrentIdx(0); setView('home') }}>Back to home</button>
          </div>
        )}

        {/* Loading */}
        {candidates.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-96">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500 text-sm">Finding candidates for you...</p>
          </div>
        )}

        {/* Candidate card */}
        {candidate && (
          <div className="px-4 py-4" style={{ maxWidth: '460px', margin: '0 auto' }}>

            {/* Counter */}
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-xs text-gray-400">{currentIdx + 1} of {candidates.length} candidates</p>
              <div className="flex gap-1">
                {candidates.slice(0, Math.min(candidates.length, 5)).map((_, i) => (
                  <div key={i} className="h-1 w-5 rounded-full" style={{ background: i <= currentIdx ? GREEN : '#E0E7FF' }} />
                ))}
              </div>
            </div>

            <div className={`rounded-3xl overflow-hidden shadow-xl transition-all duration-300 ${actionDone ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
              style={{ border: '1px solid #E0E7FF' }}>

              {/* Full-bleed photo hero */}
              <div className="relative" style={{ height: '380px' }}>
                {candidate.photo_url
                  ? <img src={candidate.photo_url} className="absolute inset-0 w-full h-full object-cover" alt={candidate.name} />
                  : <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(160deg,#4F46E5,#7C3AED)' }}>
                      <div className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl" style={{ background: 'rgba(255,255,255,0.2)' }}>
                        {candidateInitials}
                      </div>
                    </div>
                }
                {/* Gradient overlay */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' }} />
                {/* Badges */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: 'rgba(22,163,74,0.9)' }}>Actively looking</span>
                </div>
                {candidate.domain && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: 'rgba(79,70,229,0.85)' }}>{candidate.domain}</span>
                  </div>
                )}
                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: 'Georgia,serif' }}>{candidate.name}</p>
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{candidate.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {candidate.company}{candidate.city ? ' · ' + candidate.city : ''}{candidate.years_exp ? ' · ' + candidate.years_exp + ' yrs' : ''}
                  </p>
                </div>
              </div>

              {/* Card pulled up below photo */}
              <div className="bg-white">

                {/* Career timeline */}
                {candidate.career?.filter((c: any) => c.org).length > 0 && (
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#4F46E5' }}>Career Journey</p>
                    <div className="relative">
                      <div className="flex gap-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                        {candidate.career.filter((c: any) => c.org).map((c: any, i: number) => (
                          <div key={i} className="flex flex-col items-center flex-shrink-0" style={{ minWidth: '68px' }}>
                            <div className={`rounded-full mb-1.5 ${i === 0 ? 'w-3 h-3' : 'w-2 h-2'}`}
                              style={{ background: '#4F46E5', boxShadow: i === 0 ? '0 0 0 3px rgba(79,70,229,0.2)' : '' }}></div>
                            <p className="text-xs font-bold text-center leading-tight" style={{ color: i === 0 ? '#4F46E5' : '#111827' }}>{c.org}</p>
                            <p className="text-xs text-center leading-tight text-gray-400">{c.role}</p>
                            {(c.from || c.to) && <p className="text-center" style={{ fontSize: '10px', color: '#9CA3AF' }}>{formatDate(c.from)}{c.from && c.to ? ' – ' : ''}{formatDate(c.to)}</p>}
                          </div>
                        ))}
                      </div>
                      <div className="absolute top-0 right-0 h-full pointer-events-none" style={{ width: '32px', background: 'linear-gradient(to right, transparent, white)' }} />
                      <span className="absolute" style={{ top: '50%', right: '2px', transform: 'translateY(-50%)', fontSize: '14px', color: '#4F46E5' }}>›</span>
                    </div>
                  </div>
                )}

                {/* Skills */}
                {candidate.skills?.length > 0 && (
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4F46E5' }}>Skills · {candidate.skills.length}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.skills.map((s: string) => (
                        <span key={s} className="tag" style={{ fontSize: '11px', padding: '2px 8px' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prompts */}
                {prompts.filter(p => p.a?.trim()).length > 0 && (
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#4F46E5' }}>In their own words</p>
                    {prompts.filter(p => p.a?.trim()).map((p, i) => (
                      <div key={i} className="mb-3 p-3 rounded-xl" style={{ background: '#EEF2FF', border: '0.5px solid #C7D2FE' }}>
                        <p className="text-xs font-bold mb-1" style={{ color: '#3730A3' }}>{p.q}</p>
                        <p className="text-sm leading-relaxed text-gray-800">{p.a}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* What they're looking for */}
                {candidate.looking_for && (
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4F46E5' }}>What they're looking for</p>
                    <p className="text-sm leading-relaxed text-gray-800">{candidate.looking_for}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="grid grid-cols-3">
                  <button className="py-4 flex flex-col items-center gap-1.5 border-r border-gray-100 hover:bg-red-50 transition-colors"
                    onClick={() => takeAction('pass')}>
                    <span className="text-2xl">✕</span>
                    <span className="text-xs font-semibold text-red-500">Pass</span>
                  </button>
                  <button className="py-4 flex flex-col items-center gap-1.5 border-r border-gray-100 hover:bg-green-50 transition-colors"
                    onClick={() => { const c = candidates[currentIdx]; const params = new URLSearchParams({ candidate_email: c.email||'', candidate_name: c.name||'', candidate_title: c.title||'', candidate_company: c.company||'', jd_title: 'your open role', jd_id: '' }); takeAction('pursue'); router.push('/recruiter/chat?'+params.toString()) }}>
                    <span className="text-2xl">💙</span>
                    <span className="text-xs font-semibold" style={{ color: '#4F46E5' }}>Pursue</span>
                  </button>
                  <button className="py-4 flex flex-col items-center gap-1.5 hover:bg-amber-50 transition-colors"
                    onClick={() => takeAction('golden_buzzer')}>
                    <span className="text-2xl">⚡</span>
                    <span className="text-xs font-semibold text-amber-600">Golden Buzzer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
        )}

        {/* MY JDS VIEW */}
        {view === 'myjds' && (
          <div className="px-4 py-4 max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <button className="text-2xl text-indigo-600" onClick={()=>setView('home')}>‹</button>
              <h2 className="text-lg font-bold">My JDs</h2>
              <button className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-full text-white"
                style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}
                onClick={()=>router.push('/recruiter/jd-builder')}>+ Post new</button>
            </div>
            {myJds.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <div className="text-4xl mb-3">📋</div>
                <p className="font-semibold text-gray-700 mb-1">No JDs yet</p>
                <p className="text-sm text-gray-400 mb-4">Post your first role and start finding candidates</p>
                <button className="btn-primary py-3 text-sm" onClick={()=>router.push('/recruiter/jd-builder')}>Post a JD →</button>
              </div>
            ) : (
              myJds.map(jd => (
                <div key={jd.id} className="bg-white rounded-2xl mb-3 border border-gray-100 overflow-hidden shadow-sm">
                  {/* Header - always visible, click to expand */}
                  <div className="p-4 cursor-pointer" onClick={()=>setExpandedJd(expandedJd===jd.id?null:jd.id)}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{jd.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{jd.team}{jd.city ? ' · ' + jd.city : ''}{jd.salary_range ? ' · ' + jd.salary_range : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{background: jd.status==='open'?'#DCFCE7':'#F3F4F6', color: jd.status==='open'?'#16A34A':'#6B7280'}}>
                          {jd.status === 'open' ? 'Live' : 'Closed'}
                        </span>
                        <span className="text-gray-400 text-sm">{expandedJd===jd.id?'▲':'▼'}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {jd.work_style && <span className="tag" style={{fontSize:'11px',padding:'2px 8px'}}>🌏 {jd.work_style}</span>}
                      {jd.min_years > 0 && <span className="tag" style={{fontSize:'11px',padding:'2px 8px'}}>{jd.min_years}+ yrs</span>}
                    </div>
                  </div>

                  {/* Expanded full JD preview */}
                  {expandedJd === jd.id && (
                    <div className="border-t border-gray-100">
                      {jd.show_tracks !== false && (jd.ic_track||[]).length > 0 && (
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">Where This Role Takes You</p>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">⚡ IC Track</p>
                          <div className="overflow-x-auto pb-2 mb-3">
                            <div className="flex items-start relative" style={{minWidth:'max-content'}}>
                              <div className="absolute top-2 left-0 right-0 h-px bg-gray-200" />
                              {(jd.ic_track||[]).map((role:string,i:number)=>(
                                <div key={i} className="flex flex-col items-center" style={{minWidth:'72px',zIndex:1}}>
                                  <div className="w-3.5 h-3.5 rounded-full border-2 mb-1" style={{background:i<=(jd.ic_current||1)?'#4F46E5':'white',borderColor:i<=(jd.ic_current||1)?'#4F46E5':'#D1D5DB'}} />
                                  <p className="text-xs text-center px-1 leading-tight" style={{color:i===(jd.ic_current||1)?'#4F46E5':'#6B7280',fontWeight:i===(jd.ic_current||1)?600:400}}>
                                    {role}{i===(jd.ic_current||1)&&<span className="block text-indigo-400 font-normal">← Here</span>}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                          {(jd.mgmt_track||[]).length > 0 && (<>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">👥 Management Track</p>
                            <div className="overflow-x-auto pb-2">
                              <div className="flex items-start relative" style={{minWidth:'max-content'}}>
                                <div className="absolute top-2 left-0 right-0 h-px bg-gray-200" />
                                {(jd.mgmt_track||[]).map((role:string,i:number)=>(
                                  <div key={i} className="flex flex-col items-center" style={{minWidth:'72px',zIndex:1}}>
                                    <div className="w-3.5 h-3.5 rounded-full border-2 mb-1" style={{background:i<=(jd.mgmt_current||0)?'#7C3AED':'white',borderColor:i<=(jd.mgmt_current||0)?'#7C3AED':'#D1D5DB'}} />
                                    <p className="text-xs text-center px-1 leading-tight" style={{color:i===(jd.mgmt_current||0)?'#7C3AED':'#6B7280',fontWeight:i===(jd.mgmt_current||0)?600:400}}>
                                      {role}{i===(jd.mgmt_current||0)&&<span className="block text-purple-400 font-normal">← Start</span>}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>)}
                        </div>
                      )}
                      {jd.must_have_skills?.length > 0 && (
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Must-Have Skills</p>
                          <div className="flex flex-wrap gap-1">{jd.must_have_skills.map((s:string)=><span key={s} className="tag" style={{fontSize:'11px'}}>{s}</span>)}</div>
                        </div>
                      )}
                      {jd.good_to_have_skills?.length > 0 && (
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Good to Have</p>
                          <div className="flex flex-wrap gap-1">{jd.good_to_have_skills.map((s:string)=><span key={s} className="tag" style={{fontSize:'11px',background:'#F0FDF4',borderColor:'#BBF7D0',color:'#15803D'}}>{s}</span>)}</div>
                        </div>
                      )}
                      {jd.non_negotiables && (
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">🚫 Non-Negotiables</p>
                          <div className="p-3 rounded-xl text-sm leading-relaxed" style={{background:'#FFF1F2',border:'0.5px solid #FECDD3'}}>{jd.non_negotiables}</div>
                        </div>
                      )}
                      {jd.real_tuesday && (
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">📅 What a Real Tuesday Looks Like</p>
                          <p className="text-sm text-gray-800 leading-relaxed">{jd.real_tuesday}</p>
                        </div>
                      )}
                      {jd.interview_process && !(jd.interview_steps?.some((s:any)=>s.title)) && (
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">🎯 Interview Process</p>
                          <p className="text-sm text-gray-800 leading-relaxed">{jd.interview_process}</p>
                        </div>
                      )}
                      {jd.interview_steps?.some((s:any)=>s.title) && (
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Interview Process</p>
                          {jd.interview_steps.filter((s:any)=>s.title).map((step:any,i:number)=>{
                            const cols=['#4F46E5','#7C3AED','#2563EB','#D97706','#111827']
                            return (
                              <div key={i} className="flex gap-3 items-start mb-2 last:mb-0">
                                <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-white text-xs font-bold" style={{background:cols[i%5]}}>{i+1}</div>
                                <div>
                                  <span className="text-sm font-bold text-gray-900">{step.title}</span>
                                  {step.duration&&<span className="text-xs text-gray-400 ml-2">· {step.duration}</span>}
                                  {step.competencies&&<p className="text-xs text-gray-500 mt-0.5">{step.competencies}</p>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 px-4 py-3 border-t border-gray-100">
                    <button className="flex-1 py-2 rounded-full text-xs font-semibold border border-gray-200 text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
                      onClick={()=>router.push(`/recruiter/jd-builder?id=${jd.id}`)}>✏️ Edit</button>
                    {jd.status === 'open' ? (
                      <button className="flex-1 py-2 rounded-full text-xs font-semibold text-red-500 border border-red-100 hover:bg-red-50"
                        onClick={()=>setClosingJd(jd)}>🔒 Close</button>
                    ) : (
                      <button className="flex-1 py-2 rounded-full text-xs font-semibold text-green-600 border border-green-100 hover:bg-green-50"
                        onClick={async () => {
                          await fetch('/api/jds', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id: jd.id, status: 'open'}) })
                          setMyJds(myJds.map((j: any) => j.id === jd.id ? {...j, status: 'open'} : j))
                          showToast('JD is live again ✅', 'pursue')
                        }}>🔓 Reopen</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Close JD Modal */}
      {closingJd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold mb-1" style={{fontFamily:'Georgia,serif',color:'#1E1B4B'}}>Why are you closing this?</h3>
            <p className="text-sm text-gray-500 mb-5">Helps us improve Naggare for everyone.</p>
            {[
              {reason:'hired_naggare', label:'✅ Hired via Naggare', sub:'Great! We made a match.'},
              {reason:'hired_other', label:'🔄 Hired from another source', sub:'Good to know.'},
              {reason:'not_hiring', label:'❌ No longer hiring for this role', sub:'Role has been cancelled or paused.'},
            ].map(opt => (
              <button key={opt.reason}
                className="w-full text-left p-4 rounded-2xl mb-2 border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                onClick={async() => {
                  // Delete the JD from DB
                  await fetch('/api/jds', {
                    method: 'PATCH',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({id: closingJd.id, status: 'deleted', close_reason: opt.reason})
                  })
                  setMyJds(myJds.filter(j => j.id !== closingJd.id))
                  setClosingJd(null)
                  showToast(opt.reason === 'hired_naggare' ? 'Congratulations on the hire! 🎉' : 'JD removed.', 'pursue')
                }}>
                <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{opt.sub}</p>
              </button>
            ))}
            <button className="w-full py-3 text-sm text-gray-400 mt-1" onClick={()=>setClosingJd(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-white text-sm font-semibold shadow-xl z-50 whitespace-nowrap"
          style={{ background: toastType === 'pass' ? '#374151' : toastType === 'buzzer' ? '#D97706' : '#4F46E5' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
