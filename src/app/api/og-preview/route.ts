import { NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchOgPreview } from '@/lib/og-fetch'

const bodySchema = z.object({ url: z.url().max(2000) })

// Open to anonymous submitters too — link previews are part of the no-login
// submit flow. fetchOgPreview enforces SSRF protection (private ranges blocked).
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'invalid url' }, { status: 400 })

  const preview = await fetchOgPreview(parsed.data.url)
  return NextResponse.json(preview)
}
