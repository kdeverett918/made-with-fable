import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Clock, ExternalLink, XCircle } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { mediaUrl } from '@/lib/storage'
import { siteConfig } from '@/config/site'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Container } from '@/components/layout/container'
import { MediaGallery } from '@/components/creation/media-gallery'
import { PromptBlock } from '@/components/creation/prompt-block'
import { LikeButton, ShareButton } from '@/components/creation/like-button'
import { Comments, type CommentWithAuthor } from '@/components/creation/comments'
import { ReportDialog } from '@/components/creation/report-dialog'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Creation, CreationMedia, Profile } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
})

async function getCreation(id: string) {
  if (!UUID_RE.test(id)) return null
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('creations')
    .select(
      '*, profiles!creations_author_id_fkey(*), creation_media(*), creation_tags(tags(name)), categories(slug, name)',
    )
    .eq('id', id)
    .maybeSingle()
  return data as
    | (Creation & {
        profiles: Profile
        creation_media: CreationMedia[]
        creation_tags: Array<{ tags: { name: string } | null }>
        categories: { slug: string; name: string }
      })
    | null
}

function formatDate(value: string | null) {
  if (!value) return 'Unlisted'
  return dateFormatter.format(new Date(value)).toUpperCase()
}

function formatNumber(value: number) {
  return value.toLocaleString('en-US')
}

function hostOf(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return 'External site'
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const creation = await getCreation(id)
  if (!creation) return { title: 'Not found' }

  const firstMedia = [...creation.creation_media].sort((a, b) => a.position - b.position)[0]
  const image = firstMedia
    ? mediaUrl(
        firstMedia.kind === 'video' ? (firstMedia.poster_path ?? '') : firstMedia.storage_path,
      )
    : creation.og_image_path
      ? mediaUrl(creation.og_image_path)
      : siteConfig.ogImage

  const description =
    creation.story?.slice(0, 160) ?? `Made with Fable by ${creation.profiles.username}`
  const canonicalUrl = `${siteConfig.url}/c/${id}`

  return {
    title: creation.title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: creation.title,
      description,
      url: canonicalUrl,
      images: [image],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: creation.title,
      description,
      images: [image],
    },
  }
}

