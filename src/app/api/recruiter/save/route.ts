import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const payload: Record<string, any> = {
      email: body.email.toLowerCase().trim(),
    }

    if (body.personal_email !== undefined) payload.personal_email = body.personal_email
    if (body.name !== undefined) payload.name = body.name
    if (body.mobile !== undefined) payload.mobile = body.mobile
    if (body.company !== undefined) payload.company = body.company
    if (body.title !== undefined) payload.title = body.title
    if (body.domain !== undefined) payload.domain = body.domain
    if (body.photo_url !== undefined) payload.photo_url = body.photo_url
    if (body.looking_for !== undefined) payload.looking_for = body.looking_for
    if (body.status !== undefined) payload.status = body.status
    if (body.seat_type !== undefined) payload.seat_type = body.seat_type
    if (body.skills !== undefined) payload.skills = body.skills
    if (body.prompt_1_q !== undefined) payload.prompt_1_q = body.prompt_1_q
    if (body.prompt_1_a !== undefined) payload.prompt_1_a = body.prompt_1_a
    if (body.prompt_2_q !== undefined) payload.prompt_2_q = body.prompt_2_q
    if (body.prompt_2_a !== undefined) payload.prompt_2_a = body.prompt_2_a
    if (body.prompt_3_q !== undefined) payload.prompt_3_q = body.prompt_3_q
    if (body.prompt_3_a !== undefined) payload.prompt_3_a = body.prompt_3_a

    const { error, data } = await admin
      .from('recruiters')
      .upsert(payload, { onConflict: 'email' })
      .select()

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, saved: data?.[0] })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
