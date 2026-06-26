import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'raj@whiteglovelabs.io'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email || email.toLowerCase() !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const now = new Date().toISOString()

    const [
      { count: totalCandidates },
      { count: activeCandidates },
      { count: newCandidatesThisWeek },
      { count: totalRecruiters },
      { count: activeRecruiters },
      { count: newRecruitersThisWeek },
      { count: totalJds },
      { count: activeJds },
      { count: totalChats },
      { count: activeChats },
      { count: expiredChats },
      { data: candidates },
      { data: recruiters },
      { data: recentJds },
    ] = await Promise.all([
      db.from('candidates').select('*', { count: 'exact', head: true }),
      db.from('candidates').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      db.from('candidates').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
      db.from('recruiters').select('*', { count: 'exact', head: true }),
      db.from('recruiters').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      db.from('recruiters').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
      db.from('jds').select('*', { count: 'exact', head: true }),
      db.from('jds').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      db.from('chat_sessions').select('*', { count: 'exact', head: true }),
      db.from('chat_sessions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      db.from('chat_sessions').select('*', { count: 'exact', head: true }).eq('status', 'pending').lt('expires_at', now),
      db.from('candidates').select('name,email,domain,city,years_exp,status,created_at,availability,work_preference').order('created_at', { ascending: false }).limit(50),
      db.from('recruiters').select('name,email,company,title,status,created_at').order('created_at', { ascending: false }).limit(50),
      db.from('jds').select('*').neq('status','deleted').order('created_at', { ascending: false }).limit(20),
    ])

    return NextResponse.json({
      stats: {
        candidates: { total: totalCandidates, active: activeCandidates, newThisWeek: newCandidatesThisWeek },
        recruiters: { total: totalRecruiters, active: activeRecruiters, newThisWeek: newRecruitersThisWeek },
        jds: { total: totalJds, active: activeJds },
        chats: { total: totalChats, active: activeChats, expired: expiredChats },
      },
      candidates: candidates || [],
      recruiters: recruiters || [],
      recentJds: recentJds || [],
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
