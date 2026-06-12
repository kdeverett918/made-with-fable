import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-mono uppercase tracking-wider font-bold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-on-accent border-2 border-ink hover:bg-accent-deep',
        secondary:
          'bg-background text-ink border-2 border-ink hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-ink)]',
        ghost: 'text-muted hover:text-ink hover:underline',
        destructive:
          'bg-background text-accent border-2 border-accent hover:bg-accent hover:text-on-accent',
      },
      size: {
        sm: 'h-8 px-3 text-[11px]',
        md: 'h-10 px-4 text-xs',
        lg: 'h-12 px-6 text-sm',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { buttonVariants }
