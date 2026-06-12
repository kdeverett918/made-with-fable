import type { Metadata } from 'next'
import { Anton, Archivo, JetBrains_Mono } from 'next/font/google'
import { siteConfig } from '@/config/site'
import './globals.css'

const anton = Anton({
  variable: '--font-anton',
  weight: '400',
  subsets: ['latin'],
})

const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${anton.variable} ${archivo.variable} ${jetbrainsMono.variable} min-h-dvh antialiased`}
      >
        <a
          href="#main"
          className="bg-accent text-on-accent sr-only z-50 px-4 py-2 focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
