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
    return <p className="text-muted py-12 text-center text-sm">No open reports.</p>
  }

  return (
    <ul className="space-y-3">
      {reports.map((report) => (
        <li key={report.id} className="border-border bg-surface rounded-lg border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge variant="error">{REASON_LABELS[report.reason] ?? report.reason}</Badge>
              {report.creations ? (
                <Link
                  href={`/c/${report.creations.id}`}
                  className="hover:text-accent mt-2 block truncate text-sm font-medium transition-colors"
                >
                  {report.creations.title}
                </Link>
              ) : (
                <p className="text-muted mt-2 text-sm">(creation deleted)</p>
              )}
              {report.detail && <p className="text-muted mt-1 text-sm">{report.detail}</p>}
              <p className="text-muted-foreground mt-1 text-xs">
                {new Date(report.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              {report.creations && report.creations.status === 'approved' && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={pending}
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
                onClick={() => startTransition(() => resolveReport(report.id).then(() => {}))}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
