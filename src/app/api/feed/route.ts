import { NextResponse } from 'next/server'
import { fetchFeedPage, type FeedSort } from '@/lib/feed'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sort: FeedSort = searchParams.get('sort') === 'popular' ? 'popular' : 'new'
  const category = searchParams.get('category')
  const tag = searchParams.get('tag')
  const cursor = searchParams.get('cursor')

  const page = await fetchFeedPage({ sort, category, tag, cursor })
  return NextResponse.json(page, {
    headers: { 'cache-control': 'public, max-age=15, stale-while-revalidate=60' },
  })
}
