import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email')
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const db = admin()
    const { data: sessions, error } = await db
      .from('chat_sessions')
      .select('*, messages(id, sender_email, sender_role, content, read_at, created_at)')
      .or(`candidate_email.eq.${email},recruiter_email.eq.${email}`)
      .order('updated_at', { ascending: false })

    // Enrich with recruiter photo_url
    if (sessions && sessions.length > 0) {
      const recruiterEmails = [...new Set(sessions.map((s: { recruiter_email: string }) => s.recruiter_email))]
      const { data: recruiters } = await db
        .from('recruiters')
        .select('email, photo_url')
        .in('email', recruiterEmails)
      if (recruiters) {
        const photoMap: Record<string, string> = {}
        recruiters.forEach((r: { email: string; photo_url: string | null }) => {
          if (r.photo_url) photoMap[r.email] = r.photo_url
        })
        sessions.forEach((s: { recruiter_email: string; recruiter_photo?: string }) => {
          s.recruiter_photo = photoMap[s.recruiter_email] || ''
        })
      }
    }

    if (error) throw error
    return NextResponse.json(sessions || [])
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { candidate_email, recruiter_email, jd_id, initiated_by, message, recruiter_name, jd_title } = await req.json()
    const db = admin()

    const { data: existing } = await db
      .from('chat_sessions')
      .select('id, status')
      .eq('candidate_email', candidate_email)
      .eq('recruiter_email', recruiter_email)
      .eq('jd_id', jd_id)
      .not('status', 'eq', 'expired')
      .maybeSingle()

    if (existing) return NextResponse.json({ session_id: existing.id, already_exists: true })

    const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    const { data: session, error: sErr } = await db
      .from('chat_sessions')
      .insert({
        candidate_email, recruiter_email, jd_id, initiated_by, expires_at,
        status: 'pending',
        recruiter_name: recruiter_name || null,
        jd_title: jd_title || null
      })
      .select()
      .single()

    if (sErr) throw sErr

    const sender_email = initiated_by === 'candidate' ? candidate_email : recruiter_email

    const { error: mErr } = await db.from('messages').insert({
      session_id: session.id, sender_email, sender_role: initiated_by, content: message
    })
    if (mErr) throw mErr

    return NextResponse.json({ session_id: session.id })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { session_id, action } = await req.json()
    const db = admin()

    if (action === 'extend') {
      const new_expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const { error } = await db
        .from('chat_sessions')
        .update({ expires_at: new_expiry, extended: true, updated_at: new Date().toISOString() })
        .eq('id', session_id)
      if (error) throw error
    }

    if (action === 'activate') {
      const { error } = await db
        .from('chat_sessions')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', session_id)
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
