import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const resend = new Resend(process.env.RESEND_API_KEY)

    await admin.from('otp_codes').delete().eq('email', email.toLowerCase()).eq('used', false)

    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    const { error: dbError } = await admin.from('otp_codes').insert({
      email: email.toLowerCase(), code, expires_at: expiresAt.toISOString(),
    })
    if (dbError) throw new Error(dbError.message)

    await resend.emails.send({
      from: 'Naggare <naggare@naggare.com>',
      to: email,
      subject: 'Your Naggare verification code',
      html: `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#F1EFE8;margin:0;padding:32px;">
        <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #D3D1C7;">
          <div style="height:3px;background:#EF9F27;"></div>
          <div style="background:linear-gradient(135deg,#3C3489,#534AB7);padding:28px 32px;">
            <div style="font-size:20px;font-weight:700;color:#fff;font-family:Raleway,sans-serif;">Naggare</div>
            <div style="font-size:10px;color:#AFA9EC;letter-spacing:0.15em;text-transform:uppercase;margin-top:2px;">HIRING, HUMANISED.</div>
            <div style="font-size:18px;font-weight:500;color:#fff;margin-top:16px;">Your verification code</div>
          </div>
          <div style="padding:28px 32px;">
            <p style="color:#2C2C2A;font-size:14px;margin:0 0 20px;">Here's your one-time sign-in code:</p>
            <div style="background:#EEEDFE;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
              <div style="font-size:40px;font-weight:700;color:#26215C;letter-spacing:12px;font-family:monospace;">${code}</div>
              <div style="font-size:12px;color:#888;margin-top:8px;">Valid for 10 minutes · Single use</div>
            </div>
            <div style="background:#FAEEDA;border-radius:8px;padding:12px 16px;font-size:13px;color:#26215C;">
              If you didn't request this, you can safely ignore this email.
            </div>
          </div>
          <div style="padding:16px 32px;text-align:center;font-size:11px;color:#888;">
            Naggare · Whiteglove Labs · Hyderabad
          </div>
        </div>
      </body></html>`
    })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
