'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const STEPS = ['Email', 'Verify', 'Domain', 'Photo', 'Basics', 'Experience', 'Prompts', 'Skills', 'Review']

const DOMAIN_PROMPTS: Record<string, {chip:string,q:string}[]> = {
  'Technology & Product': [
    {chip:'🔧 Built something', q:'🔧 The thing I\'ve shipped I\'m most proud of'},
    {chip:'🧠 Problem solving', q:'🧠 The kind of problem I get unreasonably excited about'},
    {chip:'⚡ System design', q:'⚡ How I approach complex system design decisions'},
    {chip:'📈 Growth mindset', q:'📈 What I\'m actively working on getting better at'},
    {chip:'🧭 Leadership', q:'🧭 How I lead when there\'s no playbook'},
    {chip:'✍️ Write my own', q:'write-own'},
  ],
  'Talent Acquisition': [
    {chip:'🎯 Hire I\'m proud of', q:'🎯 The hire I\'m most proud of and why it mattered'},
    {chip:'🔍 Finding talent', q:'🔍 How I find talent others miss'},
    {chip:'🤝 Hiring manager trust', q:'🤝 How I build trust with hiring managers'},
    {chip:'🧲 Employer brand', q:'🧲 How I\'ve built a talent brand from scratch'},
    {chip:'🌏 Scaled TA', q:'🌏 How I\'ve scaled TA operations globally'},
    {chip:'📈 Growth mindset', q:'📈 What I\'m actively working on getting better at'},
    {chip:'✍️ Write my own', q:'write-own'},
  ],
  'Finance & Banking': [
    {chip:'📊 Complex model', q:'📊 The most complex model or analysis I\'ve built'},
    {chip:'💡 Risk identified', q:'💡 A risk I identified that others missed'},
    {chip:'🔍 Deal I worked on', q:'🔍 A deal or transaction that shaped my thinking'},
    {chip:'📈 Growth mindset', q:'📈 What I\'m actively working on getting better at'},
    {chip:'✍️ Write my own', q:'write-own'},
  ],
  'Marketing': [
    {chip:'🚀 Campaign proud of', q:'🚀 The campaign I\'m most proud of and its impact'},
    {chip:'📊 Growth I drove', q:'📊 The growth metric I moved and how I did it'},
    {chip:'🎨 Brand I built', q:'🎨 How I\'ve built or transformed a brand'},
    {chip:'📈 Growth mindset', q:'📈 What I\'m actively working on getting better at'},
    {chip:'✍️ Write my own', q:'write-own'},
  ],
  'Sales': [
    {chip:'💰 Deal I closed', q:'💰 The deal I\'m most proud of closing'},
    {chip:'🤝 Relationship built', q:'🤝 A long-term client relationship I built from scratch'},
    {chip:'📈 Growth mindset', q:'📈 What I\'m actively working on getting better at'},
    {chip:'✍️ Write my own', q:'write-own'},
  ],
  'HR & L&D': [
    {chip:'🌱 Culture built', q:'🌱 A culture or people programme I built that actually worked'},
    {chip:'📋 Policy that changed things', q:'📋 A policy I introduced that changed how people work'},
    {chip:'📈 L&D impact', q:'📈 A learning programme I built and how I measured its impact'},
    {chip:'📈 Growth mindset', q:'📈 What I\'m actively working on getting better at'},
    {chip:'✍️ Write my own', q:'write-own'},
  ],
  'BPO & Customer Service': [
    {chip:'⭐ Customer turned around', q:'⭐ The most difficult customer situation I turned around'},
    {chip:'📊 Metric improved', q:'📊 A key metric I improved and how I did it'},
    {chip:'🔄 Process redesigned', q:'🔄 A process I redesigned that made a real difference'},
    {chip:'📈 Growth mindset', q:'📈 What I\'m actively working on getting better at'},
    {chip:'✍️ Write my own', q:'write-own'},
  ],
  'Operations': [
    {chip:'⚙️ Process improved', q:'⚙️ A process I improved that had measurable impact'},
    {chip:'📦 Cost reduced', q:'📦 How I\'ve driven significant cost reduction'},
    {chip:'📈 Growth mindset', q:'📈 What I\'m actively working on getting better at'},
    {chip:'✍️ Write my own', q:'write-own'},
  ],
  'Other': [
    {chip:'🔧 Built something', q:'🔧 The thing I\'ve done I\'m most proud of'},
    {chip:'🧠 Problem solving', q:'🧠 The kind of problem I get unreasonably excited about'},
    {chip:'📈 Growth mindset', q:'📈 What I\'m actively working on getting better at'},
    {chip:'✍️ Write my own', q:'write-own'},
  ],
}

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
    {cat:'🧑‍💼 HR', items:['🤝 HR Business Partnering','📋 Performance Management','⚖️ Employee Relations','🌱 Talent Management']},
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

