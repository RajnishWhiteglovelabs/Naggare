'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

const SAMPLE_JDS = [
  {id:1,title:'Senior Software Engineer',company:'Zepto',initials:'ZP',color:'#7C3AED',team:'Core Platform',remote:'Remote First',years:'4+',salary:'₹30–45 LPA',mustHave:['Python','Distributed Systems','AWS'],tuesday:'Own services processing 10M orders/day.'},
  {id:2,title:'Global TA Leader',company:'CRED',initials:'CR',color:'#0284C7',team:'People',remote:'Hybrid',years:'10+',salary:'₹40–60 LPA',mustHave:['Global TA','Executive Hiring','TA Strategy'],tuesday:'Build the talent function from scratch. Own employer brand.'},
  {id:3,title:'VP Finance',company:'Groww',initials:'GW',color:'#16A34A',team:'Finance',remote:'Onsite',years:'12+',salary:'₹60–90 LPA',mustHave:['FP&A','Financial Modelling','Team Leadership'],tuesday:'Own P&L reporting, investor relations, fundraising support.'},
  {id:4,title:'ML Engineer',company:'Sarvam AI',initials:'SA',color:'#EA580C',team:'Foundation Models',remote:'Remote First',years:'3+',salary:'₹25–45 LPA',mustHave:['PyTorch','LLMs','Python'],tuesday:'Train and fine-tune models for Indian language understanding.'},
]

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [view, setView] = useState<'home'|'browse'|'profile'>('home')
  const [search, setSearch] = useState('')
  const [swipedLeft, setSwipedLeft] = useState<Set<number>>(new Set())
  const [swipedRight, setSwipedRight] = useState<Set<number>>(new Set())
  const [toast, setToast] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [welcomeBanner, setWelcomeBanner] = useState(false)

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
          setUser(profile)
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

  const filteredJDs = SAMPLE_JDS
    .filter(jd => !swipedLeft.has(jd.id) && !swipedRight.has(jd.id))
    .filter(jd => !search || jd.title.toLowerCase().includes(search.toLowerCase()) ||
      jd.company.toLowerCase().includes(search.toLowerCase()) ||
      jd.mustHave.some(s => s.toLowerCase().includes(search.toLowerCase())))

  const Avatar = ({ size = 9, className = '' }: { size?: number; className?: string }) => (
    <div
      className={`w-${size} h-${size} rounded-full overflow-hidden flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
      style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', fontSize: size < 10 ? '0.75rem' : '1.25rem' }}
    >
      {user?.photo_url
        ? <img src={user.photo_url} className="w-full h-full object-cover" alt={firstName} />
        : initials}
    </div>
  )

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
              <p className="text-sm mb-6" style={{ color: '#C7D2FE' }}>Swipe right on roles that excite you.</p>
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
              </div>
            </div>

            <div className="px-4 py-5 max-w-2xl mx-auto">
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[['10', 'JDs live', '#4F46E5'], ['40', 'Candidates', '#16A34A'], ['3', 'Matches', '#7C3AED']].map(([n, l, c]) => (
                  <div key={l} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
                    <div className="text-xl font-bold" style={{ color: c }}>{n}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Featured roles</p>
              {SAMPLE_JDS.slice(0, 2).map(jd => (
                <div key={jd.id} className="bg-white rounded-2xl mb-3 shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4">
                    <div className="flex gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: jd.color }}>{jd.initials}</div>
                      <div>
                        <p className="font-bold text-gray-900">{jd.title}</p>
                        <p className="text-sm font-semibold" style={{ color: jd.color }}>{jd.company}</p>
                        <p className="text-xs text-gray-500">{jd.team}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="tag-green tag">🌏 {jd.remote}</span>
                      <span className="tag">{jd.years} yrs</span>
                      <span className="tag" style={{ background: '#F9FAFB', color: '#4B5563', borderColor: '#E5E7EB' }}>{jd.salary}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 px-4 pb-4">
                    <button className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-500 hover:border-red-400 hover:text-red-500 transition-all" onClick={() => { setSwipedLeft(prev => new Set([...prev, jd.id])); showToast('Passed') }}>← Not Interested</button>
                    <button className="flex-1 py-2.5 rounded-full text-white text-sm font-semibold" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }} onClick={() => { setSwipedRight(prev => new Set([...prev, jd.id])); showToast('✓ Interested! Recruiter notified.') }}>Interested →</button>
                  </div>
                </div>
              ))}
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
            {filteredJDs.map(jd => (
              <div key={jd.id} className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4">
                  <div className="flex gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: jd.color }}>{jd.initials}</div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-base">{jd.title}</p>
                      <p className="text-sm font-semibold" style={{ color: jd.color }}>{jd.company}</p>
                      <p className="text-xs text-gray-500">{jd.team}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className="tag-green tag">🌏 {jd.remote}</span>
                    <span className="tag">{jd.years} yrs</span>
                    <span className="tag" style={{ background: '#F9FAFB', color: '#4B5563', borderColor: '#E5E7EB' }}>{jd.salary}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">{jd.mustHave.map(s => <span key={s} className="tag">{s}</span>)}</div>
                  {jd.tuesday && <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2"><strong>📅 Real Tuesday:</strong> {jd.tuesday}</div>}
                </div>
                <div className="flex gap-2 px-4 pb-4">
                  <button className="flex-1 py-3 rounded-full border border-gray-200 text-sm font-semibold text-gray-500 hover:border-red-400 hover:text-red-500 transition-all" onClick={() => { setSwipedLeft(prev => new Set([...prev, jd.id])); showToast('Passed') }}>← Not Interested</button>
                  <button className="flex-1 py-3 rounded-full text-white text-sm font-semibold" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }} onClick={() => { setSwipedRight(prev => new Set([...prev, jd.id])); showToast('✓ Interested! Recruiter notified.') }}>Interested →</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PROFILE VIEW */}
        {view === 'profile' && (
          <div>
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-14 z-10">
              <button className="text-2xl text-indigo-600" onClick={() => setView('home')}>‹</button>
              <h2 className="text-base font-bold">My Profile</h2>
              <button className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: '#EEF2FF', color: '#4F46E5', border: '0.5px solid #C7D2FE' }} onClick={() => showToast('Share naggare.com 🔗')}>Share 🔗</button>
            </div>

            <div className="px-4 py-5" style={{ maxWidth: '420px', margin: '0 auto' }}>
              <div className="rounded-3xl overflow-hidden shadow-xl mb-4" style={{ border: '1px solid #E5E7EB' }}>

                {/* Hero */}
                <div className="flex flex-col items-center pt-8 pb-6 px-4 text-center" style={{ background: 'linear-gradient(160deg,#4F46E5,#7C3AED)' }}>
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-3 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.25)', fontSize: '1.5rem', color: 'white', fontWeight: 'bold' }}>
                    {user?.photo_url
                      ? <img src={user.photo_url} className="w-full h-full object-cover" alt={user.name} />
                      : <span>{initials}</span>}
                  </div>
                  <p className="text-xl font-bold text-white mb-0.5" style={{ fontFamily: 'Georgia,serif' }}>{user.name}</p>
                  <p className="text-sm font-semibold" style={{ color: '#C7D2FE' }}>{user.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#A5B4FC' }}>{user.company}{user.city ? ` · ${user.city}` : ''}</p>
                  {user.domain && <span className="mt-2 px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: 'rgba(255,255,255,0.2)' }}>{user.domain}</span>}
                </div>

                {/* Career */}
                {user.career?.filter((c: any) => c.org).length > 0 && (
                  <div className="p-4 border-b border-gray-100 bg-white">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Career Journey</p>
                    <div className="flex gap-5 overflow-x-auto pb-1">
                      {user.career.filter((c: any) => c.org).map((c: any, i: number) => (
                        <div key={i} className="flex flex-col items-center" style={{ minWidth: '64px' }}>
                          <div className={`rounded-full mb-1 ${i === 0 ? 'w-3 h-3' : 'w-2 h-2'}`} style={{ background: '#4F46E5', boxShadow: i === 0 ? '0 0 0 3px rgba(79,70,229,0.2)' : '' }}></div>
                          <p className="text-xs font-bold text-center leading-tight" style={{ color: i === 0 ? '#4F46E5' : '#111827' }}>{c.org}</p>
                          <p className="text-xs text-center leading-tight" style={{ color: '#9CA3AF' }}>{c.role}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Looking for */}
                {user.looking_for && (
                  <div className="p-4 border-b border-gray-100 bg-white">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">What I'm Looking For</p>
                    <p className="text-sm leading-relaxed" style={{ color: '#1F2937' }}>{user.looking_for}</p>
                  </div>
                )}

                {/* Prompts */}
                {prompts.filter(p => p.a?.trim()).length > 0 && (
                  <div className="bg-white border-b border-gray-100">
                    <div className="px-4 pt-4 pb-1">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">In My Own Words</p>
                    </div>
                    <div className="pb-2">
                      {prompts.filter(p => p.a?.trim()).map((p, i) => (
                        <div key={i} className="mx-4 mb-4 p-4 rounded-2xl" style={{ background: '#EEF2FF', border: '0.5px solid #C7D2FE' }}>
                          <p className="text-xs font-bold mb-2" style={{ color: '#3730A3' }}>{p.q}</p>
                          <p className="text-sm leading-relaxed" style={{ color: '#1F2937' }}>{p.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {user.skills?.length > 0 && (
                  <div className="p-4 bg-white">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Skills · {user.skills.length}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {user.skills.map((s: string) => <span key={s} className="tag">{s}</span>)}
                    </div>
                  </div>
                )}
              </div>

              <button className="btn-outline py-3 text-sm w-full" onClick={() => router.push('/candidate/register?edit=true')}>✏️ Edit profile</button>
            </div>
          </div>
        )}

      </div>

      {/* Welcome banner */}
      {welcomeBanner && (
        <div className="fixed top-14 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between shadow-lg" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">👋</span>
            <div>
              <div className="text-white text-sm font-semibold">Welcome back, {firstName}!</div>
              <div className="text-xs" style={{ color: '#C7D2FE' }}>Your Naggare profile is active.</div>
            </div>
          </div>
          <button onClick={() => setWelcomeBanner(false)} className="text-white opacity-60 hover:opacity-100 text-lg">✕</button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-white text-sm font-semibold shadow-xl z-50 whitespace-nowrap" style={{ background: '#1E1B4B' }}>
          {toast}
        </div>
      )}

    </>
  )
}