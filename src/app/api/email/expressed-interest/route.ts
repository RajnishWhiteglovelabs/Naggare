import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { emailCandidateExpressedInterest, emailRecruiterCandidateInterested } from '@/lib/emails'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const {
      candidateEmail, candidateName,
      recruiterEmail, recruiterName,
      role, company, candidateRole, candidateExp, skills
    } = await req.json()

    const c = emailCandidateExpressedInterest(candidateName, role, company)
    const r = emailRecruiterCandidateInterested(recruiterName, role, candidateName, candidateRole, candidateExp, skills)

    await Promise.all([
      resend.emails.send({ from: 'Naggare <naggare@naggare.com>', to: candidateEmail, subject: c.subject, html: c.html }),
      resend.emails.send({ from: 'Naggare <naggare@naggare.com>', to: recruiterEmail, subject: r.subject, html: r.html }),
    ])

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
