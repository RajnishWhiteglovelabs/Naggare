import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { recruiter_email, candidate_email, action, jd_id } = await req.json()
    if (!recruiter_email || !candidate_email || !action) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Upsert the match record
    const { error, data } = await admin
      .from('matches')
      .upsert({
        recruiter_email: recruiter_email.toLowerCase(),
        candidate_email: candidate_email.toLowerCase(),
        recruiter_action: action, // 'pass' | 'pursue' | 'golden_buzzer'
        jd_id: jd_id || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'recruiter_email,candidate_email' })
      .select()

    if (error) throw new Error(error.message)

    // Check if it's a mutual match (candidate also expressed interest)
    const { data: candidateMatch } = await admin
      .from('matches')
      .select('candidate_action')
      .eq('recruiter_email', recruiter_email.toLowerCase())
      .eq('candidate_email', candidate_email.toLowerCase())
      .single()

    const isMutual = candidateMatch?.candidate_action === 'interested' || candidateMatch?.candidate_action === 'super_pursue'

    return NextResponse.json({ success: true, mutual: isMutual && action !== 'pass' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
