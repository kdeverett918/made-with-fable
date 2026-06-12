import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider',
  {
    variants: {
      variant: {
        default: 'border-ink text-ink',
        accent: 'border-accent text-accent',
        success: 'border-success text-success',
        warning: 'border-warning text-warning',
        error: 'border-accent bg-accent text-on-accent',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
