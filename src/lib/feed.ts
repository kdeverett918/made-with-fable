import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { FeedItem } from '@/types/database'

export type FeedSort = 'new' | 'popular'

export interface FeedPageResult {
  items: FeedItem[]
  nextCursor: string | null
}

export const FEED_PAGE_SIZE = 24

export function encodeCursor(item: FeedItem): string {
  const payload = {
    like_count: item.like_count,
    approved_at: item.approved_at,
    id: item.id,
  }
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function decodeCursor(cursor: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
    if (typeof parsed !== 'object' || parsed === null) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

/** Authors the signed-in viewer follows, for the "Following" feed. Capped to keep the RPC payload bounded. */
export async function fetchFollowedAuthorIds(): Promise<string[] | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('follows')
    .select('followee_id')
    .eq('follower_id', user.id)
    .limit(1000)
  return (data ?? []).map((row) => row.followee_id)
}

export async function fetchFeedPage(opts: {
  sort: FeedSort
  category?: string | null
  tag?: string | null
  cursor?: string | null
  authors?: string[] | null
}): Promise<FeedPageResult> {
  if (opts.authors && opts.authors.length === 0) return { items: [], nextCursor: null }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('feed_page', {
    p_sort: opts.sort,
    p_category: opts.category ?? null,
    p_tag: opts.tag ?? null,
    p_cursor: opts.cursor ? decodeCursor(opts.cursor) : null,
    p_limit: FEED_PAGE_SIZE,
    p_authors: opts.authors ?? null,
  })

  if (error || !data) return { items: [], nextCursor: null }

  const items = data as FeedItem[]
  const nextCursor = items.length === FEED_PAGE_SIZE ? encodeCursor(items[items.length - 1]) : null
  return { items, nextCursor }
}
