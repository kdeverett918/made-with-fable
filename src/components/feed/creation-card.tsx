'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { Globe, Heart, MessageSquare, Play } from 'lucide-react'
import { mediaUrl } from '@/lib/storage'
import type { FeedItem } from '@/types/database'

/**
 * Estimated card height at a given column width — lets the masonry place
 * cards without measuring the DOM. Keep in sync with the render below.
 */
export function estimateCardHeight(item: FeedItem, columnWidth: number): number {
  // every card is the same box: fixed 4:3 media area + fixed chrome,
  // so the board reads as an even pinned grid
  const chrome = 148 // pin allowance + title strip + footer strip
  return columnWidth * 0.75 + chrome
}

const countFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1,
  notation: 'compact',
})

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function countLabel(count: number, singular: string) {
  return `${countFormatter.format(count)} ${count === 1 ? singular : `${singular}s`}`
}

function BoardPin({ tilt }: { tilt: number }) {
  return (
    <span
      className="pointer-events-none absolute top-3 left-1/2 z-20 h-10 w-10"
      style={{ transform: `translate(-50%, -50%) rotate(${tilt}deg)` }}
      aria-hidden
    >
      <svg
        viewBox="0 0 40 46"
        className="h-full w-full drop-shadow-[2px_2px_0_var(--color-ink)]"
        fill="none"
      >
        <path d="M20 21v20" stroke="var(--color-ink)" strokeLinecap="round" strokeWidth="2.5" />
        <path
          d="M11 18h18l4 9H7l4-9Z"
          fill="var(--color-accent)"
          stroke="var(--color-ink)"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />
        <circle
          cx="20"
          cy="12"
          r="9"
          fill="var(--color-accent)"
          stroke="var(--color-ink)"
          strokeWidth="2.5"
        />
        <circle cx="17" cy="9" r="2.5" fill="var(--color-on-accent)" opacity="0.9" />
      </svg>
    </span>
  )
}

