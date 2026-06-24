'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
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

const TRACK_PRESETS: Record<string, {ic:string[], icIdx:number, mgmt:string[], mgmtIdx:number}> = {
  'Technology & Product': {
    ic: ['Engineer','Senior Engineer','Staff Engineer','Principal Eng','Distinguished Eng'],
    icIdx: 1,
    mgmt: ['Senior Eng','Eng Manager','Director Eng','VP Eng','SVP Eng'],
    mgmtIdx: 0
  },
  'Talent Acquisition': {
    ic: ['Recruiter','Senior Recruiter','Lead Recruiter','TA Manager','Head of TA'],
    icIdx: 1,
    mgmt: ['TA Manager','Sr TA Manager','Director TA','VP Talent','CPO'],
    mgmtIdx: 0
  },
  'Finance & Banking': {
    ic: ['Analyst','Senior Analyst','Manager','Senior Manager','Director'],
    icIdx: 1,
    mgmt: ['Manager','Senior Manager','Director','VP Finance','CFO'],
    mgmtIdx: 0
  },
  'Sales': {
    ic: ['SDR','AE','Senior AE','Account Director','Regional Director'],
    icIdx: 1,
    mgmt: ['Team Lead','Sales Manager','Regional Manager','VP Sales','CRO'],
    mgmtIdx: 0
  },
  'Marketing': {
    ic: ['Coordinator','Specialist','Manager','Senior Manager','Director'],
    icIdx: 1,
    mgmt: ['Manager','Senior Manager','Director','VP Marketing','CMO'],
    mgmtIdx: 0
  },
  'HR & L&D': {
    ic: ['HR Executive','Senior HR','HRBP','HR Manager','HR Director'],
    icIdx: 1,
    mgmt: ['HR Manager','Senior HR Manager','HR Director','VP HR','CHRO'],
    mgmtIdx: 0
  },
}

function JDBuilderInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jdId = searchParams.get('id')

  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [recruiter, setRecruiter] = useState<any>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle'|'saving'|'saved'>('idle')
  const [draftId, setDraftId] = useState<string|null>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>|null>(null)

  const [title, setTitle] = useState('')
  const [team, setTeam] = useState('')
  const [workStyle, setWorkStyle] = useState('Remote First')
  const [city, setCity] = useState('')
  const [minYears, setMinYears] = useState('')
  const [maxYears, setMaxYears] = useState('')
  const [education, setEducation] = useState('')
  const [salary, setSalary] = useState('')
  const [mustHave, setMustHave] = useState<string[]>([])
  const [mustInput, setMustInput] = useState('')
  const [goodHave, setGoodHave] = useState<string[]>([])
  const [goodInput, setGoodInput] = useState('')
  const [skillsTab, setSkillsTab] = useState<'must'|'good'>('must')
  const [tuesday, setTuesday] = useState('')
  const [nonNeg, setNonNeg] = useState('')
  const [interview, setInterview] = useState('')
  const [interviewSteps, setInterviewSteps] = useState<{title:string,duration:string,competencies:string}[]>([
    {title:'Recruiter Screen', duration:'30 min', competencies:'Career story · Expectations'},
    {title:'Technical Assessment', duration:'90 min async', competencies:''},
    {title:'HM Interview', duration:'45 min', competencies:''},
  ])
  const [hiringFor, setHiringFor] = useState('')
  const [icTrack, setIcTrack] = useState(['Engineer','Senior Engineer','Staff Engineer','Principal Engineer','Distinguished Engineer'])
  const [icCurrent, setIcCurrent] = useState(1)
  const [mgmtTrack, setMgmtTrack] = useState(['Senior Engineer','Eng Manager','Director Eng','VP Eng','SVP Eng'])
  const [mgmtCurrent, setMgmtCurrent] = useState(0)
  const [showTracks, setShowTracks] = useState(true)
  const [icInput, setIcInput] = useState('')
  const [mgmtInput, setMgmtInput] = useState('')

  // Autosave whenever any field changes
  useEffect(() => {
    autoSave()
  }, [title, team, workStyle, city, minYears, maxYears, education, salary, mustHave, goodHave, tuesday, nonNeg, interview, hiringFor, icTrack, icCurrent, mgmtTrack, mgmtCurrent, showTracks, interviewSteps])

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

      // Check for existing draft if not editing
      if (!jdId) {
        const { createClient } = await import('@supabase/supabase-js')
        const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { data: draft } = await client.from('jds')
          .select('*')
          .eq('recruiter_email', session.user.email)
          .eq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (draft) {
          setDraftId(draft.id)
          setTitle(draft.title || '')
          setTeam(draft.team || '')
          setWorkStyle(draft.work_style || 'Remote First')
          setCity(draft.city || '')
          setMinYears(draft.min_years?.toString() || '')
          setMaxYears(draft.max_years?.toString() || '')
          setEducation(draft.education || '')
          setSalary(draft.salary_range || '')
          setHiringFor(draft.company || '')
          setMustHave(draft.must_have_skills || [])
          setGoodHave(draft.good_to_have_skills || [])
          setTuesday(draft.real_tuesday || '')
          setNonNeg(draft.non_negotiables || '')
          setInterview(draft.interview_process || '')
          if (draft.interview_steps?.length) setInterviewSteps(draft.interview_steps)
          if (draft.ic_track?.length) setIcTrack(draft.ic_track)
          if (draft.ic_current != null) setIcCurrent(draft.ic_current)
          if (draft.mgmt_track?.length) setMgmtTrack(draft.mgmt_track)
          if (draft.mgmt_current != null) setMgmtCurrent(draft.mgmt_current)
          if (draft.show_tracks != null) setShowTracks(draft.show_tracks)
        }
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
          setMaxYears(data.max_years?.toString() || '')
          setEducation(data.education || '')
          setSalary(data.salary_range || '')
          setHiringFor(data.company || '')
          setMustHave(data.must_have_skills || [])
          setGoodHave(data.good_to_have_skills || [])
          setTuesday(data.real_tuesday || '')
          setNonNeg(data.non_negotiables || '')
          setInterview(data.interview_process || '')
          if (data.interview_steps?.length) setInterviewSteps(data.interview_steps)
          if (data.ic_track?.length) setIcTrack(data.ic_track)
          if (data.ic_current != null) setIcCurrent(data.ic_current)
          if (data.mgmt_track?.length) setMgmtTrack(data.mgmt_track)
          if (data.mgmt_current != null) setMgmtCurrent(data.mgmt_current)
          if (data.show_tracks != null) setShowTracks(data.show_tracks)
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

  async function autoSave() {
    if (!recruiter || !title) return // don't save empty JDs
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaveStatus('saving')
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const payload = {
          title, team, work_style: workStyle, city,
          min_years: parseInt(minYears) || 0,
          max_years: parseInt(maxYears) || 0,
          education,
          salary_range: salary,
          must_have_skills: mustHave,
          good_to_have_skills: goodHave,
          real_tuesday: tuesday,
          non_negotiables: nonNeg,
          interview_process: interview,
          interview_steps: interviewSteps,
          company: hiringFor || recruiter?.company || '',
          recruiter_email: recruiter?.email || '',
          recruiter_name: recruiter?.name || '',
          status: 'draft',
          ic_track: icTrack,
          ic_current: icCurrent,
          mgmt_track: mgmtTrack,
          mgmt_current: mgmtCurrent,
          show_tracks: showTracks,
        }
        if (draftId || jdId) {
          await client.from('jds').update(payload).eq('id', draftId || jdId)
        } else {
          const { data } = await client.from('jds').insert(payload).select().single()
          if (data?.id) setDraftId(data.id)
        }
        setAutoSaveStatus('saved')
        setTimeout(() => setAutoSaveStatus('idle'), 2000)
      } catch {
        setAutoSaveStatus('idle')
      }
    }, 2000) // 2 second debounce
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
        interview_steps: interviewSteps,
        company: hiringFor || recruiter?.company || '',
        recruiter_email: recruiter?.email || '',
        recruiter_name: recruiter?.name || '',
        status: 'open',
        ic_track: icTrack,
        ic_current: icCurrent,
        mgmt_track: mgmtTrack,
        mgmt_current: mgmtCurrent,
        show_tracks: showTracks,
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
        body: JSON.stringify({ email: recruiter?.email, name: recruiter?.name, role: title, company: recruiter?.company, location: city }),
      })

      // Delete draft after publishing
      if (draftId && !jdId) {
        const { createClient: cc } = await import('@supabase/supabase-js')
        const cl = cc(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        await cl.from('jds').delete().eq('id', draftId)
      }
      showToast(jdId ? 'JD updated!' : 'JD published! Candidates can see it now.')
      setTimeout(() => router.push('/recruiter/home'), 2000)
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
      setLoading(false)
    }
  }

  const company = hiringFor || recruiter?.company || 'Your Company'
  const companyInitials = company.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  if (!recruiter) return null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => router.back()} className="text-2xl text-indigo-600">‹</button>
        <span className="font-bold text-gray-900">{jdId ? 'Edit JD' : 'Create JD'}</span>
        {autoSaveStatus === 'saving' && <span className="text-xs text-gray-400 ml-2">Saving...</span>}
        {autoSaveStatus === 'saved' && <span className="text-xs text-green-500 ml-2">✓ Saved</span>}
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

              <div className="mb-4">
                <label className="label">Team / Function</label>
                <input className="input" placeholder="e.g. Payments Infra" value={team} onChange={e => setTeam(e.target.value)} />
              </div>

              <div className="mb-4">
                <label className="label">Company name *</label>
                <input className="input" placeholder="e.g. Razorpay" value={hiringFor}
                  onChange={e => setHiringFor(e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">Your company, or your client's name if you're an agency recruiter.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="label">City</label>
                  <input className="input" placeholder="e.g. Bengaluru" value={city} onChange={e => setCity(e.target.value)} />
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
                  <label className="label">Min years exp</label>
                  <input className="input" type="number" placeholder="e.g. 5" value={minYears} onChange={e => setMinYears(e.target.value)} />
                </div>
                <div>
                  <label className="label">Max years exp</label>
                  <input className="input" type="number" placeholder="e.g. 10" value={maxYears} onChange={e => setMaxYears(e.target.value)} />
                </div>
              </div>

              <div className="mb-4">
                <label className="label">Minimum education</label>
                <select className="input" value={education} onChange={e => setEducation(e.target.value)}>
                  <option value="">No preference</option>
                  <option>High School / 12th</option>
                  <option>Diploma</option>
                  <option>Bachelor's degree</option>
                  <option>Master's degree</option>
                  <option>MBA</option>
                  <option>PhD</option>
                  <option>CA / CPA</option>
                  <option>Any graduate</option>
                </select>
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
                <p className="text-xs text-gray-400 mb-2">Each round candidates will go through. Competencies are optional but help candidates prepare.</p>
                {interviewSteps.map((step, i) => (
                  <div key={i} className="mb-3 p-3 rounded-2xl border border-gray-100 bg-gray-50">
                    <div className="flex gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full flex-shrink-0 mt-2 text-white flex items-center justify-center text-xs font-bold"
                        style={{background: ['#4F46E5','#7C3AED','#2563EB','#D97706','#111827'][i % 5]}}>
                        {i + 1}
                      </div>
                      <input className="input flex-1 text-sm py-2" placeholder="Round name e.g. Recruiter Screen"
                        value={step.title}
                        onChange={e => setInterviewSteps(interviewSteps.map((s,j) => j===i ? {...s, title: e.target.value} : s))} />
                      <input className="input w-28 text-sm py-2" placeholder="e.g. 30 min"
                        value={step.duration}
                        onChange={e => setInterviewSteps(interviewSteps.map((s,j) => j===i ? {...s, duration: e.target.value} : s))} />
                      {interviewSteps.length > 1 && (
                        <button type="button" className="text-gray-300 hover:text-red-400 text-lg px-1"
                          onClick={() => setInterviewSteps(interviewSteps.filter((_,j) => j !== i))}>✕</button>
                      )}
                    </div>
                    <input className="input text-sm py-2" placeholder="Competencies assessed (optional) e.g. Career story · Expectations · Culture fit"
                      value={step.competencies}
                      onChange={e => setInterviewSteps(interviewSteps.map((s,j) => j===i ? {...s, competencies: e.target.value} : s))} />
                  </div>
                ))}
                <button type="button" className="w-full py-2 rounded-xl border border-dashed border-gray-300 text-sm text-gray-400 hover:border-indigo-400 hover:text-indigo-600 transition-all"
                  onClick={() => setInterviewSteps([...interviewSteps, {title:'', duration:'', competencies:''}])}>
                  + Add round
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="label mb-0">Career progression</label>
                  <button type="button" className="text-xs text-indigo-600 font-semibold"
                    onClick={() => setShowTracks(!showTracks)}>
                    {showTracks ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showTracks && (
                  <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50 space-y-5">

                    {/* Domain presets */}
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Load a template</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(TRACK_PRESETS).map(domain => (
                          <button key={domain} type="button"
                            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-all"
                            onClick={() => {
                              const p = TRACK_PRESETS[domain]
                              setIcTrack(p.ic)
                              setIcCurrent(p.icIdx)
                              setMgmtTrack(p.mgmt)
                              setMgmtCurrent(p.mgmtIdx)
                            }}>
                            {domain}
                          </button>
                        ))}
                        <button type="button"
                          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 bg-white text-gray-400 hover:border-red-300 hover:text-red-500 transition-all"
                          onClick={() => { setIcTrack([]); setIcCurrent(-1); setMgmtTrack([]); setMgmtCurrent(-1) }}>
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* IC Track */}
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">IC track — tap a level to mark where this role sits</p>
                      {icTrack.length > 0 && (
                        <div className="flex items-start overflow-x-auto pb-2 mb-3 relative">
                          <div className="absolute top-2 left-0 right-0 h-px bg-gray-200" style={{zIndex:0}} />
                          {icTrack.map((role: string, i: number) => (
                            <div key={i} className="flex flex-col items-center flex-shrink-0" style={{minWidth:'72px', zIndex:1}}>
                              <button type="button"
                                className="w-4 h-4 rounded-full border-2 mb-1.5 transition-all"
                                style={{
                                  background: i === icCurrent ? '#4F46E5' : i < icCurrent ? 'rgba(79,70,229,0.25)' : 'white',
                                  borderColor: i <= icCurrent ? '#4F46E5' : '#D1D5DB'
                                }}
                                onClick={() => setIcCurrent(i)} />
                              <span className="text-xs text-center leading-tight px-1"
                                style={{color: i === icCurrent ? '#4F46E5' : '#6B7280', fontWeight: i === icCurrent ? 600 : 400}}>
                                {role}
                              </span>
                              {i === icCurrent && <span className="text-xs text-indigo-400 mt-0.5">← Here</span>}
                              <button type="button" className="text-gray-300 hover:text-red-400 text-xs mt-1"
                                onClick={() => {
                                  const t = icTrack.filter((_: string, j: number) => j !== i)
                                  setIcTrack(t)
                                  if (icCurrent >= t.length) setIcCurrent(t.length - 1)
                                }}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input className="input flex-1 text-sm py-2" placeholder="Add level e.g. Staff Engineer"
                          value={icInput} onChange={e => setIcInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && icInput.trim()) { setIcTrack([...icTrack, icInput.trim()]); setIcInput('') }}} />
                        <button type="button"
                          className="px-4 rounded-xl text-white text-sm font-semibold flex-shrink-0"
                          style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}
                          onClick={() => { if (icInput.trim()) { setIcTrack([...icTrack, icInput.trim()]); setIcInput('') }}}>
                          + Add
                        </button>
                      </div>
                    </div>

                    {/* Management Track */}
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Management track — tap a level to mark entry point</p>
                      {mgmtTrack.length > 0 && (
                        <div className="flex items-start overflow-x-auto pb-2 mb-3 relative">
                          <div className="absolute top-2 left-0 right-0 h-px bg-gray-200" style={{zIndex:0}} />
                          {mgmtTrack.map((role: string, i: number) => (
                            <div key={i} className="flex flex-col items-center flex-shrink-0" style={{minWidth:'72px', zIndex:1}}>
                              <button type="button"
                                className="w-4 h-4 rounded-full border-2 mb-1.5 transition-all"
                                style={{
                                  background: i === mgmtCurrent ? '#7C3AED' : i < mgmtCurrent ? 'rgba(124,58,237,0.25)' : 'white',
                                  borderColor: i <= mgmtCurrent ? '#7C3AED' : '#D1D5DB'
                                }}
                                onClick={() => setMgmtCurrent(i)} />
                              <span className="text-xs text-center leading-tight px-1"
                                style={{color: i === mgmtCurrent ? '#7C3AED' : '#6B7280', fontWeight: i === mgmtCurrent ? 600 : 400}}>
                                {role}
                              </span>
                              {i === mgmtCurrent && <span className="text-xs text-purple-400 mt-0.5">← Start</span>}
                              <button type="button" className="text-gray-300 hover:text-red-400 text-xs mt-1"
                                onClick={() => {
                                  const t = mgmtTrack.filter((_: string, j: number) => j !== i)
                                  setMgmtTrack(t)
                                  if (mgmtCurrent >= t.length) setMgmtCurrent(t.length - 1)
                                }}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input className="input flex-1 text-sm py-2" placeholder="Add level e.g. Eng Manager"
                          value={mgmtInput} onChange={e => setMgmtInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && mgmtInput.trim()) { setMgmtTrack([...mgmtTrack, mgmtInput.trim()]); setMgmtInput('') }}} />
                        <button type="button"
                          className="px-4 rounded-xl text-white text-sm font-semibold flex-shrink-0"
                          style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}
                          onClick={() => { if (mgmtInput.trim()) { setMgmtTrack([...mgmtTrack, mgmtInput.trim()]); setMgmtInput('') }}}>
                          + Add
                        </button>
                      </div>
                    </div>

                  </div>
                )}
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
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: '#4F46E5', color: 'white' }}>Technology</span>
                    {workStyle && <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #6EE7B7' }}>{workStyle}</span>}
                  </div>
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
                    {(minYears || maxYears) && <span className="tag">{minYears || '0'}{maxYears ? `–${maxYears}` : '+'} yrs</span>}
                    {mustHave.length > 0 && <span className="tag">{mustHave.slice(0,2).join(' · ')}{mustHave.length > 2 ? ` +${mustHave.length - 2}` : ''}</span>}
                    {city && <span className="tag">{city}</span>}
                    {salary && <span className="tag" style={{ background: '#F9FAFB', color: '#374151', borderColor: '#E5E7EB' }}>{salary}</span>}
                  </div>
                </div>

                {/* Where this role takes you */}
                {showTracks && icTrack.length > 0 && (
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4">Where This Role Takes You</p>

                    {/* IC Track */}
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                      <span>⚡</span> IC Track
                    </p>
                    <div className="overflow-x-auto pb-2 mb-4">
                      <div className="flex items-start gap-0 min-w-max relative">
                        {/* connecting line */}
                        <div className="absolute top-2 left-2 right-2 h-px bg-gray-200" style={{zIndex:0}} />
                        {icTrack.map((role, i) => (
                          <div key={i} className="flex flex-col items-center" style={{minWidth: '90px', zIndex:1}}>
                            <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 mb-2"
                              style={{
                                background: i <= icCurrent ? '#4F46E5' : 'white',
                                borderColor: i <= icCurrent ? '#4F46E5' : '#D1D5DB'
                              }} />
                            <p className="text-xs font-bold text-center px-1 leading-tight"
                              style={{color: i === icCurrent ? '#4F46E5' : '#6B7280'}}>
                              {role}
                              {i === icCurrent && <span className="block text-indigo-400 font-normal">← Here</span>}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Management Track */}
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                      <span>👥</span> Management Track
                    </p>
                    <div className="overflow-x-auto pb-2">
                      <div className="flex items-start gap-0 min-w-max relative">
                        <div className="absolute top-2 left-2 right-2 h-px bg-gray-200" style={{zIndex:0}} />
                        {mgmtTrack.map((role, i) => (
                          <div key={i} className="flex flex-col items-center" style={{minWidth: '90px', zIndex:1}}>
                            <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 mb-2"
                              style={{
                                background: i <= mgmtCurrent ? '#7C3AED' : 'white',
                                borderColor: i <= mgmtCurrent ? '#7C3AED' : '#D1D5DB'
                              }} />
                            <p className="text-xs font-bold text-center px-1 leading-tight"
                              style={{color: i === mgmtCurrent ? '#7C3AED' : '#6B7280'}}>
                              {role}
                              {i === mgmtCurrent && <span className="block text-purple-400 font-normal">← Start</span>}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills & Tech Stack */}
                {(mustHave.length > 0 || goodHave.length > 0) && (
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Skills &amp; Tech Stack</p>
                    <div className="flex flex-wrap gap-1">
                      {mustHave.map((s: string) => <span key={s} className="tag" style={{ background: '#EEF2FF', color: '#4338CA', borderColor: '#C7D2FE' }}>{s}</span>)}
                      {goodHave.map((s: string) => <span key={s} className="tag" style={{ background: '#F9FAFB', color: '#6B7280', borderColor: '#E5E7EB' }}>{s}</span>)}
                    </div>
                  </div>
                )}

                {/* What we won't compromise on */}
                {(nonNeg || goodHave.length > 0) && (
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">What We Won't Compromise On</p>
                    {nonNeg && (
                      <div className="p-3 rounded-xl mb-3" style={{ background: '#FFF1F2', border: '0.5px solid #FECDD3' }}>
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Non Negotiables</p>
                        {nonNeg.split(/\n/).filter((l: string) => l.trim()).map((line: string, i: number) => (
                          <p key={i} className="text-sm text-gray-900 flex gap-2 mb-1"><span className="text-red-500 flex-shrink-0">●</span>{line.replace(/^[·\-\*]\s*/, '').trim()}</p>
                        ))}
                      </div>
                    )}
                    {goodHave.length > 0 && (
                      <div className="p-3 rounded-xl" style={{ background: '#F0FDF4', border: '0.5px solid #BBF7D0' }}>
                        <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Good to Have</p>
                        {goodHave.map((s: string, i: number) => (
                          <p key={i} className="text-sm text-gray-900 flex gap-2 mb-1"><span className="text-green-500 flex-shrink-0">●</span>{s}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Real Tuesday */}
                {tuesday && (
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">What a Real Tuesday Looks Like</p>
                    <p className="text-sm text-gray-900 leading-relaxed">{tuesday}</p>
                  </div>
                )}

                {/* Interview process */}
                {interviewSteps.some((s: {title:string,duration:string,competencies:string}) => s.title) && (
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Interview Process — No Surprises</p>
                    {interviewSteps.filter((s: {title:string,duration:string,competencies:string}) => s.title).map((step: {title:string,duration:string,competencies:string}, i: number) => {
                      const colors = ['#4F46E5','#7C3AED','#2563EB','#D97706','#111827']
                      return (
                        <div key={i} className="mb-4 last:mb-0">
                          <div className="flex gap-3 items-start mb-1">
                            <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-white text-xs font-bold"
                              style={{ background: colors[i % colors.length] }}>{i+1}</div>
                            <div>
                              <span className="text-sm font-bold text-gray-900">{step.title}</span>
                              {step.duration && <span className="text-xs text-gray-400 ml-2">· {step.duration}</span>}
                            </div>
                          </div>
                          {step.competencies && (
                            <div className="ml-8 flex flex-wrap gap-1 mt-1">
                              {step.competencies.split('·').map((c: string) => c.trim()).filter((c: string) => c).map((comp: string, j: number) => (
                                <span key={j} className="px-2 py-0.5 rounded-full text-xs border border-gray-200 text-gray-500 bg-gray-50">{comp}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Hiring for this role */}
                {recruiter && (
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Hiring for This Role</p>
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F9FAFB', border: '0.5px solid #E5E7EB' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
                        {recruiter.name?.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{recruiter.name}</p>
                        <p className="text-xs text-gray-500">{recruiter.title} · {recruiter.company}</p>
                      </div>
                      <span className="text-indigo-400 text-lg">›</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 p-4">
                  <div className="flex-1 py-3 rounded-full border border-gray-200 text-sm font-semibold text-gray-500 text-center">Not Interested</div>
                  <div className="flex-1 py-3 rounded-full text-white text-sm font-semibold text-center" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>Interested</div>
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


