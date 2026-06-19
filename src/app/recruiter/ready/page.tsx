'use client'
import { useRouter } from 'next/navigation'

export default function RecruiterReady() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center bg-gray-50">
      <div className="text-6xl mb-5">🎉</div>
      <h1 className="text-3xl font-bold mb-3" style={{fontFamily:'Georgia,serif',color:'#166534'}}>Your profile is ready!</h1>
      <p className="text-gray-500 mb-8 max-w-sm leading-relaxed">Candidates can now see who you are, where you've been and why they should work with you.</p>
      <div className="w-full max-w-sm mb-4 p-5 rounded-2xl border-2 cursor-pointer text-left transition-all hover:shadow-md"
        style={{background:'white',borderColor:'#BBF7D0',boxShadow:'0 4px 16px rgba(22,163,74,0.1)'}}
        onClick={() => router.push('/recruiter/jd-builder')}>
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{background:'#F0FDF4',border:'1px solid #BBF7D0'}}>📋</div>
          <div>
            <p className="font-bold" style={{color:'#166534'}}>Create your first JD</p>
            <p className="text-xs" style={{color:'#16A34A'}}>Honest JDs get better candidates</p>
          </div>
          <span className="ml-auto text-xl" style={{color:'#16A34A'}}>›</span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed pl-16">Role title · Real Tuesday tasks · Must-have skills · Non-negotiables · Interview process.</p>
      </div>
      <p className="text-gray-400 text-sm mb-3">or</p>
      <button className="btn-outline max-w-sm py-3 text-sm text-gray-500" onClick={() => router.push('/home')}>Skip — go to my dashboard</button>
    </div>
  )
}
