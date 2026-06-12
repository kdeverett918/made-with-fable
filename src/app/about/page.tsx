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
        <Container className="prose-custom max-w-2xl">
          <h1 className="font-display text-3xl font-semibold">About Made with Fable</h1>

          <div className="text-muted mt-6 space-y-4 text-[15px] leading-relaxed">
            <p>
              Claude Fable 5 is here for a limited time — and people are building remarkable things
              with it. This gallery is a community space to show off those creations: websites,
              games, art, tools, agents, writing, music, and everything in between.
            </p>
            <p>
              Every submission can include the prompt behind it, so the gallery doubles as a library
              of ideas. See something inspiring? Copy the prompt and remix it.
            </p>
            <p className="text-muted-foreground text-sm">
              This is an independent community project, not affiliated with Anthropic.
            </p>
          </div>

          <h2 className="font-display mt-10 text-xl font-semibold">Submission guidelines</h2>
          <ul className="text-muted mt-4 list-disc space-y-2 pl-5 text-[15px]">
            <li>
              Share things you made with Fable (Claude Fable 5) — that&apos;s the whole point.
            </li>
            <li>You must own or have rights to what you upload.</li>
            <li>Keep it safe for work. No hateful, violent, or sexual content.</li>
            <li>No spam, ads, or low-effort reposts of other people&apos;s work.</li>
            <li>Include the prompt and story when you can — it&apos;s what makes this useful.</li>
            <li>Submissions are reviewed by a human before they appear, usually within a day.</li>
          </ul>

          <h2 className="font-display mt-10 text-xl font-semibold">Privacy, briefly</h2>
          <ul className="text-muted mt-4 list-disc space-y-2 pl-5 text-[15px]">
            <li>We store your email (for sign-in), profile, and what you submit. Nothing else.</li>
            <li>No ads, no tracking pixels, no selling data.</li>
            <li>
              Want your account or a submission gone? Use the report button or contact the site
              owner, and it will be removed.
            </li>
          </ul>

          <div className="mt-10">
            <Link href="/submit" className={buttonVariants({ size: 'lg' })}>
              Share your creation
            </Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}
