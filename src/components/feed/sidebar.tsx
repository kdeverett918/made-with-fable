import Link from 'next/link'
import { CATEGORIES } from '@/types/database'
import { cn } from '@/lib/utils'

interface SidebarProps {
  sort: string
  category: string | null
  tag: string | null
  feed?: string | null
  signedIn?: boolean
  categoryCounts: Record<string, number>
  totalApproved: number
}

function feedHref(sort: string, category: string | null, tag: string | null, feed?: string | null) {
  const params = new URLSearchParams()
  if (sort === 'popular') params.set('sort', 'popular')
  if (category) params.set('category', category)
  if (tag) params.set('tag', tag)
  if (feed) params.set('feed', feed)
  const qs = params.toString()
  return qs ? `/?${qs}` : '/'
}

export function Sidebar({
  sort,
  category,
  tag,
  feed = null,
  signedIn = false,
  categoryCounts,
  totalApproved,
}: SidebarProps) {
  const rowClass =
    'label-mono flex items-center justify-between px-4 py-2 hover:bg-ink hover:text-background transition-colors'
  const chipClass =
    'label-mono border-ink shrink-0 border-2 px-3 py-2 font-bold transition-colors hover:bg-ink hover:text-background'

  return (
    <>
      {/* compact filter strips on mobile so the board stays above the fold */}
      <div className="border-ink min-w-0 border-t-2 lg:hidden">
        <div className="flex scrollbar-none gap-2 overflow-x-auto px-3 py-3">
          {signedIn && (
            <>
              <Link
                href={feedHref(sort, category, tag, null)}
                className={cn(chipClass, !feed && 'bg-ink text-background')}
              >
                Everyone
              </Link>
              <Link
                href={feedHref(sort, category, tag, 'following')}
                className={cn(chipClass, feed === 'following' && 'bg-ink text-background')}
              >
                Following
              </Link>
              <span className="bg-ink w-0.5 shrink-0 self-stretch" aria-hidden />
            </>
          )}
          <Link
            href={feedHref('new', category, tag, feed)}
            className={cn(chipClass, sort !== 'popular' && 'bg-ink text-background')}
          >
            Latest
          </Link>
          <Link
            href={feedHref('popular', category, tag, feed)}
            className={cn(chipClass, sort === 'popular' && 'bg-ink text-background')}
          >
            Most liked
          </Link>
        </div>
        <div className="flex scrollbar-none gap-2 overflow-x-auto px-3 pb-3">
          <Link
            href={feedHref(sort, null, tag, feed)}
            className={cn(chipClass, !category && 'bg-accent text-on-accent border-accent')}
          >
            All ({totalApproved})
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={feedHref(sort, c.slug, tag, feed)}
              className={cn(
                chipClass,
                category === c.slug && 'bg-accent text-on-accent border-accent',
              )}
            >
              {c.name} ({categoryCounts[c.slug] ?? 0})
            </Link>
          ))}
        </div>
      </div>

      <aside className="border-ink hidden flex-col border-r-0 lg:flex lg:border-r-2">
        {signedIn && (
          <section aria-label="Feed" className="border-ink border-b-2">
            <p className="label-mono text-muted px-4 pt-4 pb-2 font-bold">Feed</p>
            <ul className="pb-2">
              <li>
                <Link
                  href={feedHref(sort, category, tag, null)}
                  className={cn(rowClass, !feed && 'text-accent font-bold')}
                >
                  Everyone
                </Link>
              </li>
              <li>
                <Link
                  href={feedHref(sort, category, tag, 'following')}
                  className={cn(rowClass, feed === 'following' && 'text-accent font-bold')}
                >
                  Following
                </Link>
              </li>
            </ul>
          </section>
        )}

        <section aria-label="Filter by category" className="border-ink border-b-2">
          <p className="label-mono text-muted px-4 pt-4 pb-2 font-bold">Filter by</p>
          <ul className="pb-2">
            <li>
              <Link
                href={feedHref(sort, null, tag, feed)}
                className={cn(rowClass, !category && 'text-accent font-bold')}
              >
                <span>All projects</span>
                <span>{totalApproved}</span>
              </Link>
            </li>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={feedHref(sort, c.slug, tag, feed)}
                  className={cn(rowClass, category === c.slug && 'text-accent font-bold')}
                >
                  <span>{c.name}</span>
                  <span>{categoryCounts[c.slug] ?? 0}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Sort" className="border-ink border-b-2">
          <p className="label-mono text-muted px-4 pt-4 pb-2 font-bold">Sort by</p>
          <ul className="pb-2">
            <li>
              <Link
                href={feedHref('new', category, tag, feed)}
                className={cn(rowClass, sort !== 'popular' && 'text-accent font-bold')}
              >
                Latest
              </Link>
            </li>
            <li>
              <Link
                href={feedHref('popular', category, tag, feed)}
                className={cn(rowClass, sort === 'popular' && 'text-accent font-bold')}
              >
                Most liked
              </Link>
            </li>
          </ul>
        </section>

        <section className="hidden p-4 lg:block">
          <p className="label-mono text-ink leading-relaxed">
            <span className="text-accent">*</span> Fable is here for a limited time. A showcase
            of real products, games, and art people shipped with it.
          </p>
          <Link href="/about" className="label-mono text-accent mt-3 inline-block hover:underline">
            Learn more →
          </Link>
        </section>

        <p className="label-mono text-muted-foreground mt-auto hidden px-4 py-4 lg:block">
          © 2026 Made with Fable
        </p>
      </aside>
    </>
  )
}
