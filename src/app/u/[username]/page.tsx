import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Globe, Clock, XCircle } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { displayUrl, safeExternalUrl } from '@/lib/url'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Container } from '@/components/layout/container'
import { MasonryGrid } from '@/components/feed/masonry-grid'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { FollowButton } from '@/components/profile/follow-button'
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

  const [{ data: creations }, followingRes] = await Promise.all([
    supabase
      .from('creations')
      .select('*, creation_media(*), categories(slug)')
      .eq('author_id', profile.id)
      .order('created_at', { ascending: false }),
    user && !isOwner
      ? supabase
          .from('follows')
          .select('followee_id')
          .eq('follower_id', user.id)
          .eq('followee_id', profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const all = (creations ?? []) as CreationWithMedia[]
  const approved = all.filter((c) => c.status === 'approved')
  const unapproved = isOwner ? all.filter((c) => c.status !== 'approved') : []
  const isFollowing = Boolean(followingRes.data)
  const websiteUrl = safeExternalUrl(profile.website_url)

  return (
    <>
      <Header />
      <main id="main" className="py-12">
        <Container>
          <div className="border-ink grid border-2 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex items-center gap-5 p-5 sm:p-6">
              <Avatar
                src={profile.avatar_url}
                name={profile.display_name ?? profile.username}
                size={88}
                className="shrink-0"
              />
              <div className="min-w-0">
                <h1 className="font-display text-4xl leading-none tracking-tight uppercase sm:text-5xl">
                  {profile.display_name ?? profile.username}
                </h1>
                <p className="label-mono text-muted mt-2">@{profile.username}</p>
                {profile.bio && <p className="text-muted mt-3 max-w-md text-sm">{profile.bio}</p>}
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent label-mono mt-2 flex items-center gap-1.5 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" aria-hidden />
                    {displayUrl(websiteUrl)}
                  </a>
                )}
              </div>
            </div>
            <aside className="border-ink flex flex-col border-t-2 lg:border-t-0 lg:border-l-2">
              <div className="divide-ink grid grid-cols-3 divide-x-2">
                <div className="px-4 py-3">
                  <p className="label-mono text-muted-foreground">Projects</p>
                  <p className="font-display mt-1 text-3xl leading-none tabular-nums">
                    {approved.length}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="label-mono text-muted-foreground">Followers</p>
                  <p className="font-display mt-1 text-3xl leading-none tabular-nums">
                    {profile.follower_count}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="label-mono text-muted-foreground">Following</p>
                  <p className="font-display mt-1 text-3xl leading-none tabular-nums">
                    {profile.following_count}
                  </p>
                </div>
              </div>
              <div className="border-ink mt-auto border-t-2 p-3">
                {isOwner ? (
                  <Link
                    href="/settings/profile"
                    className="label-mono border-ink text-ink flex items-center justify-center gap-2 border-2 px-4 py-3 font-bold transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-ink)]"
                  >
                    Edit profile
                  </Link>
                ) : (
                  <FollowButton
                    profileId={profile.id}
                    username={profile.username}
                    initialFollowing={isFollowing}
                    initialCount={profile.follower_count}
                    signedIn={Boolean(user)}
                    className="w-full"
                  />
                )}
              </div>
            </aside>
          </div>

          {unapproved.length > 0 && (
            <section className="mt-12" aria-label="Your submissions in review">
              <h2 className="font-display text-2xl leading-none tracking-tight uppercase">
                In review
              </h2>
              <ul className="border-ink divide-ink mt-4 divide-y-2 border-2">
                {unapproved.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/c/${c.id}`}
                      className="hover:bg-ink hover:text-background flex items-center justify-between gap-3 px-4 py-3 transition-colors"
                    >
                      <span className="truncate text-sm font-bold tracking-wide uppercase">
                        {c.title}
                      </span>
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
              <p className="label-mono text-muted border-ink border-2 border-dashed py-16 text-center">
                No published creations yet{isOwner ? ' — submit your first one!' : '.'}
              </p>
            )}
          </section>
        </Container>
      </main>
      <Footer />
    </>
  )
}
