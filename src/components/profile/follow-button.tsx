'use client'

import { useOptimistic, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserMinus, UserPlus } from 'lucide-react'
import { setFollow } from '@/app/actions/follow'
import { cn } from '@/lib/utils'

interface FollowButtonProps {
  profileId: string
  username: string
  initialFollowing: boolean
  initialCount: number
  signedIn: boolean
  className?: string
}

export function FollowButton({
  profileId,
  username,
  initialFollowing,
  initialCount,
  signedIn,
  className,
}: FollowButtonProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [state, setOptimistic] = useOptimistic(
    { following: initialFollowing, count: initialCount },
    (current, following: boolean) => ({
      following,
      count: Math.max(current.count + (following ? 1 : -1), 0),
    }),
  )

  function onClick() {
    if (!signedIn) {
      router.push(`/login?redirectTo=/u/${username}`)
      return
    }
    startTransition(async () => {
      // setFollow revalidates the profile and makers pages — no router.refresh here
      const next = !state.following
      setOptimistic(next)
      await setFollow(profileId, next)
    })
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={state.following}
      aria-label={state.following ? `Unfollow @${username}` : `Follow @${username}`}
      className={cn(
        'label-mono flex cursor-pointer items-center justify-center gap-2 border-2 px-4 py-3 font-bold transition-all active:scale-95',
        state.following
          ? 'border-accent bg-accent text-on-accent'
          : 'border-ink text-ink hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-ink)]',
        className,
      )}
    >
      {state.following ? (
        <UserMinus className="h-4 w-4" aria-hidden />
      ) : (
        <UserPlus className="h-4 w-4" aria-hidden />
      )}
      <span>{state.following ? 'Following' : 'Follow'}</span>
      <span className="bg-ink text-background px-1.5 py-0.5 tabular-nums">{state.count}</span>
    </button>
  )
}
