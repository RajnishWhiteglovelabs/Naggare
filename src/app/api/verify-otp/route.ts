import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
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
    const { data: otpRecord, error } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !otpRecord) {
      return NextResponse.json({ error: 'Incorrect code. Please check and try again.' }, { status: 400 })
    }

    // Mark OTP as used
    await supabaseAdmin.from('otp_codes').update({ used: true }).eq('id', otpRecord.id)

    // Get or create user
    let userId: string | undefined

    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: true,
    })

    if (userData?.user?.id) {
      userId = userData.user.id
    } else if (createError?.message?.includes('already been registered')) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      const found = list?.users?.find((u) => u.email === email.toLowerCase())
      userId = found?.id
    }

    if (!userId) {
      return NextResponse.json({ error: 'Could not create or find user' }, { status: 500 })
    }

    // Set a temporary password, sign in to get real session tokens, then remove password
    const tempPassword = `Naggare_${code}_${Date.now()}`

    await supabaseAdmin.auth.admin.updateUserById(userId, { password: tempPassword })

    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: tempPassword,
    })

    // Remove temp password immediately
    await supabaseAdmin.auth.admin.updateUserById(userId, { password: `Naggare_${Math.random()}_${Date.now()}` })

    if (signInError || !signInData?.session) {
      throw new Error(signInError?.message || 'Could not create session')
    }

    return NextResponse.json({
      success: true,
      userId,
      accessToken: signInData.session.access_token,
      refreshToken: signInData.session.refresh_token,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
