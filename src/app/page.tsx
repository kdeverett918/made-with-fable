import { siteConfig } from '@/config/site'

export default function Home() {
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center px-6 text-center"
    >
      <p className="text-accent animate-fade-in font-mono text-sm tracking-widest uppercase">
        Coming soon
      </p>
      <h1 className="font-display animate-slide-up mt-4 max-w-3xl text-5xl font-semibold text-balance sm:text-7xl">
        Made with <span className="text-accent">Fable</span>
      </h1>
      <p className="text-muted animate-slide-up mt-6 max-w-xl text-lg text-pretty">
        {siteConfig.tagline}
      </p>
    </main>
  )
}
