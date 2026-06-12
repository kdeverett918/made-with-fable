'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MasonryGrid } from '@/components/feed/masonry-grid'
import { Spinner } from '@/components/ui/spinner'
import type { FeedItem } from '@/types/database'

interface InfiniteFeedProps {
  initialItems: FeedItem[]
  initialCursor: string | null
  sort: string
  category: string | null
  tag: string | null
}

export function InfiniteFeed({
  initialItems,
  initialCursor,
  sort,
  category,
  tag,
}: InfiniteFeedProps) {
  const [items, setItems] = useState(initialItems)
  const [cursor, setCursor] = useState(initialCursor)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // filter changes remount this component via the `key` prop on the page,
  // so no state reset is needed here

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ sort, cursor })
      if (category) params.set('category', category)
      if (tag) params.set('tag', tag)
      const res = await fetch(`/api/feed?${params}`)
      if (res.ok) {
        const page: { items: FeedItem[]; nextCursor: string | null } = await res.json()
        setItems((prev) => {
          const seen = new Set(prev.map((i) => i.id))
          return [...prev, ...page.items.filter((i) => !seen.has(i.id))]
        })
        setCursor(page.nextCursor)
      } else {
        setCursor(null)
      }
    } finally {
      setLoading(false)
    }
  }, [cursor, loading, sort, category, tag])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !cursor) return
    const observer = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && loadMore(),
      { rootMargin: '800px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [cursor, loadMore])

  if (items.length === 0) {
    return (
      <div className="border-border rounded-lg border border-dashed py-20 text-center">
        <p className="font-display text-xl">Nothing here yet</p>
        <p className="text-muted mt-2 text-sm">
          Be the first — share what you&apos;ve made with Fable.
        </p>
      </div>
    )
  }

  return (
    <>
      <MasonryGrid items={items} />
      <div ref={sentinelRef} className="flex justify-center py-10">
        {loading && <Spinner />}
      </div>
    </>
  )
}
