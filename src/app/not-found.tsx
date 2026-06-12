import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Not found' }

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="board-surface border-ink min-h-[70dvh] border-b-2">
        <section className="grid min-h-[70dvh] grid-cols-1 lg:grid-cols-[1fr_320px]">
          <div className="border-ink p-4 sm:p-6 lg:border-r-2">
            <p className="label-mono text-accent font-bold">404 / Missing pin</p>
            <h1 className="display-slab mt-4 text-[clamp(5rem,22vw,18rem)]">Not Found</h1>
          </div>
          <aside className="border-ink border-t-2 p-4 sm:p-6 lg:border-t-0">
            <div className="paper-cut brutal-frame animate-board-in p-5 [--tilt:-1.25deg]">
              <svg className="red-pin animate-pin-drop" viewBox="0 0 32 32" aria-hidden>
                <circle cx="16" cy="10" r="8" fill="var(--color-accent)" />
                <path d="M16 17v12" stroke="var(--color-ink)" strokeWidth="3" />
                <circle cx="16" cy="10" r="3" fill="var(--color-on-accent)" />
              </svg>
              <p className="label-mono text-muted">
                There is nothing pinned at this address. It may have moved, or it never existed.
              </p>
              <Link href="/" className={cn(buttonVariants(), 'mt-6 w-full')}>
                Back to gallery
              </Link>
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </>
  )
}
