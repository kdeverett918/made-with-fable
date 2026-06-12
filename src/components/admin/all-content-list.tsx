'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { approveCreation, removeCreation } from '@/app/actions/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface ContentRow {
  id: string
  title: string
  status: 'pending' | 'approved' | 'rejected'
  like_count: number
  created_at: string
  profiles: { username: string } | null
}

const STATUS_VARIANT = { approved: 'success', pending: 'warning', rejected: 'error' } as const

export function AllContentList({ rows }: { rows: ContentRow[] }) {
  const [pending, startTransition] = useTransition()

  if (rows.length === 0) {
    return <p className="text-muted py-12 text-center text-sm">No content yet.</p>
  }

  return (
    <ul className="divide-border border-border divide-y rounded-lg border">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <Link
              href={`/c/${row.id}`}
              className="hover:text-accent block truncate text-sm font-medium transition-colors"
            >
              {row.title}
            </Link>
            <p className="text-muted-foreground text-xs">
              @{row.profiles?.username ?? '?'} · {row.like_count} likes ·{' '}
              {new Date(row.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
            {row.status === 'approved' ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => startTransition(() => removeCreation(row.id).then(() => {}))}
              >
                Take down
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => startTransition(() => approveCreation(row.id).then(() => {}))}
              >
                Approve
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
