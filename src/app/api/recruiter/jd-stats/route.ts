import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get recruiter JDs
    const { data: jds } = await db.from('jds').select('id,title,status,created_at').eq('recruiter_email', email).neq('status', 'deleted').order('created_at', { ascending: false })
    if (!jds || jds.length === 0) return NextResponse.json({ jds: [], summary: { totalViews: 0, totalInterests: 0, activeChats: 0, avgResponseRate: 0 } })

    // For each JD get interests and chats
    const jdStats = await Promise.all(jds.map(async (jd: any) => {
      const [{ count: interests }, { count: activeChats }, { count: totalChats }] = await Promise.all([
        db.from('jd_interests').select('*', { count: 'exact', head: true }).eq('jd_id', jd.id),
        db.from('chat_sessions').select('*', { count: 'exact', head: true }).eq('jd_id', jd.id).eq('status', 'active'),
        db.from('chat_sessions').select('*', { count: 'exact', head: true }).eq('jd_id', jd.id),
      ])
      const conversion = interests && interests > 0 ? Math.round(((activeChats || 0) / interests) * 100) : 0
      return { ...jd, interests: interests || 0, activeChats: activeChats || 0, totalChats: totalChats || 0, conversion }
    }))

    // Profile views for this recruiter's candidates
    const { count: totalViews } = await db.from('profile_views').select('*', { count: 'exact', head: true }).eq('recruiter_email', email)

    const summary = {
      totalViews: totalViews || 0,
      totalInterests: jdStats.reduce((a, j) => a + j.interests, 0),
      activeChats: jdStats.reduce((a, j) => a + j.activeChats, 0),
      avgConversion: jdStats.length > 0 ? Math.round(jdStats.reduce((a, j) => a + j.conversion, 0) / jdStats.length) : 0,
    }

    return NextResponse.json({ jds: jdStats, summary })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown' }, { status: 500 })
  }
}
