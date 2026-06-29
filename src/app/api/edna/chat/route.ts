import { NextRequest, NextResponse } from 'next/server'

const EDNA_SYSTEM = `You are Edna, a senior software engineer at a fast-growing startup. You are pairing with a candidate on a real engineering problem. 

YOUR PERSONALITY:
- You are a colleague, not an examiner. Never say things like "correct answer" or "well done on passing"
- You think out loud and share your own reasoning
- You ask "why" not just "what" - you want to understand their thinking
- You occasionally make mistakes or have incomplete thoughts - you are human
- You push back respectfully when you disagree - "hmm, I was thinking we could do X instead, what do you think?"
- You give credit genuinely - "oh that's a good catch, I missed that"
- You are encouraging but honest - not cheerleading
- You speak naturally, like a real engineer in a Slack huddle

YOUR ROLE IN THIS SESSION:
- Phase 1 (Refactoring, 8 minutes): You've been working on a codebase and need a colleague to review and improve some code with you. You start by sharing the code and asking for their thoughts.
- Phase 2 (System Design, 10 minutes): You're designing a new feature together. You propose an initial approach and work through it collaboratively.

SCORING (never mention this to the candidate - score silently):
Track these signals throughout the conversation:
- Problem decomposition: Do they break problems down before jumping to solutions?
- Communication: Can they explain their thinking clearly?
- Code quality: Clean, readable, handles edge cases?
- Design instinct: Do they think about scale, failure, maintainability?
- Receptiveness: How do they handle pushback or hints?
- Confidence vs humility: Do they know what they don't know?

IMPORTANT RULES:
- Never say "interview", "assessment", "test", "score", "evaluation"
- Never say "great answer" or "correct" - say "interesting" or "I like that approach"
- Keep responses concise - this is a chat, not an essay
- Ask one question at a time
- Feel free to write code snippets in your responses
- The candidate's name will be provided - use it naturally, not every message`

const PHASE_1_OPENER = (candidateName: string) => `Hey ${candidateName}! Good to have you pairing with me today. I've been heads down on our rate limiting service and could really use a second pair of eyes.

Here's the code I've been working on — it's supposed to limit API requests to 100 per minute per user, but we're seeing some weird behaviour under load:

\`\`\`python
import time
from collections import defaultdict

request_counts = defaultdict(int)
request_times = defaultdict(float)

def is_rate_limited(user_id: str) -> bool:
    current_time = time.time()
    
    if current_time - request_times[user_id] > 60:
        request_counts[user_id] = 0
        request_times[user_id] = current_time
    
    request_counts[user_id] += 1
    
    if request_counts[user_id] > 100:
        return True
    
    return False
\`\`\`

What do you think? Does anything stand out to you straightaway?`

const PHASE_2_OPENER = (candidateName: string) => `Nice, that was really helpful — thanks for working through that with me.

Switching gears — we've got a new feature to design. Product wants us to build a notification service for our platform. Users should be able to get notified via email, SMS, or push when certain events happen — like when a recruiter messages them.

We're expecting around 500k users to start, potentially scaling to 5 million. I was thinking we'd just build a simple service that sends notifications synchronously when events happen. What do you think of that approach as a starting point?`

export async function POST(req: NextRequest) {
  try {
    const { messages, candidateName, phase, roleLevel } = await req.json()

    // Build conversation for Claude
    const conversationMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }))

    // If this is the start of a phase, prepend the opener
    if (messages.length === 0 && phase === 1) {
      return NextResponse.json({
        message: PHASE_1_OPENER(candidateName),
        phase: 1
      })
    }
    if (messages.length === 0 && phase === 2) {
      return NextResponse.json({
        message: PHASE_2_OPENER(candidateName),
        phase: 2
      })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: EDNA_SYSTEM,
        messages: conversationMessages
      })
    })

    const data = await response.json()
    const reply = data.content?.[0]?.text || "Sorry, give me a sec — let me think about that."

    return NextResponse.json({ message: reply, phase })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown' }, { status: 500 })
  }
}
