/* eslint-disable @next/next/no-img-element */
import { cn } from '@/lib/utils'

interface AvatarProps {
  src: string | null | undefined
  name: string
  size?: number
  className?: string
}

export function Avatar({ src, name, size = 32, className }: AvatarProps) {
  const initial = (name || '?').charAt(0).toUpperCase()
  return src ? (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      className={cn('rounded-full object-cover', className)}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden
      className={cn(
        'bg-accent/20 text-accent flex items-center justify-center rounded-full font-medium',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </span>
  )
}
