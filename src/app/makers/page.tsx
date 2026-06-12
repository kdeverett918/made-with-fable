import type { Metadata } from 'next'
import Link from 'next/link'
import { Globe } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Container } from '@/components/layout/container'
import { Avatar } from '@/components/ui/avatar'
import { FollowButton } from '@/components/profile/follow-button'
import { displayUrl, safeExternalUrl } from '@/lib/url'
import type { Profile } from '@/types/database'

export const metadata: Metadata = {
  title: 'Makers',
  description: 'The people behind the projects — find and follow makers building with Fable.',
}

export const dynamic = 'force-dynamic'

export default async function MakersPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [profilesRes, countRows, followsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .order('follower_count', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(200),
    supabase.rpc('approved_counts_by_author'),
    user
      ? supabase.from('follows').select('followee_id').eq('follower_id', user.id)
      : Promise.resolve({ data: null }),
  ])

  const profiles = (profilesRes.data ?? []) as Profile[]
  const projectCounts = new Map<string, number>()
  for (const row of (countRows.data ?? []) as Array<{
    author_id: string
    project_count: number
  }>) {
    projectCounts.set(row.author_id, Number(row.project_count))
  }
  const followedIds = new Set((followsRes.data ?? []).map((f) => f.followee_id))

  // makers with published work first, then everyone else
  const makers = [...profiles].sort(
    (a, b) => (projectCounts.get(b.id) ?? 0) - (projectCounts.get(a.id) ?? 0),
  )

  return (
    <>
      <Header />
      <main id="main" className="relative overflow-hidden py-8 sm:py-10 lg:py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(to_right,var(--color-ink)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ink)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.04]" />
        <Container className="max-w-6xl">
          <section className="border-ink bg-background grid border-2 shadow-[8px_8px_0_0_var(--color-ink)] lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="border-ink border-b-2 p-5 sm:p-7 lg:border-r-2 lg:border-b-0 lg:p-9">
              <p className="label-mono text-accent mb-4 font-bold">Member registry / Public</p>
              <h1 className="font-display text-[clamp(4.5rem,13vw,10rem)] leading-[0.82] tracking-tight uppercase">
                Makers
              </h1>
            </div>
            <aside className="divide-ink grid grid-cols-2 divide-x-2 lg:grid-cols-1 lg:divide-x-0 lg:divide-y-2">
              <div className="p-5 sm:p-6">
                <p className="label-mono text-muted-foreground">Members</p>
                <p className="font-display text-accent mt-2 text-6xl leading-none">
                  {makers.length}
                </p>
              </div>
              <div className="p-5 sm:p-6">
                <p className="label-mono text-muted-foreground">Why follow</p>
                <p className="text-muted mt-2 text-sm leading-relaxed">
                  Follow a maker and their new projects show up in your Following feed.
                </p>
              </div>
            </aside>
          </section>

          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {makers.map((maker) => {
              const projects = projectCounts.get(maker.id) ?? 0
              const websiteUrl = safeExternalUrl(maker.website_url)
              return (
                <li
                  key={maker.id}
                  className="border-ink bg-background magnetic-lift flex flex-col border-2"
                >
                  <Link
                    href={`/u/${maker.username}`}
                    className="group flex min-w-0 items-center gap-3 p-4"
                  >
                    <Avatar
                      src={maker.avatar_url}
                      name={maker.display_name ?? maker.username}
                      size={52}
                      className="shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="group-hover:text-accent block truncate text-base font-bold uppercase transition-colors">
                        {maker.display_name ?? maker.username}
                      </span>
                      <span className="label-mono text-muted-foreground block truncate">
                        @{maker.username}
                      </span>
                    </span>
                  </Link>
                  {maker.bio && (
                    <p className="text-muted border-ink line-clamp-2 border-t-2 px-4 py-3 text-sm leading-relaxed">
                      {maker.bio}
                    </p>
                  )}
                  <div className="border-ink divide-ink grid grid-cols-2 divide-x-2 border-t-2">
                    <div className="px-4 py-3">
                      <p className="label-mono text-muted-foreground">Projects</p>
                      <p className="font-display mt-1 text-3xl leading-none tabular-nums">
                        {projects}
                      </p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="label-mono text-muted-foreground">Followers</p>
                      <p className="font-display mt-1 text-3xl leading-none tabular-nums">
                        {maker.follower_count}
                      </p>
                    </div>
                  </div>
                  <div className="border-ink mt-auto border-t-2 p-3">
                    {user?.id === maker.id ? (
                      <p className="label-mono text-muted border-ink border-2 border-dashed px-4 py-3 text-center">
                        This is you
                      </p>
                    ) : (
                      <FollowButton
                        profileId={maker.id}
                        username={maker.username}
                        initialFollowing={followedIds.has(maker.id)}
                        initialCount={maker.follower_count}
                        signedIn={Boolean(user)}
                        className="w-full"
                      />
                    )}
                  </div>
                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="label-mono text-accent border-ink flex items-center gap-2 border-t-2 px-4 py-2.5 hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{displayUrl(websiteUrl)}</span>
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        </Container>
      </main>
      <Footer />
    </>
  )
}