const DOMAINS = ['Technology & Product','Talent Acquisition','Finance & Banking','Marketing','Sales','HR & L&D','BPO & Customer Service','Operations','Other']
const DOMAIN_ICONS: Record<string,string> = {
  'Technology & Product':'⚙️','Talent Acquisition':'🎯','Finance & Banking':'💰',
  'Marketing':'📣','Sales':'🤝','HR & L&D':'🧑‍💼','BPO & Customer Service':'📞','Operations':'📦','Other':'🌐'
}

export default function CandidateRegister() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['','','','','',''])
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [domain, setDomain] = useState('')
  const [photo, setPhoto] = useState<string|null>(null)
  const [name, setName] = useState('')
  const [personalEmail, setPersonalEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [city, setCity] = useState('')
  const [years, setYears] = useState('')
  const [career, setCareer] = useState([{org:'',role:'',from:'',to:''}])
  const [lookingFor, setLookingFor] = useState('')
  const [selectedPrompts, setSelectedPrompts] = useState<{q:string,a:string,id:string}[]>([])
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())
  const [customSkill, setCustomSkill] = useState('')
  const [ownPromptQ, setOwnPromptQ] = useState('')
  
  const photoRef = useRef<HTMLInputElement>(null)

  const progress = ((step) / (STEPS.length - 1)) * 100

  async function sendOtp() {
    if(!email || !email.includes('@')) { setError('Please enter a valid email'); return }
    setError('')
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
    if(error) { setError('Failed to send code. Please try again.'); return }
    setStep(1)
  }

  async function verifyOtp() {
    const entered = otp.join('')
    if(entered.length < 6) { setError('Please enter all 6 digits'); return }
    const { error } = await supabase.auth.verifyOtp({ email, token: entered, type: 'email' })
    if(error) { setError('Invalid or expired code. Please try again.'); return }
    setError('')
    setStep(2)
  }

  function handleOtpChange(idx: number, val: string) {
    const newOtp = [...otp]
    newOtp[idx] = val.replace(/[^0-9]/g,'').slice(-1)
    setOtp(newOtp)
    if(val && idx < 5) document.getElementById(`otp-${idx+1}`)?.focus()
    if(idx === 5 && newOtp.every(d => d)) setTimeout(verifyOtp, 100)
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if(!file) return
    const reader = new FileReader()
    reader.onload = ev => setPhoto(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function togglePrompt(promptQ: string, promptId: string) {
    if(promptQ === 'write-own') {
      const exists = selectedPrompts.find(p => p.id === 'own')
      if(exists) setSelectedPrompts(prev => prev.filter(p => p.id !== 'own'))
      else if(selectedPrompts.length < 3) setSelectedPrompts(prev => [...prev, {q:'',a:'',id:'own'}])
      else alert('You can pick up to 3 prompts')
      return
    }
    const exists = selectedPrompts.find(p => p.q === promptQ)
    if(exists) setSelectedPrompts(prev => prev.filter(p => p.q !== promptQ))
    else if(selectedPrompts.length < 3) setSelectedPrompts(prev => [...prev, {q:promptQ,a:'',id:promptId}])
    else alert('You can pick up to 3 prompts')
  }

  function updatePromptAnswer(id: string, answer: string) {
    setSelectedPrompts(prev => prev.map(p => p.id === id ? {...p, a:answer} : p))
  }

  function toggleSkill(skill: string) {
    const next = new Set(selectedSkills)
    if(next.has(skill)) next.delete(skill)
    else next.add(skill)
    setSelectedSkills(next)
  }

  function addCustomSkill() {
    if(!customSkill.trim()) return
    setSelectedSkills(prev => new Set([...prev, customSkill.trim()]))
    setCustomSkill('')
  }

  async function submit() {
    setLoading(true)
    try {
      const prompts = selectedPrompts.filter(p => p.a.trim())
      const { error } = await supabase.from('candidates').upsert({
        email,
        personal_email: personalEmail,
        mobile,
        name,
        title,
        company,
        city,
        years_exp: parseInt(years) || 0,
        domain,
        career,
        looking_for: lookingFor,
        prompt_1_q: prompts[0]?.q || '',
        prompt_1_a: prompts[0]?.a || '',
        prompt_2_q: prompts[1]?.q || '',
        prompt_2_a: prompts[1]?.a || '',
        prompt_3_q: prompts[2]?.q || '',
        prompt_3_a: prompts[2]?.a || '',
        skills: [...selectedSkills],
        status: 'active',
      }, { onConflict: 'email' })
      
      if(error) throw error
      
      router.push('/home')
    } catch(e: any) {
      setError(e.message || 'Something went wrong')
      setLoading(false)
    }
  }

  async function saveAndExit() {
    if(name && email) {
      try {
        await supabase.from('candidates').upsert({
          email, name, title, company, city, domain,
          years_exp: parseInt(years)||0,
          career, looking_for: lookingFor,
          skills: [...selectedSkills],
        }, { onConflict:'email' })
      } catch(e) {}
    }

    router.push('/')
  }

  const domainSkills = DOMAIN_SKILLS[domain] || DOMAIN_SKILLS['Other']
  const domainPrompts = DOMAIN_PROMPTS[domain] || DOMAIN_PROMPTS['Other']

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="step-header">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => step === 0 ? router.push('/') : setStep(step-1)} className="text-2xl text-indigo-600">‹</button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>
                <span className="text-sm font-bold text-white" style={{fontFamily:'Georgia,serif'}}>N</span>
              </div>
              <span className="font-bold text-navy" style={{fontFamily:'Georgia,serif'}}>Naggare</span>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs font-semibold text-indigo-600">Step {step + 1} of {STEPS.length}</div>
              <div className="text-xs text-gray-400">{STEPS[step]}</div>
            </div>
          </div>
          <div className="progress-bar">
            <div className="h-full rounded-full transition-all" style={{width:`${progress}%`, background:'linear-gradient(90deg,#4F46E5,#7C3AED)'}}></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-6">
          {error && <div className="mb-4 p-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

          {/* STEP 0: EMAIL */}
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{fontFamily:'Georgia,serif',color:'#1E1B4B'}}>Let's get you started</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your email. We'll send you a verification code.</p>
              <div className="mb-4">
                <label className="label">Email address <span className="text-red-500">*</span></label>
                <input className="input text-lg py-4" type="email" placeholder="you@company.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && sendOtp()}/>
              </div>
              <button className="btn-primary text-base py-4" onClick={sendOtp}>Send verification code →</button>
            </div>
          )}

          {/* STEP 1: OTP */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{fontFamily:'Georgia,serif',color:'#1E1B4B'}}>Check your inbox</h2>
              <p className="text-sm text-gray-500 mb-1">We sent a 6-digit code to</p>
              <p className="text-base font-semibold text-indigo-600 mb-6">{email}</p>
              <div className="flex gap-2 justify-center mb-6">
                {otp.map((digit, i) => (
                  <input key={i} id={`otp-${i}`} className="otp-input" type="number" maxLength={1}
                    value={digit} onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => { if(e.key==='Backspace' && !digit && i>0) document.getElementById(`otp-${i-1}`)?.focus() }}/>
                ))}
              </div>
              <button className="btn-primary py-4 mb-3" onClick={verifyOtp}>Verify →</button>
              <p className="text-center text-sm text-gray-500">Didn't get it? <span className="text-indigo-600 font-semibold cursor-pointer" onClick={sendOtp}>Resend</span></p>
            </div>
          )}

          {/* STEP 2: DOMAIN */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{fontFamily:'Georgia,serif',color:'#1E1B4B'}}>What's your primary domain?</h2>
              <p className="text-sm text-gray-500 mb-5">This personalises your skills and prompts.</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {DOMAINS.map(d => (
                  <div key={d} className={`domain-card ${domain===d?'selected':''}`} onClick={() => setDomain(d)}>
                    <div className="text-3xl mb-2">{DOMAIN_ICONS[d]}</div>
                    <div className="text-sm font-semibold text-gray-700">{d}</div>
                  </div>
                ))}
              </div>
              <button className="btn-primary py-4" onClick={() => { if(!domain){setError('Please select your domain');return}; setError(''); setStep(3) }}
                style={!domain?{opacity:0.5}:{}}>Continue →</button>
            </div>
          )}

          {/* STEP 3: PHOTO */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{fontFamily:'Georgia,serif',color:'#1E1B4B'}}>Add your photo</h2>
              <p className="text-sm text-gray-500 mb-4">This is how recruiters first see you.</p>
              <div className="p-4 rounded-xl mb-6 text-sm text-amber-800 text-center" style={{background:'#FFFBEB',border:'0.5px solid #FDE068'}}>
                😊 A real photo works best — casual, clear, just you. No AI headshots. Candidates with genuine photos get 3x more recruiter attention.
              </div>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer bg-gray-50"
                  onClick={() => photoRef.current?.click()}>
                  {photo ? <img src={photo} className="w-full h-full object-cover"/> : <span className="text-4xl">📷</span>}
                </div>
                <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto}/>
                <button className="text-sm font-semibold text-indigo-600" onClick={() => photoRef.current?.click()}>Upload photo</button>
                <p className="text-xs text-gray-400">JPG or PNG · Max 5MB</p>
              </div>
              <button className="btn-primary py-4 mb-3" onClick={() => setStep(4)}>Continue →</button>
              <button className="btn-outline py-3 text-sm" onClick={() => setStep(4)}>Skip for now</button>
            </div>
          )}

          {/* STEP 4: BASICS */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{fontFamily:'Georgia,serif',color:'#1E1B4B'}}>Tell us who you are</h2>
              <p className="text-sm text-gray-500 mb-6">Quick basics. Under 2 minutes.</p>
              <div className="mb-4"><label className="label">Full name <span className="text-red-500">*</span></label><input className="input" placeholder="Arjun Sharma" value={name} onChange={e=>setName(e.target.value)}/></div>
              <div className="mb-4"><label className="label">Personal email <span className="text-red-500">*</span></label><input className="input" type="email" placeholder="arjun@gmail.com" value={personalEmail} onChange={e=>setPersonalEmail(e.target.value)}/></div>
              <div className="mb-4"><label className="label">Mobile <span className="text-red-500">*</span></label>
                <div className="flex gap-2"><input className="input w-20" value="+91" readOnly/><input className="input flex-1" type="tel" placeholder="98765 43210" value={mobile} onChange={e=>setMobile(e.target.value)}/></div>
              </div>
              <div className="mb-4"><label className="label">Current title <span className="text-red-500">*</span></label><input className="input" placeholder="Senior Software Engineer" value={title} onChange={e=>setTitle(e.target.value)}/></div>
              <div className="mb-4"><label className="label">Current company <span className="text-red-500">*</span></label><input className="input" placeholder="Razorpay" value={company} onChange={e=>setCompany(e.target.value)}/></div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div><label className="label">City</label><input className="input" placeholder="Bengaluru" value={city} onChange={e=>setCity(e.target.value)}/></div>
                <div><label className="label">Years exp</label><input className="input" type="number" placeholder="7" value={years} onChange={e=>setYears(e.target.value)}/></div>
              </div>
              <button className="btn-primary py-4 mb-3" onClick={() => { if(!name||!personalEmail||!mobile||!title||!company){setError('Please fill all required fields');return}; setError(''); setStep(5) }}>Continue →</button>
              <button className="text-sm font-semibold text-indigo-600 w-full py-3 text-center" onClick={saveAndExit}>Save & come back later</button>
            </div>
          )}

          {/* STEP 5: EXPERIENCE */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{fontFamily:'Georgia,serif',color:'#1E1B4B'}}>Your career journey</h2>
              <p className="text-sm text-gray-500 mb-4">Most recent first. This becomes your timeline.</p>
              <div className="p-3 rounded-xl mb-4 flex gap-3 items-start" style={{background:'#EEF2FF',border:'0.5px solid #C7D2FE'}}>
                <span className="text-xl">🚀</span>
                <p className="text-sm text-indigo-800 font-medium">The more you add, the stronger your profile. <strong>Recruiters spend 70% of their time on the career section.</strong></p>
              </div>
              {career.map((stop, i) => (
                <div key={i} className="mb-4 p-4 rounded-xl border relative" style={{background:'#F9FAFB',borderColor:i===0?'#C7D2FE':'#E5E7EB'}}>
                  <p className="text-xs font-bold mb-3" style={{color:i===0?'#4F46E5':'#6B7280'}}>{i===0?'Current / most recent role':`Role ${i+1}`}</p>
                  {i > 0 && <button className="absolute top-3 right-3 text-gray-400 hover:text-red-500" onClick={() => setCareer(career.filter((_,j)=>j!==i))}>✕</button>}
                  <div className="mb-3"><label className="label">Organisation</label><input className="input text-sm py-2" placeholder="Razorpay" value={stop.org} onChange={e=>setCareer(career.map((c,j)=>j===i?{...c,org:e.target.value}:c))}/></div>
                  <div className="mb-3"><label className="label">Role / Title</label><input className="input text-sm py-2" placeholder="Senior Engineer" value={stop.role} onChange={e=>setCareer(career.map((c,j)=>j===i?{...c,role:e.target.value}:c))}/></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="label">Start date</label><input className="input text-sm py-2" type="month" value={stop.from} onChange={e=>setCareer(career.map((c,j)=>j===i?{...c,from:e.target.value}:c))}/></div>
                    <div><label className="label">End (blank=now)</label><input className="input text-sm py-2" type="month" value={stop.to} onChange={e=>setCareer(career.map((c,j)=>j===i?{...c,to:e.target.value}:c))}/></div>
                  </div>
                </div>
              ))}
              <button className="w-full py-3 mb-4 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 font-medium hover:border-indigo-400 hover:text-indigo-600 transition-all"
                onClick={() => setCareer([...career, {org:'',role:'',from:'',to:''}])}>+ Add another role</button>
              <div className="flex gap-3">
                <button className="btn-outline flex-none w-20 py-3" onClick={()=>setStep(4)}>← Back</button>
                <button className="btn-primary py-3" onClick={() => { if(!career[0].org){setError('Add at least one role');return}; setError(''); setStep(6) }}>Continue →</button>
              </div>
              <button className="text-sm font-semibold text-indigo-600 w-full py-3 text-center mt-1" onClick={saveAndExit}>Save & come back later</button>
            </div>
          )}

          {/* STEP 6: PROMPTS */}
          {step === 6 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{fontFamily:'Georgia,serif',color:'#1E1B4B'}}>In your own words</h2>
              <p className="text-sm text-gray-500 mb-4">This is what recruiters actually read. Be specific, honest, human.</p>
              
              <div className="mb-5">
                <label className="label">What are you looking for? <span className="text-red-500">*</span></label>
                <p className="text-xs text-gray-400 mb-2">In 100 words or less. Role type, culture, stage, what matters to you.</p>
                <div className="relative">
                  <textarea className="input" rows={4} placeholder="e.g. I'm looking for a senior TA leadership role where I can build strategy, work with C-suite and shape culture at scale."
                    value={lookingFor} onChange={e=>setLookingFor(e.target.value)}/>
                  <span className="absolute bottom-2 right-3 text-xs text-gray-400">{lookingFor.trim().split(/\s+/).filter(Boolean).length} / 100</span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-base font-bold text-gray-900 mb-1">Choose your prompts</p>
                <p className="text-sm text-gray-500 mb-3">Pick up to 3 — or write your own.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {domainPrompts.map(p => {
                    const selected = p.q==='write-own' ? selectedPrompts.some(sp=>sp.id==='own') : selectedPrompts.some(sp=>sp.q===p.q)
                    return (
                      <button key={p.q} className={`skill-chip ${selected?'selected':''}`}
                        onClick={() => togglePrompt(p.q, p.q)}>
                        {p.chip}
                      </button>
                    )
                  })}
                </div>
                {selectedPrompts.map((p, i) => (
                  <div key={p.id} className="mb-3 p-4 rounded-xl" style={{background:'#EEF2FF',border:'0.5px solid #C7D2FE'}}>
                    {p.id === 'own' ? (
                      <>
                        <input className="input mb-2 text-sm bg-white" placeholder="Type your prompt question..."
                          value={ownPromptQ} onChange={e=>{setOwnPromptQ(e.target.value); updatePromptAnswer('own', p.a)}}/>
                        <textarea className="input text-sm bg-white" rows={3} placeholder="Your answer..."
                          value={p.a} onChange={e=>updatePromptAnswer('own', e.target.value)}/>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-indigo-800 mb-2">{p.q}</p>
                        <textarea className="input text-sm bg-white" rows={3} placeholder="Be specific. What was the impact?"
                          value={p.a} onChange={e=>updatePromptAnswer(p.id, e.target.value)}/>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mb-2">
                <button className="btn-outline flex-none w-20 py-3" onClick={()=>setStep(5)}>← Back</button>
                <button className="btn-primary py-3" onClick={() => { if(!lookingFor.trim()){setError('Tell us what you\'re looking for');return}; setError(''); setStep(7) }}>Continue →</button>
              </div>
              <button className="text-sm font-semibold text-indigo-600 w-full py-3 text-center" onClick={saveAndExit}>Save & come back later</button>
            </div>
          )}

          {/* STEP 7: SKILLS */}
          {step === 7 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{fontFamily:'Georgia,serif',color:'#1E1B4B'}}>What do you bring?</h2>
              <p className="text-sm text-gray-500 mb-4">Tap to select. These power your matches.</p>
              <div className="p-3 rounded-xl mb-5 text-sm text-indigo-800" style={{background:'#EEF2FF',border:'0.5px solid #C7D2FE'}}>
                ✨ Select at least 3 skills. The more specific, the better your matches.
              </div>
              {domainSkills.map(cat => (
                <div key={cat.cat} className="mb-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{cat.cat}</p>
                  <div className="flex flex-wrap gap-2">
                    {cat.items.map(skill => (
                      <button key={skill} className={`skill-chip ${selectedSkills.has(skill)?'selected':''}`} onClick={() => toggleSkill(skill)}>{skill}</button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Add your own</p>
                <div className="flex gap-2">
                  <input className="input flex-1" placeholder="e.g. Kafka, Temporal..." value={customSkill}
                    onChange={e=>setCustomSkill(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCustomSkill()}/>
                  <button className="px-4 rounded-xl text-white text-sm font-semibold" style={{background:'#4F46E5'}} onClick={addCustomSkill}>Add</button>
                </div>
              </div>
              <p className="text-xs mb-4" style={{color: selectedSkills.size>=3?'#16A34A':selectedSkills.size>0?'#D97706':'#9CA3AF'}}>
                {selectedSkills.size} skill{selectedSkills.size!==1?'s':''} selected{selectedSkills.size>=3?' ✓':''}
              </p>
              <div className="flex gap-3 mb-2">
                <button className="btn-outline flex-none w-20 py-3" onClick={()=>setStep(6)}>← Back</button>
                <button className="btn-primary py-3" onClick={() => { if(selectedSkills.size<1){setError('Select at least one skill');return}; setError(''); setStep(8) }}>Continue →</button>
              </div>
              <button className="text-sm font-semibold text-indigo-600 w-full py-3 text-center" onClick={saveAndExit}>Save & come back later</button>
            </div>
          )}

          {/* STEP 8: REVIEW */}
          {step === 8 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{fontFamily:'Georgia,serif',color:'#1E1B4B'}}>Looking good 👀</h2>
              <p className="text-sm text-gray-500 mb-5">This is what recruiters will see. Happy with it?</p>
              <div className="card mb-5">
                <div className="p-4" style={{background:'#EEF2FF',borderBottom:'0.5px solid #C7D2FE'}}>
                  <div className="flex gap-3 items-start">
                    {photo
                      ? <img src={photo} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"/>
                      : <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 border-2 border-white shadow-md" style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>{name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
                    }
                    <div>
                      <p className="text-lg font-bold" style={{color:'#3730A3'}}>{name}</p>
                      <p className="text-sm font-semibold text-indigo-600">{title}</p>
                      <p className="text-xs text-gray-500">{company}{city?` · ${city}`:''}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{background:'rgba(79,70,229,0.1)',color:'#4F46E5'}}>{DOMAIN_ICONS[domain]} {domain}</span>
                    </div>
                  </div>
                </div>
                {career[0].org && (
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Career Journey</p>
                    <div className="flex gap-1 overflow-x-auto pb-1">
                      {career.filter(c=>c.org).map((c,i) => (
                        <div key={i} className="flex flex-col items-center min-w-16 px-1">
                          <div className={`rounded-full border-2 border-white mb-1 ${i===0?'w-3 h-3':'w-2 h-2'}`} style={{background:'#4F46E5',boxShadow:i===0?'0 0 0 3px rgba(79,70,229,0.2)':''}}></div>
                          <p className="text-xs font-bold text-center" style={{color:i===0?'#4F46E5':'#111827'}}>{c.org}</p>
                          <p className="text-xs text-gray-500 text-center">{c.role}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {lookingFor && (
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">What I'm Looking For</p>
                    <p className="text-sm text-gray-900 leading-relaxed">{lookingFor}</p>
                  </div>
                )}
                {selectedPrompts.filter(p=>p.a).length > 0 && (
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">In Their Own Words</p>
                    {selectedPrompts.filter(p=>p.a).map(p => (
                      <div key={p.id} className="mb-3 p-3 rounded-xl" style={{background:'#EEF2FF',border:'0.5px solid #C7D2FE'}}>
                        <p className="text-xs font-semibold text-indigo-800 mb-1">{p.id==='own'?ownPromptQ:p.q}</p>
                        <p className="text-sm text-gray-900 leading-relaxed">{p.a}</p>
                      </div>
                    ))}
                  </div>
                )}
                {selectedSkills.size > 0 && (
                  <div className="p-4">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Skills · {selectedSkills.size}</p>
                    <div className="flex flex-wrap gap-1">{[...selectedSkills].map(s=><span key={s} className="tag">{s}</span>)}</div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mb-2">
                <button className="btn-outline flex-none w-24 py-3" onClick={()=>setStep(7)}>← Edit</button>
                <button className="btn-primary py-3" onClick={submit} disabled={loading}>
                  {loading ? 'Creating profile...' : 'Submit & Create Profile 🚀'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
