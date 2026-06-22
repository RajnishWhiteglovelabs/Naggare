'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

const DOMAINS = [
  { id: 'Technology & Product', icon: '💻' },
  { id: 'Talent Acquisition', icon: '🎯' },
  { id: 'Finance & Banking', icon: '💰' },
  { id: 'Marketing', icon: '📣' },
  { id: 'Sales', icon: '🤝' },
  { id: 'HR & L&D', icon: '🌱' },
  { id: 'BPO & Customer Service', icon: '🎧' },
  { id: 'Operations', icon: '⚙️' },
  { id: 'Other', icon: '✨' },
]

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
  const [photo, setPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) { router.push('/signin'); return }
      setEmail(session.user.email)

      const edit = searchParams.get('edit') === 'true'
      setIsEditing(edit)

      if (edit) {
        const res = await fetch('/api/me', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: session.user.email }),
        })
        if (res.ok) {
          const p = await res.json()
          if (p.name) setName(p.name)
          if (p.mobile) setMobile(p.mobile)
          if (p.company) setCompany(p.company)
          if (p.title) setTitle(p.title)
          if (p.domain) setDomain(p.domain)
          if (p.photo_url) setPhoto(p.photo_url)
          setStep(1)
        }
      }
    }
    load()
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
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
    } catch { /* preview still shows */ }
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
          status: 'active',
          seat_type: 'trial',
        }),
      })
      if (!res.ok) throw new Error('Failed to save profile')

      if (isEditing) {
        fetch('/api/email/profile-updated', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name }),
        })
      } else {
        fetch('/api/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, type: 'recruiter' }),
        })
      }

      router.push('/recruiter/home')
    } catch (e: any) {
      showToast(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const GREEN = '#16A34A'
  const GREEN_DARK = '#15803D'
  const GREEN_BG = 'linear-gradient(135deg,#16A34A,#15803D)'

  return (
    <div className="min-h-screen" style={{ background: '#F0FDF4' }}>
      {/* Header */}
      <div className="step-header">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: GREEN_BG }}>
              <span className="text-xs font-bold text-white" style={{ fontFamily: 'Georgia,serif' }}>N</span>
            </div>
            <span className="font-bold text-base" style={{ fontFamily: 'Georgia,serif', color: '#14532D' }}>Naggare</span>
          </div>
          <span className="text-xs text-gray-400 font-medium">Step {step} of 4</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ background: i <= step ? GREEN : '#D1FAE5' }} />
          ))}
        </div>
      </div>

      <div className="px-5 pt-6 pb-24 max-w-lg mx-auto">

        {/* STEP 1: BASICS */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia,serif', color: '#14532D' }}>Let's set you up</h2>
            <p className="text-sm text-gray-500 mb-6">Tell candidates a bit about yourself.</p>

            <div className="mb-4">
              <label className="label">Your full name *</label>
              <input className="input" placeholder="e.g. Priya Sharma" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="label">Mobile number</label>
              <input className="input" type="tel" placeholder="+91 98765 43210" value={mobile} onChange={e => setMobile(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="label">Company *</label>
              <input className="input" placeholder="e.g. Zepto, CRED, Groww..." value={company} onChange={e => setCompany(e.target.value)} />
            </div>
            <div className="mb-6">
              <label className="label">Your title *</label>
              <input className="input" placeholder="e.g. Head of Talent, VP HR..." value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <button className="btn-green" onClick={() => { if (!name || !company || !title) { showToast('Please fill all required fields'); return; } setStep(2) }}
              style={{ background: GREEN_BG }}>
              Continue →
            </button>
          </div>
        )}

        {/* STEP 2: PHOTO */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia,serif', color: '#14532D' }}>Add your photo</h2>
            <p className="text-sm text-gray-500 mb-6">Candidates trust recruiters with a real photo.</p>

            <div className="flex flex-col items-center mb-8">
              <div className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center text-white text-3xl font-bold mb-4 border-4"
                style={{ background: photo ? 'transparent' : GREEN_BG, borderColor: '#BBF7D0' }}>
                {photo
                  ? <img src={photo} className="w-full h-full object-cover" alt="Profile" />
                  : (initials || '👤')}
              </div>
              <label className="cursor-pointer px-5 py-2.5 rounded-full text-sm font-semibold text-white" style={{ background: GREEN_BG }}>
                {photo ? 'Change photo' : 'Upload photo'}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            </div>

            <div className="flex gap-3">
              <button className="btn-outline flex-none w-24" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-green" onClick={() => setStep(3)} style={{ background: GREEN_BG }}>
                {photo ? 'Continue →' : 'Skip for now →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DOMAIN */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia,serif', color: '#14532D' }}>What do you hire for?</h2>
            <p className="text-sm text-gray-500 mb-5">Pick your primary hiring domain.</p>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {DOMAINS.map(d => (
                <button key={d.id}
                  className="p-3 rounded-2xl text-left border transition-all"
                  style={{
                    background: domain === d.id ? '#DCFCE7' : 'white',
                    borderColor: domain === d.id ? GREEN : '#E5E7EB',
                    borderWidth: domain === d.id ? '2px' : '1px',
                  }}
                  onClick={() => setDomain(d.id)}>
                  <span className="text-xl block mb-1">{d.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: domain === d.id ? GREEN_DARK : '#374151' }}>{d.id}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button className="btn-outline flex-none w-24" onClick={() => setStep(2)}>← Back</button>
              <button className="btn-green" onClick={() => { if (!domain) { showToast('Please select a domain'); return; } setStep(4) }} style={{ background: GREEN_BG }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia,serif', color: '#14532D' }}>Looking good 👀</h2>
            <p className="text-sm text-gray-500 mb-5">This is how candidates will see you.</p>

            <div className="rounded-3xl overflow-hidden shadow-xl mb-5" style={{ border: '1px solid #D1FAE5' }}>
              {/* Hero */}
              <div className="relative flex flex-col items-center pt-8 pb-6 px-4 text-center" style={{ background: 'linear-gradient(160deg,#16A34A,#15803D)' }}>
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg mb-3 flex items-center justify-center text-white font-bold text-xl"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>
                  {photo ? <img src={photo} className="w-full h-full object-cover" alt={name} /> : <span>{initials || '👤'}</span>}
                </div>
                <p className="text-xl font-bold text-white mb-0.5" style={{ fontFamily: 'Georgia,serif' }}>{name}</p>
                <p className="text-sm font-semibold" style={{ color: '#BBF7D0' }}>{title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#86EFAC' }}>{company}</p>
                {domain && <span className="mt-2 px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: 'rgba(255,255,255,0.2)' }}>{domain}</span>}
              </div>

              <div className="p-4 bg-white">
                <p className="text-xs font-bold mb-1" style={{ color: GREEN }}>HIRING FOR</p>
                <p className="text-sm text-gray-800">{domain || '—'}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn-outline flex-none w-24" onClick={() => setStep(3)}>← Edit</button>
              <button className="btn-green" onClick={submit} disabled={loading} style={{ background: GREEN_BG }}>
                {loading ? (isEditing ? 'Updating...' : 'Creating profile...') : (isEditing ? 'Update Profile ✅' : 'Go to Dashboard 🚀')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-white text-sm font-semibold shadow-xl z-50 whitespace-nowrap"
          style={{ background: '#14532D' }}>
          {toast}
        </div>
      )}
    </div>
  )
}

export default function RecruiterRegister() {
  return <Suspense><RecruiterRegisterInner /></Suspense>
}
