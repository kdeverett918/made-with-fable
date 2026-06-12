'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { fetchRecentCounts, RATE_LIMITS } from '@/lib/rate-limit'

const followSchema = z.object({
  profileId: z.uuid(),
  follow: z.boolean(),
})

export async function setFollow(profileId: string, follow: boolean): Promise<{ ok: boolean }> {
  const parsed = followSchema.safeParse({ profileId, follow })
  if (!parsed.success) return { ok: false }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.id === parsed.data.profileId) return { ok: false }

  if (parsed.data.follow) {
    const recent = await fetchRecentCounts(supabase)
    if (recent.follows_1m >= RATE_LIMITS.followsPerMinute) return { ok: false }
  }

  const { data: followee } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', parsed.data.profileId)
    .single()
  if (!followee) return { ok: false }

  const { error } = parsed.data.follow
    ? await supabase
        .from('follows')
        .upsert(
          { follower_id: user.id, followee_id: parsed.data.profileId },
          { onConflict: 'follower_id,followee_id', ignoreDuplicates: true },
        )
    : await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('followee_id', parsed.data.profileId)

  if (error) return { ok: false }

  revalidatePath(`/u/${followee.username}`)
  revalidatePath('/makers')
  return { ok: true }
}
