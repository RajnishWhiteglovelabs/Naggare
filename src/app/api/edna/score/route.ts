import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { messages, candidateEmail, candidateName, roleLevel } = await req.json()

    const transcript = messages.map((m: any) => {
      const speaker = m.role === 'user' ? candidateName : 'Edna'
      return speaker + ': ' + m.content
    }).join('\n\n')

    const scoringPrompt = 'You are evaluating a software engineering pair programming session.\n\n' +
      'The candidate (' + candidateName + ') was pairing with Edna (AI engineer) on:\n' +
      '1. Code refactoring - a rate limiting service with bugs\n' +
      '2. System design - a notification service\n\n' +
      'Here is the full transcript:\n\n' + transcript + '\n\n' +
      'Evaluate the candidate on these dimensions. Return ONLY valid JSON, no other text:\n\n' +
      '{\n' +
      '  "refactoring_score": <0-100>,\n' +
      '  "design_score": <0-100>,\n' +
      '  "overall_score": <0-100>,\n' +
      '  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],\n' +
      '  "watch_areas": ["<area 1>", "<area 2>"],\n' +
      '  "summary": "<2-3 sentence narrative summary for recruiter>",\n' +
      '  "role_signal": "<one of: Ready for ' + roleLevel + ', Stretch for ' + roleLevel + ', Below ' + roleLevel + '>",\n' +
      '  "collaboration_score": <0-100>\n' +
      '}'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: scoringPrompt }]
      })
    })

    const data = await response.json()
    const raw = data.content?.[0]?.text || '{}'
    const scores = JSON.parse(raw.replace(/```json|```/g, '').trim())

    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    await db.from('naggare_scores').upsert({
      candidate_email: candidateEmail,
      role_level: roleLevel,
      overall_score: scores.overall_score,
      refactoring_score: scores.refactoring_score,
      design_score: scores.design_score,
      collaboration_score: scores.collaboration_score,
      strengths: scores.strengths,
      watch_areas: scores.watch_areas,
      summary: scores.summary,
      role_signal: scores.role_signal,
      transcript,
      valid_until: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    }, { onConflict: 'candidate_email,role_level' })

    return NextResponse.json(scores)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown' }, { status: 500 })
  }
}
