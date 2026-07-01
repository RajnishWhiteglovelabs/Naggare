import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib'

export const runtime = 'nodejs'

// StandardFonts use WinAnsi encoding — map/strip anything it can't encode so we never throw.
function ascii(s?: string | null): string {
  if (!s) return ''
  return String(s)
    .replace(/\u20B9/g, 'Rs ')
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '-')
    .replace(/\u00A0/g, ' ')
    .split('')
    .map(ch => { const cc = ch.charCodeAt(0); return (cc > 0xFF || (cc >= 0x80 && cc <= 0x9F)) ? '' : ch })
    .join('')
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: c } = await db.from('candidates').select('*').eq('email', email).single()
    if (!c) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    let score: any = null
    const { data: sc } = await db.from('naggare_scores')
      .select('overall_score,role_level,role_signal,valid_until')
      .eq('candidate_email', email)
      .order('created_at', { ascending: false })
      .limit(1)
    if (sc && sc.length) score = sc[0]

    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const bold = await doc.embedFont(StandardFonts.HelveticaBold)

    const W = 595.28, H = 841.89, margin = 56, maxW = W - margin * 2
    const indigo = rgb(0.31, 0.275, 0.898)
    const dark = rgb(0.117, 0.106, 0.294)
    const gray = rgb(0.42, 0.45, 0.5)
    const body = rgb(0.13, 0.15, 0.16)
    const rule = rgb(0.85, 0.87, 0.95)

    let page: PDFPage = doc.addPage([W, H])
    let y = H - margin

    function ensure(need: number) {
      if (y - need < margin) { page = doc.addPage([W, H]); y = H - margin }
    }
    function wrap(text: string, f: PDFFont, size: number): string[] {
      const words = ascii(text).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
      const lines: string[] = []
      let cur = ''
      for (const w of words) {
        const test = cur ? cur + ' ' + w : w
        if (f.widthOfTextAtSize(test, size) > maxW && cur) { lines.push(cur); cur = w }
        else cur = test
      }
      if (cur) lines.push(cur)
      return lines.length ? lines : ['']
    }
    function text(t: string, o: { f?: PDFFont; size?: number; color?: any; gap?: number } = {}) {
      const f = o.f || font, size = o.size ?? 10.5, color = o.color || body, gap = o.gap ?? 4
      for (const ln of wrap(t, f, size)) {
        ensure(size + gap)
        page.drawText(ln, { x: margin, y: y - size, size, font: f, color })
        y -= size + gap
      }
    }
    function section(title: string) {
      y -= 10
      ensure(20)
      page.drawText(ascii(title).toUpperCase(), { x: margin, y: y - 9, size: 9, font: bold, color: indigo })
      y -= 13
      page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 0.5, color: rule })
      y -= 9
    }

    // Header
    page.drawText(ascii(c.name) || 'Candidate', { x: margin, y: y - 20, size: 20, font: bold, color: dark })
    y -= 27
    const sub = [c.title, c.company].filter(Boolean).map(ascii).join('  \u00B7  ')
    if (sub) { page.drawText(sub, { x: margin, y: y - 12, size: 11, font, color: indigo }); y -= 17 }
    const meta = [c.city, c.years_exp ? c.years_exp + ' yrs experience' : null, c.email, c.phone]
      .filter(Boolean).map(ascii).join('   |   ')
    if (meta) { page.drawText(meta, { x: margin, y: y - 10, size: 9, font, color: gray }); y -= 14 }

    // Naggare Score
    if (score) {
      section('Naggare Score')
      text(`Overall: ${score.overall_score} / 100  \u00B7  ${ascii(score.role_level)}`, { f: bold, size: 11, color: dark, gap: 3 })
      if (score.role_signal) text(score.role_signal, { size: 10, color: body })
      if (score.valid_until) text('Valid until ' + new Date(score.valid_until).toLocaleDateString('en-IN'), { size: 8.5, color: gray })
    }

    // Details
    const details = [
      c.availability ? `Availability: ${ascii(c.availability)}` : null,
      c.notice_period ? `Notice period: ${ascii(c.notice_period)}` : null,
      c.work_preference ? `Work preference: ${ascii(c.work_preference)}` : null,
      c.current_ctc ? `Current CTC: Rs. ${c.current_ctc} LPA` : null,
      c.expected_ctc ? `Expected CTC: Rs. ${c.expected_ctc} LPA` : null,
    ].filter(Boolean) as string[]
    if (details.length) {
      section('Details')
      for (const d of details) text(d, { size: 10, color: body, gap: 3 })
    }

    // What I'm looking for
    if (c.looking_for) {
      section("What I'm looking for")
      text(c.looking_for, { size: 10.5, color: body, gap: 4 })
    }

    // Skills
    if (Array.isArray(c.skills) && c.skills.length) {
      section(`Skills (${c.skills.length})`)
      text(c.skills.map(ascii).filter(Boolean).join(', '), { size: 10.5, color: body, gap: 4 })
    }

    // Footer on last page
    page.drawText('Generated via Naggare  \u00B7  naggare.com', { x: margin, y: 32, size: 8, font, color: gray })

    const bytes = await doc.save()
    const filename = `${ascii(c.name || 'candidate').replace(/[^a-z0-9]+/gi, '_')}_Naggare.pdf`
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown' }, { status: 500 })
  }
}
