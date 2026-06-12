import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Globe, Clock, XCircle } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Container } from '@/components/layout/container'
import { MasonryGrid } from '@/components/feed/masonry-grid'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Creation, CreationMedia, FeedItem, Profile } from '@/types/database'

interface PageProps {
  params: Promise<{ username: string }>
}

type CreationWithMedia = Creation & {
  creation_media: CreationMedia[]
  categories: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  return { title: `@${username}` }
}

function toFeedItem(c: CreationWithMedia, profile: Profile): FeedItem {
  const first = [...c.creation_media].sort((a, b) => a.position - b.position)[0] ?? null
  return {
    id: c.id,
    title: c.title,
    live_url: c.live_url,
    og_image_path: c.og_image_path,
    og_title: c.og_title,
    og_image_width: c.og_image_width,
    og_image_height: c.og_image_height,
    prompt_excerpt: c.prompt?.slice(0, 280) ?? null,
    category_slug: c.categories.slug,
    like_count: c.like_count,
    comment_count: c.comment_count,
    approved_at: c.approved_at ?? c.created_at,
    author_username: profile.username,
    author_display_name: profile.display_name,
    author_avatar_url: profile.avatar_url,
    media_kind: first?.kind ?? null,
    media_path: first?.storage_path ?? null,
    media_poster_path: first?.poster_path ?? null,
    media_width: first?.width ?? null,
    media_height: first?.height ?? null,
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params
  const supabase = await createSupabaseServerClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username)
    .maybeSingle<Profile>()
  if (!profile) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwner = user?.id === profile.id

  const { data: creations } = await supabase
    .from('creations')
    .select('*, creation_media(*), categories(slug)')
    .eq('author_id', profile.id)
    .order('created_at', { ascending: false })

  const all = (creations ?? []) as CreationWithMedia[]
  const approved = all.filter((c) => c.status === 'approved')
  const unapproved = isOwner ? all.filter((c) => c.status !== 'approved') : []

  return (
    <>
      <Header />
      <main id="main" className="py-12">
        <Container>
          <div className="flex flex-col items-center text-center">
            <Avatar
              src={profile.avatar_url}
              name={profile.display_name ?? profile.username}
              size={88}
            />
            <h1 className="font-display mt-4 text-3xl font-semibold">
              {profile.display_name ?? profile.username}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">@{profile.username}</p>
            {profile.bio && <p className="text-muted mt-3 max-w-md text-sm">{profile.bio}</p>}
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent mt-2 flex items-center gap-1.5 text-sm hover:underline"
              >
                <Globe className="h-3.5 w-3.5" aria-hidden />
                {profile.website_url.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            )}
          </div>

          {unapproved.length > 0 && (
            <section className="mt-12" aria-label="Your submissions in review">
              <h2 className="font-display text-xl font-semibold">In review</h2>
              <ul className="mt-4 space-y-2">
                {unapproved.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/c/${c.id}`}
                      className="border-border hover:border-border-strong flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors"
                    >
                      <span className="truncate text-sm font-medium">{c.title}</span>
                      {c.status === 'pending' ? (
                        <Badge variant="warning">
                          <Clock className="h-3 w-3" aria-hidden /> Pending
                        </Badge>
                      ) : (
                        <Badge variant="error">
                          <XCircle className="h-3 w-3" aria-hidden /> Not approved
                        </Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-12" aria-label="Creations">
            {approved.length > 0 ? (
              <MasonryGrid items={approved.map((c) => toFeedItem(c, profile))} />
            ) : (
              <p className="text-muted py-16 text-center text-sm">
                No published creations yet{isOwner ? ' — share your first one!' : '.'}
              </p>
            )}
          </section>
        </Container>
      </main>
      <Footer />
    </>
  )
}
