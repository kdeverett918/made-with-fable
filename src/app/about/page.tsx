import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Container } from '@/components/layout/container'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <>
      <Header />
      <main id="main" className="py-12">
        <Container className="max-w-2xl">
          <p className="label-mono text-accent">* Made with Fable</p>
          <h1 className="font-display mt-2 text-6xl leading-none tracking-tight uppercase">
            About
          </h1>

          <div className="border-ink mt-6 space-y-4 border-2 p-5 text-[15px] leading-relaxed sm:p-6">
            <p className="text-ink">
              Claude Fable 5 is here for a limited time — and people are shipping remarkable
              things with it. This gallery is where that work gets shown off: SaaS products,
              games, art, websites, tools, agents, and everything in between.
            </p>
            <p className="text-muted">
              This is a showcase, not a tutorial site. Post the thing you built, link the live
              version, and let the work speak. The story behind it is welcome; the spotlight stays
              on what you made.
            </p>
            <p className="label-mono text-muted-foreground">
              An independent community project, not affiliated with Anthropic.
            </p>
          </div>

          <h2 className="font-display mt-12 text-3xl leading-none tracking-tight uppercase">
            Submission guidelines
          </h2>
          <ol className="border-ink divide-ink mt-4 divide-y-2 border-2">
            {[
              'Submit things you made with Fable (Claude Fable 5) — that’s the whole point.',
              'You must own or have rights to what you upload.',
              'Keep it safe for work. No hateful, violent, or sexual content.',
              'No spam, ads, or low-effort reposts of other people’s work.',
              'Include the prompt and story when you can — it’s what makes this useful.',
              'Submissions are reviewed by a human before they appear, usually within a day.',
            ].map((text, i) => (
              <li key={i} className="flex gap-4 px-4 py-3">
                <span className="label-mono text-accent shrink-0 font-bold">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-muted text-[15px]">{text}</span>
              </li>
            ))}
          </ol>

          <h2 className="font-display mt-12 text-3xl leading-none tracking-tight uppercase">
            Privacy, briefly
          </h2>
          <ol className="border-ink divide-ink mt-4 divide-y-2 border-2">
            {[
              'We store your email (for sign-in), profile, and what you submit. Nothing else.',
              'No ads, no tracking pixels, no selling data.',
              'Want your account or a project gone? Use the report button or contact the site owner, and it will be removed.',
            ].map((text, i) => (
              <li key={i} className="flex gap-4 px-4 py-3">
                <span className="label-mono text-accent shrink-0 font-bold">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-muted text-[15px]">{text}</span>
              </li>
            ))}
            <li className="flex gap-4 px-4 py-3">
              <span className="label-mono text-accent shrink-0 font-bold">04</span>
              <span className="text-muted text-[15px]">
                Full details:{' '}
                <Link
                  href="/privacy"
                  className="text-ink hover:text-accent font-bold underline underline-offset-2 transition-colors"
                >
                  privacy policy
                </Link>{' '}
                and{' '}
                <Link
                  href="/terms"
                  className="text-ink hover:text-accent font-bold underline underline-offset-2 transition-colors"
                >
                  terms
                </Link>
                .
              </span>
            </li>
          </ol>

          <div className="mt-12">
            <Link href="/submit" className={buttonVariants({ size: 'lg' })}>
              Submit your project
            </Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}
