import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { emailCandidateMatch, emailRecruiterMatch } from '@/lib/emails'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const {
      candidateEmail, candidateName,
      recruiterEmail, recruiterName,
      role, company, exp, skills
    } = await req.json()

    const c = emailCandidateMatch(candidateName, role, company)
    const r = emailRecruiterMatch(recruiterName, candidateName, role, exp, skills)

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
