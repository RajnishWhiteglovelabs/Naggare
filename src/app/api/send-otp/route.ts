import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    // Delete any existing unused OTPs for this email
    await supabase.from('otp_codes').delete().eq('email', email.toLowerCase()).eq('used', false)

    // Generate new OTP
    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store in DB
    const { error: dbError } = await supabase.from('otp_codes').insert({
      email: email.toLowerCase(),
      code,
      expires_at: expiresAt.toISOString(),
    })
    if (dbError) throw new Error(dbError.message)

    // Send via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'Naggare <naggare@naggare.com>',
      to: email,
      subject: 'Your Naggare verification code',
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F1EFE8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #D3D1C7;">
    <div style="height:3px;background:#EF9F27;"></div>
    <div style="background:linear-gradient(135deg,#3C3489 0%,#534AB7 100%);padding:32px 40px 28px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <div style="background:rgba(255,255,255,0.12);border-radius:8px;padding:6px 10px;display:inline-flex;align-items:center;">
          <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-1px;">N</span>
          <span style="width:6px;height:6px;border-radius:50%;background:#EF9F27;display:inline-block;margin-left:2px;vertical-align:top;margin-top:3px;"></span>
        </div>
        <div>
          <div style="font-size:16px;font-weight:500;color:#ffffff;">Naggare</div>
          <div style="font-size:10px;color:#AFA9EC;letter-spacing:0.07em;text-transform:uppercase;">Hiring, Humanised</div>
        </div>
      </div>
      <div style="font-size:20px;font-weight:500;color:#ffffff;line-height:1.35;margin-bottom:6px;">Verify your email to get started.</div>
      <div style="font-size:12px;color:#AFA9EC;line-height:1.5;">One code. One step. Then you're in.</div>
    </div>
    <div style="padding:32px 40px;">
      <p style="font-size:14px;color:#2C2C2A;line-height:1.8;margin:0 0 14px;">Hi there,</p>
      <p style="font-size:14px;color:#2C2C2A;line-height:1.8;margin:0 0 20px;">Here's your one-time code to verify your email and continue building your Naggare profile.</p>
      <div style="background:#EEEDFE;border-left:3px solid #7F77DD;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <div style="font-size:10px;font-weight:500;letter-spacing:0.07em;text-transform:uppercase;color:#534AB7;margin-bottom:8px;">Your verification code</div>
        <div style="text-align:center;padding:12px 0;">
          <div style="font-size:40px;font-weight:700;color:#26215C;letter-spacing:12px;font-family:monospace;">${code}</div>
          <div style="font-size:11px;color:#888780;margin-top:8px;">Valid for 10 minutes · Single use only</div>
        </div>
      </div>
      <div style="background:#FAEEDA;border-left:3px solid #EF9F27;border-radius:8px;padding:16px 20px;">
        <div style="font-size:13px;color:#26215C;line-height:1.6;">If you didn't create a Naggare account, you can safely ignore this email.</div>
      </div>
    </div>
    <div style="height:1px;background:#D3D1C7;"></div>
    <div style="padding:16px 32px;text-align:center;font-size:11px;color:#888780;line-height:1.6;">
      Naggare · Whiteglove Labs · Hyderabad · <a href="mailto:hello@naggare.com" style="color:#534AB7;text-decoration:none;">hello@naggare.com</a>
    </div>
  </div>
</body>
</html>`
    })

    if (emailError) throw new Error(emailError.message)

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