export default async function CreationPage({ params }: PageProps) {
  const { id } = await params
  const creation = await getCreation(id)
  if (!creation) notFound()

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [likedRes, commentsRes, viewerRes] = await Promise.all([
    user
      ? supabase
          .from('likes')
          .select('creation_id')
          .eq('user_id', user.id)
          .eq('creation_id', creation.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('comments')
      .select(
        'id, body, created_at, author_id, profiles!comments_author_id_fkey(username, display_name, avatar_url)',
      )
      .eq('creation_id', creation.id)
      .order('created_at', { ascending: true }),
    user
      ? supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ])

  const isAdmin = Boolean(viewerRes.data?.is_admin)
  const isOwner = user?.id === creation.author_id
  const author = creation.profiles
  const media = [...creation.creation_media].sort((a, b) => a.position - b.position)
  const tags = creation.creation_tags.map((t) => t.tags?.name).filter(Boolean) as string[]
  const liveHost = creation.live_url ? hostOf(creation.live_url) : null
  const displayDate = formatDate(creation.approved_at ?? creation.created_at)

  const comments: CommentWithAuthor[] = (commentsRes.data ?? []).map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    author: (c as unknown as { profiles: CommentWithAuthor['author'] }).profiles,
    isOwn: user?.id === c.author_id,
  }))

  return (
    <>
      <Header />
      <main id="main" className="pb-16">
        <Container className="max-w-[1600px]">
          <article className="border-ink bg-background border-x-2 border-b-2">
            {isOwner && creation.status === 'pending' && (
              <div className="border-warning flex items-center gap-3 border-b-2 px-4 py-3 sm:px-6">
                <Clock className="text-warning h-4 w-4 shrink-0" aria-hidden />
                <p className="label-mono text-warning">
                  <span className="font-bold">Pending review.</span> Only you can see this until it
                  is approved.
                </p>
              </div>
            )}
            {isOwner && creation.status === 'rejected' && (
              <div className="border-error flex items-start gap-3 border-b-2 px-4 py-3 sm:px-6">
                <XCircle className="text-error mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p className="label-mono text-error">
                  <span className="font-bold">Not approved.</span>
                  {creation.rejection_reason ? ` ${creation.rejection_reason}` : ''}
                </p>
              </div>
            )}

            <section className="border-ink border-b-2">
              <div className="grid lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_28rem]">
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{creation.categories.name}</Badge>
                    {tags.map((tag) => (
                      <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`}>
                        <Badge variant="accent">#{tag}</Badge>
                      </Link>
                    ))}
                  </div>

                  <p className="label-mono text-accent mt-8 font-bold">
                    Made with Fable / {creation.categories.slug}
                  </p>
                  <h1 className="font-display mt-3 max-w-[13ch] text-5xl leading-[0.88] tracking-normal text-balance [overflow-wrap:anywhere] break-words uppercase sm:text-7xl md:text-8xl lg:text-[8.25rem] xl:text-[9rem]">
                    {creation.title}
                  </h1>
                </div>

                <aside className="border-ink border-t-2 lg:border-t-0 lg:border-l-2">
                  <div className="border-ink grid grid-cols-2 border-b-2">
                    <div className="border-ink border-r-2 p-4">
                      <p className="label-mono text-muted">File</p>
                      <p className="font-mono text-sm font-bold tabular-nums">
                        #{creation.id.slice(0, 8)}
                      </p>
                    </div>
                    <div className="p-4">
                      <p className="label-mono text-muted">Status</p>
                      <p className="font-mono text-sm font-bold uppercase">{creation.status}</p>
                    </div>
                    <div className="border-ink border-t-2 border-r-2 p-4">
                      <p className="label-mono text-muted">Published</p>
                      <p className="font-mono text-sm font-bold tabular-nums">{displayDate}</p>
                    </div>
                    <div className="border-ink border-t-2 p-4">
                      <p className="label-mono text-muted">Category</p>
                      <p className="font-mono text-sm font-bold uppercase">
                        {creation.categories.slug}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5">
                    <p className="label-mono text-muted font-bold">Maker</p>
                    <Link
                      href={`/u/${author.username}`}
                      className="group mt-3 flex min-w-0 items-center gap-3"
                    >
                      <Avatar
                        src={author.avatar_url}
                        name={author.display_name ?? author.username}
                        size={44}
                      />
                      <span className="min-w-0">
                        <span className="group-hover:text-accent block truncate text-base font-bold uppercase transition-colors">
                          {author.display_name ?? author.username}
                        </span>
                        <span className="label-mono text-muted-foreground block truncate">
                          @{author.username}
                        </span>
                      </span>
                    </Link>
                  </div>
                </aside>
              </div>
            </section>

            <section className="grid lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_28rem]">
              <div className="border-ink p-3 sm:p-5 lg:border-r-2 lg:p-8">
                <MediaGallery media={media} />
              </div>

              <aside className="border-ink bg-surface-raised border-t-2 lg:border-t-0">
                <div className="lg:sticky lg:top-16">
                  <div className="border-ink grid grid-cols-2 border-b-2">
                    <div className="border-ink border-r-2 p-4">
                      <p className="label-mono text-muted">Likes</p>
                      <p className="font-display mt-1 text-5xl leading-none tracking-normal tabular-nums">
                        {formatNumber(creation.like_count)}
                      </p>
                    </div>
                    <div className="p-4">
                      <p className="label-mono text-muted">Comments</p>
                      <p className="font-display mt-1 text-5xl leading-none tracking-normal tabular-nums">
                        {formatNumber(comments.length)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    <LikeButton
                      creationId={creation.id}
                      initialCount={creation.like_count}
                      initialLiked={Boolean(likedRes.data)}
                      signedIn={Boolean(user)}
                      disabled={creation.status !== 'approved'}
                      className="w-full"
                    />
                    <ShareButton
                      title={creation.title}
                      text={`Made with Fable by @${author.username}`}
                      className="w-full"
                    />
                    <ReportDialog
                      creationId={creation.id}
                      signedIn={Boolean(user)}
                      className="border-ink text-ink hover:text-ink flex w-full justify-center gap-2 border-2 px-4 py-3 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-ink)]"
                    />

                    {creation.live_url && liveHost && (
                      <a
                        href={creation.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="label-mono bg-ink text-background border-ink hover:bg-accent hover:border-accent flex min-w-0 items-center justify-center gap-2 border-2 px-4 py-4 font-bold transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="min-w-0 truncate">Visit {liveHost}</span>
                      </a>
                    )}
                  </div>
                </div>
              </aside>
            </section>

            <section className="border-ink grid border-t-2 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_28rem]">
              <div className="border-ink space-y-6 p-4 sm:p-6 lg:border-r-2 lg:p-8">
                {creation.story ? (
                  <section className="border-ink bg-background border-2">
                    <div className="border-ink border-b-2 px-4 py-3">
                      <p className="label-mono text-muted font-bold">Build note</p>
                      <h2 className="font-display mt-1 text-5xl leading-none tracking-normal uppercase">
                        Story
                      </h2>
                    </div>
                    <p className="text-foreground px-4 py-5 text-base leading-relaxed whitespace-pre-wrap">
                      {creation.story}
                    </p>
                  </section>
                ) : (
                  <section className="border-ink bg-background border-2 border-dashed px-4 py-10">
                    <p className="font-display text-4xl leading-none tracking-normal uppercase">
                      No story attached
                    </p>
                    <p className="label-mono text-muted mt-3">
                      The media board is carrying this one.
                    </p>
                  </section>
                )}

                {creation.prompt && <PromptBlock prompt={creation.prompt} />}
              </div>

              <div className="bg-surface p-4 sm:p-6 lg:p-8">
                <Comments
                  creationId={creation.id}
                  comments={comments}
                  signedIn={Boolean(user)}
                  isAdmin={isAdmin}
                  canComment={Boolean(user) && creation.status === 'approved'}
                />
              </div>
            </section>
          </article>
        </Container>
      </main>
      <Footer />
    </>
  )
}
