import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Check candidates table - exclude deleted accounts
    const { data: candidate } = await admin.from('candidates').select('*').ilike('email', email.toLowerCase()).neq('status', 'deleted').single()
    if (candidate) return NextResponse.json({ type: 'candidate', ...candidate })

    // Check recruiters table - exclude deleted accounts
    const { data: recruiter } = await admin.from('recruiters').select('*').ilike('email', email.toLowerCase()).neq('status', 'deleted').single()
    if (recruiter) return NextResponse.json({ type: 'recruiter', ...recruiter })

    // No profile yet - check auth user metadata for intended type
    const { data: { users } } = await admin.auth.admin.listUsers()
    const authUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (authUser?.user_metadata?.type) {
      return NextResponse.json({ error: 'No profile found', intended_type: authUser.user_metadata.type }, { status: 404 })
    }

    return NextResponse.json({ error: 'No profile found' }, { status: 404 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
