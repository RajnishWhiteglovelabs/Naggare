import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { emailRecruiterMonday, emailCandidateMonday } from '@/lib/emails'

function getResend() { const { Resend } = require('resend'); return new Resend(process.env.RESEND_API_KEY) }

export async function GET() {
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const resend = getResend()
    const FROM = 'Naggare <naggare@naggare.com>'
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const now = new Date().toISOString()

    // Recruiter emails
    const { data: recruiters } = await db.from('recruiters').select('email,name').eq('status','active')
    if (recruiters) {
      for (const r of recruiters) {
        const [{ count: jdsLive }, { count: newCandidates }, { count: pendingChats }] = await Promise.all([
          db.from('jds').select('*', { count: 'exact', head: true }).eq('recruiter_email', r.email).eq('status','open'),
          db.from('candidates').select('*', { count: 'exact', head: true }).eq('status','active').gte('created_at', oneWeekAgo),
          db.from('chat_sessions').select('*', { count: 'exact', head: true }).eq('recruiter_email', r.email).eq('status','pending').lt('expires_at', now),
        ])
        const { subject, html } = emailRecruiterMonday(r.name, jdsLive || 0, newCandidates || 0, pendingChats || 0)
        await resend.emails.send({ from: FROM, to: r.email, subject, html })
      }
    }

    // Candidate emails
    const { data: candidates } = await db.from('candidates').select('email,name').eq('status','active')
    if (candidates) {
      for (const c of candidates) {
        const { subject, html } = emailCandidateMonday(c.name)
        await resend.emails.send({ from: FROM, to: c.email, subject, html })
      }
    }

    return NextResponse.json({ success: true, recruiters: recruiters?.length, candidates: candidates?.length })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
