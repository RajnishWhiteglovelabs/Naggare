import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const { data: candidate } = await supabaseAdmin
      .from('candidates')
      .select('*')
      .ilike('email', email.toLowerCase())
      .single()

    if (candidate) return NextResponse.json({ type: 'candidate', ...candidate })

    const { data: recruiter } = await supabaseAdmin
      .from('recruiters')
      .select('*')
      .ilike('email', email.toLowerCase())
      .single()

    if (recruiter) return NextResponse.json({ type: 'recruiter', ...recruiter })

    return NextResponse.json({ error: 'No profile found' }, { status: 404 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
