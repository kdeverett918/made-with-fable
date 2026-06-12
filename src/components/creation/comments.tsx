'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { MessageSquare, Trash2 } from 'lucide-react'
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
  canComment: boolean
}

function timeAgo(iso: string) {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function Comments({ creationId, comments, signedIn, isAdmin, canComment }: CommentsProps) {
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [deletePending, startDeleteTransition] = useTransition()
  const trimmedLength = body.trim().length
  const remaining = 2000 - body.length

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!trimmedLength) return

    startTransition(async () => {
      // addComment revalidates the page, which refreshes this list — no router.refresh here
      const result = await addComment(creationId, body)
      if (result.ok) {
        setBody('')
      } else {
        setError(result.error ?? 'Could not post comment')
      }
    })
  }

  function removeComment(commentId: string) {
    setError(null)
    setDeletingId(commentId)
    startDeleteTransition(async () => {
      const result = await deleteComment(commentId, creationId)
      if (!result.ok) setError('Could not delete comment')
      setDeletingId(null)
    })
  }

  return (
    <section className="border-ink bg-background border-2" aria-label="Comments">
      <header className="border-ink flex items-center justify-between border-b-2 px-4 py-3">
        <div>
          <p className="label-mono text-muted font-bold">Public margin</p>
          <h2 className="font-display mt-1 text-4xl leading-none tracking-normal uppercase">
            Comments
          </h2>
        </div>
        <div className="border-ink flex min-h-12 min-w-12 items-center justify-center border-2 px-3">
          <span className="font-mono text-lg leading-none font-bold tabular-nums">
            {comments.length}
          </span>
        </div>
      </header>

      <div className="p-4">
        {signedIn && canComment ? (
          <form onSubmit={submit}>
            <label htmlFor="comment-body" className="label-mono text-ink mb-2 block font-bold">
              Add a note
            </label>
            <Textarea
              id="comment-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Ask how it was made, leave a reaction, or add a useful detail."
              maxLength={2000}
              rows={4}
              className="min-h-32 resize-y"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="label-mono text-muted tabular-nums" aria-live="polite">
                {remaining} characters left
              </p>
              <Button type="submit" size="sm" disabled={pending || trimmedLength === 0}>
                {pending ? <Spinner className="text-on-accent h-3.5 w-3.5" /> : null}
                Post comment
              </Button>
            </div>
            {error && (
              <p
                className="label-mono text-error border-error mt-3 border-2 px-3 py-2"
                aria-live="polite"
              >
                {error}
              </p>
            )}
          </form>
        ) : signedIn ? (
          <div className="border-ink bg-surface-raised border-2 px-4 py-3">
            <p className="label-mono text-muted">Comments open after a creation is approved.</p>
          </div>
        ) : (
          <div className="border-ink bg-surface-raised border-2 px-4 py-3">
            <p className="text-muted text-sm">
              <Link
                href={`/login?redirectTo=/c/${creationId}`}
                className="label-mono text-accent font-bold hover:underline"
              >
                Sign in
              </Link>{' '}
              to join the conversation.
            </p>
          </div>
        )}
      </div>

      {comments.length === 0 ? (
        <div className="border-ink border-t-2 px-4 py-12 text-center">
          <MessageSquare className="text-muted mx-auto h-7 w-7" aria-hidden />
          <p className="font-display mt-3 text-3xl leading-none tracking-normal uppercase">
            No notes yet
          </p>
          <p className="label-mono text-muted mt-2">The board is open for first reactions.</p>
        </div>
      ) : (
        <ul className="border-ink divide-ink divide-y-2 border-t-2">
          {comments.map((comment, index) => {
            const authorName =
              comment.author?.display_name ?? comment.author?.username ?? 'Unknown maker'

            return (
              <li key={comment.id} className="grid grid-cols-[auto_1fr_auto] gap-3 p-4">
                <div className="label-mono text-muted mt-1 w-8 tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </div>

                <div className="min-w-0">
                  <div className="flex min-w-0 items-start gap-3">
                    {comment.author ? (
                      <Link href={`/u/${comment.author.username}`} className="shrink-0">
                        <Avatar src={comment.author.avatar_url} name={authorName} size={36} />
                      </Link>
                    ) : (
                      <Avatar src={null} name={authorName} size={36} />
                    )}
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        {comment.author ? (
                          <Link
                            href={`/u/${comment.author.username}`}
                            className="hover:text-accent text-sm font-bold uppercase transition-colors"
                          >
                            {authorName}
                          </Link>
                        ) : (
                          <span className="text-sm font-bold uppercase">{authorName}</span>
                        )}
                        <span className="label-mono text-muted-foreground">
                          {timeAgo(comment.created_at)}
                        </span>
                      </p>
                      <p className="text-foreground mt-2 text-sm leading-relaxed break-words whitespace-pre-wrap">
                        {comment.body}
                      </p>
                    </div>
                  </div>
                </div>

                {(comment.isOwn || isAdmin) && (
                  <button
                    type="button"
                    onClick={() => removeComment(comment.id)}
                    disabled={deletePending && deletingId === comment.id}
                    aria-label="Delete comment"
                    className="text-muted-foreground hover:text-error cursor-pointer self-start transition-colors disabled:cursor-wait disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
