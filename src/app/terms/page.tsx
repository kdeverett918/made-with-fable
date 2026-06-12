import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = { title: 'Terms of Use' }

export default function TermsPage() {
  return (
    <>
      <Header />
      <main id="main" className="py-12">
        <Container className="max-w-2xl">
          <p className="label-mono text-accent">* Made with Fable</p>
          <h1 className="font-display mt-2 text-6xl leading-none tracking-tight uppercase">
            Terms
          </h1>
          <p className="label-mono text-muted-foreground mt-3">Last updated: June 12, 2026</p>

          <div className="border-ink mt-6 space-y-4 border-2 p-5 text-[15px] leading-relaxed sm:p-6">
            <p className="text-ink">
              By using Made with Fable you agree to these terms. They&rsquo;re short on purpose —
              this is a community gallery run by one person, and the rules are mostly common sense.
            </p>
            <p className="label-mono text-muted-foreground">
              An independent community project, not affiliated with Anthropic.
            </p>
          </div>

          <h2 className="font-display mt-12 text-3xl leading-none tracking-tight uppercase">
            The rules
          </h2>
          <ol className="border-ink divide-ink mt-4 divide-y-2 border-2">
            {[
              'You must own or have the rights to anything you upload.',
              'By submitting, you grant this site a non-exclusive license to display your work. You keep all your rights — we just need permission to show it.',
              'Keep it safe for work. No hateful, violent, sexual, or illegal content.',
              'No spam, and no impersonating other people.',
              'Submissions are reviewed by a human before they appear. We may remove content or accounts that break these rules, at our discretion.',
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
            The fine print
          </h2>
          <div className="border-ink mt-4 space-y-4 border-2 p-5 text-[15px] leading-relaxed sm:p-6">
            <p className="text-muted">
              The service is provided as-is, with no warranties of any kind. We do our best to keep
              it running and your data safe, but we can&rsquo;t promise uninterrupted service.
            </p>
            <p className="text-muted">
              Made with Fable is an independent community project and is not affiliated with,
              endorsed by, or sponsored by Anthropic.
            </p>
            <p className="text-muted">
              Questions about these terms? Email{' '}
              <a
                href="mailto:kristine@dizzywalk.com"
                className="text-ink hover:text-accent font-bold underline underline-offset-2 transition-colors"
              >
                kristine@dizzywalk.com
              </a>
              . If the terms change, we will update this page and the &ldquo;last updated&rdquo;
              date above.
            </p>
          </div>

          <div className="mt-12">
            <p className="label-mono text-muted">
              See also:{' '}
              <Link
                href="/privacy"
                className="text-ink hover:text-accent font-bold underline underline-offset-2 transition-colors"
              >
                Privacy policy
              </Link>
            </p>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}
