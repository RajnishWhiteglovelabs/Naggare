'use client'
// build-fix-v2
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

const jds: any[] = [] // replaced by real JDs from DB

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [jds, setJds] = useState<any[]>([])
  const [view, setView] = useState<'home'|'browse'|'profile'>('home')
  const [search, setSearch] = useState('')
  const [swipedLeft, setSwipedLeft] = useState<Set<number>>(new Set())
  const [swipedRight, setSwipedRight] = useState<Set<number>>(new Set())
  const [toast, setToast] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [welcomeBanner, setWelcomeBanner] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.email) { router.push('/signin'); return }
        const res = await fetch('/api/me', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: session.user.email }),
        })
        if (res.ok) {
          const profile = await res.json()
          if (profile.type === 'recruiter') { router.push('/recruiter/home'); return }
          setUser(profile)
          // Load metrics
          fetch('/api/candidate/metrics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: session.user.email }) })
            .then(r => r.json()).then(setMetrics).catch(() => {})

          // Load real JDs
          const jdRes = await fetch('/api/jds')
          if (jdRes.ok) {
            const jdData = await jdRes.json()
            setJds(jdData)
          }
          if (!sessionStorage.getItem('naggare_welcomed')) {
            setWelcomeBanner(true)
            sessionStorage.setItem('naggare_welcomed', '1')
            setTimeout(() => setWelcomeBanner(false), 4000)
          }
        } else {
          router.push('/candidate/register')
        }
      } catch {
        router.push('/signin')
      }
    }
    load()
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function signOut() {
    if (!confirm('Sign out of Naggare?')) return
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) return null

  const firstName = user?.name?.split(' ')[0] || 'there'
  const initials = user?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  const prompts = [
    user?.prompt_1_q ? { q: user.prompt_1_q, a: user.prompt_1_a } : null,
    user?.prompt_2_q ? { q: user.prompt_2_q, a: user.prompt_2_a } : null,
    user?.prompt_3_q ? { q: user.prompt_3_q, a: user.prompt_3_a } : null,
  ].filter(Boolean) as { q: string; a: string }[]

  function formatDate(d: string) {
    if (!d) return ''
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const parts = d.split('-')
    if (parts.length === 2) return `${months[parseInt(parts[1])-1] || ''} ${parts[0]}`
    return parts[0]
  }

  const filteredJDs = jds
    .filter(jd => !swipedLeft.has(jd.id) && !swipedRight.has(jd.id))
    .filter(jd => !search || jd.title.toLowerCase().includes(search.toLowerCase()) ||
      jd.company.toLowerCase().includes(search.toLowerCase()) ||
      (jd.must_have_skills || []).some((s: string) => s.toLowerCase().includes(search.toLowerCase())))

  return (
    <>

      {/* NAV */}
      <nav className="bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
            <span className="text-sm font-bold text-white" style={{ fontFamily: 'Georgia,serif' }}>N</span>
          </div>
          <span className="font-bold text-lg" style={{ fontFamily: 'Georgia,serif', color: '#1E1B4B' }}>Naggare</span>
        </div>

        <div className="flex items-center gap-2 relative">
          <span className="text-sm font-semibold text-gray-600 hidden sm:block">{firstName}</span>
          <div
            className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-bold cursor-pointer flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}
            onClick={() => setMenuOpen(prev => !prev)}
          >
            {user?.photo_url
              ? <img src={user.photo_url} className="w-full h-full object-cover" alt={firstName} />
              : <span className="text-xs font-bold">{initials}</span>}
          </div>

          {/* Dropdown */}
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl shadow-2xl overflow-hidden bg-white border border-gray-100">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
                </div>
                {[
                  { icon: '🏠', label: 'Home', action: () => { setView('home'); setMenuOpen(false) } },
                  { icon: '✏️', label: 'Edit Profile', action: () => { router.push('/candidate/register?edit=true'); setMenuOpen(false) } },
                  { icon: '⚙️', label: 'Account Settings', action: () => { router.push('/account-settings'); setMenuOpen(false) } },
                  { icon: '💬', label: 'Feedback', action: () => { router.push('/feedback'); setMenuOpen(false) } },
                  { icon: '⭐', label: 'Get Naggare Score', action: () => { router.push('/candidate/edna'); setMenuOpen(false) } },
                ].map(item => (
                  <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-left" onClick={item.action}>
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

        {/* HOME VIEW */}
        {view === 'home' && (
          <>
            <div className="px-5 py-8 text-center text-white" style={{ background: 'linear-gradient(135deg,#1E1B4B,#312e81)' }}>
              <p className="text-xs font-semibold tracking-widest mb-2 uppercase" style={{ color: '#A5B4FC' }}>Good to see you, {firstName}</p>
              <h1 className="text-xl font-bold leading-snug mb-2" style={{ fontFamily: 'Georgia,serif' }}>Your profile is live.<br />Let the right roles find you.</h1>
              <p className="text-sm mb-6" style={{ color: '#C7D2FE' }}>Tap on roles that excite you.</p>
              <div className="flex gap-3 justify-center max-w-xs mx-auto">
                <div className="flex-1 p-3 rounded-2xl cursor-pointer border border-white/20 text-left" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => setView('profile')}>
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold mb-1 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    {user?.photo_url ? <img src={user.photo_url} className="w-full h-full object-cover" alt={firstName} /> : <span className="text-xs font-bold">{initials}</span>}
                  </div>
                  <div className="text-sm font-bold text-white">My Profile</div>
                  <div className="text-xs" style={{ color: '#A5B4FC' }}>View & edit</div>
                </div>
                <div className="flex-1 p-3 rounded-2xl cursor-pointer border border-white/20 text-left" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => setView('browse')}>
                  <div className="text-2xl mb-1">📋</div>
                  <div className="text-sm font-bold text-white">Browse JDs</div>
                  <div className="text-xs" style={{ color: '#A5B4FC' }}>Find your match</div>
                </div>
                <div className="rounded-2xl p-4 cursor-pointer" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => router.push('/candidate/inbox')}>
                  <div className="text-2xl mb-1">💬</div>
                  <div className="text-sm font-bold text-white">Inbox</div>
                  <div className="text-xs" style={{ color: '#A5B4FC' }}>Your chats</div>
                </div>
              </div>
            </div>

            <div className="px-4 py-4 max-w-2xl mx-auto">
              {/* Activity metrics */}
              {metrics && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider mb-3 px-1" style={{color:'#4F46E5'}}>Your Activity</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <p className="text-xs text-gray-400 mb-1">Profile Views</p>
                      <p className="text-2xl font-bold" style={{color:'#4F46E5'}}>{metrics.totalViews}</p>
                      <p className="text-xs text-gray-400">+{metrics.viewsThisWeek} this week</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <p className="text-xs text-gray-400 mb-1">Roles Interested</p>
                      <p className="text-2xl font-bold" style={{color:'#7C3AED'}}>{metrics.totalInterests}</p>
                      <p className="text-xs text-gray-400">JDs you tapped Interested</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <p className="text-xs text-gray-400 mb-1">Active Chats</p>
                      <p className="text-2xl font-bold" style={{color:'#15803D'}}>{metrics.activeChats}</p>
                      <p className="text-xs text-gray-400">{metrics.totalChats} total conversations</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <p className="text-xs text-gray-400 mb-1">Response Rate</p>
                      <p className="text-2xl font-bold" style={{color:'#C2410C'}}>{metrics.responseRate}%</p>
                      <p className="text-xs text-gray-400">Recruiters who replied</p>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Featured roles</p>
              {jds.length === 0 && (
                <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                  <div className="text-3xl mb-2">📋</div>
                  <p className="text-sm font-semibold text-gray-600">No JDs yet</p>
                  <p className="text-xs text-gray-400 mt-1">Recruiters are posting roles — check back soon</p>
                </div>
              )}
              {jds.slice(0, 2).map(jd => {
                const co = jd.company || 'Company'
                const ini = co.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()
                return (
                <div key={jd.id} className="bg-white rounded-3xl mb-4 shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-4" style={{background:'#EEF2FF',borderBottom:'0.5px solid #C7D2FE'}}>
                    <div className="flex flex-wrap gap-1 mb-3">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{background:'#4F46E5',color:'white'}}>Technology</span>
                      {jd.work_style && <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{background:'#ECFDF5',color:'#065F46',border:'1px solid #6EE7B7'}}>{jd.work_style}</span>}
                    </div>
                    <div className="flex gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>{ini}</div>
                      <div>
                        <p className="font-bold text-lg" style={{color:'#1E1B4B'}}>{jd.title}</p>
                        <p className="text-sm font-semibold text-indigo-600">{co}</p>
                        <p className="text-xs text-gray-500">{jd.team}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {jd.min_years > 0 && <span className="tag">{jd.min_years}{jd.max_years > 0 ? `–${jd.max_years}` : '+'} yrs</span>}
                      {(jd.must_have_skills||[]).slice(0,2).length > 0 && <span className="tag">{(jd.must_have_skills||[]).slice(0,2).join(' · ')}{(jd.must_have_skills||[]).length > 2 ? ` +${(jd.must_have_skills||[]).length-2}` : ''}</span>}
                      {jd.city && <span className="tag">{jd.city}</span>}
                      {jd.salary_range && <span className="tag" style={{background:'#F9FAFB',color:'#374151',borderColor:'#E5E7EB'}}>{jd.salary_range}</span>}
                    </div>
                  </div>
                  {jd.show_tracks !== false && (jd.ic_track||[]).length > 0 && (
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4">Where This Role Takes You</p>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">⚡ IC Track</p>
                      <div className="overflow-x-auto pb-2 mb-4">
                        <div className="flex items-start relative" style={{minWidth:'max-content'}}>
                          <div className="absolute top-2 left-2 right-2 h-px bg-gray-200" />
                          {(jd.ic_track||[]).map((role:string,i:number)=>(
                            <div key={i} className="flex flex-col items-center" style={{minWidth:'80px',zIndex:1}}>
                              <div className="w-4 h-4 rounded-full border-2 mb-1" style={{background:i<=(jd.ic_current||1)?'#4F46E5':'white',borderColor:i<=(jd.ic_current||1)?'#4F46E5':'#D1D5DB'}} />
                              <p className="text-xs font-semibold text-center px-1 leading-tight" style={{color:i===(jd.ic_current||1)?'#4F46E5':'#6B7280'}}>
                                {role}{i===(jd.ic_current||1)&&<span className="block text-indigo-400 font-normal">← Here</span>}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {(jd.mgmt_track||[]).length > 0 && (<>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">👥 Management Track</p>
                        <div className="overflow-x-auto pb-2">
                          <div className="flex items-start relative" style={{minWidth:'max-content'}}>
                            <div className="absolute top-2 left-2 right-2 h-px bg-gray-200" />
                            {(jd.mgmt_track||[]).map((role:string,i:number)=>(
                              <div key={i} className="flex flex-col items-center" style={{minWidth:'80px',zIndex:1}}>
                                <div className="w-4 h-4 rounded-full border-2 mb-1" style={{background:i<=(jd.mgmt_current||0)?'#7C3AED':'white',borderColor:i<=(jd.mgmt_current||0)?'#7C3AED':'#D1D5DB'}} />
                                <p className="text-xs font-semibold text-center px-1 leading-tight" style={{color:i===(jd.mgmt_current||0)?'#7C3AED':'#6B7280'}}>
                                  {role}{i===(jd.mgmt_current||0)&&<span className="block text-purple-400 font-normal">← Start</span>}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>)}
                    </div>
                  )}
                  {((jd.must_have_skills||[]).length > 0 || (jd.good_to_have_skills||[]).length > 0) && (
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Skills &amp; Tech Stack</p>
                      <div className="flex flex-wrap gap-1">
                        {(jd.must_have_skills||[]).map((s:string)=><span key={s} className="tag" style={{background:'#EEF2FF',color:'#4338CA',borderColor:'#C7D2FE'}}>{s}</span>)}
                        {(jd.good_to_have_skills||[]).map((s:string)=><span key={s} className="tag" style={{background:'#F9FAFB',color:'#6B7280',borderColor:'#E5E7EB'}}>{s}</span>)}
                      </div>
                    </div>
                  )}
                  {jd.non_negotiables && (
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">What We Won’t Compromise On</p>
                      <div className="p-3 rounded-xl" style={{background:'#FFF1F2',border:'0.5px solid #FECDD3'}}>
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Non Negotiables</p>
                        {jd.non_negotiables.split('\n').filter((l:string)=>l.trim()).map((line:string,i:number)=>(
                          <p key={i} className="text-sm text-gray-900 flex gap-2 mb-1"><span className="text-red-500">●</span>{line.trim()}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {jd.real_tuesday && (
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">What a Real Tuesday Looks Like</p>
                      <p className="text-sm text-gray-900 leading-relaxed">{jd.real_tuesday}</p>
                    </div>
                  )}
                  {(jd.interview_steps||[]).some((s:any)=>s.title) && (
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Interview Process — No Surprises</p>
                      {(jd.interview_steps||[]).filter((s:any)=>s.title).map((step:any,i:number)=>{
                        const cols=['#4F46E5','#7C3AED','#2563EB','#D97706','#111827']
                        return (
                          <div key={i} className="mb-3 last:mb-0">
                            <div className="flex gap-3 items-start mb-1">
                              <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-white text-xs font-bold" style={{background:cols[i%5]}}>{i+1}</div>
                              <div><span className="text-sm font-bold text-gray-900">{step.title}</span>{step.duration&&<span className="text-xs text-gray-400 ml-2">· {step.duration}</span>}</div>
                            </div>
                            {step.competencies&&<div className="ml-8 flex flex-wrap gap-1 mt-1">{step.competencies.split('·').map((c:string)=>c.trim()).filter((c:string)=>c).map((comp:string,j:number)=><span key={j} className="px-2 py-0.5 rounded-full text-xs border border-gray-200 text-gray-500 bg-gray-50">{comp}</span>)}</div>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <div className="flex gap-2 p-4">
                    <button className="flex-1 py-3 rounded-full border border-gray-200 text-sm font-semibold text-gray-500" onClick={()=>{setSwipedLeft(prev=>new Set([...prev,jd.id]));showToast('Passed')}}>Not Interested</button>
                    <button className="flex-1 py-3 rounded-full text-white text-sm font-semibold" style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}} onClick={()=>{ setSwipedRight(prev=>new Set([...prev,jd.id]));
                      fetch('/api/track/jd-interest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidate_email: user?.email, jd_id: jd.id }) }).catch(()=>{});
                      const params = new URLSearchParams({ jd_id: jd.id, recruiter_email: jd.recruiter_email||'', jd_title: jd.title||'', recruiter_name: jd.recruiter_name||'' }); router.push('/candidate/chat?'+params.toString()) }}>Interested →</button>
                  </div>
                </div>
                )
              })}
              <button className="w-full py-3 rounded-xl text-sm font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50" onClick={() => setView('browse')}>View all JDs →</button>
            </div>

          </>
        )}

        {/* BROWSE VIEW */}
        {view === 'browse' && (
          <div className="px-4 py-5 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <button className="text-2xl text-indigo-600" onClick={() => setView('home')}>‹</button>
              <h2 className="text-lg font-bold">Browse JDs</h2>
            </div>
            <div className="relative mb-4">
              <input className="input pl-10" placeholder="Search roles, companies, skills..." value={search} onChange={e => setSearch(e.target.value)} />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">{filteredJDs.length} role{filteredJDs.length !== 1 ? 's' : ''} {search ? 'found' : 'available'}</p>
            {filteredJDs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-semibold text-gray-700">No roles found</p>
                <p className="text-sm text-gray-500 mt-1">Try a different search</p>
              </div>
            )}
            {filteredJDs.map(jd => {
                const co = jd.company || 'Company'
                const ini = co.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()
                return (
                <div key={jd.id} className="bg-white rounded-3xl mb-4 shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-4" style={{background:'#EEF2FF',borderBottom:'0.5px solid #C7D2FE'}}>
                    <div className="flex flex-wrap gap-1 mb-3">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{background:'#4F46E5',color:'white'}}>Technology</span>
                      {jd.work_style && <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{background:'#ECFDF5',color:'#065F46',border:'1px solid #6EE7B7'}}>{jd.work_style}</span>}
                    </div>
                    <div className="flex gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>{ini}</div>
                      <div>
                        <p className="font-bold text-lg" style={{color:'#1E1B4B'}}>{jd.title}</p>
                        <p className="text-sm font-semibold text-indigo-600">{co}</p>
                        <p className="text-xs text-gray-500">{jd.team}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {jd.min_years > 0 && <span className="tag">{jd.min_years}{jd.max_years > 0 ? `–${jd.max_years}` : '+'} yrs</span>}
                      {(jd.must_have_skills||[]).slice(0,2).length > 0 && <span className="tag">{(jd.must_have_skills||[]).slice(0,2).join(' · ')}{(jd.must_have_skills||[]).length > 2 ? ` +${(jd.must_have_skills||[]).length-2}` : ''}</span>}
                      {jd.city && <span className="tag">{jd.city}</span>}
                      {jd.salary_range && <span className="tag" style={{background:'#F9FAFB',color:'#374151',borderColor:'#E5E7EB'}}>{jd.salary_range}</span>}
                    </div>
                  </div>
                  {jd.show_tracks !== false && (jd.ic_track||[]).length > 0 && (
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4">Where This Role Takes You</p>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">⚡ IC Track</p>
                      <div className="overflow-x-auto pb-2 mb-4">
                        <div className="flex items-start relative" style={{minWidth:'max-content'}}>
                          <div className="absolute top-2 left-2 right-2 h-px bg-gray-200" />
                          {(jd.ic_track||[]).map((role:string,i:number)=>(
                            <div key={i} className="flex flex-col items-center" style={{minWidth:'80px',zIndex:1}}>
                              <div className="w-4 h-4 rounded-full border-2 mb-1" style={{background:i<=(jd.ic_current||1)?'#4F46E5':'white',borderColor:i<=(jd.ic_current||1)?'#4F46E5':'#D1D5DB'}} />
                              <p className="text-xs font-semibold text-center px-1 leading-tight" style={{color:i===(jd.ic_current||1)?'#4F46E5':'#6B7280'}}>
                                {role}{i===(jd.ic_current||1)&&<span className="block text-indigo-400 font-normal">← Here</span>}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {(jd.mgmt_track||[]).length > 0 && (<>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">👥 Management Track</p>
                        <div className="overflow-x-auto pb-2">
                          <div className="flex items-start relative" style={{minWidth:'max-content'}}>
                            <div className="absolute top-2 left-2 right-2 h-px bg-gray-200" />
                            {(jd.mgmt_track||[]).map((role:string,i:number)=>(
                              <div key={i} className="flex flex-col items-center" style={{minWidth:'80px',zIndex:1}}>
                                <div className="w-4 h-4 rounded-full border-2 mb-1" style={{background:i<=(jd.mgmt_current||0)?'#7C3AED':'white',borderColor:i<=(jd.mgmt_current||0)?'#7C3AED':'#D1D5DB'}} />
                                <p className="text-xs font-semibold text-center px-1 leading-tight" style={{color:i===(jd.mgmt_current||0)?'#7C3AED':'#6B7280'}}>
                                  {role}{i===(jd.mgmt_current||0)&&<span className="block text-purple-400 font-normal">← Start</span>}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>)}
                    </div>
                  )}
                  {((jd.must_have_skills||[]).length > 0 || (jd.good_to_have_skills||[]).length > 0) && (
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Skills &amp; Tech Stack</p>
                      <div className="flex flex-wrap gap-1">
                        {(jd.must_have_skills||[]).map((s:string)=><span key={s} className="tag" style={{background:'#EEF2FF',color:'#4338CA',borderColor:'#C7D2FE'}}>{s}</span>)}
                        {(jd.good_to_have_skills||[]).map((s:string)=><span key={s} className="tag" style={{background:'#F9FAFB',color:'#6B7280',borderColor:'#E5E7EB'}}>{s}</span>)}
                      </div>
                    </div>
                  )}
                  {jd.non_negotiables && (
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">What We Won’t Compromise On</p>
                      <div className="p-3 rounded-xl" style={{background:'#FFF1F2',border:'0.5px solid #FECDD3'}}>
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Non Negotiables</p>
                        {jd.non_negotiables.split('\n').filter((l:string)=>l.trim()).map((line:string,i:number)=>(
                          <p key={i} className="text-sm text-gray-900 flex gap-2 mb-1"><span className="text-red-500">●</span>{line.trim()}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {jd.real_tuesday && (
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">What a Real Tuesday Looks Like</p>
                      <p className="text-sm text-gray-900 leading-relaxed">{jd.real_tuesday}</p>
                    </div>
                  )}
                  {(jd.interview_steps||[]).some((s:any)=>s.title) && (
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Interview Process — No Surprises</p>
                      {(jd.interview_steps||[]).filter((s:any)=>s.title).map((step:any,i:number)=>{
                        const cols=['#4F46E5','#7C3AED','#2563EB','#D97706','#111827']
                        return (
                          <div key={i} className="mb-3 last:mb-0">
                            <div className="flex gap-3 items-start mb-1">
                              <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-white text-xs font-bold" style={{background:cols[i%5]}}>{i+1}</div>
                              <div><span className="text-sm font-bold text-gray-900">{step.title}</span>{step.duration&&<span className="text-xs text-gray-400 ml-2">· {step.duration}</span>}</div>
                            </div>
                            {step.competencies&&<div className="ml-8 flex flex-wrap gap-1 mt-1">{step.competencies.split('·').map((c:string)=>c.trim()).filter((c:string)=>c).map((comp:string,j:number)=><span key={j} className="px-2 py-0.5 rounded-full text-xs border border-gray-200 text-gray-500 bg-gray-50">{comp}</span>)}</div>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <div className="flex gap-2 p-4">
                    <button className="flex-1 py-3 rounded-full border border-gray-200 text-sm font-semibold text-gray-500" onClick={()=>{setSwipedLeft(prev=>new Set([...prev,jd.id]));showToast('Passed')}}>Not Interested</button>
                    <button className="flex-1 py-3 rounded-full text-white text-sm font-semibold" style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}} onClick={()=>{ setSwipedRight(prev=>new Set([...prev,jd.id]));
                      fetch('/api/track/jd-interest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidate_email: user?.email, jd_id: jd.id }) }).catch(()=>{});
                      const params = new URLSearchParams({ jd_id: jd.id, recruiter_email: jd.recruiter_email||'', jd_title: jd.title||'', recruiter_name: jd.recruiter_name||'' }); router.push('/candidate/chat?'+params.toString()) }}>Interested →</button>
                  </div>
                </div>
                )
              })}
          </div>
        )}

                {/* PROFILE VIEW */}
        {view === 'profile' && (
          <div className="min-h-screen" style={{background:'#f5f5f5'}}>
            {/* Sticky top bar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-14 z-10">
              <button className="text-2xl text-indigo-600" onClick={() => setView('home')}>‹</button>
              <h2 className="text-base font-bold">My Profile</h2>
              <button className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{background:'#EEF2FF',color:'#4F46E5',border:'0.5px solid #C7D2FE'}}
                onClick={() => showToast('Share naggare.com 🔗')}>Share 🔗</button>
            </div>

            {/* Bumble-style card */}
            <div style={{maxWidth:'420px',margin:'0 auto',paddingBottom:'80px'}}>

              {/* Full-bleed photo hero */}
              <div className="relative" style={{height:'480px',background:'linear-gradient(160deg,#4F46E5,#7C3AED)'}}>
                {user?.photo_url && (
                  <img src={user.photo_url} className="absolute inset-0 w-full h-full object-cover" alt={user.name} />
                )}
                {/* Gradient overlay at bottom */}
                <div className="absolute inset-0" style={{background:'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)'}} />
                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-3xl font-bold text-white mb-1" style={{fontFamily:'Georgia,serif',textShadow:'0 2px 8px rgba(0,0,0,0.4)'}}>{user.name}</p>
                  <p className="text-base font-semibold mb-0.5" style={{color:'rgba(255,255,255,0.9)'}}>{user.title}</p>
                  <p className="text-sm" style={{color:'rgba(255,255,255,0.7)'}}>{user.company}{user.city ? ' · ' + user.city : ''}</p>
                  {user.domain && (
                    <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold text-white" style={{background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)',border:'0.5px solid rgba(255,255,255,0.3)'}}>
                      {user.domain}
                    </span>
                  )}
                </div>
                {/* No photo placeholder */}
                {!user?.photo_url && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-3" style={{background:'rgba(255,255,255,0.2)'}}>
                      {initials}
                    </div>
                    <p className="text-white text-sm opacity-70">Add a photo to complete your profile</p>
                  </div>
                )}
              </div>

              {/* Scrollable sections below photo */}
              <div className="bg-white mx-4 rounded-3xl shadow-lg overflow-hidden" style={{marginTop:'-24px',position:'relative',zIndex:1}}>

                {/* Career */}
                {user.career?.filter((c:any)=>c.org).length > 0 && (
                  <div className="p-5 border-b border-gray-100">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Career Journey</p>
                    <div className="relative">
                      <div id="career-scroll" className="flex gap-5 overflow-x-auto pb-1" style={{scrollbarWidth:'none'}}>
                        {user.career.filter((c:any)=>c.org).map((c:any,i:number) => (
                          <div key={i} className="flex flex-col items-center flex-shrink-0" style={{minWidth:'64px'}}>
                            <div className={`rounded-full mb-1.5 ${i===0?'w-3 h-3':'w-2 h-2'}`} style={{background:'#4F46E5',boxShadow:i===0?'0 0 0 3px rgba(79,70,229,0.2)':''}}></div>
                            <p className="text-xs font-bold text-center leading-tight" style={{color:i===0?'#4F46E5':'#111827'}}>{c.org}</p>
                            <p className="text-xs text-center leading-tight text-gray-400">{c.role}</p>
                            {(c.from||c.to) && <p className="text-center leading-tight" style={{fontSize:'10px',color:'#9CA3AF'}}>{formatDate(c.from)}{c.from&&c.to?' – ':''}{formatDate(c.to)}</p>}
                          </div>
                        ))}
                      </div>
                      {/* Fade + arrow indicators */}
                      <div className="absolute top-0 left-0 h-full pointer-events-none flex items-center" style={{width:'24px',background:'linear-gradient(to left, transparent, white)'}}>
                        <span style={{color:'#4F46E5',fontSize:'14px',fontWeight:'600',lineHeight:1}}>‹</span>
                      </div>
                      <div className="absolute top-0 right-0 h-full pointer-events-none flex items-center justify-end" style={{width:'24px',background:'linear-gradient(to right, transparent, white)'}}>
                        <span style={{color:'#4F46E5',fontSize:'14px',fontWeight:'600',lineHeight:1}}>›</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills */}
                {user.skills?.length > 0 && (
                  <div className="p-5">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Skills · {user.skills.length}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {user.skills.map((s:string) => <span key={s} className="tag">{s}</span>)}
                    </div>
                  </div>
                )}

                {/* Looking for */}
                {user.looking_for && (
                  <div className="p-5 border-b border-gray-100">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">What I'm Looking For</p>
                    <p className="text-sm leading-relaxed text-gray-800">{user.looking_for}</p>
                  </div>
                )}

                {/* Prompts */}
                {prompts.filter(p=>p.a?.trim()).length > 0 && (
                  <div className="border-b border-gray-100">
                    <div className="px-5 pt-5 pb-1">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">In My Own Words</p>
                    </div>
                    <div className="px-5 pb-5">
                      {prompts.filter(p=>p.a?.trim()).map((p,i) => (
                        <div key={i} className="mt-4 p-4 rounded-2xl" style={{background:'#EEF2FF',border:'0.5px solid #C7D2FE'}}>
                          <p className="text-xs font-bold mb-2" style={{color:'#3730A3'}}>{p.q}</p>
                          <p className="text-sm leading-relaxed text-gray-800">{p.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Edit button */}
              <div className="px-4 mt-5">
                <button className="btn-outline py-3 text-sm w-full" onClick={() => router.push('/candidate/register?edit=true')}>✏️ Edit profile</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Welcome banner */}
      {welcomeBanner && (
        <div className="fixed top-14 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between shadow-lg" style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>
          <div className="flex items-center gap-3">
            <span className="text-xl">👋</span>
            <div>
              <div className="text-white text-sm font-semibold">Welcome back, {firstName}!</div>
              <div className="text-xs" style={{color:'#C7D2FE'}}>Your Naggare profile is active.</div>
            </div>
          </div>
          <button onClick={() => setWelcomeBanner(false)} className="text-white opacity-60 hover:opacity-100 text-lg">✕</button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-white text-sm font-semibold shadow-xl z-50 whitespace-nowrap" style={{background:'#1E1B4B'}}>
          {toast}
        </div>
      )}
    </>
  )
}