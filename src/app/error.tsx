'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main id="main" className="board-surface border-ink min-h-dvh border-b-2">
      <section className="grid min-h-dvh grid-cols-1 lg:grid-cols-[1fr_320px]">
        <div className="border-ink p-4 sm:p-6 lg:border-r-2">
          <p className="label-mono text-accent font-bold">Error / Jammed press</p>
          <h1 className="display-slab mt-4 text-[clamp(4rem,18vw,14rem)]">Something broke</h1>
        </div>
        <aside className="border-ink border-t-2 p-4 sm:p-6 lg:border-t-0">
          <div className="paper-cut brutal-frame animate-board-in p-5 [--tilt:-1.25deg]">
            <svg className="red-pin animate-pin-drop" viewBox="0 0 32 32" aria-hidden>
              <circle cx="16" cy="10" r="8" fill="var(--color-accent)" />
              <path d="M16 17v12" stroke="var(--color-ink)" strokeWidth="3" />
              <circle cx="16" cy="10" r="3" fill="var(--color-on-accent)" />
            </svg>
            <p className="label-mono text-muted">
              An unexpected error stopped this page from rendering. Try again, or head back to the
              board.
            </p>
            {error.digest && (
              <p className="label-mono text-muted-foreground mt-3">Ref: {error.digest}</p>
            )}
            <Button onClick={reset} className="mt-6 w-full">
              Try again
            </Button>
            <Link href="/" className={cn(buttonVariants({ variant: 'secondary' }), 'mt-3 w-full')}>
              Back to the gallery
            </Link>
          </div>
        </aside>
      </section>
    </main>
  )
}
