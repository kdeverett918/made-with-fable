import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-on-accent hover:bg-accent-soft active:scale-[0.98] shadow-[0_0_20px_-6px_rgba(240,178,74,0.4)]',
        secondary:
          'bg-surface-raised text-foreground border border-border hover:border-border-strong hover:bg-surface active:scale-[0.98]',
        ghost: 'text-muted hover:text-foreground hover:bg-surface-raised',
        destructive: 'bg-error/10 text-error border border-error/30 hover:bg-error/20',
      },
      size: {
        sm: 'h-8 rounded-md px-3 text-sm',
        md: 'h-10 rounded-md px-4 text-sm',
        lg: 'h-12 rounded-lg px-6 text-base',
        icon: 'h-9 w-9 rounded-md',
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
