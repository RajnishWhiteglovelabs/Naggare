'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

const REC_HIRE_SKILLS = [
  {cat:'💻 Technology', items:['Software Engineering','Frontend','Backend','Full Stack','Mobile','DevOps','Data Engineering','AI / ML','Security','Product Management']},
  {cat:'🎯 Leadership', items:['CTO / VP Engineering','CPO / VP Product','CEO / MD','CFO','CHRO / VP HR','CMO','VP Sales','Director Level','C-Suite']},
  {cat:'💰 Finance', items:['Investment Banking','Private Equity','FP&A','Risk Management','Corporate Finance','Accounting','Compliance']},
  {cat:'📣 Marketing', items:['Brand Marketing','Performance Marketing','Content Marketing','Product Marketing','Growth','PR & Communications']},
  {cat:'🤝 Sales', items:['Enterprise Sales','B2B Sales','Account Management','Business Development','Revenue Operations']},
  {cat:'🧑‍💼 HR & L&D', items:['HR Business Partnering','L&D','Compensation & Benefits','OD & Culture','DEI']},
  {cat:'📞 BPO & Ops', items:['Customer Service','Operations','Supply Chain','Process Excellence','Quality Assurance']},
  {cat:'🌐 Sectors', items:['Fintech','NBFC','D2C','SaaS','E-commerce','Healthcare','EdTech','Real Estate','Logistics','Manufacturing']},
]

