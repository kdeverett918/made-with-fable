'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { addComment, deleteComment } from '@/app/actions/engagement'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'

export interface CommentWithAuthor {
  id: string
  body: string
  created_at: string
  author: {
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
  isOwn: boolean
}

interface CommentsProps {
  creationId: string
  comments: CommentWithAuthor[]
  signedIn: boolean
  isAdmin: boolean
}

function timeAgo(iso: string) {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function Comments({ creationId, comments, signedIn, isAdmin }: CommentsProps) {
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await addComment(creationId, body)
      if (result.ok) setBody('')
      else setError(result.error ?? 'Could not post comment')
    })
  }

  return (
    <section aria-label="Comments">
      <h2 className="font-display text-xl font-semibold">
        Comments{comments.length > 0 && ` (${comments.length})`}
      </h2>

      {signedIn ? (
        <form onSubmit={submit} className="mt-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Say something nice or ask how it was made…"
            maxLength={2000}
            rows={2}
          />
          {error && <p className="text-error mt-1 text-sm">{error}</p>}
          <div className="mt-2 flex justify-end">
            <Button type="submit" size="sm" disabled={pending || body.trim() === ''}>
              {pending ? <Spinner className="text-on-accent h-3.5 w-3.5" /> : null}
              Post comment
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-muted mt-4 text-sm">
          <Link href={`/login?redirectTo=/c/${creationId}`} className="text-accent hover:underline">
            Sign in
          </Link>{' '}
          to join the conversation.
        </p>
      )}

      <ul className="mt-6 space-y-5">
        {comments.map((comment) => (
          <li key={comment.id} className="flex gap-3">
            <Link
              href={comment.author ? `/u/${comment.author.username}` : '#'}
              className="shrink-0"
            >
              <Avatar
                src={comment.author?.avatar_url}
                name={comment.author?.display_name ?? comment.author?.username ?? '?'}
                size={32}
              />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline gap-2 text-sm">
                <Link
                  href={comment.author ? `/u/${comment.author.username}` : '#'}
                  className="hover:text-accent font-medium transition-colors"
                >
                  {comment.author?.display_name ?? comment.author?.username ?? 'Unknown'}
                </Link>
                <span className="text-muted-foreground text-xs">{timeAgo(comment.created_at)}</span>
              </p>
              <p className="text-muted mt-1 text-sm break-words whitespace-pre-wrap">
                {comment.body}
              </p>
            </div>
            {(comment.isOwn || isAdmin) && (
              <button
                onClick={() =>
                  startTransition(() => deleteComment(comment.id, creationId).then(() => {}))
                }
                aria-label="Delete comment"
                className="text-muted-foreground hover:text-error cursor-pointer self-start transition-colors"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
