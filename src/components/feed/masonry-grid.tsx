'use client'

import { CreationCard } from '@/components/feed/creation-card'
import type { FeedItem } from '@/types/database'

/**
 * Pinned board layout. CSS grid avoids a hydration-only layout pass, so the
 * board paints as a full editorial wall even before client JavaScript settles.
 */
export function MasonryGrid({ items }: { items: FeedItem[] }) {
  return (
    <section
      aria-label="Pinned project board"
      className="border-ink bg-surface relative isolate w-full max-w-full min-w-0 overflow-x-clip border-2 p-2 pb-4 sm:p-3 sm:pb-5"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--color-ink) 1px, transparent 1px), linear-gradient(to bottom, var(--color-ink) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
        aria-hidden
      />
      <div className="border-ink bg-background relative mb-3 flex items-center justify-between border-2">
        <p className="label-mono text-ink px-3 py-2 font-bold">Pinned board</p>
        <p className="label-mono text-accent border-ink border-l-2 px-3 py-2 font-bold tabular-nums">
          {items.length} work{items.length === 1 ? '' : 's'}
        </p>
      </div>
      <div className="relative grid min-w-0 grid-cols-1 items-start gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
        {items.map((item, index) => (
          <CreationCard key={item.id} item={item} index={index} preload={index < 8} />
        ))}
      </div>
    </section>
  )
}
