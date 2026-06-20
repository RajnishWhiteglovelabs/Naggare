'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

export default function JDBuilder() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)
  const [toast, setToast] = useState('')
  
  const [title, setTitle] = useState('')
  const [team, setTeam] = useState('')
  const [workStyle, setWorkStyle] = useState('🌏 Remote First')
  const [minYears, setMinYears] = useState('')
  const [salary, setSalary] = useState('')
  const [mustHave, setMustHave] = useState<string[]>([])
  const [mustInput, setMustInput] = useState('')
  const [goodHave, setGoodHave] = useState<string[]>([])
  const [goodInput, setGoodInput] = useState('')
  const [tuesday, setTuesday] = useState('')
  const [nonNeg, setNonNeg] = useState('')
  const [interview, setInterview] = useState('')

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('naggare_user')||'{}') : {}

  function showToast(msg: string) { setToast(msg); setTimeout(()=>setToast(''),3000) }

  function addTag(val: string, arr: string[], setArr: (a:string[])=>void, setInput: (s:string)=>void) {
    if(!val.trim()) return
    setArr([...arr, val.trim()])
    setInput('')
  }

  async function publish() {
    if(!title) { setError('Add a role title'); return }
    if(!tuesday) { setError('Add what a real Tuesday looks like'); return }
    if(!nonNeg) { setError('Add your non-negotiables'); return }
    setLoading(true)
    try {
      await supabase.from('jds').insert({
        title, team, work_style: workStyle,
        min_years: parseInt(minYears)||0,
        salary_range: salary,
        must_have_skills: mustHave,
        good_to_have_skills: goodHave,
        real_tuesday: tuesday,
        non_negotiables: nonNeg,
        interview_process: interview,
        company: user.company||'',
        status: 'open',
      })
      showToast('✅ JD published! Candidates can see it now.')
      setTimeout(() => router.push('/home'), 2000)
    } catch(e: any) {
      setError(e.message||'Something went wrong')
      setLoading(false)
    }
  }

  const company = user.company || 'Your Company'
  const companyInitials = company.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()

  return (
    <div className="min-h-screen flex flex-col">
      <div className="step-header" style={{background:'#F0FDF4',borderBottomColor:'#BBF7D0'}}>
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-2xl" style={{color:'#16A34A'}}>‹</button>
          <span className="font-bold" style={{color:'#166534'}}>Create JD</span>
          {preview && <button className="ml-auto px-4 py-1.5 rounded-full text-white text-xs font-semibold" style={{background:'#16A34A'}} onClick={publish} disabled={loading}>{loading?'Publishing...':'Publish →'}</button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-5">
          {error && <div className="mb-4 p-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}

          {!preview ? (
            <>
              <h2 className="text-xl font-bold mb-1" style={{fontFamily:'Georgia,serif',color:'#166534'}}>Your Job Description</h2>
              <p className="text-sm text-gray-500 mb-5">Honest JDs attract honest candidates. No corporate speak.</p>
              
              <div className="mb-4"><label className="label">Role title <span className="text-red-500">*</span></label><input className="input" placeholder="Senior Software Engineer" value={title} onChange={e=>setTitle(e.target.value)}/></div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div><label className="label">Team</label><input className="input" placeholder="Payments Infra" value={team} onChange={e=>setTeam(e.target.value)}/></div>
                <div><label className="label">Work style</label>
                  <select className="input" value={workStyle} onChange={e=>setWorkStyle(e.target.value)}>
                    <option>🌏 Remote First</option><option>🏢 Hybrid</option><option>📍 Onsite</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div><label className="label">Min years exp</label><input className="input" type="number" placeholder="5" value={minYears} onChange={e=>setMinYears(e.target.value)}/></div>
                <div><label className="label">Salary range</label><input className="input" placeholder="₹40–60 LPA" value={salary} onChange={e=>setSalary(e.target.value)}/></div>
              </div>
              
              <div className="mb-4">
                <label className="label">Must-have skills <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-xl bg-white min-h-12" style={{borderColor:'#BBF7D0'}}>
                  {mustHave.map(s=><span key={s} className="tag">{s}<span className="cursor-pointer ml-1 opacity-60" onClick={()=>setMustHave(mustHave.filter(m=>m!==s))}>✕</span></span>)}
                  <input className="border-none outline-none text-sm flex-1 min-w-24 bg-transparent" placeholder="e.g. Java, React..." value={mustInput} onChange={e=>setMustInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();addTag(mustInput,mustHave,setMustHave,setMustInput)}}}/>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="label">Good to have</label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-xl bg-white min-h-12 border-gray-200">
                  {goodHave.map(s=><span key={s} className="tag-green tag">{s}<span className="cursor-pointer ml-1 opacity-60" onClick={()=>setGoodHave(goodHave.filter(g=>g!==s))}>✕</span></span>)}
                  <input className="border-none outline-none text-sm flex-1 min-w-24 bg-transparent" placeholder="e.g. Kubernetes..." value={goodInput} onChange={e=>setGoodInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();addTag(goodInput,goodHave,setGoodHave,setGoodInput)}}}/>
                </div>
              </div>

              <div className="mb-4"><label className="label">What a real Tuesday looks like <span className="text-red-500">*</span></label><textarea className="input" rows={4} placeholder="What does this person actually work on day to day? Not 'responsible for' — what do they do? Be specific." value={tuesday} onChange={e=>setTuesday(e.target.value)}/></div>
              <div className="mb-4"><label className="label">Non-negotiables <span className="text-red-500">*</span></label><textarea className="input" rows={3} placeholder="What's the real bar? What actually disqualifies someone? Be honest." value={nonNeg} onChange={e=>setNonNeg(e.target.value)}/></div>
              <div className="mb-5"><label className="label">Interview process</label><textarea className="input" rows={3} placeholder="e.g. Recruiter screen 30 min → Coding 90 min → System design → Offer within 5 days" value={interview} onChange={e=>setInterview(e.target.value)}/></div>

              <button className="btn-outline py-3 mb-3 text-sm" style={{borderColor:'#BBF7D0',color:'#16A34A'}} onClick={() => { if(!title){setError('Add a role title first');return}; setError(''); setPreview(true) }}>Preview JD →</button>
              <button className="btn-green py-4" onClick={publish} disabled={loading}>{loading?'Publishing...':'Submit & Publish JD 🚀'}</button>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-400 text-center mb-4">This is exactly what candidates will see</p>
              <div className="card mb-5">
                <div className="p-4" style={{background:'#EEF2FF',borderBottom:'0.5px solid #C7D2FE'}}>
                  <div className="flex gap-2 flex-wrap mb-3">
                    <span className="tag-green tag">🌏 {workStyle}</span>
                    {salary&&<span className="tag">₹ {salary}</span>}
                    {minYears&&<span className="tag" style={{background:'#F9FAFB',color:'#4B5563',borderColor:'#E5E7EB'}}>{minYears}+ yrs</span>}
                    <span className="tag ml-auto" style={{background:'#F0F9FF',color:'#1D4ED8',borderColor:'#BAE6FD'}}>✓ Verified</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{background:'linear-gradient(135deg,#4F46E5,#3730A3)'}}>{companyInitials}</div>
                    <div>
                      <p className="font-bold text-lg" style={{color:'#3730A3'}}>{title}</p>
                      <p className="text-sm font-semibold text-indigo-600">{company}</p>
                      <p className="text-xs text-gray-500">{team}</p>
                    </div>
                  </div>
                </div>
                {mustHave.length>0&&<div className="p-4 border-b border-gray-100"><p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Must-Have Skills</p><div className="flex flex-wrap gap-1">{mustHave.map(s=><span key={s} className="tag">{s}</span>)}</div></div>}
                {goodHave.length>0&&<div className="p-4 border-b border-gray-100"><p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Good to Have</p><div className="flex flex-wrap gap-1">{goodHave.map(s=><span key={s} className="tag-green tag">{s}</span>)}</div></div>}
                {nonNeg&&<div className="p-4 border-b border-gray-100"><p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">🚫 Non-Negotiables</p><div className="p-3 rounded-xl text-sm text-gray-900 leading-relaxed" style={{background:'#FFF1F2',border:'0.5px solid #FECDD3'}}>{nonNeg}</div></div>}
                {tuesday&&<div className="p-4 border-b border-gray-100"><p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">📅 What a Real Tuesday Looks Like</p><p className="text-sm text-gray-900 leading-relaxed">{tuesday}</p></div>}
                {interview&&<div className="p-4 border-b border-gray-100"><p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">🎯 Interview Process</p><p className="text-sm text-gray-900 leading-relaxed">{interview}</p></div>}
                <div className="flex gap-2 p-4">
                  <div className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-500 text-center">← Not Interested</div>
                  <div className="flex-1 py-2.5 rounded-full text-white text-sm font-semibold text-center" style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>Interested →</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="btn-outline flex-none w-24 py-3 text-sm" onClick={() => setPreview(false)}>← Edit</button>
                <button className="btn-green py-3" onClick={publish} disabled={loading}>{loading?'Publishing...':'Publish JD 🚀'}</button>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-white text-sm font-semibold shadow-xl z-50 whitespace-nowrap" style={{background:'#1E1B4B'}}>{toast}</div>}
    </div>
  )
}
