import Link from 'next/link'
import { Container } from '@/components/layout/container'

export function Footer() {
  return (
    <footer className="border-border mt-16 border-t py-10">
      <Container className="text-muted-foreground flex flex-col items-center justify-between gap-4 text-sm sm:flex-row">
        <p>
          Made with <span className="text-accent">Fable</span> — a community showcase. Not
          affiliated with Anthropic.
        </p>
        <nav className="flex gap-6">
          <Link href="/about" className="hover:text-foreground transition-colors">
            About &amp; guidelines
          </Link>
          <Link href="/submit" className="hover:text-foreground transition-colors">
            Submit
          </Link>
        </nav>
      </Container>
    </footer>
  )
}
