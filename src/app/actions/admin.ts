'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

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

  const { error } = await supabase.from('creations').update({ status: 'approved' }).eq('id', id)
  if (error) return { ok: false }
  revalidatePath('/')
  revalidatePath('/admin')
  return { ok: true }
}

export async function rejectCreation(id: string, reason: string): Promise<{ ok: boolean }> {
  const supabase = await requireAdmin()
  if (!supabase) return { ok: false }

  const { error } = await supabase
    .from('creations')
    .update({ status: 'rejected', rejection_reason: reason.slice(0, 500) || null })
    .eq('id', id)
  if (error) return { ok: false }
  revalidatePath('/')
  revalidatePath('/admin')
  return { ok: true }
}

export async function removeCreation(id: string): Promise<{ ok: boolean }> {
  // take an approved creation back down (sets rejected, keeps the record)
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
