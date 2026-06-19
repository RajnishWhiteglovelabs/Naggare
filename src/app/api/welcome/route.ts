import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const candidateEmail = (name: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1E1B4B,#312e81);padding:40px 32px;text-align:center;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#4F46E5,#7C3AED);border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="color:white;font-size:32px;font-weight:bold;font-family:Georgia,serif;">N</span>
      </div>
      <h1 style="color:white;margin:0;font-family:Georgia,serif;font-size:28px;">Welcome to Naggare</h1>
      <p style="color:#A5B4FC;margin:8px 0 0;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Hiring, Humanised.</p>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#1E1B4B;font-family:Georgia,serif;margin:0 0 16px;">Hi ${name} 👋</h2>
      <p style="color:#374151;line-height:1.7;margin:0 0 16px;">Your candidate profile is live on Naggare. Recruiters can now discover you based on your persona, craft, and attitude — not just your CV.</p>
      <p style="color:#374151;line-height:1.7;margin:0 0 24px;">Here's what happens next:</p>
      <div style="background:#EEF2FF;border-radius:12px;padding:20px;margin:0 0 24px;">
        <p style="margin:0 0 12px;color:#3730A3;font-weight:600;">✅ Browse open roles that match your profile</p>
        <p style="margin:0 0 12px;color:#3730A3;font-weight:600;">🎯 Express interest — recruiters get notified</p>
        <p style="margin:0 0 12px;color:#3730A3;font-weight:600;">🤝 When there's a mutual match, the conversation begins</p>
        <p style="margin:0;color:#3730A3;font-weight:600;">🔒 Your details stay private until you both say yes</p>
      </div>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="https://naggare.com/signin" style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:white;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:600;font-size:15px;">View My Profile →</a>
      </div>
      <p style="color:#6B7280;font-size:13px;line-height:1.6;margin:0;">Questions? Reply to this email — we're a small team and we read every message.</p>
    </div>
    <div style="background:#F9FAFB;padding:20px 32px;text-align:center;border-top:1px solid #E5E7EB;">
      <p style="color:#9CA3AF;font-size:12px;margin:0;">Naggare · A Whiteglove Labs product · Hyderabad</p>
    </div>
  </div>
</body>
</html>
`

const recruiterEmail = (name: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#14532d,#166534);padding:40px 32px;text-align:center;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#16A34A,#15803D);border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="color:white;font-size:32px;font-weight:bold;font-family:Georgia,serif;">N</span>
      </div>
      <h1 style="color:white;margin:0;font-family:Georgia,serif;font-size:28px;">Welcome to Naggare</h1>
      <p style="color:#86EFAC;margin:8px 0 0;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Hiring, Humanised.</p>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#14532d;font-family:Georgia,serif;margin:0 0 16px;">Hi ${name} 👋</h2>
      <p style="color:#374151;line-height:1.7;margin:0 0 16px;">Your recruiter profile is live on Naggare. You can now post JDs and discover candidates who've already shown genuine interest in roles like yours.</p>
      <p style="color:#374151;line-height:1.7;margin:0 0 24px;">Here's how it works:</p>
      <div style="background:#F0FDF4;border-radius:12px;padding:20px;margin:0 0 24px;">
        <p style="margin:0 0 12px;color:#166534;font-weight:600;">📋 Post your JDs with real context — not just job specs</p>
        <p style="margin:0 0 12px;color:#166534;font-weight:600;">👥 Browse candidates who match what you're hiring for</p>
        <p style="margin:0 0 12px;color:#166534;font-weight:600;">⚡ Pass, Pursue, or Golden Buzzer — your call</p>
        <p style="margin:0;color:#166534;font-weight:600;">🤝 Matches happen only when both sides say yes</p>
      </div>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="https://naggare.com/signin" style="display:inline-block;background:linear-gradient(135deg,#16A34A,#15803D);color:white;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:600;font-size:15px;">Go to Dashboard →</a>
      </div>
      <p style="color:#6B7280;font-size:13px;line-height:1.6;margin:0;">Questions? Reply to this email — we're a small team and we read every message.</p>
    </div>
    <div style="background:#F9FAFB;padding:20px 32px;text-align:center;border-top:1px solid #E5E7EB;">
      <p style="color:#9CA3AF;font-size:12px;margin:0;">Naggare · A Whiteglove Labs product · Hyderabad</p>
    </div>
  </div>
</body>
</html>
`

export async function POST(req: NextRequest) {
  try {
    const { email, name, type } = await req.json()
    if (!email || !name || !type) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const html = type === 'candidate' ? candidateEmail(name) : recruiterEmail(name)
    const subject = type === 'candidate'
      ? `Welcome to Naggare, ${name.split(' ')[0]} — your profile is live 🎉`
      : `Welcome to Naggare, ${name.split(' ')[0]} — start finding the right talent 🎉`

    await resend.emails.send({
      from: 'Naggare <naggare@whiteglovelabs.io>',
      to: email,
      subject,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
