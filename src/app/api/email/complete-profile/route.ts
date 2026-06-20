import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { emailCandidateCompleteProfile } from '@/lib/emails'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()
    const { subject, html } = emailCandidateCompleteProfile(name, email)
    await resend.emails.send({ from: 'Naggare <naggare@naggare.com>', to: email, subject, html })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
