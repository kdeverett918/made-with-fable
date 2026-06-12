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
  feed?: string | null
}

export function InfiniteFeed({
  initialItems,
  initialCursor,
  sort,
  category,
  tag,
  feed,
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
      if (feed) params.set('feed', feed)
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
  }, [cursor, loading, sort, category, tag, feed])

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
      <div className="border-ink bg-surface relative overflow-hidden border-2 border-dashed py-20 text-center shadow-[4px_4px_0_0_var(--color-ink)]">
        <span
          className="bg-accent border-ink absolute top-0 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2"
          aria-hidden
        />
        <p className="font-display text-3xl leading-none uppercase">
          {feed === 'following' ? 'Your board is empty' : 'Nothing here yet'}
        </p>
        <p className="label-mono text-muted mt-3">
          {feed === 'following'
            ? 'Follow some makers and their projects will pin here.'
            : "Be the first — submit what you've made with Fable."}
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
