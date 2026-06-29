'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

export default function Landing() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => setChecking(false), 1500)
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.email) {
          const res = await fetch('/api/me', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.user.email }),
          })
          if (res.ok) {
            clearTimeout(timeout)
            const profile = await res.json()
            router.push(profile.type === 'recruiter' ? '/recruiter/home' : '/home')
            return
          }
        }
      } catch { /* silently fail */ }
      clearTimeout(timeout)
      setChecking(false)
    }
    checkSession()
    return () => clearTimeout(timeout)
  }, [])

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-sm" style={{color:'#6366F1',fontFamily:'Raleway,sans-serif'}}>Loading Naggare...</div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{fontFamily:'Raleway,sans-serif'}}>

      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>
            <span className="text-sm font-bold text-white" style={{fontFamily:'Georgia,serif'}}>N</span>
          </div>
          <span className="font-bold text-lg" style={{color:'#1E1B4B',fontFamily:'Georgia,serif'}}>Naggare</span>
        </div>
        <button onClick={() => router.push('/signin')}
          className="text-sm font-semibold px-4 py-2 rounded-full border"
          style={{borderColor:'#E0E7FF',color:'#4F46E5'}}>
          Sign in
        </button>
      </nav>

      {/* SCROLLING FOUNDER STRIP */}
      <div className="overflow-hidden py-2.5 border-b border-indigo-100" style={{background:'#EEF2FF'}}>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-track {
            display: flex;
            width: max-content;
            animation: marquee 28s linear infinite;
          }
          .marquee-track:hover { animation-play-state: paused; }
        `}</style>
        <div className="marquee-track">
          {[0,1].map(copy => (
            <div key={copy} className="flex items-center gap-8 px-6" style={{whiteSpace:'nowrap'}}>
              <span className="text-xs font-semibold" style={{color:'#4F46E5'}}>
                ✦ &ldquo;22 years in Talent Acquisition taught me one thing — the best hires happen when both sides are honest about what they want. Naggare is built on that belief.&rdquo;
              </span>
              <span className="text-xs font-bold" style={{color:'#7C3AED'}}>— Rajnish Alexander, Founder</span>
              <span className="text-xs" style={{color:'#C7D2FE'}}>✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section className="flex flex-col items-center text-center px-6 pt-16 pb-12" style={{background:'linear-gradient(160deg,#EEF2FF 0%,#F5F3FF 50%,#ffffff 100%)'}}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold tracking-wider uppercase"
          style={{background:'#E0E7FF',color:'#4F46E5'}}>
          Hiring, Humanised.
        </div>
        <h1 className="text-4xl font-bold leading-tight mb-4 max-w-md" style={{color:'#1E1B4B',fontFamily:'Georgia,serif',lineHeight:'1.2'}}>
          High quality signals.<br/>Before the first call.
        </h1>
        <p className="text-base leading-relaxed mb-8 max-w-sm" style={{color:'#6B7280'}}>
          Naggare is a mutual-match hiring platform. Candidates express interest. Recruiters pursue. A conversation only starts when both sides are ready.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button className="btn-primary text-base py-4" onClick={() => router.push('/signup?type=candidate')}>
            I&apos;m looking for a job →
          </button>
          <button className="btn-green text-base py-4" onClick={() => router.push('/signup?type=recruiter')}>
            I&apos;m hiring →
          </button>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="px-6 py-14 max-w-lg mx-auto w-full">
        <p className="text-xs font-bold uppercase tracking-widest mb-6 text-center" style={{color:'#4F46E5'}}>Sound familiar?</p>
        <div className="flex flex-col gap-4">
          {[
            { emoji: '😔', text: 'You spent hours on an application form that asked for your resume — then made you type it all out again. Here you build once, in under 5 minutes.' },
            { emoji: '💸', text: 'You paid a premium for a resume builder. Got 2 views. Both were bots.' },
            { emoji: '✨', text: 'Your profile is more than a resume — a persona, a craft, a fun colleague. But no one ever gave you the space to show it. Until now.' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-2xl" style={{background:'#F9FAFB',border:'1px solid #F3F4F6'}}>
              <span className="text-xl flex-shrink-0">{item.emoji}</span>
              <p className="text-sm leading-relaxed" style={{color:'#374151'}}>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="px-6 py-14 max-w-lg mx-auto w-full">
        <p className="text-xs font-bold uppercase tracking-widest mb-2 text-center" style={{color:'#4F46E5'}}>The old way vs the Naggare way</p>
        <h2 className="text-2xl font-bold text-center mb-8" style={{color:'#1E1B4B',fontFamily:'Georgia,serif'}}>Stop applying. Start being found.</h2>

        <div className="grid grid-cols-2 gap-4">

          {/* BEFORE */}
          <div className="rounded-3xl p-5" style={{background:'#FEF2F2',border:'1px solid #FECACA'}}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">😓</span>
              <p className="text-xs font-bold uppercase tracking-wider" style={{color:'#DC2626'}}>The old way</p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                {n:'50', label:'jobs applied to'},
                {n:'5', label:'heard back from'},
                {n:'3', label:'got screened by'},
                {n:'1', label:'moved forward with'},
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm" style={{background:'#FEE2E2',color:'#DC2626'}}>
                    {item.n}
                  </div>
                  <p className="text-xs leading-snug" style={{color:'#7F1D1D'}}>{item.label}</p>
                </div>
              ))}
              <div className="mt-2 pt-3 border-t border-red-200">
                <p className="text-xs italic" style={{color:'#DC2626'}}>Exhausting. Demoralising. Months of effort.</p>
              </div>
            </div>
          </div>

          {/* AFTER */}
          <div className="rounded-3xl p-5" style={{background:'#EEF2FF',border:'1px solid #C7D2FE'}}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">✨</span>
              <p className="text-xs font-bold uppercase tracking-wider" style={{color:'#4F46E5'}}>The Naggare way</p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                {icon:'👤', label:'Build profile once'},
                {icon:'💻', label:'18 min session with Edna — show your skills'},
                {icon:'⭐', label:'Get your Naggare Score'},
                {icon:'📬', label:'Sit back'},
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base" style={{background:'#E0E7FF'}}>
                    {item.icon}
                  </div>
                  <p className="text-xs leading-snug" style={{color:'#1E1B4B'}}>{item.label}</p>
                </div>
              ))}
              <div className="mt-2 pt-3 border-t border-indigo-200">
                <p className="text-xs font-bold" style={{color:'#4F46E5'}}>Recruiters come to you.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Power statement */}
        <div className="mt-6 p-5 rounded-3xl text-center" style={{background:'linear-gradient(135deg,#1E1B4B,#312E81)'}}>
          <p className="text-sm font-bold text-white mb-1" style={{fontFamily:'Georgia,serif'}}>
            Being good at your job should be enough.
          </p>
          <p className="text-xs" style={{color:'#A5B4FC'}}>
            You don&apos;t need to be good at applying. On Naggare, your score speaks for you.
          </p>
        </div>
      </section>

      {/* JOURNEY COMPARISON */}
      <section className="px-6 py-14 max-w-lg mx-auto w-full">
        <p className="text-xs font-bold uppercase tracking-widest mb-2 text-center" style={{color:'#4F46E5'}}>Time is your most valuable asset</p>
        <h2 className="text-2xl font-bold text-center mb-8" style={{color:'#1E1B4B',fontFamily:'Georgia,serif'}}>3-6 weeks vs 35 minutes.</h2>

        {/* Broken journey */}
        <div className="rounded-3xl p-5 mb-4" style={{background:'#FEF2F2',border:'1px solid #FECACA'}}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">😔</span>
            <p className="text-xs font-bold uppercase tracking-wider" style={{color:'#DC2626'}}>Current candidate journey (broken)</p>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              {step:'1', text:'Build resume', time:'2–3 hours'},
              {step:'2', text:'Find jobs', time:'Hours of searching'},
              {step:'3', text:'Write cover letter per application', time:'30 min each'},
              {step:'4', text:'Fill application forms', time:'30 min each'},
              {step:'5', text:'Wait for response', time:'Days to weeks, usually silence'},
              {step:'6', text:'Phone screen with recruiter', time:'30–45 min just to establish basics'},
              {step:'7', text:'Technical screen', time:'60–90 min'},
              {step:'8', text:'More rounds', time:'Weeks'},
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5" style={{background:'#FEE2E2',color:'#DC2626'}}>
                  {item.step}
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold" style={{color:'#7F1D1D'}}>{item.text}</span>
                  <span className="text-xs" style={{color:'#DC2626'}}> — {item.time}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-red-200 text-center">
            <p className="text-xs font-bold" style={{color:'#DC2626'}}>Total time before a real conversation:</p>
            <p className="text-sm font-bold mt-0.5" style={{color:'#7F1D1D'}}>3–6 weeks minimum. Often never.</p>
          </div>
        </div>

        {/* Naggare journey */}
        <div className="rounded-3xl p-5" style={{background:'#EEF2FF',border:'1px solid #C7D2FE'}}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">✨</span>
            <p className="text-xs font-bold uppercase tracking-wider" style={{color:'#4F46E5'}}>Naggare candidate journey</p>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              {step:'1', text:'Build profile once', time:'Under 5 minutes', done:true},
              {step:'2', text:'Browse JDs, tap Interested', time:'1 tap', done:true},
              {step:'3', text:'18 min session with Edna', time:'8 min refactoring + 10 min design', done:false},
              {step:'4', text:'Recruiter sees full signal, pursues', time:'No screening call needed', done:false},
              {step:'5', text:'First conversation is a real interview', time:'Not a screen', done:false},
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5" style={{background:'#E0E7FF',color:'#4F46E5'}}>
                  {item.step}
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold" style={{color:'#1E1B4B'}}>{item.text}</span>
                  <span className="text-xs" style={{color:'#4F46E5'}}> — {item.time}</span>
                  {item.done && <span className="ml-1 text-xs" style={{color:'#15803D'}}>✅</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-indigo-200 text-center">
            <p className="text-xs font-bold" style={{color:'#4F46E5'}}>Total time before a real conversation:</p>
            <p className="text-sm font-bold mt-0.5" style={{color:'#1E1B4B'}}>35 minutes of candidate effort. Ever.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-14 max-w-lg mx-auto w-full" style={{background:'#F5F3FF',borderRadius:'24px',margin:'0 auto 40px',maxWidth:'480px'}}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2 text-center" style={{color:'#4F46E5'}}>How Naggare works</p>
        <h2 className="text-2xl font-bold text-center mb-8" style={{color:'#1E1B4B',fontFamily:'Georgia,serif'}}>Mutual interest. Before hello.</h2>
        <div className="flex flex-col gap-6">
          {[
            { step: '01', title: 'Build your profile', desc: 'Candidates and recruiters both build rich profiles — not just a CV or a job spec. Persona, philosophy, what you&apos;re really looking for.' },
            { step: '02', title: 'Browse and signal', desc: 'Candidates swipe on JDs. Recruiters browse candidates. Both sides signal interest independently — no cold outreach.' },
            { step: '03', title: 'Mutual match unlocks chat', desc: 'Only when both sides have shown interest does a conversation open. No more black holes. No more spam.' },
            { step: '04', title: 'Hire with context', desc: 'By the time you speak, you already know each other. The first call is a real conversation, not a screening.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>
                {item.step}
              </div>
              <div>
                <p className="font-bold text-sm mb-1" style={{color:'#1E1B4B'}}>{item.title}</p>
                <p className="text-sm leading-relaxed" style={{color:'#6B7280'}}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOR CANDIDATES / RECRUITERS */}
      <section className="px-6 py-14 max-w-lg mx-auto w-full">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl" style={{background:'#EEF2FF',border:'1px solid #C7D2FE'}}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'#4F46E5'}}>For Candidates</p>
            <ul className="flex flex-col gap-2">
              {['No more black holes','High quality signals before the first call','Only talk to recruiters who are serious','Free. Always.'].map((t,i) => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{color:'#374151'}}>
                  <span style={{color:'#4F46E5',flexShrink:0}}>✓</span>{t}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5 rounded-2xl" style={{background:'#F0FDF4',border:'1px solid #BBF7D0'}}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'#15803D'}}>For Recruiters</p>
            <ul className="flex flex-col gap-2">
              {['Only engage with interested candidates','High quality signals before the first call','No cold outreach needed','₹2,000/month per seat'].map((t,i) => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{color:'#374151'}}>
                  <span style={{color:'#15803D',flexShrink:0}}>✓</span>{t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>



      {/* MANIFESTO */}
      <section className="px-6 py-14 max-w-lg mx-auto w-full">
        <div className="rounded-3xl p-8 text-center" style={{background:'linear-gradient(160deg,#1E1B4B,#312E81)'}}>
          <p className="text-2xl font-bold text-white mb-6 leading-snug" style={{fontFamily:'Georgia,serif'}}>
            Being good at your job should be enough.
          </p>
          <div className="flex flex-col gap-3 mb-8 text-left">
            {[
              "You don’t need to be good at applying.",
              "You don’t need to know how to write a resume.",
              "You don’t need to network your way into interviews.",
            ].map((line, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0" style={{color:'#F87171'}}>✕</span>
                <p className="text-sm" style={{color:'#C7D2FE'}}>{line}</p>
              </div>
            ))}
          </div>
          <div className="h-px mb-8" style={{background:'rgba(255,255,255,0.1)'}}/>
          <p className="text-lg font-bold text-white mb-2" style={{fontFamily:'Georgia,serif'}}>
            You just need to be good.
          </p>
          <p className="text-sm" style={{color:'#A5B4FC'}}>
            Naggare proves it for you — to every recruiter on the platform.
          </p>
          <p className="text-xs mt-2 font-semibold uppercase tracking-wider" style={{color:'#6366F1'}}>
            We’re the first hiring platform built on that belief.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-14 flex flex-col items-center text-center" style={{background:'linear-gradient(160deg,#4F46E5,#7C3AED)'}}>
        <h2 className="text-2xl font-bold text-white mb-2" style={{fontFamily:'Georgia,serif'}}>Ready to hire differently?</h2>
        <p className="text-sm mb-8" style={{color:'#C7D2FE'}}>Join candidates and recruiters who believe hiring can be better.</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button className="py-4 rounded-full text-sm font-bold text-indigo-700 bg-white hover:bg-indigo-50 transition-colors"
            onClick={() => router.push('/signup?type=candidate')}>
            Join as Candidate →
          </button>
          <button className="py-4 rounded-full text-sm font-bold border-2 border-white text-white hover:bg-white hover:text-indigo-700 transition-colors"
            onClick={() => router.push('/signup?type=recruiter')}>
            Join as Recruiter / TA →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-6 flex items-center justify-between border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>
            <span className="text-xs font-bold text-white" style={{fontFamily:'Georgia,serif'}}>N</span>
          </div>
          <span className="text-xs font-semibold" style={{color:'#1E1B4B',fontFamily:'Georgia,serif'}}>Naggare</span>
        </div>
        <p className="text-xs" style={{color:'#9CA3AF'}}>© 2025 Whiteglove Labs. Hyderabad.</p>
      </footer>

    </div>
  )
}
