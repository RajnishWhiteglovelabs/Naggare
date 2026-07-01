'use client'

// Shared recruiter profile card — single source of truth.
// Used on candidate home (tap "Meet the recruiter") and candidate inbox (tap name/photo).
export default function RecruiterProfileCard({ recruiter, onClose }: { recruiter: any; onClose: () => void }) {
  if (!recruiter) return null
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{background:'#f5f5f5',fontFamily:'Raleway,sans-serif'}}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button className="text-2xl text-indigo-600" onClick={onClose}>‹</button>
        <h2 className="text-base font-bold">Recruiter Profile</h2>
      </div>
      <div style={{maxWidth:'420px',margin:'0 auto',paddingBottom:'80px',paddingTop:'16px'}}>
        <div className="rounded-3xl overflow-hidden shadow-xl" style={{border:'1px solid #E0E7FF'}}>

          {/* Hero */}
          <div className="flex flex-col items-center pt-8 pb-6 px-4 text-center"
            style={{background:'linear-gradient(160deg,#4F46E5,#7C3AED)'}}>
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-3 flex items-center justify-center text-white font-bold text-2xl"
              style={{background:'rgba(255,255,255,0.2)'}}>
              {recruiter?.photo_url
                ? <img src={recruiter.photo_url} className="w-full h-full object-cover" alt={recruiter.name}/>
                : <span>{recruiter.name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase()}</span>}
            </div>
            <p className="text-xl font-bold text-white mb-0.5" style={{fontFamily:'Georgia,serif'}}>{recruiter.name}</p>
            <p className="text-sm font-semibold" style={{color:'#C7D2FE'}}>{recruiter.title}</p>
            <p className="text-xs mt-0.5" style={{color:'#A5B4FC'}}>{recruiter.company}</p>
          </div>

          {/* Hiring philosophy */}
          {recruiter.looking_for && (
            <div className="p-4 border-b border-gray-100 bg-white">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">My Hiring Philosophy</p>
              <p className="text-sm leading-relaxed text-gray-800">{recruiter.looking_for}</p>
            </div>
          )}

          {/* Skills */}
          {recruiter.skills?.length > 0 && (
            <div className="p-4 border-b border-gray-100 bg-white">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Skills I hire for · {recruiter.skills.length}</p>
              <div className="flex flex-wrap gap-1.5">
                {recruiter.skills.map((s:string) => <span key={s} className="tag">{s}</span>)}
              </div>
            </div>
          )}

          {/* Prompts */}
          {[recruiter.prompt_1_q, recruiter.prompt_2_q, recruiter.prompt_3_q].filter(Boolean).length > 0 && (
            <div className="p-4 bg-white">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">In My Own Words</p>
              {[
                {q:recruiter.prompt_1_q, a:recruiter.prompt_1_a},
                {q:recruiter.prompt_2_q, a:recruiter.prompt_2_a},
                {q:recruiter.prompt_3_q, a:recruiter.prompt_3_a},
              ].filter(p=>p.q&&p.a).map((p,i)=>(
                <div key={i} className="mb-3 p-4 rounded-2xl" style={{background:'#EEF2FF',border:'0.5px solid #C7D2FE'}}>
                  <p className="text-xs font-bold mb-2" style={{color:'#3730A3'}}>{p.q}</p>
                  <p className="text-sm leading-relaxed text-gray-800">{p.a}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
