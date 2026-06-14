import type { Metadata } from 'next'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Container } from '@/components/layout/container'
import { ModerationCard, type PendingCreation } from '@/components/admin/moderation-card'
import { ReportsList, type ReportRow } from '@/components/admin/reports-list'
import { AllContentList, type ContentRow } from '@/components/admin/all-content-list'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Admin' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminPage({ searchParams }: PageProps) {
  const { tab = 'pending' } = await searchParams
  const supabase = await createSupabaseServerClient()

  const [{ data: pending }, { data: reports }, { count: pendingCount }, { count: openReports }] =
    await Promise.all([
      supabase
        .from('creations')
        .select(
          '*, profiles!creations_author_id_fkey(username, display_name, avatar_url), creation_media(*), categories(name), creation_tags(tags(name))',
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(50),
      supabase
        .from('reports')
        .select('*, creations(id, title, status)')
        .eq('status', 'open')
        .order('created_at', { ascending: true })
        .limit(50),
      supabase
        .from('creations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    ])

  let allContent: ContentRow[] = []
  if (tab === 'all') {
    const { data } = await supabase
      .from('creations')
      .select(
        'id, title, status, like_count, created_at, guest_name, profiles!creations_author_id_fkey(username)',
      )
      .order('created_at', { ascending: false })
      .limit(100)
    allContent = (data ?? []) as unknown as ContentRow[]
  }

  const tabs = [
    { id: 'pending', label: 'Pending', count: pendingCount ?? 0 },
    { id: 'reports', label: 'Reports', count: openReports ?? 0 },
    { id: 'all', label: 'All content', count: null },
  ]

  return (
    <>
      <Header />
      <main id="main" className="relative overflow-hidden py-8 sm:py-10 lg:py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[linear-gradient(to_right,var(--color-ink)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ink)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.04]" />
        <Container className="max-w-6xl">
          <section className="border-ink bg-background grid border-2 shadow-[8px_8px_0_0_var(--color-ink)] lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="border-ink border-b-2 p-5 sm:p-7 lg:border-r-2 lg:border-b-0 lg:p-9">
              <p className="label-mono text-accent mb-4 font-bold">Admin room / Live queue</p>
              <h1 className="font-display text-[clamp(4.5rem,13vw,10rem)] leading-[0.82] tracking-tight uppercase">
                Moderation
              </h1>
            </div>
            <aside className="divide-ink grid grid-cols-2 divide-x-2 lg:grid-cols-1 lg:divide-x-0 lg:divide-y-2">
              <div className="p-5 sm:p-6">
                <p className="label-mono text-muted-foreground">Pending</p>
                <p className="font-display text-accent mt-2 text-6xl leading-none">
                  {pendingCount ?? 0}
                </p>
              </div>
              <div className="p-5 sm:p-6">
                <p className="label-mono text-muted-foreground">Reports</p>
                <p className="font-display mt-2 text-6xl leading-none">{openReports ?? 0}</p>
              </div>
            </aside>
          </section>

          <nav
            className="border-ink bg-background mt-8 grid border-2 sm:inline-grid sm:grid-cols-3"
            aria-label="Moderation views"
          >
            {tabs.map((t, i) => (
              <Link
                key={t.id}
                href={`/admin?tab=${t.id}`}
                className={cn(
                  'label-mono flex items-center justify-between gap-4 px-4 py-3 font-bold transition-colors sm:justify-center',
                  i > 0 && 'border-ink border-t-2 sm:border-t-0 sm:border-l-2',
                  tab === t.id
                    ? 'bg-ink text-background'
                    : 'text-muted hover:bg-ink hover:text-background',
                )}
                aria-current={tab === t.id ? 'page' : undefined}
              >
                {t.label}
                {t.count !== null && (
                  <span
                    className={cn(
                      'ml-1.5 font-bold',
                      tab === t.id ? 'text-on-accent' : 'text-accent',
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <section className="mt-6" aria-live="polite">
            {tab === 'pending' && (
              <div className="space-y-6">
                {(pending ?? []).length === 0 && (
                  <p className="label-mono text-muted border-ink border-2 border-dashed py-12 text-center">
                    Nothing waiting for review.
                  </p>
                )}
                {((pending ?? []) as unknown as PendingCreation[]).map((creation) => (
                  <ModerationCard key={creation.id} creation={creation} />
                ))}
              </div>
            )}
            {tab === 'reports' && (
              <ReportsList reports={(reports ?? []) as unknown as ReportRow[]} />
            )}
            {tab === 'all' && <AllContentList rows={allContent} />}
          </section>
        </Container>
      </main>
    </>
  )
}
