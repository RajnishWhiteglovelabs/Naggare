import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { emailCandidateProfileComplete } from '@/lib/emails'

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { subject, html } = emailCandidateProfileComplete(name || email.split('@')[0])
    await resend.emails.send({ from: 'Naggare <naggare@naggare.com>', to: email, subject, html })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
