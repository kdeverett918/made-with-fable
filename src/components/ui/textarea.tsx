import { cn } from '@/lib/utils'

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'bg-surface border-border text-foreground placeholder:text-muted-foreground focus:border-accent/60 min-h-24 w-full rounded-md border px-3 py-2 text-sm transition-colors outline-none',
        className,
      )}
      {...props}
    />
  )
}
