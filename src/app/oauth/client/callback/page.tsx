import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, XCircle } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = { title: 'OAuth callback' }

interface OAuthClientCallbackPageProps {
  searchParams: Promise<{
    code?: string
    state?: string
    error?: string
    error_description?: string
  }>
}

function short(value: string) {
  return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value
}

export default async function OAuthClientCallbackPage({
  searchParams,
}: OAuthClientCallbackPageProps) {
  const params = await searchParams
  const success = Boolean(params.code && !params.error)

  return (
    <>
      <Header />
      <main id="main" className="py-10">
        <Container className="max-w-3xl">
          <section className="border-ink bg-background border-2 shadow-[8px_8px_0_0_var(--color-ink)]">
            <div className="border-ink grid grid-cols-[1fr_auto] border-b-2">
              <div className="p-5">
                <p className="label-mono text-accent font-bold">OAuth client callback</p>
                <h1 className="font-display mt-2 text-6xl leading-none uppercase">
                  {success ? 'Code received' : 'No pass'}
                </h1>
              </div>
              <div className="border-ink flex items-center border-l-2 px-5">
                {success ? (
                  <Check className="text-accent h-8 w-8" aria-hidden />
                ) : (
                  <XCircle className="text-accent h-8 w-8" aria-hidden />
                )}
              </div>
            </div>
            <div className="space-y-4 p-5">
              {success ? (
                <>
                  <p className="text-muted leading-relaxed">
                    Authorization completed. A real OAuth client should now exchange this code at
                    Supabase&apos;s token endpoint using the original PKCE verifier.
                  </p>
                  <div className="border-ink grid border-2">
                    <div className="border-ink border-b-2 p-4">
                      <p className="label-mono text-muted-foreground">Code</p>
                      <p className="mt-2 font-mono text-xs break-all">{short(params.code!)}</p>
                    </div>
                    {params.state && (
                      <div className="p-4">
                        <p className="label-mono text-muted-foreground">State</p>
                        <p className="mt-2 font-mono text-xs break-all">{short(params.state)}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="border-ink border-2 p-4">
                  <p className="label-mono text-muted-foreground">Error</p>
                  <p className="text-accent mt-2 font-bold break-words">
                    {params.error_description ??
                      params.error ??
                      'No authorization code was returned.'}
                  </p>
                </div>
              )}
              <Link
                href="/"
                className="label-mono bg-accent text-on-accent border-ink inline-flex border-2 px-4 py-3 font-bold"
              >
                Back to the board
              </Link>
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  )
}
