import { fetchFeedPage, type FeedSort } from '@/lib/feed'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Container } from '@/components/layout/container'
import { FeedControls } from '@/components/feed/feed-controls'
import { InfiniteFeed } from '@/components/feed/infinite-feed'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

interface HomeProps {
  searchParams: Promise<{ sort?: string; category?: string; tag?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams
  const sort: FeedSort = params.sort === 'popular' ? 'popular' : 'new'
  const category = params.category ?? null
  const tag = params.tag ?? null

  const { items, nextCursor } = await fetchFeedPage({ sort, category, tag })

  return (
    <>
      <Header />
      <main id="main">
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 50% -10%, rgba(240, 178, 74, 0.13), transparent)',
            }}
          />
          <Container className="text-center">
            <Badge variant="accent" className="animate-fade-in">
              Fable 5 is here — for a limited time
            </Badge>
            <h1 className="font-display animate-slide-up mx-auto mt-5 max-w-3xl text-4xl font-semibold text-balance sm:text-6xl">
              Show us what you made with <span className="text-accent">Fable</span>
            </h1>
            <p className="text-muted animate-slide-up mx-auto mt-5 max-w-xl text-lg text-pretty">
              A community gallery of websites, games, art, tools, and agents built with Claude Fable
              5 — with the prompts behind them.
            </p>
          </Container>
        </section>

        <Container>
          <FeedControls sort={sort} category={category} tag={tag} />
          {tag && (
            <p className="text-muted mt-3 text-sm">
              Showing creations tagged <span className="text-accent">#{tag}</span>
            </p>
          )}
          <div className="mt-6">
            <InfiniteFeed
              key={`${sort}-${category}-${tag}`}
              initialItems={items}
              initialCursor={nextCursor}
              sort={sort}
              category={category}
              tag={tag}
            />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}
