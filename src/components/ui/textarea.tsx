import { cn } from '@/lib/utils'

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'bg-background border-ink text-ink placeholder:text-muted-foreground focus:border-accent min-h-24 w-full border-2 px-3 py-2 font-mono text-sm transition-colors outline-none',
        className,
      )}
      {...props}
    />
  )
}
