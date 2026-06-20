import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { emailCandidateJDClosed, emailRecruiterJDDeleted } from '@/lib/emails'

function getResend() { const { Resend } = require('resend'); return new Resend(process.env.RESEND_API_KEY) }

export async function POST(req: NextRequest) {
  try {
    const { recruiterEmail, recruiterName, candidateEmails, candidateNames, role, company } = await req.json()

    // Notify recruiter
    const r = emailRecruiterJDDeleted(recruiterName, role, company)
    const sends = [getResend().emails.send({ from: 'Naggare <naggare@naggare.com>', to: recruiterEmail, subject: r.subject, html: r.html })]

    // Notify all candidates who expressed interest
    if (Array.isArray(candidateEmails)) {
      candidateEmails.forEach((email: string, i: number) => {
        const name = candidateNames?.[i] ?? 'there'
        const c = emailCandidateJDClosed(name, role, company)
        sends.push(getResend().emails.send({ from: 'Naggare <naggare@naggare.com>', to: email, subject: c.subject, html: c.html }))
      })
    }

    await Promise.all(sends)
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
