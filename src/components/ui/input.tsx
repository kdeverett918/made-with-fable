import { cn } from '@/lib/utils'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'bg-background border-ink text-ink placeholder:text-muted-foreground focus:border-accent h-10 w-full border-2 px-3 font-mono text-sm transition-colors outline-none',
        className,
      )}
      {...props}
    />
  )
}
