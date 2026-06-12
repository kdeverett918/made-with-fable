'use server'

import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { fetchOgPreview, downloadOgImage } from '@/lib/og-fetch'
import { fetchRecentCounts, RATE_LIMITS } from '@/lib/rate-limit'
import { notifyAdminOfSubmission } from '@/lib/email'

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
  live_url: z
    .url()
    .max(2000)
    .refine((u) => /^https?:\/\//i.test(u), 'Live link must be an http(s) URL')
    .optional()
    .or(z.literal('')),
  category_slug: z.string().min(1),
  tags: z.array(z.string().regex(/^[a-z0-9-]{2,30}$/)).max(5),
  media: z.array(mediaItemSchema).max(7),
})

export type CreateCreationInput = z.infer<typeof createCreationSchema>
export type CreateCreationResult = { ok: true; id: string } | { ok: false; error: string }

export async function createCreation(input: CreateCreationInput): Promise<CreateCreationResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }

  const parsed = createCreationSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid submission' }
  }
  const data = parsed.data

  if (!data.live_url && data.media.length === 0) {
    return { ok: false, error: 'Add at least one image, video, or live link' }
  }

  const recent = await fetchRecentCounts(supabase)
  if (recent.creations_1d >= RATE_LIMITS.creationsPerDay) {
    return { ok: false, error: 'Submission limit reached for today — try again tomorrow' }
  }

  const videos = data.media.filter((m) => m.kind === 'video')
  if (videos.length > 1) return { ok: false, error: 'Only one video per creation' }
  if (data.media.filter((m) => m.kind === 'image').length > 6) {
    return { ok: false, error: 'Up to 6 images per creation' }
  }

  // uploaded objects must live in the submitter's own storage folder
  const ownFolder = `${user.id}/`
  for (const m of data.media) {
    if (!m.storage_path.startsWith(ownFolder)) return { ok: false, error: 'Invalid media path' }
    if (m.poster_path && !m.poster_path.startsWith(ownFolder)) {
      return { ok: false, error: 'Invalid media path' }
    }
  }

  const { data: category } = await supabase
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
        const path = `${user.id}/og-${nanoid(10)}.webp`
        const { error: uploadError } = await supabase.storage
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

  const { data: creation, error: insertError } = await supabase
    .from('creations')
    .insert({
      author_id: user.id,
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
    const { error: mediaError } = await supabase.from('creation_media').insert(
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
      await supabase.from('creations').delete().eq('id', creation.id)
      return { ok: false, error: 'Could not save your media' }
    }
  }

  if (data.tags.length > 0) {
    const names = [...new Set(data.tags)]
    await supabase.from('tags').upsert(
      names.map((name) => ({ name })),
      { onConflict: 'name', ignoreDuplicates: true },
    )
    const { data: tagRows } = await supabase.from('tags').select('id, name').in('name', names)
    if (tagRows && tagRows.length > 0) {
      await supabase
        .from('creation_tags')
        .insert(tagRows.map((t) => ({ creation_id: creation.id, tag_id: t.id })))
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()
  await notifyAdminOfSubmission({
    title: data.title,
    username: profile?.username ?? 'unknown',
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
