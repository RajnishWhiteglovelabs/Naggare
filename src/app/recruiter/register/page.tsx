'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

const DOMAIN_SKILLS: Record<string, {cat:string,items:string[]}[]> = {
  'Technology & Product': [
    {cat:'💻 Languages', items:['☕ Java','🐍 Python','⚡ JavaScript','🔷 TypeScript','🐹 Go','🦀 Rust']},
    {cat:'⚛️ Frontend', items:['⚛️ React','🟢 Vue.js','▲ Next.js','📱 React Native','🎯 Flutter']},
    {cat:'🔧 Backend & Infra', items:['🟢 Node.js','🌿 Spring Boot','☸️ Kubernetes','🐳 Docker','🌩️ AWS','☁️ GCP']},
    {cat:'🤖 AI / ML', items:['🧠 Machine Learning','🔥 PyTorch','✨ Prompt Engineering','🔗 LLM Integration','📚 RAG']},
    {cat:'🎯 Product', items:['🗺️ Product Strategy','📋 Roadmapping','📋 Agile / Scrum','📈 Growth','📊 Analytics']},
  ],
  'Talent Acquisition': [
    {cat:'🎯 Core TA', items:['🔍 Technical Sourcing','🤝 Executive Hiring','🌱 Campus Recruiting','🌏 Global TA','🎯 Diversity Hiring','⚡ High Volume Hiring']},
    {cat:'🧲 Brand & Strategy', items:['🧲 Employer Branding','🗺️ TA Strategy','📈 Workforce Planning','📊 TA Analytics','🤖 AI in Recruiting']},
    {cat:'🧭 Leadership', items:['👥 Team Building','🌏 Global TA Leadership','🤝 C-Suite Partnering','📈 TA Transformation']},
  ],
  'Finance & Banking': [
    {cat:'💰 Core Finance', items:['📊 Financial Modelling','💰 FP&A','📋 Budgeting','📑 Financial Reporting','💳 Corporate Finance']},
    {cat:'🏦 Investment', items:['📈 Equity Research','🏦 Investment Banking','💹 Private Equity','🏗️ M&A','⚖️ Risk Management']},
  ],
  'Marketing': [
    {cat:'📣 Brand & Content', items:['📣 Brand Strategy','✍️ Content Marketing','🎨 Creative Direction','📰 PR & Communications']},
    {cat:'📊 Performance', items:['🎯 Performance Marketing','🔍 SEO / SEM','📧 Email Marketing','📊 Marketing Analytics','📈 Growth Marketing']},
  ],
  'Sales': [
    {cat:'🤝 Core Sales', items:['🤝 B2B Sales','🌐 Enterprise Sales','💼 Account Management','🎯 Business Development','📣 Pre-Sales']},
    {cat:'📊 Operations', items:['💰 Revenue Operations','📊 Sales Analytics','📋 CRM Management','🎪 Sales Enablement']},
  ],
  'HR & L&D': [
    {cat:'🧑 HR', items:['🤝 HR Business Partnering','📋 Performance Management','⚖️ Employee Relations','🌱 Talent Management']},
    {cat:'📚 L&D', items:['📚 Learning & Development','🎓 Leadership Development','🔄 Change Management','🌟 Culture Building']},
  ],
  'BPO & Customer Service': [
    {cat:'📞 Service', items:['⭐ Customer Service','📊 Quality Assurance','🔄 Process Excellence','📋 SLA Management','👥 Team Management']},
    {cat:'⚙️ Process', items:['🔬 Six Sigma','📦 Process Redesign','🤖 Automation','📊 Operations Analytics']},
  ],
  'Operations': [
    {cat:'⚙️ Core', items:['⚙️ Operations Management','📦 Supply Chain','🔄 Process Improvement','📊 Data Analysis']},
    {cat:'📋 Project', items:['📦 Project Management','🔬 Six Sigma','🏗️ Business Transformation','💡 Strategy Consulting']},
  ],
  'Other': [
    {cat:'🧭 Leadership', items:['👥 People Management','🗺️ Strategic Planning','🌱 Mentoring','🔄 Change Management']},
    {cat:'📊 Business', items:['📊 Data Analysis','📋 Project Management','🤝 Stakeholder Management','📈 Business Development']},
  ],
}

