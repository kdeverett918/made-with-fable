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

export async function fetchFeedPage(opts: {
  sort: FeedSort
  category?: string | null
  tag?: string | null
  cursor?: string | null
}): Promise<FeedPageResult> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('feed_page', {
    p_sort: opts.sort,
    p_category: opts.category ?? null,
    p_tag: opts.tag ?? null,
    p_cursor: opts.cursor ? decodeCursor(opts.cursor) : null,
    p_limit: FEED_PAGE_SIZE,
  })

  if (error || !data) return { items: [], nextCursor: null }

  const items = data as FeedItem[]
  const nextCursor = items.length === FEED_PAGE_SIZE ? encodeCursor(items[items.length - 1]) : null
  return { items, nextCursor }
}
