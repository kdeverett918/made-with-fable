'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

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

  const { error } = await supabase.from('comments').insert({
    creation_id: parsed.data.creationId,
    author_id: user.id,
    body: parsed.data.body,
  })
  if (error) return { ok: false, error: 'Could not post comment' }

  revalidatePath(`/c/${creationId}`)
  return { ok: true }
}

export async function deleteComment(
  commentId: string,
  creationId: string,
): Promise<{ ok: boolean }> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (!error) revalidatePath(`/c/${creationId}`)
  return { ok: !error }
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

  const { error } = await supabase.from('reports').insert({
    creation_id: parsed.data.creationId,
    reporter_id: user.id,
    reason: parsed.data.reason,
    detail: parsed.data.detail || null,
  })
  if (error) return { ok: false, error: 'Could not submit report' }
  return { ok: true }
}
