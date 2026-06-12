import { cn } from '@/lib/utils'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'bg-surface border-border text-foreground placeholder:text-muted-foreground focus:border-accent/60 h-10 w-full rounded-md border px-3 text-sm transition-colors outline-none',
        className,
      )}
      {...props}
    />
  )
}
