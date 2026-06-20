import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { emailCandidateWelcome, emailRecruiterWelcome } from '@/lib/emails'

export async function POST(req: NextRequest) {
  try {
    const { email, name, type } = await req.json()
    if (!email || !name || !type) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { subject, html } = type === 'candidate' ? emailCandidateWelcome(name) : emailRecruiterWelcome(name)
    await resend.emails.send({ from: 'Naggare <naggare@naggare.com>', to: email, subject, html })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
