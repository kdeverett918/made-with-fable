'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { fetchRecentCounts, RATE_LIMITS } from '@/lib/rate-limit'

export async function toggleLike(creationId: string): Promise<{ ok: boolean; liked?: boolean }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const { data: existing } = await supabase
    .from('likes')
    .select('creation_id')
    .eq('user_id', user.id)
    .eq('creation_id', creationId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('creation_id', creationId)
    return { ok: !error, liked: false }
  }

  const { error } = await supabase
    .from('likes')
    .insert({ user_id: user.id, creation_id: creationId })
  return { ok: !error, liked: true }
}

const commentSchema = z.object({
  creationId: z.uuid(),
  body: z.string().trim().min(1).max(2000),
})

export async function addComment(
  creationId: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sign in to comment' }

  const parsed = commentSchema.safeParse({ creationId, body })
  if (!parsed.success) return { ok: false, error: 'Comment must be 1–2000 characters' }

  const recent = await fetchRecentCounts(supabase)
  if (recent.comments_1m >= RATE_LIMITS.commentsPerMinute) {
    return { ok: false, error: 'You are commenting too fast — wait a minute' }
  }

  const { error } = await supabase.from('comments').insert({
    creation_id: parsed.data.creationId,
    author_id: user.id,
    body: parsed.data.body,
  })
  if (error) return { ok: false, error: 'Could not post comment' }

  revalidatePath(`/c/${creationId}`)
  return { ok: true }
}

const deleteCommentSchema = z.object({
  commentId: z.uuid(),
  creationId: z.uuid(),
})

export async function deleteComment(
  commentId: string,
  creationId: string,
): Promise<{ ok: boolean }> {
  const parsed = deleteCommentSchema.safeParse({ commentId, creationId })
  if (!parsed.success) return { ok: false }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const { data: viewer } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('comments')
    .delete()
    .eq('id', parsed.data.commentId)
    .eq('creation_id', parsed.data.creationId)

  if (!viewer?.is_admin) query = query.eq('author_id', user.id)

  const { data, error } = await query.select('id')
  if (error || !data?.length) return { ok: false }

  revalidatePath(`/c/${parsed.data.creationId}`)
  return { ok: true }
}

const reportSchema = z.object({
  creationId: z.uuid(),
  reason: z.enum(['spam', 'inappropriate', 'not_fable', 'other']),
  detail: z.string().max(500).optional().or(z.literal('')),
})

export async function reportCreation(input: {
  creationId: string
  reason: string
  detail?: string
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sign in to report' }

  const parsed = reportSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid report' }

  const recent = await fetchRecentCounts(supabase)
  if (recent.reports_1h >= RATE_LIMITS.reportsPerHour) {
    return { ok: false, error: 'Report limit reached — try again later' }
  }

  const { error } = await supabase.from('reports').insert({
    creation_id: parsed.data.creationId,
    reporter_id: user.id,
    reason: parsed.data.reason,
    detail: parsed.data.detail || null,
  })
  if (error) return { ok: false, error: 'Could not submit report' }
  return { ok: true }
}
