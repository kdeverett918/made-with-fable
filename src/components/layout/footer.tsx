import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-ink bg-background mt-16 border-t-2">
      <div className="flex flex-col items-stretch sm:flex-row">
        <p className="label-mono text-muted border-ink flex items-center px-4 py-3 sm:border-r-2">
          Made with <span className="text-accent mx-1 font-bold">Fable</span> — a community
          showcase. Not affiliated with Anthropic.
        </p>
        <nav className="border-ink flex items-stretch border-t-2 sm:ml-auto sm:border-t-0 sm:border-l-2">
          <Link
            href="/makers"
            className="label-mono text-muted hover:bg-ink hover:text-background border-ink flex items-center border-r-2 px-4 py-3 font-bold transition-colors"
          >
            Makers
          </Link>
          <Link
            href="/about"
            className="label-mono text-muted hover:bg-ink hover:text-background border-ink flex items-center border-r-2 px-4 py-3 font-bold transition-colors"
          >
            About &amp; guidelines
          </Link>
          <Link
            href="/submit"
            className="label-mono text-muted hover:bg-ink hover:text-background border-ink flex items-center border-r-2 px-4 py-3 font-bold transition-colors"
          >
            Submit a project
          </Link>
          <Link
            href="/privacy"
            className="label-mono text-muted hover:bg-ink hover:text-background border-ink flex items-center border-r-2 px-4 py-3 font-bold transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="label-mono text-muted hover:bg-ink hover:text-background flex items-center px-4 py-3 font-bold transition-colors"
          >
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  )
}
