'use server'

import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { fetchOgPreview, downloadOgImage } from '@/lib/og-fetch'
import { normalizeUrl, isHttpUrl } from '@/lib/url'
import { fetchRecentCounts, RATE_LIMITS } from '@/lib/rate-limit'
import { notifyAdminOfSubmission } from '@/lib/email'

// shared anonymous-upload folder. Kept as a literal here (not imported from the
// 'use client' upload module) so it resolves correctly across the server boundary.
const GUEST_FOLDER = 'guest'

const mediaItemSchema = z.object({
  kind: z.enum(['image', 'video']),
  storage_path: z.string().min(1).max(300),
  poster_path: z.string().min(1).max(300).nullable(),
  width: z.number().int().min(1).max(10000),
  height: z.number().int().min(1).max(10000),
})

const createCreationSchema = z.object({
  title: z.string().min(3).max(120),
  story: z.string().max(5000).optional().or(z.literal('')),
  prompt: z.string().max(10000).optional().or(z.literal('')),
  // Accept a bare host ("example.com") — a missing scheme is filled in with
  // https:// so people don't have to type it. Empty is allowed (link optional).
  live_url: z
    .string()
    .max(2050)
    .transform(normalizeUrl)
    .refine((u) => u === '' || isHttpUrl(u), 'Enter a valid web address (e.g. example.com)'),
  category_slug: z.string().min(1),
  tags: z.array(z.string().regex(/^[a-z0-9-]{2,30}$/)).max(5),
  media: z.array(mediaItemSchema).max(7),
  // present only for anonymous (signed-out) submissions
  guest_name: z.string().trim().max(60).optional().or(z.literal('')),
})

export type CreateCreationInput = z.infer<typeof createCreationSchema>
export type CreateCreationResult = { ok: true; id: string } | { ok: false; error: string }

export async function createCreation(input: CreateCreationInput): Promise<CreateCreationResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const parsed = createCreationSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid submission' }
  }
  const data = parsed.data

  if (!data.live_url && data.media.length === 0) {
    return { ok: false, error: 'Add at least one image, video, or live link' }
  }

  const isGuest = !user
  const guestName = data.guest_name?.trim() ?? ''
  if (isGuest && guestName.length < 2) {
    return { ok: false, error: 'Add your name so people know who made it' }
  }

  // Anonymous submissions have no session to satisfy RLS, so they are written
  // with the service-role client and credited to a guest name (null author_id).
  const db = isGuest ? createSupabaseAdminClient() : supabase
  const authorId = user?.id ?? null
  const folder = user?.id ?? GUEST_FOLDER

  if (isGuest) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await db
      .from('creations')
      .select('id', { count: 'exact', head: true })
      .is('author_id', null)
      .gte('created_at', since)
    if ((count ?? 0) >= RATE_LIMITS.guestCreationsPerDay) {
      return { ok: false, error: 'Submission limit reached for today — try again tomorrow' }
    }
  } else {
    const recent = await fetchRecentCounts(supabase)
    if (recent.creations_1d >= RATE_LIMITS.creationsPerDay) {
      return { ok: false, error: 'Submission limit reached for today — try again tomorrow' }
    }
  }

  const videos = data.media.filter((m) => m.kind === 'video')
  if (videos.length > 1) return { ok: false, error: 'Only one video per creation' }
  if (data.media.filter((m) => m.kind === 'image').length > 6) {
    return { ok: false, error: 'Up to 6 images per creation' }
  }

  // uploaded objects must live in the submitter's own storage folder
  const ownFolder = `${folder}/`
  for (const m of data.media) {
    if (!m.storage_path.startsWith(ownFolder)) return { ok: false, error: 'Invalid media path' }
    if (m.poster_path && !m.poster_path.startsWith(ownFolder)) {
      return { ok: false, error: 'Invalid media path' }
    }
  }

  const { data: category } = await db
    .from('categories')
    .select('id')
    .eq('slug', data.category_slug)
    .single()
  if (!category) return { ok: false, error: 'Pick a category' }

  // OG capture for live links — non-fatal on any failure
  let ogTitle: string | null = null
  let ogImagePath: string | null = null
  let ogWidth: number | null = null
  let ogHeight: number | null = null

  if (data.live_url) {
    const preview = await fetchOgPreview(data.live_url)
    ogTitle = preview.title
    if (preview.imageUrl) {
      const image = await downloadOgImage(preview.imageUrl)
      if (image) {
        const path = `${folder}/og-${nanoid(10)}.webp`
        const { error: uploadError } = await db.storage
          .from('media')
          .upload(path, image.buffer, { contentType: 'image/webp' })
        if (!uploadError) {
          ogImagePath = path
          ogWidth = image.width
          ogHeight = image.height
        }
      }
    }
  }

  const { data: creation, error: insertError } = await db
    .from('creations')
    .insert({
      author_id: authorId,
      guest_name: isGuest ? guestName : null,
      title: data.title,
      story: data.story || null,
      prompt: data.prompt || null,
      live_url: data.live_url || null,
      og_title: ogTitle,
      og_image_path: ogImagePath,
      og_image_width: ogWidth,
      og_image_height: ogHeight,
      category_id: category.id,
    })
    .select('id')
    .single()

  if (insertError || !creation) return { ok: false, error: 'Could not save your submission' }

  if (data.media.length > 0) {
    const { error: mediaError } = await db.from('creation_media').insert(
      data.media.map((m, i) => ({
        creation_id: creation.id,
        kind: m.kind,
        storage_path: m.storage_path,
        poster_path: m.poster_path,
        width: m.width,
        height: m.height,
        position: i,
      })),
    )
    if (mediaError) {
      await db.from('creations').delete().eq('id', creation.id)
      return { ok: false, error: 'Could not save your media' }
    }
  }

  if (data.tags.length > 0) {
    const names = [...new Set(data.tags)]
    await db.from('tags').upsert(
      names.map((name) => ({ name })),
      { onConflict: 'name', ignoreDuplicates: true },
    )
    const { data: tagRows } = await db.from('tags').select('id, name').in('name', names)
    if (tagRows && tagRows.length > 0) {
      await db
        .from('creation_tags')
        .insert(tagRows.map((t) => ({ creation_id: creation.id, tag_id: t.id })))
    }
  }

  let submitterName = guestName ? `${guestName} (guest)` : 'guest'
  if (user) {
    const { data: profile } = await db
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
    submitterName = profile?.username ?? 'unknown'
  }
  await notifyAdminOfSubmission({
    title: data.title,
    username: submitterName,
    creationId: creation.id,
  })

  revalidatePath('/')
  return { ok: true, id: creation.id }
}

export async function deleteCreation(id: string): Promise<{ ok: boolean }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const { data, error } = await supabase.from('creations').delete().eq('id', id).select('id')
  if (error || !data?.length) return { ok: false }
  revalidatePath('/')
  return { ok: true }
}
