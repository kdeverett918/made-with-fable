'use client'

/* eslint-disable @next/next/no-img-element */
import { useState, useTransition } from 'react'
import { Check, ExternalLink, X } from 'lucide-react'
import { approveCreation, rejectCreation } from '@/app/actions/admin'
import { mediaUrl } from '@/lib/storage'
import { safeExternalUrl } from '@/lib/url'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import type { CreationMedia } from '@/types/database'

export interface PendingCreation {
  id: string
  title: string
  story: string | null
  prompt: string | null
  live_url: string | null
  created_at: string
  profiles: { username: string; display_name: string | null; avatar_url: string | null }
  creation_media: CreationMedia[]
  categories: { name: string }
  creation_tags: Array<{ tags: { name: string } | null }>
}

export function ModerationCard({ creation }: { creation: PendingCreation }) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [decided, setDecided] = useState<'approved' | 'rejected' | null>(null)
  const [pending, startTransition] = useTransition()

  const media = [...creation.creation_media].sort((a, b) => a.position - b.position)
  const tags = creation.creation_tags.map((t) => t.tags?.name).filter(Boolean)
  const liveUrl = safeExternalUrl(creation.live_url)

  if (decided) {
    return (
      <div className="border-ink bg-background border-2 border-dashed px-4 py-4 shadow-[4px_4px_0_0_var(--color-ink)]">
        <p className="label-mono text-muted-foreground font-bold">Decision logged</p>
        <p className="text-muted mt-2 text-sm font-bold tracking-wide uppercase">
          {creation.title} / {decided === 'approved' ? 'approved' : 'rejected'}
        </p>
      </div>
    )
  }

  return (
    <article className="border-ink bg-background border-2 shadow-[6px_6px_0_0_var(--color-ink)]">
      <header className="border-ink grid border-b-2 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0">
          <div className="border-ink border-b-2 px-4 py-3 sm:px-5">
            <p className="label-mono text-muted-foreground">Pending creation</p>
            <h2 className="mt-1 text-lg font-bold tracking-wide uppercase sm:text-xl">
              {creation.title}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
            <Avatar
              src={creation.profiles.avatar_url}
              name={creation.profiles.username}
              size={28}
            />
            <p className="label-mono text-muted">
              @{creation.profiles.username} /{' '}
              <time dateTime={creation.created_at}>
                {new Date(creation.created_at).toLocaleString()}
              </time>
            </p>
          </div>
        </div>
        <div className="border-ink grid grid-cols-2 border-t-2 lg:grid-cols-1 lg:border-t-0 lg:border-l-2">
          <div className="border-ink border-r-2 p-4 lg:border-r-0 lg:border-b-2">
            <p className="label-mono text-muted-foreground">Category</p>
            <div className="mt-2">
              <Badge>{creation.categories.name}</Badge>
            </div>
          </div>
          <div className="p-4">
            <p className="label-mono text-muted-foreground">Assets</p>
            <p className="font-display mt-1 text-4xl leading-none">{media.length}</p>
          </div>
        </div>
      </header>

      <div className="space-y-4 p-4 sm:p-5">
        {media.length > 0 && (
          <div>
            <p className="label-mono mb-2 font-bold">Media evidence</p>
            <div className="flex scrollbar-none gap-3 overflow-x-auto pb-1">
              {media.map((m) => (
                <img
                  key={m.id}
                  src={mediaUrl(
                    m.kind === 'video' ? (m.poster_path ?? m.storage_path) : m.storage_path,
                  )}
                  alt=""
                  className="border-ink bg-surface-raised h-36 w-44 shrink-0 border-2 object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="label-mono border-ink text-accent hover:bg-accent hover:text-on-accent flex items-center gap-2 border-2 px-3 py-2 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            <span className="truncate">{liveUrl}</span>
          </a>
        )}

        {(creation.story || creation.prompt || tags.length > 0) && (
          <div className="grid gap-3 lg:grid-cols-2">
            {creation.story && (
              <div className="border-ink border-2 p-3">
                <p className="label-mono text-muted-foreground">Story</p>
                <p className="text-muted mt-2 line-clamp-5 text-sm leading-relaxed">
                  {creation.story}
                </p>
              </div>
            )}
            {creation.prompt && (
              <div className="border-ink bg-surface-raised border-2 p-3">
                <p className="label-mono text-muted-foreground">Prompt</p>
                <pre className="mt-2 max-h-36 scrollbar-none overflow-auto font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {creation.prompt}
                </pre>
              </div>
            )}
            {tags.length > 0 && (
              <p className="label-mono border-ink text-muted-foreground border-2 px-3 py-2 lg:col-span-2">
                Tags: {tags.join(', ')}
              </p>
            )}
          </div>
        )}
      </div>

      <footer className="border-ink bg-surface-raised border-t-2 px-4 py-3 sm:px-5">
        {rejecting ? (
          <div className="space-y-3">
            <label className="block">
              <span className="label-mono mb-2 block font-bold">Rejection reason</span>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (optional, shown to the creator)"
                rows={3}
                maxLength={500}
                autoFocus
              />
            </label>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" size="sm" onClick={() => setRejecting(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await rejectCreation(creation.id, reason)
                    if (result.ok) setDecided('rejected')
                  })
                }
              >
                {pending ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <X className="h-3.5 w-3.5" aria-hidden />
                )}
                Confirm reject
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="destructive" size="sm" onClick={() => setRejecting(true)}>
              <X className="h-3.5 w-3.5" aria-hidden /> Reject
            </Button>
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await approveCreation(creation.id)
                  if (result.ok) setDecided('approved')
                })
              }
            >
              {pending ? (
                <Spinner className="text-on-accent h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" aria-hidden />
              )}
              Approve
            </Button>
          </div>
        )}
      </footer>
    </article>
  )
}
