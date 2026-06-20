import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { emailCandidateSuperPursued, emailRecruiterSuperPursued } from '@/lib/emails'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const {
      candidateEmail, candidateName,
      recruiterEmail, recruiterName, recruiterTitle,
      company, candidateRole, candidateExp, skills
    } = await req.json()

    const c = emailCandidateSuperPursued(candidateName, recruiterName, recruiterTitle, company)
    const r = emailRecruiterSuperPursued(recruiterName, candidateName, candidateRole, candidateExp, skills)

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
