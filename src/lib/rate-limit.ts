import type { SupabaseClient } from '@supabase/supabase-js'

export interface RecentCounts {
  comments_1m: number
  reports_1h: number
  creations_1d: number
  follows_1m: number
}

/** Recent activity for the signed-in user. Fails open (zeros) so a broken RPC never locks everyone out. */
export async function fetchRecentCounts(supabase: SupabaseClient): Promise<RecentCounts> {
  const { data } = await supabase.rpc('my_recent_counts').single()
  const row = (data ?? {}) as Partial<RecentCounts>
  return {
    comments_1m: Number(row.comments_1m ?? 0),
    reports_1h: Number(row.reports_1h ?? 0),
    creations_1d: Number(row.creations_1d ?? 0),
    follows_1m: Number(row.follows_1m ?? 0),
  }
}

export const RATE_LIMITS = {
  commentsPerMinute: 5,
  reportsPerHour: 5,
  creationsPerDay: 10,
  followsPerMinute: 30,
  // anonymous submissions share one bucket (no account to key off), so this is a
  // global-per-day ceiling on the guest intake to bound spam before review
  guestCreationsPerDay: 40,
} as const
