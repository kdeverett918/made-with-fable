'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { resolveReport, removeCreation } from '@/app/actions/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface ReportRow {
  id: string
  reason: string
  detail: string | null
  created_at: string
  creations: { id: string; title: string; status: string } | null
}

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  inappropriate: 'Inappropriate',
  not_fable: 'Not made with Fable',
  other: 'Other',
}

export function ReportsList({ reports }: { reports: ReportRow[] }) {
  const [pending, startTransition] = useTransition()

  if (reports.length === 0) {
    return (
      <div className="border-ink bg-background border-2 border-dashed py-14 text-center">
        <p className="font-display text-5xl leading-none uppercase">No reports</p>
        <p className="label-mono text-muted mt-3">The queue is clear.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-4">
      {reports.map((report) => (
        <li
          key={report.id}
          className="border-ink bg-background border-2 shadow-[5px_5px_0_0_var(--color-ink)]"
        >
          <div className="border-ink grid border-b-2 sm:grid-cols-[minmax(0,1fr)_220px]">
            <div className="min-w-0 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="error">{REASON_LABELS[report.reason] ?? report.reason}</Badge>
                <p className="label-mono text-muted-foreground">
                  <time dateTime={report.created_at}>
                    {new Date(report.created_at).toLocaleString()}
                  </time>
                </p>
              </div>
              {report.creations ? (
                <Link
                  href={`/c/${report.creations.id}`}
                  className="hover:text-accent mt-3 block truncate text-base font-bold tracking-wide uppercase transition-colors"
                >
                  {report.creations.title}
                </Link>
              ) : (
                <p className="text-muted mt-2 text-sm">(creation deleted)</p>
              )}
            </div>
            <div className="border-ink flex border-t-2 sm:flex-col sm:border-t-0 sm:border-l-2">
              {report.creations && report.creations.status === 'approved' && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  className="sm:border-accent h-full min-h-12 flex-1 border-0 sm:border-b-2"
                  onClick={() =>
                    startTransition(async () => {
                      await removeCreation(report.creations!.id)
                      await resolveReport(report.id)
                    })
                  }
                >
                  Remove content
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                disabled={pending}
                className="h-full min-h-12 flex-1 border-0"
                onClick={() => startTransition(() => resolveReport(report.id).then(() => {}))}
              >
                Dismiss
              </Button>
            </div>
          </div>
          {report.detail && (
            <p className="text-muted px-4 py-3 text-sm leading-relaxed">{report.detail}</p>
          )}
        </li>
      ))}
    </ul>
  )
}
