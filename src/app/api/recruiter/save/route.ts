import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const payload: Record<string, any> = {
      email: body.email.toLowerCase().trim(),
      personal_email: body.personal_email || body.email,
    }

    if (body.name !== undefined) payload.name = body.name
    if (body.mobile !== undefined) payload.mobile = body.mobile
    if (body.company !== undefined) payload.company = body.company
    if (body.title !== undefined) payload.title = body.title
    if (body.domain !== undefined) payload.domain = body.domain
    if (body.photo_url !== undefined) payload.photo_url = body.photo_url
    if (body.status !== undefined) payload.status = body.status
    if (body.seat_type !== undefined) payload.seat_type = body.seat_type

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
