'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Heart, Share2 } from 'lucide-react'
import { toggleLike } from '@/app/actions/engagement'
import { copyText } from '@/lib/clipboard'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  creationId: string
  initialCount: number
  initialLiked: boolean
  signedIn: boolean
  disabled?: boolean
  className?: string
}

export function LikeButton({
  creationId,
  initialCount,
  initialLiked,
  signedIn,
  disabled = false,
  className,
}: LikeButtonProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [state, setOptimistic] = useOptimistic(
    { count: initialCount, liked: initialLiked },
    (current, liked: boolean) => ({
      liked,
      count: current.count + (liked ? 1 : -1),
    }),
  )

  function onClick() {
    if (disabled) return
    if (!signedIn) {
      router.push(`/login?redirectTo=/c/${creationId}`)
      return
    }
    startTransition(async () => {
      setOptimistic(!state.liked)
      await toggleLike(creationId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={state.liked}
      aria-label={state.liked ? 'Unlike' : 'Like'}
      disabled={disabled}
      className={cn(
        'label-mono flex cursor-pointer items-center justify-center gap-2 border-2 px-4 py-3 font-bold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-55',
        state.liked
          ? 'border-accent bg-accent text-on-accent'
          : 'border-ink text-ink hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-ink)]',
        className,
      )}
    >
      <Heart className={cn('h-4 w-4', state.liked && 'fill-current')} aria-hidden />
      <span>{state.liked ? 'Liked' : 'Like'}</span>
      <span className="bg-ink text-background px-1.5 py-0.5 tabular-nums">{state.count}</span>
    </button>
  )
}

interface ShareButtonProps {
  title: string
  text?: string
  className?: string
}

export function ShareButton({ title, text, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  function onShare() {
    startTransition(async () => {
      const url = window.location.href

      if (navigator.share) {
        try {
          await navigator.share({ title, text, url })
          return
        } catch (error) {
          // User dismissed the share sheet — nothing to do.
          if (error instanceof DOMException && error.name === 'AbortError') return
          // Any other share failure falls through to the clipboard copy.
        }
      }

      // copyText never throws; on total failure we simply re-enable the button.
      if (await copyText(url)) {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2200)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={onShare}
      disabled={pending}
      className={cn(
        'label-mono border-ink text-ink flex cursor-pointer items-center justify-center gap-2 border-2 px-4 py-3 font-bold transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-ink)] disabled:cursor-wait disabled:opacity-70',
        copied && 'border-accent bg-accent text-on-accent',
        className,
      )}
    >
      {copied ? (
        <Check className="h-4 w-4" aria-hidden />
      ) : (
        <Share2 className="h-4 w-4" aria-hidden />
      )}
      {copied ? 'Copied' : 'Share'}
    </button>
  )
}
