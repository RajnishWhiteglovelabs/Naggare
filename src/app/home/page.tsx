'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

const SAMPLE_JDS = [
  {id:1,title:'Senior Software Engineer',company:'Zepto',initials:'ZP',color:'#7C3AED',team:'Core Platform',remote:'Remote First',years:'4+',salary:'₹30–45 LPA',mustHave:['Python','Distributed Systems','AWS'],tuesday:'Own services processing 10M orders/day.',nonNeg:'4+ yrs · Python or Go · High-scale experience'},
  {id:2,title:'Global TA Leader',company:'CRED',initials:'CR',color:'#0284C7',team:'People',remote:'Hybrid',years:'10+',salary:'₹40–60 LPA',mustHave:['Global TA','Executive Hiring','TA Strategy'],tuesday:'Build the talent function from scratch. Own employer brand.',nonNeg:'10+ yrs TA · Global experience · C-suite partnering'},
  {id:3,title:'VP Finance',company:'Groww',initials:'GW',color:'#16A34A',team:'Finance',remote:'Onsite',years:'12+',salary:'₹60–90 LPA',mustHave:['FP&A','Financial Modelling','Team Leadership'],tuesday:'Own P&L reporting, investor relations, fundraising support.',nonNeg:'CA / MBA Finance · 12+ yrs · Listed company experience preferred'},
  {id:4,title:'ML Engineer',company:'Sarvam AI',initials:'SA',color:'#EA580C',team:'Foundation Models',remote:'Remote First',years:'3+',salary:'₹25–45 LPA',mustHave:['PyTorch','LLMs','Python'],tuesday:'Train and fine-tune models for Indian language understanding.',nonNeg:'3+ yrs ML · PyTorch proficiency · Published work preferred'},
]

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'home'|'browse'|'profile'>('home')
  const [swipedLeft, setSwipedLeft] = useState<Set<number>>(new Set())
  const [swipedRight, setSwipedRight] = useState<Set<number>>(new Set())
  const [toast, setToast] = useState('')
  const [welcomeBanner, setWelcomeBanner] = useState(false)

  useEffect(() => {
    async function loadUser() {
      try {
        // Try session first, fall back to localStorage email
        const { data: { session } } = await supabase.auth.getSession()
        const email = session?.user?.email || localStorage.getItem('naggare_email')

        if (!email) { router.push('/signin'); return }

        // Use service-role API to bypass RLS
        const res = await fetch('/api/me', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })

        if (res.ok) {
          const profile = await res.json()
          setUser(profile)
          // Show welcome banner briefly
          const isNewSession = !sessionStorage.getItem('naggare_welcomed')
          if (isNewSession) {
            setWelcomeBanner(true)
            sessionStorage.setItem('naggare_welcomed', '1')
            setTimeout(() => setWelcomeBanner(false), 4000)
          }
          return
        }

        // No profile found — send to registration
        router.push('/candidate/register')
      } catch {
        router.push('/signin')
      }
    }
    loadUser()
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function signOut() {
    if(!confirm('Sign out of Naggare?')) return
    await supabase.auth.signOut()
    router.push('/')
  }

  const firstName = user?.name?.split(' ')[0] || 'there'
  const initials = user?.name?.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase() || '?'
  const isCandidate = user?.type === 'candidate'

  const filteredJDs = SAMPLE_JDS.filter(jd =>
    !search || jd.title.toLowerCase().includes(search.toLowerCase()) ||
    jd.company.toLowerCase().includes(search.toLowerCase()) ||
    jd.mustHave.some(s => s.toLowerCase().includes(search.toLowerCase()))
  ).filter(jd => !swipedLeft.has(jd.id) && !swipedRight.has(jd.id))

  if(!user) return null

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>
            <span className="text-sm font-bold text-white" style={{fontFamily:'Georgia,serif'}}>N</span>
          </div>
          <span className="font-bold text-lg" style={{fontFamily:'Georgia,serif',color:'#1E1B4B'}}>Naggare</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">{firstName}</span>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer"
            style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}
            onClick={() => setView('profile')}>
            {user?.photo_url ? <img src={user.photo_url} className="w-full h-full object-cover rounded-full"/> : initials}
          </div>
          <button className="text-xs text-gray-400 hover:text-red-500" onClick={signOut}>Sign out</button>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto">
        {/* HOME VIEW */}
        {view === 'home' && (
          <>
            <div className="px-5 py-8 text-center text-white" style={{background:'linear-gradient(135deg,#1E1B4B,#312e81)'}}>
              <p className="text-xs font-semibold tracking-widest mb-2 uppercase" style={{color:'#A5B4FC'}}>Good to see you, {firstName}</p>
              <h1 className="text-xl font-bold leading-snug mb-2" style={{fontFamily:'Georgia,serif'}}>
                {isCandidate ? 'Your profile is live.\nLet the right roles find you.' : 'Your profile is live.\nFind the right talent.'}
              </h1>
              <p className="text-sm mb-6" style={{color:'#C7D2FE'}}>
                {isCandidate ? 'Swipe right on roles that excite you.' : 'Pass, Pursue or Golden Buzzer candidates.'}
              </p>
              <div className="flex gap-3 justify-center">
                <div className="flex-1 max-w-36 p-3 rounded-2xl cursor-pointer border border-white/20 text-left" 
                  style={{background:'rgba(255,255,255,0.1)'}} onClick={() => setView('profile')}>
                  <div className="text-2xl mb-1">👤</div>
                  <div className="text-sm font-bold text-white">My Profile</div>
                  <div className="text-xs" style={{color:'#A5B4FC'}}>View & edit</div>
                </div>
                <div className="flex-1 max-w-36 p-3 rounded-2xl cursor-pointer border border-white/20 text-left"
                  style={{background:'rgba(255,255,255,0.1)'}} onClick={() => setView('browse')}>
                  <div className="text-2xl mb-1">{isCandidate ? '📋' : '👥'}</div>
                  <div className="text-sm font-bold text-white">{isCandidate ? 'Browse JDs' : 'Browse Candidates'}</div>
                  <div className="text-xs" style={{color:'#A5B4FC'}}>Find your match</div>
                </div>
              </div>
            </div>

            <div className="px-5 py-5">
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[['10','JDs live','#4F46E5'],['40','Candidates','#16A34A'],['3','Matches','#7C3AED']].map(([n,l,c]) => (
                  <div key={l} className="card p-3 text-center">
                    <div className="text-xl font-bold" style={{color:c}}>{n}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{l}</div>
                  </div>
                ))}
              </div>

              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Featured roles</p>
              {SAMPLE_JDS.slice(0,2).map(jd => (
                <div key={jd.id} className="card mb-3">
                  <div className="p-4">
                    <div className="flex gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{background:jd.color}}>{jd.initials}</div>
                      <div>
                        <p className="font-bold text-gray-900">{jd.title}</p>
                        <p className="text-sm font-semibold" style={{color:jd.color}}>{jd.company}</p>
                        <p className="text-xs text-gray-500">{jd.team}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="tag-green tag">🌏 {jd.remote}</span>
                      <span className="tag">{jd.years} yrs</span>
                      <span className="tag" style={{background:'#F9FAFB',color:'#4B5563',borderColor:'#E5E7EB'}}>{jd.salary}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 px-4 pb-4">
                    <button className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-500 hover:border-red-400 hover:text-red-500 transition-all" onClick={() => { setSwipedLeft(prev => new Set([...prev,jd.id])); showToast('Passed') }}>← Not Interested</button>
                    <button className="flex-1 py-2.5 rounded-full text-white text-sm font-semibold transition-all" style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}} onClick={() => { setSwipedRight(prev => new Set([...prev,jd.id])); showToast('✓ Interested! Recruiter notified.') }}>Interested →</button>
                  </div>
                </div>
              ))}
              <button className="w-full py-3 rounded-xl text-sm font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 mt-1" onClick={() => setView('browse')}>View all JDs →</button>
            </div>
          </>
        )}

        {/* BROWSE VIEW */}
        {view === 'browse' && (
          <div className="px-5 py-5">
            <div className="flex items-center gap-3 mb-4">
              <button className="text-2xl text-indigo-600" onClick={() => setView('home')}>‹</button>
              <h2 className="text-lg font-bold">Browse JDs</h2>
            </div>
            <div className="relative mb-4">
              <input className="input pl-10" placeholder="Search roles, companies, skills..."
                value={search} onChange={e => setSearch(e.target.value)}/>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">{filteredJDs.length} role{filteredJDs.length!==1?'s':''} {search?'found':'available'}</p>
            {filteredJDs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-semibold text-gray-700">No roles found</p>
                <p className="text-sm text-gray-500 mt-1">Try a different search</p>
              </div>
            )}
            {filteredJDs.map(jd => (
              <div key={jd.id} className="card mb-4">
                <div className="p-4">
                  <div className="flex gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{background:jd.color}}>{jd.initials}</div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-base">{jd.title}</p>
                      <p className="text-sm font-semibold" style={{color:jd.color}}>{jd.company}</p>
                      <p className="text-xs text-gray-500">{jd.team}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className="tag-green tag">🌏 {jd.remote}</span>
                    <span className="tag">{jd.years} yrs</span>
                    <span className="tag" style={{background:'#F9FAFB',color:'#4B5563',borderColor:'#E5E7EB'}}>{jd.salary}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">{jd.mustHave.map(s=><span key={s} className="tag">{s}</span>)}</div>
                  {jd.tuesday && <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2"><strong>📅 Real Tuesday:</strong> {jd.tuesday}</div>}
                </div>
                <div className="flex gap-2 px-4 pb-4">
                  <button className="flex-1 py-3 rounded-full border border-gray-200 text-sm font-semibold text-gray-500 hover:border-red-400 hover:text-red-500 transition-all" onClick={() => { setSwipedLeft(prev => new Set([...prev,jd.id])); showToast('Passed') }}>← Not Interested</button>
                  <button className="flex-1 py-3 rounded-full text-white text-sm font-semibold" style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}} onClick={() => { setSwipedRight(prev => new Set([...prev,jd.id])); showToast('✓ Interested! Recruiter notified.') }}>Interested →</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PROFILE VIEW */}
        {view === 'profile' && (
          <div>
            <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-100 sticky top-14 z-10">
              <button className="text-2xl text-indigo-600" onClick={() => setView('home')}>‹</button>
              <h2 className="text-base font-bold">My Profile</h2>
              <button className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-full" style={{background:'#EEF2FF',color:'#4F46E5',border:'0.5px solid #C7D2FE'}} onClick={() => showToast('Profile link copied! Share naggare.com 🔗')}>Share 🔗</button>
            </div>
            <div className="p-5">
              <div className="card mb-4">
                <div className="p-4" style={{background:'#EEF2FF',borderBottom:'0.5px solid #C7D2FE'}}>
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-white shadow-md flex-shrink-0" style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>{initials}</div>
                    <div>
                      <p className="text-lg font-bold" style={{color:'#3730A3'}}>{user.name}</p>
                      <p className="text-sm font-semibold text-indigo-600">{user.title}</p>
                      <p className="text-xs text-gray-500">{user.company}{user.city?` · ${user.city}`:''}</p>
                      {user.domain && <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(79,70,229,0.1)',color:'#4F46E5'}}>{user.domain}</span>}
                    </div>
                  </div>
                </div>
                {user.career?.filter((c:any)=>c.org).length > 0 && (
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Career Journey</p>
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {user.career.filter((c:any)=>c.org).map((c:any,i:number) => (
                        <div key={i} className="flex flex-col items-center min-w-16">
                          <div className={`rounded-full border-2 border-white mb-1 ${i===0?'w-3 h-3':'w-2 h-2'}`} style={{background:'#4F46E5',boxShadow:i===0?'0 0 0 3px rgba(79,70,229,0.2)':''}}></div>
                          <p className="text-xs font-bold text-center" style={{color:i===0?'#4F46E5':'#111827'}}>{c.org}</p>
                          <p className="text-xs text-gray-500 text-center">{c.role}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {user.looking_for && (
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">What I'm Looking For</p>
                    <p className="text-sm text-gray-900 leading-relaxed">{user.looking_for}</p>
                  </div>
                )}
                {user.skills?.length > 0 && (
                  <div className="p-4">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Skills · {user.skills.length}</p>
                    <div className="flex flex-wrap gap-1">{user.skills.map((s:string)=><span key={s} className="tag">{s}</span>)}</div>
                  </div>
                )}
              </div>
              <button className="btn-outline py-3 text-sm" onClick={() => router.push('/candidate/register')}>✏️ Edit profile</button>
            </div>
          </div>
        )}
      </div>

      {/* Welcome banner */}
      {welcomeBanner && (
        <div className="fixed top-14 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between shadow-lg"
          style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-white text-sm font-semibold shadow-xl z-50 whitespace-nowrap"
          style={{background:'#1E1B4B'}}>
          {toast}
        </div>
      )}
    </div>
  )
}
