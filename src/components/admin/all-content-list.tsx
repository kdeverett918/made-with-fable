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
    return (
      <div className="border-ink bg-background border-2 border-dashed py-14 text-center">
        <p className="font-display text-5xl leading-none uppercase">No content</p>
        <p className="label-mono text-muted mt-3">Nothing has been posted yet.</p>
      </div>
    )
  }

  return (
    <div className="border-ink bg-background border-2 shadow-[6px_6px_0_0_var(--color-ink)]">
      <div className="border-ink bg-surface-raised hidden grid-cols-[minmax(0,1fr)_120px_150px] border-b-2 px-4 py-3 sm:grid">
        <p className="label-mono text-muted-foreground font-bold">Creation</p>
        <p className="label-mono text-muted-foreground font-bold">Status</p>
        <p className="label-mono text-muted-foreground font-bold">Action</p>
      </div>
      <ul className="divide-ink divide-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_120px_150px] sm:items-center"
          >
            <div className="min-w-0">
              <Link
                href={`/c/${row.id}`}
                className="hover:text-accent block truncate text-sm font-bold tracking-wide uppercase transition-colors"
              >
                {row.title}
              </Link>
              <p className="label-mono text-muted-foreground mt-1">
                @{row.profiles?.username ?? '?'} / {row.like_count} likes /{' '}
                <time dateTime={row.created_at}>
                  {new Date(row.created_at).toLocaleDateString()}
                </time>
              </p>
            </div>
            <div className="flex items-center">
              <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
            </div>
            <div className="flex items-center sm:justify-end">
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
    </div>
  )
}
