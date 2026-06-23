import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const recruiter_email = searchParams.get('recruiter_email')

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    let query = admin.from('jds').select('*').order('created_at', { ascending: false })

    if (recruiter_email) {
      // For recruiter's own JDs — show all except deleted
      query = query.eq('recruiter_email', recruiter_email).neq('status', 'deleted')
    } else {
      // For candidates — show only open JDs
      query = query.eq('status', 'open')
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return NextResponse.json(data || [])
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, close_reason } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const payload: Record<string, any> = { status }
    if (close_reason) payload.close_reason = close_reason

    const { error } = await admin.from('jds').update(payload).eq('id', id)
    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown' }, { status: 500 })
  }
}
