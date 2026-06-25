import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { candidate_name, candidate_title, candidate_company, candidate_skills, jd_title, jd_company, recruiter_name } = await req.json()

    const prompt = `You are helping a recruiter write a personalised inmail to a candidate on Naggare, a humanised hiring platform.

Candidate: ${candidate_name}, ${candidate_title} at ${candidate_company}
Skills: ${(candidate_skills || []).slice(0,5).join(', ')}
Role they applied for: ${jd_title} at ${jd_company}
Recruiter: ${recruiter_name}

Write a short, warm, personalised opening message (3-4 sentences max). 
- Reference something specific about the candidate
- Mention the role
- End with an open question or invitation to chat
- Tone: professional but human, not corporate
- Do NOT use "I hope this message finds you well" or similar clichés
- Write in first person as the recruiter
- No subject line, just the message body`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    return NextResponse.json({ draft: text })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
