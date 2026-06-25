import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET — fetch messages for a session
export async function GET(req: NextRequest) {
  try {
    const session_id = req.nextUrl.searchParams.get('session_id')
    if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

    const db = admin()
    const { data, error } = await db
      .from('messages')
      .select('*')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// POST — send a message
export async function POST(req: NextRequest) {
  try {
    const { session_id, sender_email, sender_role, content } = await req.json()
    const db = admin()

    const { data: msg, error: mErr } = await db
      .from('messages')
      .insert({ session_id, sender_email, sender_role, content })
      .select()
      .single()
    if (mErr) throw mErr

    // Activate session when recruiter first replies
    const { data: session } = await db
      .from('chat_sessions')
      .select('status, candidate_email, recruiter_email, initiated_by')
      .eq('id', session_id)
      .single()

    if (session?.status === 'pending' && sender_role !== session.initiated_by) {
      await db.from('chat_sessions')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', session_id)
    }

    await db.from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', session_id)

    return NextResponse.json(msg)
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// PATCH — mark messages as read
export async function PATCH(req: NextRequest) {
  try {
    const { session_id, reader_email } = await req.json()
    const db = admin()

    const { error } = await db
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('session_id', session_id)
      .neq('sender_email', reader_email)
      .is('read_at', null)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
