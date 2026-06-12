'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { Globe, Heart, MessageCircle, Play, Terminal } from 'lucide-react'
import { mediaUrl } from '@/lib/storage'
import { Avatar } from '@/components/ui/avatar'
import type { FeedItem } from '@/types/database'

/**
 * Estimated card height at a given column width — lets the masonry place
 * cards without measuring the DOM. Keep in sync with the render below.
 */
export function estimateCardHeight(item: FeedItem, columnWidth: number): number {
  const chrome = 84 // title + author/meta rows
  if (item.media_width && item.media_height) {
    return columnWidth * (item.media_height / item.media_width) + chrome
  }
  if (item.og_image_width && item.og_image_height) {
    return columnWidth * (item.og_image_height / item.og_image_width) + chrome
  }
  if (item.live_url) return 120 + chrome
  if (item.prompt_excerpt) {
    const lines = Math.ceil(Math.min(item.prompt_excerpt.length, 280) / 38)
    return 48 + lines * 18 + chrome
  }
  return 90 + chrome
}

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function CreationCard({ item, priority = false }: { item: FeedItem; priority?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const aspect =
    item.media_width && item.media_height
      ? `${item.media_width} / ${item.media_height}`
      : item.og_image_width && item.og_image_height
        ? `${item.og_image_width} / ${item.og_image_height}`
        : undefined

  return (
    <Link
      href={`/c/${item.id}`}
      className="group border-border bg-surface hover:border-border-strong block overflow-hidden rounded-lg border transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
      onMouseEnter={() => videoRef.current?.play().catch(() => {})}
      onMouseLeave={() => {
        videoRef.current?.pause()
        if (videoRef.current) videoRef.current.currentTime = 0
      }}
    >
      {/* media area */}
      {item.media_kind === 'video' && item.media_path ? (
        <div className="relative" style={{ aspectRatio: aspect }}>
          <video
            ref={videoRef}
            src={mediaUrl(item.media_path)}
            poster={item.media_poster_path ? mediaUrl(item.media_poster_path) : undefined}
            muted
            loop
            playsInline
            preload="none"
            className="h-full w-full object-cover"
          />
          <span className="bg-background/70 absolute right-2 bottom-2 rounded-full p-1.5 backdrop-blur-sm">
            <Play className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      ) : item.media_kind === 'image' && item.media_path ? (
        <div className="relative" style={{ aspectRatio: aspect }}>
          <Image
            src={mediaUrl(item.media_path)}
            alt={item.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      ) : item.og_image_path ? (
        <div className="relative" style={{ aspectRatio: aspect }}>
          <Image
            src={mediaUrl(item.og_image_path)}
            alt={item.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            className="object-cover"
          />
          {item.live_url && (
            <span className="bg-background/70 absolute bottom-2 left-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs backdrop-blur-sm">
              <Globe className="h-3 w-3" aria-hidden /> {domainOf(item.live_url)}
            </span>
          )}
        </div>
      ) : item.live_url ? (
        <div className="from-accent/15 to-surface flex h-[120px] flex-col items-center justify-center gap-2 bg-gradient-to-br">
          <Globe className="text-accent h-6 w-6" aria-hidden />
          <span className="text-muted px-4 text-center text-sm">{domainOf(item.live_url)}</span>
        </div>
      ) : item.prompt_excerpt ? (
        <div className="p-4">
          <Terminal className="text-accent mb-2 h-4 w-4" aria-hidden />
          <p className="text-muted line-clamp-6 font-mono text-xs leading-relaxed">
            {item.prompt_excerpt}
          </p>
        </div>
      ) : (
        <div className="from-accent/10 to-surface h-[90px] bg-gradient-to-br" />
      )}

      {/* chrome */}
      <div className="p-3">
        <h3 className="truncate text-sm font-medium">{item.title}</h3>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <Avatar
              src={item.author_avatar_url}
              name={item.author_display_name ?? item.author_username}
              size={18}
            />
            <span className="text-muted-foreground truncate text-xs">
              {item.author_display_name ?? item.author_username}
            </span>
          </span>
          <span className="text-muted-foreground flex shrink-0 items-center gap-2 text-xs">
            <span className="flex items-center gap-0.5">
              <Heart className="h-3 w-3" aria-hidden /> {item.like_count}
            </span>
            <span className="flex items-center gap-0.5">
              <MessageCircle className="h-3 w-3" aria-hidden /> {item.comment_count}
            </span>
          </span>
        </div>
      </div>
    </Link>
  )
}
