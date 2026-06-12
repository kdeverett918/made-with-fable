'use client'

import { useEffect, useState } from 'react'
import { CreationCard, estimateCardHeight } from '@/components/feed/creation-card'
import type { FeedItem } from '@/types/database'

const BREAKPOINTS: Array<{ minWidth: number; columns: number }> = [
  { minWidth: 1280, columns: 5 },
  { minWidth: 1024, columns: 4 },
  { minWidth: 640, columns: 3 },
  { minWidth: 0, columns: 2 },
]

function columnsForWidth(width: number) {
  return BREAKPOINTS.find((b) => width >= b.minWidth)?.columns ?? 2
}

function useColumnCount() {
  const [columns, setColumns] = useState(4)
  useEffect(() => {
    const update = () => setColumns(columnsForWidth(window.innerWidth))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return columns
}

/**
 * Shortest-column masonry. Heights come from stored media dimensions, so no
 * DOM measurement is needed and appended pages never reshuffle earlier items.
 */
export function MasonryGrid({ items }: { items: FeedItem[] }) {
  const columnCount = useColumnCount()

  const columns: FeedItem[][] = Array.from({ length: columnCount }, () => [])
  const heights = new Array<number>(columnCount).fill(0)
  const columnWidth = 280 // estimate only — relative ratios are what matter

  for (const item of items) {
    let shortest = 0
    for (let i = 1; i < columnCount; i++) {
      if (heights[i] < heights[shortest]) shortest = i
    }
    columns[shortest].push(item)
    heights[shortest] += estimateCardHeight(item, columnWidth) + 16
  }

  return (
    <div className="flex gap-4">
      {columns.map((column, colIndex) => (
        <div key={colIndex} className="flex min-w-0 flex-1 flex-col gap-4">
          {column.map((item, i) => (
            <CreationCard key={item.id} item={item} priority={colIndex < 4 && i === 0} />
          ))}
        </div>
      ))}
    </div>
  )
}
