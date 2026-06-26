import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { candidate_email, jd_id } = await req.json()
    if (!candidate_email || !jd_id) return NextResponse.json({ ok: true })
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    await db.from('jd_interests').upsert({ candidate_email, jd_id }, { onConflict: 'candidate_email,jd_id' })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
