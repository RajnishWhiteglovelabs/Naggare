import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const recruiter_email = searchParams.get('recruiter_email')
    const status = searchParams.get('status') || 'open'

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    let query = admin.from('jds').select('*').eq('status', status).order('created_at', { ascending: false })
    if (recruiter_email) query = query.eq('recruiter_email', recruiter_email)

    const { data, error } = await query
    if (error) throw new Error(error.message)

    return NextResponse.json(data || [])
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
