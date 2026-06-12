'use client'

/* eslint-disable @next/next/no-img-element */
import { useState, useTransition } from 'react'
import { Check, ExternalLink, X } from 'lucide-react'
import { approveCreation, rejectCreation } from '@/app/actions/admin'
import { mediaUrl } from '@/lib/storage'
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

  if (decided) {
    return (
      <div className="border-border text-muted rounded-lg border border-dashed px-4 py-3 text-sm">
        “{creation.title}” {decided === 'approved' ? 'approved ✓' : 'rejected'}
      </div>
    )
  }

  return (
    <article className="border-border bg-surface overflow-hidden rounded-lg border">
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-medium">{creation.title}</h2>
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
              <Avatar
                src={creation.profiles.avatar_url}
                name={creation.profiles.username}
                size={16}
              />
              @{creation.profiles.username} · {new Date(creation.created_at).toLocaleString()}
            </p>
          </div>
          <Badge>{creation.categories.name}</Badge>
        </div>

        {media.length > 0 && (
          <div className="flex scrollbar-none gap-2 overflow-x-auto">
            {media.map((m) => (
              <img
                key={m.id}
                src={mediaUrl(
                  m.kind === 'video' ? (m.poster_path ?? m.storage_path) : m.storage_path,
                )}
                alt=""
                className="h-32 shrink-0 rounded-md object-cover"
              />
            ))}
          </div>
        )}

        {creation.live_url && (
          <a
            href={creation.live_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent flex items-center gap-1.5 text-sm hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden /> {creation.live_url}
          </a>
        )}

        {creation.story && <p className="text-muted line-clamp-4 text-sm">{creation.story}</p>}
        {creation.prompt && (
          <pre className="bg-background max-h-32 scrollbar-none overflow-auto rounded-md p-3 font-mono text-xs whitespace-pre-wrap">
            {creation.prompt}
          </pre>
        )}
        {tags.length > 0 && (
          <p className="text-muted-foreground text-xs">tags: {tags.join(', ')}</p>
        )}
      </div>

      <div className="border-border bg-surface-raised/50 border-t px-4 py-3">
        {rejecting ? (
          <div className="space-y-2">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional — shown to the creator)"
              rows={2}
              maxLength={500}
              autoFocus
            />
            <div className="flex justify-end gap-2">
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
          <div className="flex justify-end gap-2">
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
      </div>
    </article>
  )
}
