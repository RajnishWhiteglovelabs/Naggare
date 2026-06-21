import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email, message } = await req.json()
    if (!message) return NextResponse.json({ error: 'Missing message' }, { status: 400 })

    await resend.emails.send({
      from: 'Naggare Feedback <naggare@naggare.com>',
      to: 'raj@whiteglovelabs.io',
      subject: `💬 Naggare Feedback from ${email}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
          <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);border-radius:16px;padding:24px;margin-bottom:24px;">
            <h1 style="color:white;margin:0;font-size:20px;">💬 New Feedback</h1>
            <p style="color:#C7D2FE;margin:4px 0 0;">From: ${email}</p>
          </div>
          <div style="background:#F9FAFB;border-radius:12px;padding:20px;border:1px solid #E5E7EB;">
            <p style="color:#111827;font-size:15px;line-height:1.7;white-space:pre-wrap;margin:0;">${message}</p>
          </div>
          <p style="color:#9CA3AF;font-size:12px;margin-top:16px;">Sent from naggare.com</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
