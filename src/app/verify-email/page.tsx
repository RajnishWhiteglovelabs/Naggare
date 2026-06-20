'use client'
import { useRouter } from 'next/navigation'

export default function VerifyEmail() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-white">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>
            <span className="text-base font-bold text-white" style={{fontFamily:'Raleway,sans-serif'}}>N</span>
          </div>
          <span className="text-xl font-bold" style={{fontFamily:'Raleway,sans-serif',color:'#6366F1'}}>Naggare</span>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-2xl font-bold mb-2" style={{color:'#1E1B4B',fontFamily:'Raleway,sans-serif'}}>Check your inbox</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            We've sent you a verification link. Click it to verify your account, then come back and sign in.
          </p>
          <div className="p-4 rounded-xl mb-6 text-sm text-indigo-800 text-left" style={{background:'#EEF2FF',border:'0.5px solid #C7D2FE'}}>
            <strong>Next steps:</strong>
            <ol className="mt-2 space-y-1 list-decimal list-inside text-indigo-700">
              <li>Open the email from Naggare</li>
              <li>Click the verification link</li>
              <li>Sign in with your email and password</li>
              <li>Build your profile</li>
            </ol>
          </div>
          <button className="btn-primary" onClick={() => router.push('/signin')}>
            Go to Sign in →
          </button>
        </div>
      </div>
    </div>
  )
}
