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
        'id, title, status, like_count, created_at, profiles!creations_author_id_fkey(username)',
      )
      .order('created_at', { ascending: false })
      .limit(100)
    allContent = (data ?? []) as unknown as ContentRow[]
  }

  const tabs = [
    { id: 'pending', label: `Pending (${pendingCount ?? 0})` },
    { id: 'reports', label: `Reports (${openReports ?? 0})` },
    { id: 'all', label: 'All content' },
  ]

  return (
    <>
      <Header />
      <main id="main" className="py-10">
        <Container className="max-w-3xl">
          <h1 className="font-display text-3xl font-semibold">Moderation</h1>

          <div className="border-border mt-6 flex gap-1 border-b">
            {tabs.map((t) => (
              <Link
                key={t.id}
                href={`/admin?tab=${t.id}`}
                className={cn(
                  'rounded-t-md px-4 py-2 text-sm transition-colors',
                  tab === t.id
                    ? 'border-accent text-foreground border-b-2 font-medium'
                    : 'text-muted hover:text-foreground',
                )}
              >
                {t.label}
              </Link>
            ))}
          </div>

          <div className="mt-6">
            {tab === 'pending' && (
              <div className="space-y-6">
                {(pending ?? []).length === 0 && (
                  <p className="text-muted py-12 text-center text-sm">
                    Nothing waiting for review. 🎉
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
          </div>
        </Container>
      </main>
    </>
  )
}
