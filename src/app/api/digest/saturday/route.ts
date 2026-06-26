import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { emailCandidateSaturday } from '@/lib/emails'

function getResend() { const { Resend } = require('resend'); return new Resend(process.env.RESEND_API_KEY) }

export async function GET() {
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const resend = getResend()
    const FROM = 'Naggare <naggare@naggare.com>'

    const { data: candidates } = await db.from('candidates').select('email,name').eq('status','active')
    if (candidates) {
      for (const c of candidates) {
        const { subject, html } = emailCandidateSaturday(c.name)
        await resend.emails.send({ from: FROM, to: c.email, subject, html })
      }
    }

    return NextResponse.json({ success: true, sent: candidates?.length })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
