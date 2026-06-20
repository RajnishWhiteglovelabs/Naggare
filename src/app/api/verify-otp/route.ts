import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()
    if (!email || !code) return NextResponse.json({ error: 'Missing email or code' }, { status: 400 })

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: otpRecord, error } = await admin
      .from('otp_codes').select('*')
      .eq('email', email.toLowerCase()).eq('code', code).eq('used', false)
      .gt('expires_at', new Date().toISOString()).single()

    if (error || !otpRecord) return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 })

    await admin.from('otp_codes').update({ used: true }).eq('id', otpRecord.id)

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
