import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Only send fields that exist — build a clean payload
    const payload: Record<string, any> = {
      email: body.email.toLowerCase().trim(),
      personal_email: body.personal_email || body.email,
    }

    if (body.name !== undefined) payload.name = body.name
    if (body.mobile !== undefined) payload.mobile = body.mobile
    if (body.title !== undefined) payload.title = body.title
    if (body.company !== undefined) payload.company = body.company
    if (body.city !== undefined) payload.city = body.city
    if (body.years_exp !== undefined) payload.years_exp = body.years_exp
    if (body.domain !== undefined) payload.domain = body.domain
    if (body.career !== undefined) payload.career = body.career
    if (body.looking_for !== undefined) payload.looking_for = body.looking_for
    if (body.status !== undefined) payload.status = body.status
    if (body.skills !== undefined) payload.skills = body.skills
    if (body.photo_url !== undefined) payload.photo_url = body.photo_url

    // Prompts — always include all 6 fields together
    if (body.prompt_1_q !== undefined) payload.prompt_1_q = body.prompt_1_q
    if (body.prompt_1_a !== undefined) payload.prompt_1_a = body.prompt_1_a
    if (body.prompt_2_q !== undefined) payload.prompt_2_q = body.prompt_2_q
    if (body.prompt_2_a !== undefined) payload.prompt_2_a = body.prompt_2_a
    if (body.prompt_3_q !== undefined) payload.prompt_3_q = body.prompt_3_q
    if (body.prompt_3_a !== undefined) payload.prompt_3_a = body.prompt_3_a

    console.log('[candidate/save] payload keys:', Object.keys(payload))
    console.log('[candidate/save] prompts:', {
      p1q: payload.prompt_1_q,
      p1a: payload.prompt_1_a,
      p2q: payload.prompt_2_q,
      p2a: payload.prompt_2_a,
    })

    const { error, data } = await admin
      .from('candidates')
      .upsert(payload, { onConflict: 'email' })
      .select()

    if (error) {
      console.error('[candidate/save] upsert error:', error)
      throw new Error(error.message)
    }

    console.log('[candidate/save] saved row:', JSON.stringify(data?.[0]).slice(0, 300))

    return NextResponse.json({ success: true, saved: data?.[0] })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[candidate/save] caught:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
