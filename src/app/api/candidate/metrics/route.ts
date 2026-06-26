import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
      { count: totalViews },
      { count: viewsThisWeek },
      { count: totalInterests },
      { count: activeChats },
      { count: totalChats },
    ] = await Promise.all([
      db.from('profile_views').select('*', { count: 'exact', head: true }).eq('candidate_email', email),
      db.from('profile_views').select('*', { count: 'exact', head: true }).eq('candidate_email', email).gte('created_at', oneWeekAgo),
      db.from('jd_interests').select('*', { count: 'exact', head: true }).eq('candidate_email', email),
      db.from('chat_sessions').select('*', { count: 'exact', head: true }).eq('candidate_email', email).eq('status', 'active'),
      db.from('chat_sessions').select('*', { count: 'exact', head: true }).eq('candidate_email', email),
    ])

    const responseRate = totalInterests && totalInterests > 0
      ? Math.round(((activeChats || 0) / totalInterests) * 100)
      : 0

    return NextResponse.json({
      totalViews: totalViews || 0,
      viewsThisWeek: viewsThisWeek || 0,
      totalInterests: totalInterests || 0,
      activeChats: activeChats || 0,
      totalChats: totalChats || 0,
      responseRate,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown' }, { status: 500 })
  }
}
