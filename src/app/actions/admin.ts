'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notifyAuthorOfDecision } from '@/lib/email'

async function requireAdmin() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  return profile?.is_admin ? supabase : null
}

export async function approveCreation(id: string): Promise<{ ok: boolean }> {
  const supabase = await requireAdmin()
  if (!supabase) return { ok: false }

  const { data: updated, error } = await supabase
    .from('creations')
    .update({ status: 'approved' })
    .eq('id', id)
    .select('title, author_id')
    .single()
  if (error || !updated) return { ok: false }

  await notifyAuthorOfDecision({
    authorId: updated.author_id,
    title: updated.title,
    creationId: id,
    approved: true,
  })

  revalidatePath('/')
  revalidatePath('/admin')
  return { ok: true }
}

export async function rejectCreation(
  id: string,
  reason: string,
  options?: { notify?: boolean },
): Promise<{ ok: boolean }> {
  const supabase = await requireAdmin()
  if (!supabase) return { ok: false }

  const trimmedReason = reason.slice(0, 500) || null
  const { data: updated, error } = await supabase
    .from('creations')
    .update({ status: 'rejected', rejection_reason: trimmedReason })
    .eq('id', id)
    .select('title, author_id')
    .single()
  if (error || !updated) return { ok: false }

  if (options?.notify !== false) {
    await notifyAuthorOfDecision({
      authorId: updated.author_id,
      title: updated.title,
      creationId: id,
      approved: false,
      reason: trimmedReason,
    })
  }

  revalidatePath('/')
  revalidatePath('/admin')
  return { ok: true }
}

export async function removeCreation(id: string): Promise<{ ok: boolean }> {
  // take an approved creation back down (sets rejected, keeps the record);
  // moderation take-downs notify the author like any rejection
  return rejectCreation(id, 'Removed by moderators')
}

export async function resolveReport(id: string): Promise<{ ok: boolean }> {
  const supabase = await requireAdmin()
  if (!supabase) return { ok: false }

  const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', id)
  if (error) return { ok: false }
  revalidatePath('/admin')
  return { ok: true }
}
