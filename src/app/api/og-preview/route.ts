import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { fetchOgPreview } from '@/lib/og-fetch'

const bodySchema = z.object({ url: z.url().max(2000) })

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'invalid url' }, { status: 400 })

  const preview = await fetchOgPreview(parsed.data.url)
  return NextResponse.json(preview)
}
