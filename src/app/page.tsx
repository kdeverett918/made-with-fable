import Link from 'next/link'
import Image from 'next/image'
import { fetchFeedPage, fetchFollowedAuthorIds, type FeedSort } from '@/lib/feed'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Sidebar } from '@/components/feed/sidebar'
import { InfiniteFeed } from '@/components/feed/infinite-feed'
import { CATEGORIES } from '@/types/database'

export const dynamic = 'force-dynamic'

interface HomeProps {
  searchParams: Promise<{ sort?: string; category?: string; tag?: string; feed?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams
  const sort: FeedSort = params.sort === 'popular' ? 'popular' : 'new'
  const category = params.category ?? null
  const tag = params.tag ?? null

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // the followed-author list comes from the session, never from the URL
  const feed = params.feed === 'following' && user ? 'following' : null
  const followedIds = feed ? await fetchFollowedAuthorIds() : null

  const [{ items, nextCursor }, countsRes, membersRes] = await Promise.all([
    fetchFeedPage({ sort, category, tag, authors: followedIds }),
    supabase.rpc('category_counts'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ])

  const countRows = (countsRes.data ?? []) as { slug: string; approved_count: number }[]
  const categoryCounts: Record<string, number> = {}
  for (const c of CATEGORIES) categoryCounts[c.slug] = 0
  let totalApproved = 0
  for (const row of countRows) {
    categoryCounts[row.slug] = Number(row.approved_count)
    totalApproved += Number(row.approved_count)
  }
  const totalMembers = membersRes.count ?? 0

  return (
    <>
      <Header />
      <main id="main" className="overflow-x-clip">
        <h1
          className="font-display border-ink animate-fade-in pointer-events-none w-full border-b-2 px-2 text-center leading-[0.92] font-normal tracking-tight uppercase select-none"
          style={{ fontSize: 'clamp(3rem, 12.5vw, 13.5rem)' }}
        >
          Made with Fable
        </h1>

        <section className="border-ink grid border-b-2 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <div className="border-ink bg-surface-raised flex items-center justify-center border-b-2 p-6 md:border-r-2 md:border-b-0">
            <Image
              src="/rip-fable-v2.png"
              alt="A headstone reading R.I.P. Fable"
              width={1024}
              height={1024}
              priority
              className="h-auto w-full max-w-[260px]"
            />
          </div>
          <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
            <p className="label-mono text-accent font-bold">In memoriam · 2025—2026</p>
            <h2 className="font-display text-4xl leading-[0.9] uppercase sm:text-5xl">
              Fable is gone.
              <br />
              The work it made lives on.
            </h2>
            <p className="text-muted max-w-xl leading-relaxed text-pretty">
              Claude Fable 5 has been retired. This board keeps the projects people built with it
              online — games, tools, songs, sites. Add yours so it doesn&rsquo;t disappear. No
              account needed.
            </p>
            <div>
              <Link
                href="/submit"
                className="label-mono bg-accent text-on-accent hover:bg-accent-deep inline-block px-4 py-2.5 font-bold transition-colors"
              >
                Post your project →
              </Link>
            </div>
          </div>
        </section>

        <div className="border-ink grid grid-cols-1 border-b-2 sm:grid-cols-2 lg:grid-cols-4">
          <p className="label-mono text-ink px-4 py-3">
            A community archive of everything made with Fable.
          </p>
          <p className="label-mono text-muted border-ink px-4 py-3 sm:border-l-2">
            Browse the board. Add your own — no sign-up.
          </p>
          <p className="label-mono border-ink px-4 py-3 lg:border-l-2">
            Total projects: <span className="text-accent font-bold">{totalApproved}</span>
            <br />
            Total members: <span className="text-accent font-bold">{totalMembers}</span>
          </p>
          <Link
            href="/submit"
            className="label-mono text-accent border-ink flex items-center px-4 py-3 font-bold hover:underline sm:border-l-2"
          >
            Submit a project →
          </Link>
        </div>

        <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
          <Sidebar
            sort={sort}
            category={category}
            tag={tag}
            feed={feed}
            signedIn={Boolean(user)}
            categoryCounts={categoryCounts}
            totalApproved={totalApproved}
          />
          <div className="border-ink min-w-0 overflow-x-clip border-t-2 p-3 sm:p-4 lg:border-t-0">
            {tag && (
              <p className="label-mono text-muted mb-4">
                Tagged: <span className="text-accent font-bold">#{tag}</span>{' '}
                <Link href="/" className="hover:underline">
                  [clear]
                </Link>
              </p>
            )}
            <InfiniteFeed
              key={`${sort}-${category}-${tag}-${feed}`}
              initialItems={items}
              initialCursor={nextCursor}
              sort={sort}
              category={category}
              tag={tag}
              feed={feed}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
