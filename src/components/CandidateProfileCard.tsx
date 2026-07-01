'use client'
import { useState } from 'react'

async function downloadCandidatePdf(candidate: any) {
  const res = await fetch('/api/candidate/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: candidate.email }),
  })
  if (!res.ok) throw new Error('failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(candidate.name || 'candidate').replace(/[^a-z0-9]+/gi, '_')}_Naggare.pdf`
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}
export { downloadCandidatePdf }

// On-screen card visual (photo hero + sections). Used by the modal below.
export function CandidateCardVisual({ candidate, score }: { candidate: any; score?: any }) {
  const initials = candidate.name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase()
  const meta = [candidate.company, candidate.city, candidate.years_exp ? candidate.years_exp + ' yrs' : null].filter(Boolean).join(' · ')
  const prompts = [
    { q: candidate.prompt_1_q, a: candidate.prompt_1_a },
    { q: candidate.prompt_2_q, a: candidate.prompt_2_a },
    { q: candidate.prompt_3_q, a: candidate.prompt_3_a },
  ].filter(p => p.q && p.a)
  return (
    <div className="rounded-3xl overflow-hidden shadow-xl" style={{border:'1px solid #E0E7FF',background:'#fff'}}>
      <div className="relative" style={{height:'340px'}}>
        {candidate.photo_url
          ? <img src={candidate.photo_url} className="absolute inset-0 w-full h-full object-cover" alt={candidate.name}/>
          : <div className="absolute inset-0 flex items-center justify-center" style={{background:'linear-gradient(160deg,#4F46E5,#7C3AED)'}}>
              <span className="text-white font-bold text-5xl">{initials}</span>
            </div>}
        <div className="absolute inset-0" style={{background:'linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 55%)'}}/>
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-white" style={{fontFamily:'Georgia,serif'}}>{candidate.name}</p>
            <p className="text-sm" style={{color:'#C7D2FE'}}>{candidate.title}</p>
            {meta && <p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.7)'}}>{meta}</p>}
          </div>
          {score && (
            <div className="flex flex-col items-center px-3 py-2 rounded-2xl flex-shrink-0" style={{background:'rgba(255,255,255,0.2)'}}>
              <p className="text-3xl font-bold text-white">{score.overall_score}</p>
              <p className="text-xs font-bold" style={{color:'#C7D2FE'}}>Naggare Score</p>
              <p className="text-xs" style={{color:'rgba(255,255,255,0.6)'}}>{score.role_level}</p>
            </div>
          )}
        </div>
      </div>

      {(candidate.availability||candidate.notice_period||candidate.work_preference||candidate.current_ctc||candidate.expected_ctc) && (
        <div className="p-4 border-b border-gray-100 bg-white flex flex-wrap gap-2">
          {candidate.availability && <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{background:'#EEF2FF',color:'#4F46E5'}}>{candidate.availability}</span>}
          {candidate.notice_period && <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{background:'#F0FDF4',color:'#15803D'}}>⏱ {candidate.notice_period}</span>}
          {candidate.work_preference && <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{background:'#FFF7ED',color:'#C2410C'}}>🏠 {candidate.work_preference}</span>}
          {candidate.current_ctc && <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{background:'#F9FAFB',color:'#374151'}}>Current: ₹{candidate.current_ctc}L</span>}
          {candidate.expected_ctc && <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{background:'#F9FAFB',color:'#374151'}}>Expected: ₹{candidate.expected_ctc}L</span>}
        </div>
      )}

      {score && (
        <div className="p-4 border-b border-gray-100 bg-white">
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#4F46E5'}}>Naggare Score · {score.role_level}</p>
          <div className="flex items-center gap-4">
            <p className="text-4xl font-bold" style={{color:'#4F46E5'}}>{score.overall_score}</p>
            <div>
              <p className="text-sm font-semibold" style={{color:'#1E1B4B'}}>{score.role_signal}</p>
              <p className="text-xs" style={{color:'#9CA3AF'}}>Valid until {new Date(score.valid_until).toLocaleDateString('en-IN')}</p>
            </div>
          </div>
        </div>
      )}

      {candidate.skills?.length > 0 && (
        <div className="p-4 border-b border-gray-100 bg-white">
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#4F46E5'}}>Skills · {candidate.skills.length}</p>
          <div className="flex flex-wrap gap-1.5">{candidate.skills.map((s:string) => <span key={s} className="tag">{s}</span>)}</div>
        </div>
      )}

      {candidate.looking_for && (
        <div className={"p-4 bg-white" + (prompts.length ? " border-b border-gray-100" : "")}>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#4F46E5'}}>What they&apos;re looking for</p>
          <p className="text-sm leading-relaxed" style={{color:'#374151'}}>{candidate.looking_for}</p>
        </div>
      )}

      {prompts.length > 0 && (
        <div className="p-4 bg-white">
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'#4F46E5'}}>In their own words</p>
          {prompts.map((p, i) => (
            <div key={i} className="mb-3 p-4 rounded-2xl" style={{background:'#EEF2FF',border:'0.5px solid #C7D2FE'}}>
              <p className="text-xs font-bold mb-2" style={{color:'#3730A3'}}>{p.q}</p>
              <p className="text-sm leading-relaxed text-gray-800">{p.a}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CandidateProfileCard({
  candidate, score, onClose, onPass, onPursue,
}: {
  candidate: any; score?: any; onClose: () => void; onPass?: () => void; onPursue?: () => void
}) {
  if (!candidate) return null
  const showActions = !!onPass && !!onPursue
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState(false)
  async function downloadPdf() {
    if (!candidate?.email) return
    try {
      setPdfError(false); setPdfLoading(true)
      await downloadCandidatePdf(candidate)
    } catch {
      setPdfError(true); setTimeout(() => setPdfError(false), 3000)
    } finally { setPdfLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{background:'#f5f5f5',fontFamily:'Raleway,sans-serif'}}>
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button className="text-2xl text-indigo-600" onClick={onClose}>‹</button>
        <h2 className="text-base font-bold">Candidate Profile</h2>
      </div>
      <div style={{maxWidth:'420px',margin:'0 auto',paddingBottom:'80px',paddingTop:'16px',paddingLeft:'12px',paddingRight:'12px'}}>
        <CandidateCardVisual candidate={candidate} score={score} />

        <button onClick={downloadPdf} disabled={pdfLoading}
          className="w-full mt-4 py-3 rounded-2xl text-sm font-semibold border disabled:opacity-60"
          style={{borderColor:'#C7D2FE',color:'#4F46E5',background:'#fff'}}>
          {pdfLoading ? 'Generating…' : '⬇ Download profile'}
        </button>
        {pdfError && <p className="text-xs text-center mt-2" style={{color:'#DC2626'}}>Couldn&apos;t generate PDF — try again</p>}

        {showActions && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button onClick={onPass}
              className="py-3 rounded-2xl text-sm font-semibold border" style={{borderColor:'#E5E7EB',color:'#6B7280',background:'#fff'}}>Pass</button>
            <button onClick={onPursue}
              className="py-3 rounded-2xl text-sm font-semibold text-white" style={{background:'#15803D'}}>Pursue →</button>
          </div>
        )}
      </div>
    </div>
  )
}
