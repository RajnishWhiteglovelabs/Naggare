import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()
    if (!email || !code) {
      return NextResponse.json({ error: 'Missing email or code' }, { status: 400 })
    }

    // Find valid OTP
    const { data: otpRecord, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
    }

    // Mark as used
    await supabase.from('otp_codes').update({ used: true }).eq('id', otpRecord.id)

    // Create or get user via admin API
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: true,
    })

    let userId = userData?.user?.id

    // If user already exists, just get them
    if (userError && userError.message.includes('already been registered')) {
      const { data: existingUser } = await supabase.auth.admin.listUsers()
      const found = existingUser?.users?.find((u: any) => u.email === email.toLowerCase())
      userId = found?.id
    }

    if (!userId) {
      return NextResponse.json({ error: 'Could not create user' }, { status: 500 })
    }

    // Generate a session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email.toLowerCase(),
    })

    if (sessionError) throw new Error(sessionError.message)

    return NextResponse.json({ success: true, userId, actionLink: sessionData?.properties?.action_link })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
