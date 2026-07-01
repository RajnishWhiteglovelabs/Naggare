import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont, PDFImage } from 'pdf-lib'

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

function roundedRect(w: number, h: number, r: number): string {
  r = Math.min(r, h / 2, w / 2)
  return `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`
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

    // Photo (fetched server-side — no browser CORS to worry about). jpg/png only; anything else is skipped.
    let photoImg: PDFImage | null = null
    if (c.photo_url) {
      try {
        const r = await fetch(c.photo_url)
        if (r.ok) {
          const ct = (r.headers.get('content-type') || '').toLowerCase()
          const buf = new Uint8Array(await r.arrayBuffer())
          if (ct.includes('png') || (buf[0] === 0x89 && buf[1] === 0x50)) photoImg = await doc.embedPng(buf)
          else if (ct.includes('jpg') || ct.includes('jpeg') || (buf[0] === 0xFF && buf[1] === 0xD8)) photoImg = await doc.embedJpg(buf)
        }
      } catch { /* leave photoImg null */ }
    }

    const W = 595.28, H = 841.89, M = 48
    const indigo = rgb(0.31, 0.275, 0.898), indigoDk = rgb(0.216, 0.188, 0.639), dark = rgb(0.117, 0.106, 0.294)
    const gray = rgb(0.42, 0.45, 0.5), bodyc = rgb(0.22, 0.25, 0.28), rule = rgb(0.90, 0.91, 0.96)
    const lav = rgb(0.933, 0.949, 1), softwhite = rgb(0.85, 0.87, 0.98), white = rgb(1, 1, 1)

    let page: PDFPage = doc.addPage([W, H])
    let y = H

    // ---------- HEADER BAND ----------
    const bandH = 150
    page.drawRectangle({ x: 0, y: H - bandH, width: W, height: bandH, color: indigo })
    let photoBlock = 0
    if (photoImg) {
      const pw = 92, ph = 112
      const px = W - M - pw, py = H - bandH + (bandH - ph) / 2
      page.drawRectangle({ x: px - 3, y: py - 3, width: pw + 6, height: ph + 6, color: white })
      page.drawImage(photoImg, { x: px, y: py, width: pw, height: ph })
      photoBlock = pw + 14
    }
    const availName = (photoBlock ? W - M - photoBlock : W - 2 * M) - M
    let nameSize = 23
    while (bold.widthOfTextAtSize(ascii(c.name) || 'Candidate', nameSize) > availName && nameSize > 15) nameSize -= 1
    page.drawText(ascii(c.name) || 'Candidate', { x: M, y: H - 46, size: nameSize, font: bold, color: white })
    const role = [c.title, c.company].filter(Boolean).map(ascii).join('  \u00B7  ')
    if (role) page.drawText(role, { x: M, y: H - 68, size: 11.5, font: bold, color: softwhite })
    const meta = [c.city, c.years_exp ? c.years_exp + ' yrs experience' : null, c.email, c.phone]
      .filter(Boolean).map(ascii).join('    |    ')
    if (meta) page.drawText(meta, { x: M, y: H - 84, size: 8.5, font, color: rgb(0.8, 0.82, 0.95) })
    if (score) {
      const label = `NAGGARE SCORE  ${score.overall_score}` + (score.role_level ? `  \u00B7  ${ascii(score.role_level)}` : '')
      const ph = 22, pw = bold.widthOfTextAtSize(label, 9) + 24, pillTop = H - 98
      page.drawSvgPath(roundedRect(pw, ph, 11), { x: M, y: pillTop, color: white })
      page.drawText(label, { x: M + 12, y: pillTop - ph / 2 - 3, size: 9, font: bold, color: indigo })
    }

    // ---------- BODY ----------
    y = H - bandH - 30
    function ensure(need: number): boolean {
      if (y - need < M) { page = doc.addPage([W, H]); y = H - M; return true }
      return false
    }
    function wrap(t: string, f: PDFFont, size: number, maxW: number): string[] {
      const words = ascii(t).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
      const L: string[] = []; let cur = ''
      for (const w of words) {
        const test = cur ? cur + ' ' + w : w
        if (f.widthOfTextAtSize(test, size) > maxW && cur) { L.push(cur); cur = w } else cur = test
      }
      if (cur) L.push(cur)
      return L.length ? L : ['']
    }
    function section(t: string) {
      y -= 6; ensure(24)
      page.drawText(ascii(t).toUpperCase(), { x: M, y: y - 10, size: 9.5, font: bold, color: indigo })
      y -= 15
      page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.6, color: rule })
      y -= 12
    }
    function para(t: string) {
      const maxW = W - 2 * M
      for (const ln of wrap(t, font, 10.5, maxW)) { ensure(15); page.drawText(ln, { x: M, y: y - 10, size: 10.5, font, color: bodyc }); y -= 15 }
    }
    function pills(items: { text: string; bg: any; fg: any; br?: any }[]) {
      let x = M; const ph = 22, gap = 8, size = 9
      for (const it of items) {
        const label = ascii(it.text); const pw = font.widthOfTextAtSize(label, size) + 22
        if (x + pw > W - M) { x = M; y -= ph + gap }
        if (ensure(ph)) x = M
        page.drawSvgPath(roundedRect(pw, ph, 11), { x, y, color: it.bg, borderColor: it.br || undefined, borderWidth: it.br ? 0.6 : 0 })
        page.drawText(label, { x: x + 11, y: y - ph / 2 - 3, size, font: bold, color: it.fg })
        x += pw + gap
      }
      y -= ph + 6
    }

    if (c.looking_for) { section("What I'm looking for"); para(c.looking_for) }

    const details: { text: string; bg: any; fg: any; br?: any }[] = []
    if (c.availability) details.push({ text: c.availability, bg: lav, fg: indigo })
    if (c.notice_period) details.push({ text: 'Notice: ' + c.notice_period, bg: rgb(0.941, 0.992, 0.957), fg: rgb(0.082, 0.502, 0.239) })
    if (c.work_preference) details.push({ text: c.work_preference, bg: rgb(1, 0.969, 0.918), fg: rgb(0.761, 0.255, 0.047) })
    if (c.current_ctc) details.push({ text: 'Current: Rs. ' + c.current_ctc + ' LPA', bg: rgb(0.976, 0.98, 0.984), fg: rgb(0.29, 0.33, 0.39), br: rgb(0.9, 0.91, 0.94) })
    if (c.expected_ctc) details.push({ text: 'Expected: Rs. ' + c.expected_ctc + ' LPA', bg: rgb(0.976, 0.98, 0.984), fg: rgb(0.29, 0.33, 0.39), br: rgb(0.9, 0.91, 0.94) })
    if (details.length) { section('Details'); pills(details) }

    if (score && score.role_signal) {
      section('Naggare Score')
      para(`${score.overall_score} / 100  \u00B7  ${ascii(score.role_signal)}` + (score.valid_until ? `  \u00B7  valid until ${new Date(score.valid_until).toLocaleDateString('en-IN')}` : ''))
    }

    if (Array.isArray(c.skills) && c.skills.length) {
      section(`Skills (${c.skills.length})`)
      pills(c.skills.map((s: string) => ({ text: s, bg: lav, fg: indigoDk })))
    }

    page.drawText('Generated via Naggare  \u00B7  naggare.com', { x: M, y: 30, size: 8, font, color: gray })

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