const DOMAIN_PROMPTS: Record<string, {chip:string,q:string}[]> = {
  'Technology & Product': [
    {chip:'🔧 Built something', q:'🔧 The role I hire for that I am most proud of filling'},
    {chip:'🧠 My hiring philosophy', q:'🧠 How I think about great vs good candidates'},
    {chip:'⚡ My sourcing edge', q:'⚡ How I find talent others miss'},
    {chip:'📈 What I look for', q:'📈 The traits I always look for beyond the resume'},
    {chip:'✍️ Write my own', q:'write-own'},
  ],
  'Talent Acquisition': [
    {chip:'🎯 Hire I am proud of', q:'🎯 The hire I am most proud of and why it mattered'},
    {chip:'🔍 Finding talent', q:'🔍 How I find talent others miss'},
    {chip:'🤝 Hiring manager trust', q:'🤝 How I build trust with hiring managers'},
    {chip:'🧲 Employer brand', q:'🧲 How I have built a talent brand from scratch'},
    {chip:'🌏 Scaled TA', q:'🌏 How I have scaled TA operations globally'},
    {chip:'✍️ Write my own', q:'write-own'},
  ],
  'Finance & Banking': [
    {chip:'💰 What I hire for', q:'💰 The finance roles I love hiring for and why'},
    {chip:'🧠 My hiring philosophy', q:'🧠 How I think about great vs good candidates'},
    {chip:'✍️ Write my own', q:'write-own'},
  ],
  'Marketing': [
    {chip:'📣 What I hire for', q:'📣 The marketing roles I hire for and what I look for'},
    {chip:'🧠 My hiring philosophy', q:'🧠 How I identify creative talent'},
    {chip:'✍️ Write my own', q:'write-own'},
  ],
  'Sales': [
    {chip:'💼 What I hire for', q:'💼 The sales profiles I look for and why'},
    {chip:'🧠 My hiring philosophy', q:'🧠 What separates a good salesperson from a great one'},
    {chip:'✍️ Write my own', q:'write-own'},
  ],
  'HR & L&D': [
    {chip:'🌱 What I hire for', q:'🌱 The HR and L&D profiles I look for'},
    {chip:'🧠 My hiring philosophy', q:'🧠 How I identify people-first candidates'},
    {chip:'✍️ Write my own', q:'write-own'},
  ],
  'BPO & Customer Service': [
    {chip:'📞 What I hire for', q:'📞 The BPO and CX profiles I look for'},
    {chip:'🧠 My hiring philosophy', q:'🧠 What makes great CX talent'},
    {chip:'✍️ Write my own', q:'write-own'},
  ],
  'Operations': [
    {chip:'⚙️ What I hire for', q:'⚙️ The operations profiles I look for'},
    {chip:'🧠 My hiring philosophy', q:'🧠 What separates strong ops talent'},
    {chip:'✍️ Write my own', q:'write-own'},
  ],
  'Other': [
    {chip:'🎯 What I hire for', q:'🎯 The roles I hire for and what I look for'},
    {chip:'🧠 My hiring philosophy', q:'🧠 How I think about talent'},
    {chip:'✍️ Write my own', q:'write-own'},
  ],
}

const DOMAINS = ['Technology & Product','Talent Acquisition','Finance & Banking','Marketing','Sales','HR & L&D','BPO & Customer Service','Operations','Other']
const DOMAIN_ICONS: Record<string,string> = {
  'Technology & Product':'💻','Talent Acquisition':'🎯','Finance & Banking':'💰',
  'Marketing':'📣','Sales':'🤝','HR & L&D':'🌱','BPO & Customer Service':'📞','Operations':'⚙️','Other':'✨'
}

const STEPS = ['Your details','Photo','Domain','Skills','In your words','Review']
const GREEN = '#16A34A'
const GREEN_DARK = '#15803D'
const GREEN_BG = 'linear-gradient(135deg,#16A34A,#15803D)'

function RecruiterRegisterInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [company, setCompany] = useState('')
  const [title, setTitle] = useState('')
  const [domain, setDomain] = useState('')
  const [photo, setPhoto] = useState<string|null>(null)
  const [lookingFor, setLookingFor] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())
  const [customSkill, setCustomSkill] = useState('')
  const [selectedPrompts, setSelectedPrompts] = useState<{q:string,a:string,id:string}[]>([])
  const [ownPromptQ, setOwnPromptQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [toast, setToast] = useState('')
  const [saveToast, setSaveToast] = useState(false)

  const domainSkills = DOMAIN_SKILLS[domain] || DOMAIN_SKILLS['Other']
  const domainPrompts = DOMAIN_PROMPTS[domain] || DOMAIN_PROMPTS['Other']
  const progress = ((step) / STEPS.length) * 100

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) { router.push('/signin'); return }
      setEmail(session.user.email)

      const edit = searchParams.get('edit') === 'true'
      setIsEditing(edit)

      const res = await fetch('/api/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email }),
      })

      if (res.ok) {
        const p = await res.json()
        if (p.type === 'candidate') { router.push('/home'); return }
        if (edit || p.type === 'recruiter') {
          if (p.name) setName(p.name)
          if (p.mobile) setMobile(p.mobile)
          if (p.company) setCompany(p.company)
          if (p.title) setTitle(p.title)
          if (p.domain) setDomain(p.domain)
          if (p.photo_url) setPhoto(p.photo_url)
          if (p.looking_for) setLookingFor(p.looking_for)
          if (p.skills) setSelectedSkills(new Set(p.skills))
          if (p.prompt_1_q) {
            const restored = []
            if (p.prompt_1_q) restored.push({q:p.prompt_1_q, a:p.prompt_1_a||'', id:p.prompt_1_q})
            if (p.prompt_2_q) restored.push({q:p.prompt_2_q, a:p.prompt_2_a||'', id:p.prompt_2_q})
            if (p.prompt_3_q) restored.push({q:p.prompt_3_q, a:p.prompt_3_a||'', id:p.prompt_3_q})
            setSelectedPrompts(restored)
          }
          if (edit) setStep(1)
          else router.push('/recruiter/home')
        }
      }
    }
    load()
  }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function toggleSkill(skill: string) {
    setSelectedSkills(prev => {
      const next = new Set(prev)
      next.has(skill) ? next.delete(skill) : next.add(skill)
      return next
    })
  }

  function addCustomSkill() {
    if (!customSkill.trim()) return
    setSelectedSkills(prev => new Set([...prev, customSkill.trim()]))
    setCustomSkill('')
  }

  function togglePrompt(promptQ: string, promptId: string) {
    if (promptId === 'write-own') {
      if (selectedPrompts.some(p => p.id === 'own')) {
        setSelectedPrompts(prev => prev.filter(p => p.id !== 'own'))
      } else if (selectedPrompts.length < 3) {
        setSelectedPrompts(prev => [...prev, {q:'', a:'', id:'own'}])
      }
      return
    }
    if (selectedPrompts.some(p => p.q === promptQ)) {
      setSelectedPrompts(prev => prev.filter(p => p.q !== promptQ))
    } else if (selectedPrompts.length < 3) {
      setSelectedPrompts(prev => [...prev, {q:promptQ, a:'', id:promptId}])
    } else {
      showToast('Max 3 prompts')
    }
  }

  function updatePromptAnswer(id: string, answer: string) {
    setSelectedPrompts(prev => prev.map(p => p.id === id ? {...p, a:answer} : p))
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPhoto(ev.target?.result as string)
    reader.readAsDataURL(file)
    try {
      const sessionResult = await supabase.auth.getSession()
      const userEmail = sessionResult?.data?.session?.user?.email || email
      const formData = new FormData()
      formData.append('file', file)
      formData.append('email', userEmail)
      const res = await fetch('/api/upload-photo', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) setPhoto(data.url)
    } catch { }
  }

  async function saveAndExit() {
    const saveEmail = email
    if (!saveEmail) return
    const exitPayload: Record<string,any> = {
      email: saveEmail,
      personal_email: saveEmail,
      status: 'incomplete',
    }
    if (name) exitPayload.name = name
    if (mobile) exitPayload.mobile = mobile
    if (company) exitPayload.company = company
    if (title) exitPayload.title = title
    if (domain) exitPayload.domain = domain
    if (photo) exitPayload.photo_url = photo
    if (lookingFor) exitPayload.looking_for = lookingFor
    if (selectedSkills.size > 0) exitPayload.skills = [...selectedSkills]
    if (selectedPrompts.length > 0) {
      exitPayload.prompt_1_q = selectedPrompts[0]?.q || ''
      exitPayload.prompt_1_a = selectedPrompts[0]?.a || ''
      exitPayload.prompt_2_q = selectedPrompts[1]?.q || ''
      exitPayload.prompt_2_a = selectedPrompts[1]?.a || ''
      exitPayload.prompt_3_q = selectedPrompts[2]?.q || ''
      exitPayload.prompt_3_a = selectedPrompts[2]?.a || ''
    }

    await fetch('/api/recruiter/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exitPayload),
    })
    setSaveToast(true)
    setTimeout(() => { setSaveToast(false); router.push('/recruiter/home') }, 2000)
  }

  async function submit() {
    setLoading(true)
    try {
      const res = await fetch('/api/recruiter/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          personal_email: email,
          mobile,
          name,
          company,
          title,
          domain,
          photo_url: photo || '',
          looking_for: lookingFor,
          skills: [...selectedSkills],
          prompt_1_q: selectedPrompts[0]?.q || '',
          prompt_1_a: selectedPrompts[0]?.a || '',
          prompt_2_q: selectedPrompts[1]?.q || '',
          prompt_2_a: selectedPrompts[1]?.a || '',
          prompt_3_q: selectedPrompts[2]?.q || '',
          prompt_3_a: selectedPrompts[2]?.a || '',
          status: 'active',
          seat_type: 'trial',
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      if (isEditing) {
        fetch('/api/email/profile-updated', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, name }) })
      } else {
        fetch('/api/welcome', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, name, type:'recruiter' }) })
      }
      router.push('/recruiter/home')
    } catch (e: any) {
      showToast(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || '?'

  return (
    <div className="min-h-screen flex flex-col" style={{background:'linear-gradient(135deg,#052e16,#14532d)'}}>
      {/* Header */}
      <div className="step-header" style={{borderBottom:'0.5px solid #D1FAE5'}}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => step === 1 ? router.push('/') : setStep(step-1)} className="text-2xl" style={{color:GREEN}}>‹</button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:GREEN_BG}}>
                <span className="text-sm font-bold text-white" style={{fontFamily:'Georgia,serif'}}>N</span>
              </div>
              <span className="font-bold text-base" style={{fontFamily:'Georgia,serif',color:'#14532D'}}>Naggare</span>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs font-semibold" style={{color:GREEN}}>Step {step} of {STEPS.length}</div>
              <div className="text-xs text-gray-400">{STEPS[step-1]}</div>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-green-100 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{width:`${progress}%`,background:GREEN_BG}}></div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="bg-white rounded-3xl px-5 py-6 shadow-2xl">

            {/* STEP 1: BASICS */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{fontFamily:'Georgia,serif',color:'#14532D'}}>Let's set you up</h2>
                <p className="text-sm text-gray-500 mb-1">Your profile takes under 5 minutes.</p>
                <p className="text-xs text-green-600 font-semibold mb-5">Building your profile helps candidates trust you before the first call.</p>
                <div className="mb-4">
                  <label className="label">Your full name *</label>
                  <input className="input" placeholder="e.g. Priya Sharma" value={name} onChange={e=>setName(e.target.value)}/>
                </div>
                <div className="mb-4">
                  <label className="label">Mobile number</label>
                  <input className="input" type="tel" placeholder="+91 98765 43210" value={mobile} onChange={e=>setMobile(e.target.value)}/>
                </div>
                <div className="mb-4">
                  <label className="label">Company *</label>
                  <input className="input" placeholder="e.g. Zepto, CRED, Groww..." value={company} onChange={e=>setCompany(e.target.value)}/>
                </div>
                <div className="mb-4">
                  <label className="label">Your title *</label>
                  <input className="input" placeholder="e.g. Head of Talent, VP HR..." value={title} onChange={e=>setTitle(e.target.value)}/>
                </div>
                <div className="mb-6">
                  <label className="label">Your hiring philosophy <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea className="input" rows={3} placeholder="e.g. I don't just fill roles. I find people who'll grow with the business. Great hires happen when both sides are honest about what they want..." value={lookingFor} onChange={e=>setLookingFor(e.target.value)}/>
                  <p className="text-xs text-gray-400 mt-1">Candidates read this first — make it human, make it yours.</p>
                </div>
                <button className="btn-green mb-3" style={{background:GREEN_BG}} onClick={()=>{if(!name||!company||!title){showToast('Please fill all required fields');return}setStep(2)}}>Continue →</button>
                <button className="text-center w-full text-sm font-semibold py-2" style={{color:GREEN}} onClick={saveAndExit}>Save & come back later</button>
              </div>
            )}

            {/* STEP 2: PHOTO */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{fontFamily:'Georgia,serif',color:'#14532D'}}>Add your photo</h2>
                <p className="text-sm text-gray-500 mb-6">Candidates trust recruiters with a real photo.</p>
                <div className="flex flex-col items-center mb-8">
                  <div className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center text-white text-3xl font-bold mb-4 border-4" style={{background:photo?'transparent':GREEN_BG,borderColor:'#BBF7D0'}}>
                    {photo ? <img src={photo} className="w-full h-full object-cover" alt="Profile"/> : (initials||'?')}
                  </div>
                  <label className="cursor-pointer px-6 py-2.5 rounded-full text-sm font-semibold text-white" style={{background:GREEN_BG}}>
                    {photo ? 'Change photo' : 'Upload photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhoto}/>
                  </label>
                </div>
                <div className="flex gap-3">
                  <button className="btn-outline flex-none w-24" onClick={()=>setStep(1)}>← Back</button>
                  <button className="btn-green" style={{background:GREEN_BG}} onClick={()=>setStep(3)}>{photo?'Continue →':'Skip for now →'}</button>
                </div>
                <button className="text-center w-full text-sm font-semibold py-3 mt-2" style={{color:GREEN}} onClick={saveAndExit}>Save & come back later</button>
              </div>
            )}

            {/* STEP 3: DOMAIN */}
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{fontFamily:'Georgia,serif',color:'#14532D'}}>What do you hire for?</h2>
                <p className="text-sm text-gray-500 mb-5">Pick your primary hiring domain.</p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {DOMAINS.map(d => (
                    <button key={d} className="p-3 rounded-2xl text-left border transition-all"
                      style={{background:domain===d?'#DCFCE7':'white',borderColor:domain===d?GREEN:'#E5E7EB',borderWidth:domain===d?'2px':'1px'}}
                      onClick={()=>setDomain(d)}>
                      <span className="text-xl block mb-1">{DOMAIN_ICONS[d]}</span>
                      <span className="text-xs font-semibold" style={{color:domain===d?GREEN_DARK:'#374151'}}>{d}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button className="btn-outline flex-none w-24" onClick={()=>setStep(2)}>← Back</button>
                  <button className="btn-green" style={{background:GREEN_BG}} onClick={()=>{if(!domain){showToast('Please select a domain');return}setStep(4)}}>Continue →</button>
                </div>
                <button className="text-center w-full text-sm font-semibold py-3 mt-2" style={{color:GREEN}} onClick={saveAndExit}>Save & come back later</button>
              </div>
            )}

            {/* STEP 4: SKILLS */}
            {step === 4 && (
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{fontFamily:'Georgia,serif',color:'#14532D'}}>Skills you hire for</h2>
                <p className="text-sm text-gray-500 mb-1">Pick skills relevant to your hiring domain.</p>
                <p className="text-xs mb-4" style={{color:selectedSkills.size>=3?GREEN:selectedSkills.size>0?'#D97706':'#9CA3AF'}}>
                  {selectedSkills.size} skill{selectedSkills.size!==1?'s':''} selected{selectedSkills.size>=3?' ✓':''}
                </p>
                {domainSkills.map(cat => (
                  <div key={cat.cat} className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:GREEN}}>{cat.cat}</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.items.map(skill => (
                        <button key={skill}
                          className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
                          style={{
                            background: selectedSkills.has(skill) ? '#DCFCE7' : 'white',
                            borderColor: selectedSkills.has(skill) ? GREEN : '#E5E7EB',
                            color: selectedSkills.has(skill) ? GREEN_DARK : '#374151',
                            fontWeight: selectedSkills.has(skill) ? '600' : '400',
                          }}
                          onClick={()=>toggleSkill(skill)}>{skill}</button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Add your own</p>
                  <div className="flex gap-2 mb-3">
                    <input className="input flex-1" placeholder="e.g. Boolean Search, LinkedIn Recruiter..." value={customSkill}
                      onChange={e=>setCustomSkill(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCustomSkill()}/>
                    <button className="px-4 rounded-xl text-white text-sm font-semibold" style={{background:GREEN_BG}} onClick={addCustomSkill}>Add</button>
                  </div>
                  {(() => {
                    const allDomainItems = new Set(domainSkills.flatMap(c=>c.items))
                    const customSkills = [...selectedSkills].filter(s=>!allDomainItems.has(s))
                    return customSkills.length > 0 ? (
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your added skills</p>
                        <div className="flex flex-wrap gap-2">
                          {customSkills.map(s => (
                            <button key={s} className="px-3 py-1.5 rounded-full text-sm font-semibold border flex items-center gap-1"
                              style={{background:'#DCFCE7',borderColor:GREEN,color:GREEN_DARK}}
                              onClick={()=>toggleSkill(s)}>{s} <span className="text-xs opacity-60">✕</span></button>
                          ))}
                        </div>
                      </div>
                    ) : null
                  })()}
                </div>

                <div className="flex gap-3">
                  <button className="btn-outline flex-none w-24" onClick={()=>setStep(3)}>← Back</button>
                  <button className="btn-green" style={{background:GREEN_BG}} onClick={()=>{if(selectedSkills.size===0){showToast('Pick at least 1 skill');return}setStep(5)}}>Continue →</button>
                </div>
                <button className="text-center w-full text-sm font-semibold py-3 mt-2" style={{color:GREEN}} onClick={saveAndExit}>Save & come back later</button>
              </div>
            )}

            {/* STEP 5: PROMPTS */}
            {step === 5 && (
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{fontFamily:'Georgia,serif',color:'#14532D'}}>Your recruiter voice</h2>
                <p className="text-sm text-gray-500 mb-1">This is what candidates read to decide if they trust you. Make it count.</p>
                <p className="text-xs text-green-600 font-semibold mb-5">Pick up to 3 prompts — start with your hiring philosophy.</p>

                <div className="flex flex-wrap gap-2 mb-5">
                  {domainPrompts.map(p => (
                    <button key={p.chip}
                      className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
                      style={{
                        background: selectedPrompts.some(sp=>sp.q===p.q||(p.q==='write-own'&&selectedPrompts.some(sp=>sp.id==='own'))) ? '#DCFCE7' : 'white',
                        borderColor: selectedPrompts.some(sp=>sp.q===p.q||(p.q==='write-own'&&selectedPrompts.some(sp=>sp.id==='own'))) ? GREEN : '#E5E7EB',
                        color: selectedPrompts.some(sp=>sp.q===p.q||(p.q==='write-own'&&selectedPrompts.some(sp=>sp.id==='own'))) ? GREEN_DARK : '#374151',
                      }}
                      onClick={()=>togglePrompt(p.q, p.q)}>
                      {p.chip}
                    </button>
                  ))}
                </div>

                {selectedPrompts.map((p,i) => (
                  <div key={i} className="mb-4 p-4 rounded-2xl border" style={{background:'#F0FDF4',borderColor:'#BBF7D0'}}>
                    {p.id === 'own' ? (
                      <input className="input mb-2" placeholder="Write your own prompt..." value={ownPromptQ} onChange={e=>setOwnPromptQ(e.target.value)}/>
                    ) : (
                      <p className="text-xs font-bold mb-2" style={{color:'#14532D'}}>{p.q}</p>
                    )}
                    <textarea className="input" rows={3} placeholder="Your answer..."
                      value={p.a} onChange={e=>updatePromptAnswer(p.id, e.target.value)}/>
                  </div>
                ))}

                <div className="flex gap-3">
                  <button className="btn-outline flex-none w-24" onClick={()=>setStep(4)}>← Back</button>
                  <button className="btn-green" style={{background:GREEN_BG}} onClick={()=>setStep(6)}>Continue →</button>
                </div>
                <button className="text-center w-full text-sm font-semibold py-3 mt-2" style={{color:GREEN}} onClick={saveAndExit}>Save & come back later</button>
              </div>
            )}

            {/* STEP 6: REVIEW */}
            {step === 6 && (
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{fontFamily:'Georgia,serif',color:'#14532D'}}>Looking good</h2>
                <p className="text-sm text-gray-500 mb-5">This is what candidates will see.</p>

                <div className="rounded-3xl overflow-hidden shadow-xl mb-5" style={{border:'1px solid #D1FAE5'}}>
                  <div className="relative flex flex-col items-center pt-8 pb-6 px-4 text-center" style={{background:GREEN_BG}}>
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg mb-3 flex items-center justify-center text-white font-bold text-xl" style={{background:'rgba(255,255,255,0.2)'}}>
                      {photo ? <img src={photo} className="w-full h-full object-cover" alt={name}/> : <span>{initials}</span>}
                    </div>
                    <p className="text-xl font-bold text-white mb-0.5" style={{fontFamily:'Georgia,serif'}}>{name}</p>
                    <p className="text-sm font-semibold" style={{color:'#BBF7D0'}}>{title}</p>
                    <p className="text-xs mt-0.5" style={{color:'#86EFAC'}}>{company}</p>
                    {domain && <span className="mt-2 px-3 py-1 rounded-full text-xs font-semibold text-white" style={{background:'rgba(255,255,255,0.2)'}}>{DOMAIN_ICONS[domain]} {domain}</span>}
                  </div>
                  {lookingFor && (
                    <div className="p-4 bg-white border-b border-gray-100">
                      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:GREEN}}>My hiring philosophy</p>
                      <p className="text-sm text-gray-800 leading-relaxed">{lookingFor}</p>
                    </div>
                  )}
                  {selectedSkills.size > 0 && (
                    <div className="p-4 bg-white border-b border-gray-100">
                      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:GREEN}}>Skills hiring for · {selectedSkills.size}</p>
                      <div className="flex flex-wrap gap-1">{[...selectedSkills].map(s=><span key={s} className="tag">{s}</span>)}</div>
                    </div>
                  )}
                  {selectedPrompts.filter(p=>p.a).length > 0 && (
                    <div className="p-4 bg-white">
                      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:GREEN}}>My recruiter voice</p>
                      {selectedPrompts.filter(p=>p.a).map((p,i)=>(
                        <div key={i} className="mb-3 p-3 rounded-xl" style={{background:'#F0FDF4',border:'0.5px solid #BBF7D0'}}>
                          <p className="text-xs font-bold mb-1" style={{color:'#14532D'}}>{p.id==='own'?ownPromptQ:p.q}</p>
                          <p className="text-sm text-gray-800">{p.a}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button className="btn-outline flex-none w-24" onClick={()=>setStep(5)}>← Edit</button>
                  <button className="btn-green" style={{background:GREEN_BG}} onClick={submit} disabled={loading}>
                    {loading?(isEditing?'Updating...':'Creating profile...'):(isEditing?'Update Profile':'Go to Dashboard')}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Save toast */}
      {saveToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-xl" style={{background:GREEN_DARK}}>
          Profile saved! Taking you home...
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-white text-sm font-semibold shadow-xl z-50 whitespace-nowrap" style={{background:'#14532D'}}>
          {toast}
        </div>
      )}
    </div>
  )
}

export default function RecruiterRegister() {
  return <Suspense><RecruiterRegisterInner/></Suspense>
}
