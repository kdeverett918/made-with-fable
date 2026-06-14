import type { Metadata } from 'next'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Container } from '@/components/layout/container'
import { SubmitWizard } from '@/components/submit/submit-wizard'

export const metadata: Metadata = { title: 'Submit your project' }

export default async function SubmitPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <>
      <Header />
      <main id="main" className="relative overflow-hidden py-8 sm:py-10 lg:py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(to_right,var(--color-ink)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ink)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.04]" />
        <Container className="max-w-6xl">
          <section className="border-ink bg-background grid border-2 shadow-[8px_8px_0_0_var(--color-ink)] lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="border-ink border-b-2 p-5 sm:p-7 lg:border-r-2 lg:border-b-0 lg:p-9">
              <p className="label-mono text-accent mb-4 font-bold">Submission desk / 2026</p>
              <h1 className="font-display max-w-4xl text-[clamp(4.5rem,13vw,10rem)] leading-[0.82] tracking-tight uppercase">
                Submit your project
              </h1>
            </div>
            <aside className="divide-ink grid divide-y-2">
              <div className="p-5 sm:p-6">
                <p className="label-mono text-muted-foreground">Review note</p>
                <p className="text-muted mt-3 text-sm leading-relaxed">
                  No account needed — just your name, a title, and media or a link. Every project is
                  reviewed before it pins to the public board.
                </p>
                {!user && (
                  <p className="label-mono text-muted-foreground mt-4">
                    Want a profile to keep your projects together?{' '}
                    <Link
                      href="/login?redirectTo=/submit"
                      className="text-accent font-bold hover:underline"
                    >
                      Sign in
                    </Link>{' '}
                    — optional.
                  </p>
                )}
              </div>
              <div className="divide-ink grid grid-cols-2 divide-x-2">
                <div className="p-5">
                  <p className="label-mono text-muted-foreground">Needs</p>
                  <p className="font-display mt-2 text-4xl leading-none uppercase">URL</p>
                </div>
                <div className="p-5">
                  <p className="label-mono text-muted-foreground">Status</p>
                  <p className="font-display text-accent mt-2 text-4xl leading-none uppercase">
                    Review
                  </p>
                </div>
              </div>
            </aside>
          </section>

          <SubmitWizard userId={user?.id ?? null} />
        </Container>
      </main>
      <Footer />
    </>
  )
}
