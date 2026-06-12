'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/', label: 'Gallery' },
  { href: '/makers', label: 'Makers' },
  { href: '/about', label: 'About' },
  { href: '/submit', label: 'Submit' },
] as const

export function NavLinks({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const pathname = usePathname()

  return (
    <>
      {LINKS.map(({ href, label }, index) => {
        const active =
          href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
        const last = index === LINKS.length - 1

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'label-mono flex items-center hover:underline',
              active ? 'text-accent' : 'text-muted hover:text-ink',
              variant === 'desktop' && 'px-4',
              variant === 'mobile' && 'min-h-11 flex-1 justify-center py-3',
              !last && 'border-ink border-r-2',
            )}
          >
            / {label}
          </Link>
        )
      })}
    </>
  )
}
