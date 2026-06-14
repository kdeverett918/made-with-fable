import { NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchOgPreview } from '@/lib/og-fetch'
import { normalizeUrl, isHttpUrl } from '@/lib/url'

// A bare host gets https:// filled in before validation, matching the submit flow.
const bodySchema = z.object({
  url: z
    .string()
    .max(2050)
    .transform(normalizeUrl)
    .refine(isHttpUrl, 'invalid url'),
})

// Open to anonymous submitters too — link previews are part of the no-login
// submit flow. fetchOgPreview enforces SSRF protection (private ranges blocked).
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'invalid url' }, { status: 400 })

  const preview = await fetchOgPreview(parsed.data.url)
  return NextResponse.json(preview)
}
