'use client'

import { useOptimistic, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { toggleLike } from '@/app/actions/engagement'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  creationId: string
  initialCount: number
  initialLiked: boolean
  signedIn: boolean
}

export function LikeButton({ creationId, initialCount, initialLiked, signedIn }: LikeButtonProps) {
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
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95',
        state.liked
          ? 'border-accent/40 bg-accent/15 text-accent'
          : 'border-border text-muted hover:border-border-strong hover:text-foreground',
      )}
    >
      <Heart className={cn('h-4 w-4', state.liked && 'fill-current')} aria-hidden />
      {state.count}
    </button>
  )
}