export function CreationCard({
  item,
  preload = false,
  index = 0,
}: {
  item: FeedItem
  preload?: boolean
  index?: number
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // uniform boxes: every media area is cropped to 4:3 regardless of native size
  const mediaAspect = '4 / 3'
  const pinTilt = ((index % 5) - 2) * 4
  const cardNumber = String(index + 1).padStart(2, '0')

  return (
    <Link
      href={`/c/${item.id}`}
      className="group animate-slide-up relative isolate block min-w-0 pt-3 outline-offset-4"
      style={{ animationDelay: `${Math.min(index * 34, 420)}ms` }}
      onMouseEnter={() => videoRef.current?.play().catch(() => {})}
      onMouseLeave={() => {
        videoRef.current?.pause()
        if (videoRef.current) videoRef.current.currentTime = 0
      }}
    >
      <BoardPin tilt={pinTilt} />
      <article className="border-ink bg-background group-hover:bg-surface relative min-w-0 overflow-hidden border-2 shadow-[3px_3px_0_0_var(--color-ink)] transition-[transform,box-shadow,background-color] duration-300 [transition-timing-function:var(--ease-fluid)] will-change-transform group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:-rotate-1 group-hover:shadow-[8px_8px_0_0_var(--color-ink)]">
        <span className="bg-accent absolute inset-x-0 top-0 h-1.5" aria-hidden />

        {/* title strip */}
        <div className="border-ink border-b-2 px-3 pt-4 pb-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="label-mono text-muted-foreground truncate">
              pinned / {item.category_slug}
            </span>
            <span className="label-mono bg-ink text-background shrink-0 px-1.5 py-1">
              {cardNumber}
            </span>
          </div>
          <h3 className="line-clamp-2 min-h-[2lh] text-base leading-[0.98] font-black tracking-wide break-words uppercase">
            {item.title}
          </h3>
          <p className="label-mono text-muted mt-2 truncate">by @{item.author_username}</p>
        </div>

        {/* media area */}
        {item.media_kind === 'video' && item.media_path ? (
          <div
            className="border-ink bg-surface-raised relative overflow-hidden border-b-2"
            style={{ aspectRatio: mediaAspect }}
          >
            <video
              ref={videoRef}
              src={mediaUrl(item.media_path)}
              poster={item.media_poster_path ? mediaUrl(item.media_poster_path) : undefined}
              muted
              loop
              playsInline
              preload="none"
              className="h-full w-full object-cover contrast-110 grayscale transition-[filter,transform] duration-500 [transition-timing-function:var(--ease-fluid)] group-hover:scale-[1.03] group-hover:grayscale-0"
            />
            <span className="bg-ink text-background border-ink absolute right-0 bottom-0 border-t-2 border-l-2 p-2">
              <Play className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
        ) : item.media_kind === 'image' && item.media_path ? (
          <div
            className="border-ink bg-surface-raised relative overflow-hidden border-b-2"
            style={{ aspectRatio: mediaAspect }}
          >
            <Image
              src={mediaUrl(item.media_path)}
              alt={item.title}
              fill
              loading={preload ? 'eager' : 'lazy'}
              sizes="(max-width: 559px) 100vw, (max-width: 900px) 50vw, (max-width: 1280px) 33vw, 260px"
              className="object-cover contrast-110 grayscale transition-[filter,transform] duration-500 [transition-timing-function:var(--ease-fluid)] group-hover:scale-[1.03] group-hover:grayscale-0"
            />
          </div>
        ) : item.og_image_path ? (
          <div
            className="border-ink bg-surface-raised relative overflow-hidden border-b-2"
            style={{ aspectRatio: mediaAspect }}
          >
            <Image
              src={mediaUrl(item.og_image_path)}
              alt={item.title}
              fill
              loading={preload ? 'eager' : 'lazy'}
              sizes="(max-width: 559px) 100vw, (max-width: 900px) 50vw, (max-width: 1280px) 33vw, 260px"
              className="object-cover contrast-110 grayscale transition-[filter,transform] duration-500 [transition-timing-function:var(--ease-fluid)] group-hover:scale-[1.03] group-hover:grayscale-0"
            />
            {item.live_url && (
              <span className="label-mono bg-ink text-background border-ink absolute bottom-0 left-0 flex max-w-full items-center gap-1 border-t-2 border-r-2 px-2 py-1.5">
                <Globe className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{domainOf(item.live_url)}</span>
              </span>
            )}
          </div>
        ) : item.live_url ? (
          <div
            className="border-ink bg-surface-raised flex flex-col items-center justify-center gap-3 border-b-2 px-4"
            style={{ aspectRatio: mediaAspect }}
          >
            <Globe className="text-accent h-6 w-6" aria-hidden />
            <span className="label-mono text-ink max-w-full text-center break-all">
              {domainOf(item.live_url)}
            </span>
          </div>
        ) : item.prompt_excerpt ? (
          <div
            className="border-ink bg-surface-raised overflow-hidden border-b-2 p-3"
            style={{ aspectRatio: mediaAspect }}
          >
            <p className="label-mono text-accent mb-2 font-bold">&gt;_ prompt</p>
            <p className="text-muted line-clamp-6 font-mono text-xs leading-relaxed break-words">
              {item.prompt_excerpt}
            </p>
          </div>
        ) : (
          <div
            className="border-ink bg-surface-raised border-b-2"
            style={{ aspectRatio: mediaAspect }}
          />
        )}

        {/* footer strip */}
        <div className="label-mono bg-background grid grid-cols-2 text-[0.65rem] tabular-nums">
          <span className="text-accent border-ink flex min-w-0 items-center justify-center gap-1.5 border-r-2 px-2 py-2.5 font-bold">
            <Heart className="h-3.5 w-3.5 fill-current" aria-hidden />
            <span className="truncate">{countLabel(item.like_count, 'like')}</span>
          </span>
          <span className="text-ink flex min-w-0 items-center justify-center gap-1.5 px-2 py-2.5 font-bold">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            <span className="truncate">{countLabel(item.comment_count, 'comment')}</span>
          </span>
        </div>
      </article>
    </Link>
  )
}
