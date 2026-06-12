import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-surface-raised text-muted border border-border',
        accent: 'bg-accent/15 text-accent border border-accent/25',
        success: 'bg-success/15 text-success border border-success/25',
        warning: 'bg-warning/15 text-warning border border-warning/25',
        error: 'bg-error/15 text-error border border-error/25',
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
