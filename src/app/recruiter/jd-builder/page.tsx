'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

const SKILL_SETS: {cat: string, items: string[]}[] = [
  {cat:'💻 Technology', items:['Python','JavaScript','TypeScript','Java','Go','React','Node.js','AWS','GCP','Docker','Kubernetes','Machine Learning','LLMs','System Design','Microservices']},
  {cat:'🎯 Talent & HR', items:['Technical Sourcing','Executive Hiring','Campus Recruiting','Global TA','Employer Branding','TA Strategy','Workforce Planning','HRBP','L&D','Compensation']},
  {cat:'💰 Finance', items:['FP&A','Financial Modelling','Budgeting','M&A','Investment Banking','Risk Management','Private Equity','Corporate Finance']},
  {cat:'📣 Marketing', items:['Brand Strategy','Content Marketing','Performance Marketing','SEO/SEM','Growth Marketing','Product Marketing','Email Marketing']},
  {cat:'🤝 Sales', items:['B2B Sales','Enterprise Sales','Account Management','Business Development','Revenue Operations','CRM','Pre-Sales']},
  {cat:'⚙️ Operations', items:['Supply Chain','Process Improvement','Project Management','Six Sigma','Data Analysis','Operations Management']},
  {cat:'📊 Data & Analytics', items:['SQL','Data Analysis','Business Intelligence','Tableau','Power BI','Statistics','Data Science','Analytics']},
]

function JDBuilderInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jdId = searchParams.get('id')

  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [recruiter, setRecruiter] = useState<any>(null)

  const [title, setTitle] = useState('')
  const [team, setTeam] = useState('')
  const [workStyle, setWorkStyle] = useState('Remote First')
  const [city, setCity] = useState('')
  const [minYears, setMinYears] = useState('')
  const [salary, setSalary] = useState('')
  const [mustHave, setMustHave] = useState<string[]>([])
  const [mustInput, setMustInput] = useState('')
  const [goodHave, setGoodHave] = useState<string[]>([])
  const [goodInput, setGoodInput] = useState('')
  const [skillsTab, setSkillsTab] = useState<'must'|'good'>('must')
  const [tuesday, setTuesday] = useState('')
  const [nonNeg, setNonNeg] = useState('')
  const [interview, setInterview] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) { router.push('/signin'); return }

      const res = await fetch('/api/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email }),
      })
      if (res.ok) {
        const p = await res.json()
        if (p.type !== 'recruiter') { router.push('/home'); return }
        setRecruiter(p)
      }

      // If editing existing JD
      if (jdId) {
        const { createClient } = await import('@supabase/supabase-js')
        const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { data } = await client.from('jds').select('*').eq('id', jdId).single()
        if (data) {
          setTitle(data.title || '')
          setTeam(data.team || '')
          setWorkStyle(data.work_style || 'Remote First')
          setCity(data.city || '')
          setMinYears(data.min_years?.toString() || '')
          setSalary(data.salary_range || '')
          setMustHave(data.must_have_skills || [])
          setGoodHave(data.good_to_have_skills || [])
          setTuesday(data.real_tuesday || '')
          setNonNeg(data.non_negotiables || '')
          setInterview(data.interview_process || '')
        }
      }
    }
    load()
  }, [jdId])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function addTag(val: string, arr: string[], setArr: (a: string[]) => void, setInput: (s: string) => void) {
    if (!val.trim()) return
    setArr([...arr, val.trim()])
    setInput('')
  }

  function removeTag(val: string, arr: string[], setArr: (a: string[]) => void) {
    setArr(arr.filter(s => s !== val))
  }

  async function publish() {
    if (!title) { setError('Add a role title'); return }
    if (!tuesday) { setError('Add what a real Tuesday looks like'); return }
    if (!nonNeg) { setError('Add your non-negotiables'); return }
    setLoading(true)
    setError('')
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      const payload = {
        title,
        team,
        work_style: workStyle,
        city,
        min_years: parseInt(minYears) || 0,
        salary_range: salary,
        must_have_skills: mustHave,
        good_to_have_skills: goodHave,
        real_tuesday: tuesday,
        non_negotiables: nonNeg,
        interview_process: interview,
        company: recruiter?.company || '',
        recruiter_email: recruiter?.email || '',
        recruiter_name: recruiter?.name || '',
        status: 'open',
      }

      if (jdId) {
        await client.from('jds').update(payload).eq('id', jdId)
      } else {
        await client.from('jds').insert(payload)
      }

      // Send JD published email
      fetch('/api/email/jd-published', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recruiter?.email, name: recruiter?.name, jobTitle: title, company: recruiter?.company }),
      })

      showToast(jdId ? 'JD updated!' : 'JD published! Candidates can see it now.')
      setTimeout(() => router.push('/recruiter/home'), 2000)
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
      setLoading(false)
    }
  }

  const company = recruiter?.company || 'Your Company'
  const companyInitials = company.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  if (!recruiter) return null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => router.back()} className="text-2xl text-indigo-600">‹</button>
        <span className="font-bold text-gray-900">{jdId ? 'Edit JD' : 'Create JD'}</span>
        {preview && (
          <button className="ml-auto btn-primary py-2 px-5 text-sm w-auto rounded-full"
            onClick={publish} disabled={loading}>
            {loading ? 'Publishing...' : jdId ? 'Update →' : 'Publish →'}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-5">
          {error && <div className="mb-4 p-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

          {!preview ? (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Georgia,serif', color: '#1E1B4B' }}>
                {jdId ? 'Edit JD' : 'Post a role'}
              </h2>
              <p className="text-sm text-gray-500 mb-5">Honest JDs attract honest candidates. No corporate speak.</p>

              <div className="mb-4">
                <label className="label">Role title *</label>
                <input className="input" placeholder="e.g. Senior Software Engineer" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="label">Team / Function</label>
                  <input className="input" placeholder="e.g. Payments Infra" value={team} onChange={e => setTeam(e.target.value)} />
                </div>
                <div>
                  <label className="label">Work style</label>
                  <select className="input" value={workStyle} onChange={e => setWorkStyle(e.target.value)}>
                    <option>Remote First</option>
                    <option>Hybrid</option>
                    <option>Onsite</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="label">City</label>
                  <input className="input" placeholder="e.g. Bengaluru" value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div>
                  <label className="label">Min years exp</label>
                  <input className="input" type="number" placeholder="e.g. 5" value={minYears} onChange={e => setMinYears(e.target.value)} />
                </div>
              </div>

              <div className="mb-4">
                <label className="label">Salary range</label>
                <input className="input" placeholder="e.g. ₹40–60 LPA" value={salary} onChange={e => setSalary(e.target.value)} />
              </div>

              {/* Skills section with tabs */}
              <div className="mb-4">
                <label className="label">Skills</label>
                {/* Tab switcher */}
                <div className="flex gap-2 mb-3">
                  <button className="flex-1 py-2 rounded-full text-sm font-semibold border transition-all"
                    style={{background: skillsTab==='must'?'linear-gradient(135deg,#4F46E5,#7C3AED)':'white', color: skillsTab==='must'?'white':'#6B7280', borderColor: skillsTab==='must'?'transparent':'#E5E7EB'}}
                    onClick={()=>setSkillsTab('must')}>
                    Must-have {mustHave.length > 0 && `(${mustHave.length})`}
                  </button>
                  <button className="flex-1 py-2 rounded-full text-sm font-semibold border transition-all"
                    style={{background: skillsTab==='good'?'linear-gradient(135deg,#4F46E5,#7C3AED)':'white', color: skillsTab==='good'?'white':'#6B7280', borderColor: skillsTab==='good'?'transparent':'#E5E7EB'}}
                    onClick={()=>setSkillsTab('good')}>
                    Good to have {goodHave.length > 0 && `(${goodHave.length})`}
                  </button>
                </div>

                {/* Selected chips */}
                {skillsTab === 'must' && mustHave.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {mustHave.map(s => (
                      <button key={s} className="px-3 py-1.5 rounded-full text-sm font-semibold border flex items-center gap-1"
                        style={{background:'#EEF2FF',borderColor:'#4F46E5',color:'#4F46E5'}}
                        onClick={()=>removeTag(s,mustHave,setMustHave)}>
                        {s} <span className="opacity-60 text-xs">✕</span>
                      </button>
                    ))}
                  </div>
                )}
                {skillsTab === 'good' && goodHave.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {goodHave.map(s => (
                      <button key={s} className="px-3 py-1.5 rounded-full text-sm font-semibold border flex items-center gap-1"
                        style={{background:'#F0FDF4',borderColor:'#16A34A',color:'#15803D'}}
                        onClick={()=>removeTag(s,goodHave,setGoodHave)}>
                        {s} <span className="opacity-60 text-xs">✕</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Predefined skill chips */}
                {SKILL_SETS.map(cat => (
                  <div key={cat.cat} className="mb-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{cat.cat}</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.items.map(skill => {
                        const inMust = mustHave.includes(skill)
                        const inGood = goodHave.includes(skill)
                        const isSelected = skillsTab === 'must' ? inMust : inGood
                        const otherSelected = skillsTab === 'must' ? inGood : inMust
                        return (
                          <button key={skill}
                            className="px-3 py-1.5 rounded-full text-sm border transition-all"
                            style={{
                              background: isSelected ? (skillsTab==='must'?'#EEF2FF':'#F0FDF4') : otherSelected ? '#F9FAFB' : 'white',
                              borderColor: isSelected ? (skillsTab==='must'?'#4F46E5':'#16A34A') : '#E5E7EB',
                              color: isSelected ? (skillsTab==='must'?'#4F46E5':'#15803D') : otherSelected ? '#9CA3AF' : '#374151',
                              fontWeight: isSelected ? '600' : '400',
                              opacity: otherSelected && !isSelected ? 0.5 : 1,
                            }}
                            onClick={() => {
                              if (skillsTab === 'must') {
                                inMust ? removeTag(skill,mustHave,setMustHave) : addTag(skill,mustHave,setMustHave,()=>{})
                              } else {
                                inGood ? removeTag(skill,goodHave,setGoodHave) : addTag(skill,goodHave,setGoodHave,()=>{})
                              }
                            }}>
                            {skill}
                            {isSelected && ' ✓'}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {/* Custom skill input */}
                <div className="flex gap-2 mt-3">
                  <input className="input flex-1" placeholder={skillsTab==='must'?'Add custom must-have skill...':'Add custom nice-to-have skill...'}
                    value={skillsTab==='must'?mustInput:goodInput}
                    onChange={e => skillsTab==='must'?setMustInput(e.target.value):setGoodInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (skillsTab==='must') addTag(mustInput,mustHave,setMustHave,setMustInput)
                        else addTag(goodInput,goodHave,setGoodHave,setGoodInput)
                      }
                    }}/>
                  <button className="px-4 rounded-xl text-white text-sm font-semibold flex-shrink-0"
                    style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}
                    onClick={() => {
                      if (skillsTab==='must') addTag(mustInput,mustHave,setMustHave,setMustInput)
                      else addTag(goodInput,goodHave,setGoodHave,setGoodInput)
                    }}>Add</button>
                </div>
              </div>

              <div className="mb-4">
                <label className="label">What a real Tuesday looks like *</label>
                <p className="text-xs text-gray-400 mb-1">Not "responsible for" — what does this person actually do? Be specific.</p>
                <textarea className="input" rows={4}
                  placeholder="e.g. Reviewing PRs on the payments retry engine, pairing with the junior engineer on the queue backlog, joining the weekly infra sync..."
                  value={tuesday} onChange={e => setTuesday(e.target.value)} />
              </div>

              <div className="mb-4">
                <label className="label">Non-negotiables *</label>
                <p className="text-xs text-gray-400 mb-1">What actually disqualifies someone? Be honest.</p>
                <textarea className="input" rows={3}
                  placeholder="e.g. 5+ years hands-on Java · Microservices at production scale · No consulting backgrounds"
                  value={nonNeg} onChange={e => setNonNeg(e.target.value)} />
              </div>

              <div className="mb-6">
                <label className="label">Interview process</label>
                <p className="text-xs text-gray-400 mb-1">Help candidates know what to expect.</p>
                <textarea className="input" rows={3}
                  placeholder="e.g. 1. Recruiter screen 30 min · 2. Coding 90 min async · 3. System design 60 min · 4. HM interview 45 min · Decision within 5 days"
                  value={interview} onChange={e => setInterview(e.target.value)} />
              </div>

              <button className="btn-outline py-3 mb-3 text-sm"
                onClick={() => { if (!title) { setError('Add a role title first'); return }; setError(''); setPreview(true) }}>
                Preview JD →
              </button>
              <button className="btn-primary py-4" onClick={publish} disabled={loading}>
                {loading ? 'Publishing...' : jdId ? 'Update JD ✅' : 'Submit & Publish JD 🚀'}
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 text-center mb-4">This is exactly what candidates will see</p>
              <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 mb-4">
                {/* Header */}
                <div className="p-4" style={{ background: '#EEF2FF', borderBottom: '0.5px solid #C7D2FE' }}>
                  <div className="flex gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>{companyInitials}</div>
                    <div>
                      <p className="font-bold text-lg" style={{ color: '#1E1B4B' }}>{title}</p>
                      <p className="text-sm font-semibold text-indigo-600">{company}</p>
                      <p className="text-xs text-gray-500">{team}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="tag" style={{ background: '#EEF2FF', color: '#4F46E5', borderColor: '#C7D2FE' }}>🌏 {workStyle}</span>
                    {city && <span className="tag">📍 {city}</span>}
                    {minYears && <span className="tag">{minYears}+ yrs</span>}
                    {salary && <span className="tag" style={{ background: '#F9FAFB', color: '#374151', borderColor: '#E5E7EB' }}>{salary}</span>}
                  </div>
                </div>

                {/* Must-have skills */}
                {mustHave.length > 0 && (
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Must-Have Skills</p>
                    <div className="flex flex-wrap gap-1">{mustHave.map(s => <span key={s} className="tag">{s}</span>)}</div>
                  </div>
                )}

                {/* Good to have */}
                {goodHave.length > 0 && (
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Good to Have</p>
                    <div className="flex flex-wrap gap-1">{goodHave.map(s => <span key={s} className="tag" style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#15803D' }}>{s}</span>)}</div>
                  </div>
                )}

                {/* Non-negotiables */}
                {nonNeg && (
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">🚫 Non-Negotiables</p>
                    <div className="p-3 rounded-xl text-sm text-gray-900 leading-relaxed" style={{ background: '#FFF1F2', border: '0.5px solid #FECDD3' }}>{nonNeg}</div>
                  </div>
                )}

                {/* Real Tuesday */}
                {tuesday && (
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">📅 What a Real Tuesday Looks Like</p>
                    <p className="text-sm text-gray-900 leading-relaxed">{tuesday}</p>
                  </div>
                )}

                {/* Interview process */}
                {interview && (
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">🎯 Interview Process</p>
                    <p className="text-sm text-gray-900 leading-relaxed">{interview}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 p-4">
                  <div className="flex-1 py-3 rounded-full border border-gray-200 text-sm font-semibold text-gray-500 text-center">← Not Interested</div>
                  <div className="flex-1 py-3 rounded-full text-white text-sm font-semibold text-center" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>Interested →</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="btn-outline flex-none w-24 py-3 text-sm" onClick={() => setPreview(false)}>← Edit</button>
                <button className="btn-primary py-3" onClick={publish} disabled={loading}>
                  {loading ? 'Publishing...' : jdId ? 'Update JD ✅' : 'Publish JD 🚀'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-white text-sm font-semibold shadow-xl z-50 whitespace-nowrap"
          style={{ background: '#1E1B4B' }}>{toast}</div>
      )}
    </div>
  )
}

export default function JDBuilder() {
  return <Suspense><JDBuilderInner /></Suspense>
}