export default function RecruiterRegister() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data: recruiter } = await supabase.from('recruiters').select('email').ilike('email', session.user.email!).single()
      if (recruiter) router.push('/home')
    })
  }, [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['','','','','',''])
  const [photo, setPhoto] = useState<string|null>(null)
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [city, setCity] = useState('')
  const [years, setYears] = useState('')
  const [specs, setSpecs] = useState<string[]>([])
  const [specInput, setSpecInput] = useState('')
  const [career, setCareer] = useState([{org:'',role:'',from:'',to:''}])
  const [bio, setBio] = useState('')
  const [hireSkills, setHireSkills] = useState<Set<string>>(new Set())
  const [customHireSkill, setCustomHireSkill] = useState('')

  const photoRef = useRef<HTMLInputElement>(null)
  const STEPS = ['Email','Verify','Photo','Basics','Journey','Bio','Skills I Hire For']
  const progress = (step / (STEPS.length - 1)) * 100

  async function sendOtp() {
    if(!email || !email.includes('@')) { setError('Please enter a valid email'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to send code. Please try again.'); return }
      setStep(1)
    } catch {
      setError('Failed to send code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp() {
    const entered = otp.join('')
    if(entered.length < 6) { setError('Please enter all 6 digits'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: entered }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid or expired code. Please try again.'); setLoading(false); return }

      // Set real Supabase session
      if (data.accessToken && data.refreshToken) {
        await supabase.auth.setSession({ access_token: data.accessToken, refresh_token: data.refreshToken })
      }

      setError(''); setStep(2)
    } catch {
      setError('Invalid or expired code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleOtpChange(idx: number, val: string) {
    const newOtp = [...otp]
    newOtp[idx] = val.replace(/[^0-9]/g,'').slice(-1)
    setOtp(newOtp)
    if(val && idx < 5) document.getElementById(`rec-otp-${idx+1}`)?.focus()
    if(idx === 5 && newOtp.every(d => d)) setTimeout(verifyOtp, 100)
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if(!file) return
    const reader = new FileReader()
    reader.onload = ev => setPhoto(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function addSpec(e: React.KeyboardEvent) {
    if(e.key !== 'Enter' && e.key !== ',') return
    e.preventDefault()
    if(!specInput.trim()) return
    setSpecs(prev => [...prev, specInput.trim()])
    setSpecInput('')
  }

  function toggleHireSkill(skill: string) {
    const next = new Set(hireSkills)
    if(next.has(skill)) next.delete(skill)
    else next.add(skill)
    setHireSkills(next)
  }

  async function submit() {
    setLoading(true)
    try {
      const { error: err } = await supabase.from('recruiters').upsert({
        email, name, mobile, title, company, city,
        years_recruiting: parseInt(years)||0,
        specialisations: specs,
        career, bio,
        hire_skills: [...hireSkills],
        status: 'active',
      }, { onConflict:'email' })
      if(err) throw err
      // Send welcome email
      fetch('/api/welcome', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, name, type:'recruiter' }) })
      router.push('/recruiter/ready')
    } catch(e: any) {
      setError(e.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="step-header" style={{background:'#F0FDF4',borderBottomColor:'#BBF7D0'}}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => step===0?router.push('/'):setStep(step-1)} className="text-2xl" style={{color:'#16A34A'}}>‹</button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>
                <span className="text-sm font-bold text-white" style={{fontFamily:'Georgia,serif'}}>N</span>
              </div>
              <span className="font-bold" style={{fontFamily:'Georgia,serif',color:'#1E1B4B'}}>Naggare</span>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs font-semibold" style={{color:'#16A34A'}}>Step {step+1} of {STEPS.length}</div>
              <div className="text-xs text-gray-400">{STEPS[step]}</div>
            </div>
          </div>
          <div className="progress-bar">
            <div className="h-full rounded-full transition-all" style={{width:`${progress}%`,background:'linear-gradient(90deg,#16A34A,#15803D)'}}></div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-6">
          {error && <div className="mb-4 p-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

          {step === 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{fontFamily:'Georgia,serif',color:'#166534'}}>Let's get you set up</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your email — personal or work, your choice.</p>
              <div className="mb-4"><label className="label">Email address <span className="text-red-500">*</span></label>
                <input className="input text-lg py-4" type="email" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendOtp()}/></div>
              <button className="btn-green py-4" onClick={sendOtp}>Send verification code →</button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{fontFamily:'Georgia,serif',color:'#166534'}}>Check your inbox</h2>
              <p className="text-sm text-gray-500 mb-1">We sent a 6-digit code to</p>
              <p className="text-base font-semibold mb-6" style={{color:'#16A34A'}}>{email}</p>
              <div className="flex gap-2 justify-center mb-6">
                {otp.map((d,i) => <input key={i} id={`rec-otp-${i}`} className="otp-input" type="number" maxLength={1} value={d}
                  onChange={e=>handleOtpChange(i,e.target.value)} onKeyDown={e=>{if(e.key==='Backspace'&&!d&&i>0)document.getElementById(`rec-otp-${i-1}`)?.focus()}}/>)}
              </div>
              <button className="btn-green py-4" onClick={verifyOtp}>Verify →</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{fontFamily:'Georgia,serif',color:'#166534'}}>Add your photo</h2>
              <p className="text-sm text-gray-500 mb-4">Candidates see your photo before deciding to engage.</p>
              <div className="p-4 rounded-xl mb-5 text-sm text-amber-800 text-center" style={{background:'#FFFBEB',border:'0.5px solid #FDE068'}}>
                😊 A real, warm photo builds trust instantly. Candidates are more likely to engage with approachable recruiters.
              </div>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer bg-gray-50"
                  onClick={() => photoRef.current?.click()}>
                  {photo ? <img src={photo} className="w-full h-full object-cover"/> : <span className="text-4xl">📷</span>}
                </div>
                <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto}/>
                <button className="text-sm font-semibold" style={{color:'#16A34A'}} onClick={() => photoRef.current?.click()}>Upload photo</button>
              </div>
              <button className="btn-green py-4 mb-3" onClick={() => setStep(3)}>Continue →</button>
              <button className="btn-outline py-3 text-sm" onClick={() => setStep(3)}>Skip for now</button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{fontFamily:'Georgia,serif',color:'#166534'}}>Your recruiter profile</h2>
              <p className="text-sm text-gray-500 mb-5">Candidates see this before deciding to engage.</p>
              <div className="mb-4"><label className="label">Full name <span className="text-red-500">*</span></label><input className="input" placeholder="Sneha Krishnan" value={name} onChange={e=>setName(e.target.value)}/></div>
              <div className="mb-4"><label className="label">Mobile <span className="text-red-500">*</span></label>
                <div className="flex gap-2"><input className="input w-20" value="+91" readOnly/><input className="input flex-1" type="tel" placeholder="98765 43210" value={mobile} onChange={e=>setMobile(e.target.value)}/></div>
              </div>
              <div className="mb-4"><label className="label">Your title <span className="text-red-500">*</span></label><input className="input" placeholder="Senior TA Manager" value={title} onChange={e=>setTitle(e.target.value)}/></div>
              <div className="mb-4"><label className="label">Company <span className="text-red-500">*</span></label><input className="input" placeholder="Razorpay" value={company} onChange={e=>setCompany(e.target.value)}/></div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div><label className="label">City</label><input className="input" placeholder="Bengaluru" value={city} onChange={e=>setCity(e.target.value)}/></div>
                <div><label className="label">Years recruiting</label><input className="input" type="number" placeholder="9" value={years} onChange={e=>setYears(e.target.value)}/></div>
              </div>
              <div className="mb-5">
                <label className="label">Specialisations (press Enter after each)</label>
                <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-xl bg-white min-h-12 cursor-text" style={{borderColor:'#BBF7D0'}} onClick={() => document.getElementById('spec-input')?.focus()}>
                  {specs.map(s => <span key={s} className="tag-green tag">{s}<span className="cursor-pointer ml-1 opacity-60" onClick={()=>setSpecs(specs.filter(sp=>sp!==s))}>✕</span></span>)}
                  <input id="spec-input" className="border-none outline-none text-sm min-w-24 flex-1 bg-transparent" placeholder={specs.length===0?"e.g. Tech Hiring, Leadership...":""} value={specInput} onChange={e=>setSpecInput(e.target.value)} onKeyDown={addSpec}/>
                </div>
              </div>
              <button className="btn-green py-4" onClick={() => { if(!name||!mobile||!title||!company){setError('Please fill all required fields');return}; setError(''); setStep(4) }}>Continue →</button>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{fontFamily:'Georgia,serif',color:'#166534'}}>Your recruiting journey</h2>
              <p className="text-sm text-gray-500 mb-4">Where you've been builds trust with candidates.</p>
              <div className="p-3 rounded-xl mb-4 flex gap-3 items-start" style={{background:'#F0FDF4',border:'0.5px solid #BBF7D0'}}>
                <span className="text-xl">🤝</span>
                <p className="text-sm font-medium" style={{color:'#166534'}}>Candidates want to know your story. <strong>Recruiters with full career histories get 2x more candidate engagement.</strong></p>
              </div>
              {career.map((stop,i) => (
                <div key={i} className="mb-4 p-4 rounded-xl border relative" style={{background:'#F0FDF4',borderColor:i===0?'#BBF7D0':'#E5E7EB'}}>
                  <p className="text-xs font-bold mb-3" style={{color:i===0?'#16A34A':'#6B7280'}}>{i===0?'Current / most recent role':`Role ${i+1}`}</p>
                  {i>0&&<button className="absolute top-3 right-3 text-gray-400 hover:text-red-500" onClick={()=>setCareer(career.filter((_,j)=>j!==i))}>✕</button>}
                  <div className="mb-3"><label className="label">Company</label><input className="input text-sm py-2" placeholder="Razorpay" value={stop.org} onChange={e=>setCareer(career.map((c,j)=>j===i?{...c,org:e.target.value}:c))}/></div>
                  <div className="mb-3"><label className="label">Role / Title</label><input className="input text-sm py-2" placeholder="Sr TA Manager" value={stop.role} onChange={e=>setCareer(career.map((c,j)=>j===i?{...c,role:e.target.value}:c))}/></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="label">Start date</label><input className="input text-sm py-2" type="month" value={stop.from} onChange={e=>setCareer(career.map((c,j)=>j===i?{...c,from:e.target.value}:c))}/></div>
                    <div><label className="label">End (blank=now)</label><input className="input text-sm py-2" type="month" value={stop.to} onChange={e=>setCareer(career.map((c,j)=>j===i?{...c,to:e.target.value}:c))}/></div>
                  </div>
                </div>
              ))}
              <button className="w-full py-3 mb-4 rounded-xl border-2 border-dashed text-sm font-medium transition-all" style={{borderColor:'#BBF7D0',color:'#16A34A'}}
                onClick={()=>setCareer([...career,{org:'',role:'',from:'',to:''}])}>+ Add another role</button>
              <div className="flex gap-3">
                <button className="btn-outline flex-none w-20 py-3" onClick={()=>setStep(3)}>← Back</button>
                <button className="btn-green py-3" onClick={()=>{if(!career[0].org){setError('Add at least one role');return};setError('');setStep(5)}}>Continue →</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{fontFamily:'Georgia,serif',color:'#166534'}}>Why candidates Super Pursue you</h2>
              <p className="text-sm text-gray-500 mb-4">This is what candidates read before deciding to engage. Be specific, honest, human.</p>
              <div className="p-3 rounded-xl mb-4 text-sm" style={{background:'#F0FDF4',border:'0.5px solid #BBF7D0',color:'#166534'}}>
                💡 Think about: What makes you different? How do you treat candidates? What can someone expect when they work with you?
              </div>
              <div className="mb-5">
                <label className="label">Your bio <span className="text-red-500">*</span></label>
                <div className="relative">
                  <textarea className="input" rows={6} placeholder="e.g. I've spent 12 years building TA functions across APAC. I believe great hiring is built on honesty — I'll tell you what the role is really like. I respond within 24 hours, give real feedback and never ghost."
                    value={bio} onChange={e=>setBio(e.target.value)}/>
                  <span className="absolute bottom-2 right-3 text-xs text-gray-400">{bio.trim().split(/\s+/).filter(Boolean).length} / 150</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="btn-outline flex-none w-20 py-3" style={{borderColor:'#BBF7D0',color:'#16A34A'}} onClick={()=>setStep(4)}>← Back</button>
                <button className="btn-green py-3" onClick={()=>{if(!bio.trim()){setError('Add your bio');return};setError('');setStep(6)}}>Continue →</button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{fontFamily:'Georgia,serif',color:'#166534'}}>What do you hire for?</h2>
              <p className="text-sm text-gray-500 mb-5">Candidates use this to find the right recruiter.</p>
              {REC_HIRE_SKILLS.map(cat => (
                <div key={cat.cat} className="mb-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{cat.cat}</p>
                  <div className="flex flex-wrap gap-2">
                    {cat.items.map(skill => (
                      <button key={skill} className={`skill-chip ${hireSkills.has(skill)?'selected':''}`} onClick={()=>toggleHireSkill(skill)}>{skill}</button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Add your own</p>
                <div className="flex gap-2">
                  <input className="input flex-1" placeholder="e.g. Fintech, NBFC..." value={customHireSkill} onChange={e=>setCustomHireSkill(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&customHireSkill.trim()){setHireSkills(new Set([...hireSkills,customHireSkill.trim()]));setCustomHireSkill('')}}}/>
                  <button className="px-4 rounded-xl text-white text-sm font-semibold" style={{background:'#16A34A'}} onClick={()=>{if(customHireSkill.trim()){setHireSkills(new Set([...hireSkills,customHireSkill.trim()]));setCustomHireSkill('')}}}>Add</button>
                </div>
              </div>
              <p className="text-xs mb-4" style={{color:hireSkills.size>=3?'#16A34A':'#9CA3AF'}}>{hireSkills.size} skill{hireSkills.size!==1?'s':''} selected{hireSkills.size>=3?' ✓':''}</p>
              <div className="flex gap-3">
                <button className="btn-outline flex-none w-20 py-3" style={{borderColor:'#BBF7D0',color:'#16A34A'}} onClick={()=>setStep(5)}>← Back</button>
                <button className="btn-green py-3" onClick={submit} disabled={loading}>{loading?'Creating profile...':'Create Profile ✓'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
