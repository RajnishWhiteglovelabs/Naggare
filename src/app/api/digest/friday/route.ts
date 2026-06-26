import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { emailRecruiterFriday } from '@/lib/emails'

function getResend() { const { Resend } = require('resend'); return new Resend(process.env.RESEND_API_KEY) }

export async function GET() {
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const resend = getResend()
    const FROM = 'Naggare <naggare@naggare.com>'
    const now = new Date().toISOString()
    const soonDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: recruiters } = await db.from('recruiters').select('email,name').eq('status','active')
    if (recruiters) {
      for (const r of recruiters) {
        const [{ count: pendingChats }, { count: expiringJds }] = await Promise.all([
          db.from('chat_sessions').select('*', { count: 'exact', head: true })
            .eq('recruiter_email', r.email).eq('status','pending').lt('expires_at', now),
          db.from('jds').select('*', { count: 'exact', head: true })
            .eq('recruiter_email', r.email).eq('status','open').lt('expires_at', soonDate),
        ])
        const { subject, html } = emailRecruiterFriday(r.name, pendingChats || 0, expiringJds || 0)
        await resend.emails.send({ from: FROM, to: r.email, subject, html })
      }
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
