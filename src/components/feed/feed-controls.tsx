import Link from 'next/link'
import { Flame, Sparkles } from 'lucide-react'
import { CATEGORIES } from '@/types/database'
import { cn } from '@/lib/utils'

interface FeedControlsProps {
  sort: string
  category: string | null
  tag: string | null
}

function feedHref(sort: string, category: string | null, tag: string | null) {
  const params = new URLSearchParams()
  if (sort === 'popular') params.set('sort', 'popular')
  if (category) params.set('category', category)
  if (tag) params.set('tag', tag)
  const qs = params.toString()
  return qs ? `/?${qs}` : '/'
}

export function FeedControls({ sort, category, tag }: FeedControlsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="-mx-1 flex scrollbar-none gap-2 overflow-x-auto px-1 py-1">
        <Link
          href={feedHref(sort, null, tag)}
          className={cn(
            'shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
            !category
              ? 'bg-foreground text-background border-foreground font-medium'
              : 'border-border text-muted hover:border-border-strong hover:text-foreground',
          )}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={feedHref(sort, c.slug, tag)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
              category === c.slug
                ? 'bg-foreground text-background border-foreground font-medium'
                : 'border-border text-muted hover:border-border-strong hover:text-foreground',
            )}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="border-border flex shrink-0 self-start rounded-full border p-0.5 sm:self-auto">
        <Link
          href={feedHref('new', category, tag)}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors',
            sort !== 'popular' ? 'bg-surface-raised text-foreground font-medium' : 'text-muted',
          )}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden /> New
        </Link>
        <Link
          href={feedHref('popular', category, tag)}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors',
            sort === 'popular' ? 'bg-surface-raised text-foreground font-medium' : 'text-muted',
          )}
        >
          <Flame className="h-3.5 w-3.5" aria-hidden /> Popular
        </Link>
      </div>
    </div>
  )
}
