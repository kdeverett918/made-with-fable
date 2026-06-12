import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main id="main" className="py-12">
        <Container className="max-w-2xl">
          <p className="label-mono text-accent">* Made with Fable</p>
          <h1 className="font-display mt-2 text-6xl leading-none tracking-tight uppercase">
            Privacy
          </h1>
          <p className="label-mono text-muted-foreground mt-3">Last updated: June 12, 2026</p>

          <div className="border-ink mt-6 space-y-4 border-2 p-5 text-[15px] leading-relaxed sm:p-6">
            <p className="text-ink">
              Made with Fable is a small community gallery, not a corporation. We collect the
              minimum needed to run the site, and this page explains all of it in plain language.
            </p>
            <p className="label-mono text-muted-foreground">
              An independent community project, not affiliated with Anthropic.
            </p>
          </div>

          <h2 className="font-display mt-12 text-3xl leading-none tracking-tight uppercase">
            What we collect
          </h2>
          <ol className="border-ink divide-ink mt-4 divide-y-2 border-2">
            {[
              'Your email address — used to sign you in (magic link) and nothing else.',
              'Profile info you choose to provide: username, display name, bio, avatar.',
              'What you do here: submissions, comments, likes, and follows.',
              'Basic server logs (IP address, request times) that hosting generates automatically.',
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
            What we don&rsquo;t do
          </h2>
          <ol className="border-ink divide-ink mt-4 divide-y-2 border-2">
            {[
              'No ads.',
              'No tracking pixels or third-party analytics — server logs are it.',
              'No selling, renting, or sharing your data with anyone.',
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
            Where it lives
          </h2>
          <div className="border-ink mt-4 space-y-4 border-2 p-5 text-[15px] leading-relaxed sm:p-6">
            <p className="text-muted">
              Your data is stored in Supabase, hosted in the United States. The site itself runs on
              Render. The only cookies we set are the auth session cookies that keep you signed in —
              nothing else.
            </p>
            <p className="text-muted">
              Third parties involved: Supabase (authentication and storage), Google (only if you
              choose to sign in with Google), and Render (hosting). That&rsquo;s the whole list.
            </p>
          </div>

          <h2 className="font-display mt-12 text-3xl leading-none tracking-tight uppercase">
            Your rights
          </h2>
          <div className="border-ink mt-4 space-y-4 border-2 p-5 text-[15px] leading-relaxed sm:p-6">
            <p className="text-muted">
              Want your account or any of your content deleted? Email{' '}
              <a
                href="mailto:kristine@dizzywalk.com"
                className="text-ink hover:text-accent font-bold underline underline-offset-2 transition-colors"
              >
                kristine@dizzywalk.com
              </a>{' '}
              or use the report button on any page. Deletion requests are honored within 30 days,
              usually much faster.
            </p>
            <p className="text-muted">
              This site is not directed at children under 13. If you believe a child has created an
              account, contact us and we will remove it.
            </p>
            <p className="text-muted">
              If this policy changes, we will update this page and the &ldquo;last updated&rdquo;
              date above.
            </p>
          </div>

          <div className="mt-12">
            <p className="label-mono text-muted">
              See also:{' '}
              <Link
                href="/terms"
                className="text-ink hover:text-accent font-bold underline underline-offset-2 transition-colors"
              >
                Terms of use
              </Link>
            </p>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}
