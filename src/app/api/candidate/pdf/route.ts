import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont, PDFImage } from 'pdf-lib'

export const runtime = 'nodejs'

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
    .replace(/\s+/g, ' ')
    .trim()
}
function rr(w: number, h: number, r: number): string {
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
      .eq('candidate_email', email).order('created_at', { ascending: false }).limit(1)
    if (sc && sc.length) score = sc[0]

    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const bold = await doc.embedFont(StandardFonts.HelveticaBold)
    const serif = await doc.embedFont(StandardFonts.TimesRomanBold)

    let img: PDFImage | null = null
    if (c.photo_url) {
      try {
        const r = await fetch(c.photo_url)
        if (r.ok) {
          const ct = (r.headers.get('content-type') || '').toLowerCase()
          const buf = new Uint8Array(await r.arrayBuffer())
          if (ct.includes('png') || (buf[0] === 0x89 && buf[1] === 0x50)) img = await doc.embedPng(buf)
          else if (ct.includes('jpg') || ct.includes('jpeg') || (buf[0] === 0xFF && buf[1] === 0xD8)) img = await doc.embedJpg(buf)
        }
      } catch { /* fallback below */ }
    }

    const W = 595.28, H = 841.89, M = 40
    const indigo = rgb(0.31, 0.275, 0.898), indigoDk = rgb(0.216, 0.188, 0.639), dark = rgb(0.117, 0.106, 0.294)
    const gray = rgb(0.42, 0.45, 0.5), bodyc = rgb(0.22, 0.25, 0.28), rule = rgb(0.90, 0.91, 0.96)
    const lav = rgb(0.933, 0.949, 1), white = rgb(1, 1, 1)

    let page: PDFPage = doc.addPage([W, H])
    let y = H

    // ---- HERO ----
    const heroH = 300
    if (img) {
      const s = Math.max(W / img.width, heroH / img.height)
      const dw = img.width * s, dh = img.height * s
      page.drawImage(img, { x: (W - dw) / 2, y: H - heroH / 2 - dh / 2, width: dw, height: dh })
    } else {
      page.drawRectangle({ x: 0, y: H - heroH, width: W, height: heroH, color: indigo })
      const initials = (ascii(c.name).split(' ').map(n => n[0]).join('').slice(0, 2) || 'C').toUpperCase()
      const iw = serif.widthOfTextAtSize(initials, 60)
      page.drawText(initials, { x: (W - iw) / 2, y: H - heroH / 2 - 20, size: 60, font: serif, color: rgb(1, 1, 1), opacity: 0.85 })
    }
    // white body mask (hides any photo overflow below hero)
    page.drawRectangle({ x: 0, y: 0, width: W, height: H - heroH, color: white })
    // gradient overlay for text legibility
    const band = 175
    for (let i = 0; i < 20; i++) {
      const t = i / 19
      page.drawRectangle({ x: 0, y: H - heroH + (band * (1 - t)) - band / 20 + (heroH - band), width: W, height: band / 20 + 0.6, color: rgb(0, 0, 0), opacity: 0.05 + 0.7 * t })
    }
    // hero text
    page.drawText(ascii(c.name) || 'Candidate', { x: M, y: H - heroH + 58, size: 26, font: serif, color: white })
    if (c.title) page.drawText(ascii(c.title).toUpperCase(), { x: M, y: H - heroH + 40, size: 11, font: bold, color: rgb(0.85, 0.87, 0.98) })
    const meta = [c.company, c.city, c.years_exp ? c.years_exp + ' yrs' : null].filter(Boolean).map(ascii).join(' \u00B7 ')
    if (meta) page.drawText(meta, { x: M, y: H - heroH + 24, size: 9.5, font, color: rgb(0.85, 0.86, 0.92) })
    if (score) {
      const bw = 60, bh = 56, bx = W - M - bw, by = H - heroH + 22
      page.drawSvgPath(rr(bw, bh, 14), { x: bx, y: by + bh, color: white })
      const lab = String(score.overall_score); const tw = bold.widthOfTextAtSize(lab, 22)
      page.drawText(lab, { x: bx + (bw - tw) / 2, y: by + bh - 30, size: 22, font: bold, color: indigo })
      const t2 = 'Naggare'; const tw2 = bold.widthOfTextAtSize(t2, 7)
      page.drawText(t2, { x: bx + (bw - tw2) / 2, y: by + bh - 40, size: 7, font: bold, color: indigo })
      if (score.role_level) { const t3 = ascii(score.role_level); const tw3 = font.widthOfTextAtSize(t3, 7); page.drawText(t3, { x: bx + (bw - tw3) / 2, y: by + 9, size: 7, font, color: gray }) }
    }

    // ---- BODY ----
    y = H - heroH - 24
    function ensure(n: number) { if (y - n < M) { page = doc.addPage([W, H]); y = H - M } }
    function wrap(t: string, f: PDFFont, size: number, maxW: number): string[] {
      const words = ascii(t).split(' ').filter(Boolean); const L: string[] = []; let cur = ''
      for (const w of words) { const test = cur ? cur + ' ' + w : w; if (f.widthOfTextAtSize(test, size) > maxW && cur) { L.push(cur); cur = w } else cur = test }
      if (cur) L.push(cur); return L.length ? L : ['']
    }
    function section(t: string) {
      y -= 8; ensure(24)
      page.drawText(ascii(t).toUpperCase(), { x: M, y: y - 10, size: 9.5, font: bold, color: indigo })
      y -= 15; page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.6, color: rule }); y -= 12
    }
    function para(t: string, size = 10.5, color: any = bodyc) {
      for (const ln of wrap(t, font, size, W - 2 * M)) { ensure(size + 4); page.drawText(ln, { x: M, y: y - size, size, font, color }); y -= size + 4 }
    }
    function pills(items: string[]) {
      let x = M; const ph = 22, gap = 7, size = 9
      for (const it of items) { const label = ascii(it); if (!label) continue; const pw = font.widthOfTextAtSize(label, size) + 22; if (x + pw > W - M) { x = M; y -= ph + gap; ensure(ph) } ensure(ph); page.drawSvgPath(rr(pw, ph, 11), { x, y, color: lav }); page.drawText(label, { x: x + 11, y: y - ph / 2 - 3, size, font: bold, color: indigoDk }); x += pw + gap }
      y -= ph + 6
    }

    if (Array.isArray(c.skills) && c.skills.length) { section(`Skills \u00B7 ${c.skills.length}`); pills(c.skills) }
    if (c.looking_for) { section("What they're looking for"); para(c.looking_for) }
    const prompts = [
      { q: c.prompt_1_q, a: c.prompt_1_a }, { q: c.prompt_2_q, a: c.prompt_2_a }, { q: c.prompt_3_q, a: c.prompt_3_a },
    ].filter(p => p.q && p.a)
    if (prompts.length) {
      section('In their own words')
      for (const p of prompts) {
        const qlines = wrap(p.q, bold, 10, W - 2 * M - 24)
        const alines = wrap(p.a, font, 10, W - 2 * M - 24)
        const cardH = 12 + qlines.length * 13 + 6 + alines.length * 13 + 12
        ensure(cardH + 8)
        page.drawSvgPath(rr(W - 2 * M, cardH, 14), { x: M, y, color: lav, borderColor: rgb(0.78, 0.82, 0.99), borderWidth: 0.5 })
        let ty = y - 16
        for (const ln of qlines) { page.drawText(ln, { x: M + 12, y: ty, size: 10, font: bold, color: indigoDk }); ty -= 13 }
        ty -= 5
        for (const ln of alines) { page.drawText(ln, { x: M + 12, y: ty, size: 10, font, color: rgb(0.2, 0.22, 0.27) }); ty -= 13 }
        y -= cardH + 10
      }
    }
    ensure(20); page.drawText('Generated via Naggare  \u00B7  naggare.com', { x: M, y: y - 4, size: 8, font, color: gray })

    const bytes = await doc.save()
    const filename = `${ascii(c.name || 'candidate').replace(/[^a-z0-9]+/gi, '_')}_Naggare.pdf`
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' },
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown' }, { status: 500 })
  }
}
