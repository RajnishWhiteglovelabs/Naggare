import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const email = formData.get('email') as string

    if (!file || !email) return NextResponse.json({ error: 'Missing file or email' }, { status: 400 })

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${email.replace('@','_').replace('.','_')}_${Date.now()}.${ext}`
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await admin.storage
      .from('avatars')
      .upload(filename, buffer, { contentType: file.type, upsert: true })

    if (uploadError) throw new Error(uploadError.message)

    const { data } = admin.storage.from('avatars').getPublicUrl(filename)

    return NextResponse.json({ url: data.publicUrl })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
