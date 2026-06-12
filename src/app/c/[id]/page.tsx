import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink, Clock, XCircle } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { mediaUrl } from '@/lib/storage'
import { siteConfig } from '@/config/site'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Container } from '@/components/layout/container'
import { MediaGallery } from '@/components/creation/media-gallery'
import { PromptBlock } from '@/components/creation/prompt-block'
import { LikeButton } from '@/components/creation/like-button'
import { Comments, type CommentWithAuthor } from '@/components/creation/comments'
import { ReportDialog } from '@/components/creation/report-dialog'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import type { Creation, CreationMedia, Profile } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const creation = await getCreation(id)
  if (!creation) return { title: 'Not found' }

  const firstMedia = creation.creation_media.sort((a, b) => a.position - b.position)[0]
  const image = firstMedia
    ? mediaUrl(
        firstMedia.kind === 'video' ? (firstMedia.poster_path ?? '') : firstMedia.storage_path,
      )
    : creation.og_image_path
      ? mediaUrl(creation.og_image_path)
      : siteConfig.ogImage

  return {
    title: creation.title,
    description:
      creation.story?.slice(0, 160) ?? `Made with Fable by ${creation.profiles.username}`,
    openGraph: { title: creation.title, images: [image] },
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
      <main id="main" className="py-10">
        <Container className="max-w-2xl">
          {isOwner && creation.status === 'pending' && (
            <div className="border-warning/30 bg-warning/10 mb-6 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm">
              <Clock className="text-warning h-4 w-4 shrink-0" aria-hidden />
              <p>
                <span className="font-medium">Pending review.</span> Only you can see this until
                it&apos;s approved.
              </p>
            </div>
          )}
          {isOwner && creation.status === 'rejected' && (
            <div className="border-error/30 bg-error/10 mb-6 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
              <XCircle className="text-error mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                <span className="font-medium">Not approved.</span>
                {creation.rejection_reason ? ` ${creation.rejection_reason}` : ''}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge>{creation.categories.name}</Badge>
            {tags.map((tag) => (
              <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`}>
                <Badge variant="accent">#{tag}</Badge>
              </Link>
            ))}
          </div>

          <h1 className="font-display mt-3 text-3xl font-semibold text-balance sm:text-4xl">
            {creation.title}
          </h1>

          <div className="mt-4 flex items-center justify-between gap-4">
            <Link href={`/u/${author.username}`} className="group flex items-center gap-2.5">
              <Avatar
                src={author.avatar_url}
                name={author.display_name ?? author.username}
                size={36}
              />
              <span>
                <span className="group-hover:text-accent block text-sm font-medium transition-colors">
                  {author.display_name ?? author.username}
                </span>
                <span className="text-muted-foreground block text-xs">@{author.username}</span>
              </span>
            </Link>
            <ReportDialog creationId={creation.id} signedIn={Boolean(user)} />
          </div>

          <div className="mt-8 space-y-8">
            <MediaGallery media={media} />

            {creation.live_url && (
              <a
                href={creation.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'secondary', size: 'lg' }) + ' w-full'}
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                Visit the live creation
              </a>
            )}

            {creation.story && (
              <section aria-label="Story">
                <h2 className="font-display text-xl font-semibold">The story</h2>
                <p className="text-muted mt-3 text-[15px] leading-relaxed whitespace-pre-wrap">
                  {creation.story}
                </p>
              </section>
            )}

            {creation.prompt && <PromptBlock prompt={creation.prompt} />}

            <div className="border-border flex items-center gap-3 border-t pt-6">
              <LikeButton
                creationId={creation.id}
                initialCount={creation.like_count}
                initialLiked={Boolean(likedRes.data)}
                signedIn={Boolean(user)}
              />
            </div>

            <Comments
              creationId={creation.id}
              comments={comments}
              signedIn={Boolean(user)}
              isAdmin={isAdmin}
            />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}
