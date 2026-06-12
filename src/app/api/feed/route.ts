import { NextResponse } from 'next/server'
import { fetchFeedPage, fetchFollowedAuthorIds, type FeedSort } from '@/lib/feed'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sort: FeedSort = searchParams.get('sort') === 'popular' ? 'popular' : 'new'
  const category = searchParams.get('category')
  const tag = searchParams.get('tag')
  const cursor = searchParams.get('cursor')
  const following = searchParams.get('feed') === 'following'

  // the followed-author list is derived from the session, never from the client
  const authors = following ? ((await fetchFollowedAuthorIds()) ?? []) : null

  const page = await fetchFeedPage({ sort, category, tag, cursor, authors })
  return NextResponse.json(page, {
    headers: following
      ? { 'cache-control': 'private, no-store' }
      : { 'cache-control': 'public, max-age=15, stale-while-revalidate=60' },
  })
}
