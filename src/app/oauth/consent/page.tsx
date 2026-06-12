import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Ban, Check, KeyRound } from 'lucide-react'
import { approveOAuthAuthorization, denyOAuthAuthorization } from '@/app/actions/oauth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Container } from '@/components/layout/container'

export const metadata: Metadata = { title: 'Authorize app access' }

interface ConsentPageProps {
  searchParams: Promise<{ authorization_id?: string; error?: string }>
}

const scopeLabels: Record<string, string> = {
  openid: 'Confirm your identity',
  email: 'Share your email address',
  profile: 'Share your profile details',
  phone: 'Share your phone number',
}

function scopeText(scope: string) {
  return scopeLabels[scope] ?? `Allow ${scope}`
}

function ErrorPanel({
  title,
  message,
  authorizationId,
}: {
  title: string
  message: string
  authorizationId?: string
}) {
  return (
    <>
      <Header />
      <main id="main" className="py-10">
        <Container className="max-w-3xl">
          <section className="border-ink bg-background border-2 shadow-[8px_8px_0_0_var(--color-ink)]">
            <div className="border-ink grid grid-cols-[1fr_auto] border-b-2">
              <div className="p-5">
                <p className="label-mono text-accent font-bold">OAuth access</p>
                <h1 className="font-display mt-2 text-6xl leading-none uppercase">{title}</h1>
              </div>
              <div className="border-ink flex items-center border-l-2 px-5">
                <KeyRound className="text-accent h-8 w-8" aria-hidden />
              </div>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-muted leading-relaxed">{message}</p>
              {authorizationId && (
                <p className="label-mono text-muted-foreground break-all">
                  Authorization: {authorizationId}
                </p>
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

export default async function OAuthConsentPage({ searchParams }: ConsentPageProps) {
  const params = await searchParams
  const authorizationId = params.authorization_id

  if (!authorizationId) {
    return (
      <ErrorPanel
        title="Missing pass"
        message="This authorization request is missing its authorization_id."
      />
    )
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(
      `/login?redirectTo=${encodeURIComponent(`/oauth/consent?authorization_id=${authorizationId}`)}`,
    )
  }

  const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId)

  if (error || !data) {
    return (
      <ErrorPanel
        title="Bad pass"
        message="This authorization request could not be loaded. It may have expired or already been used."
        authorizationId={authorizationId}
      />
    )
  }

  if ('redirect_url' in data) redirect(data.redirect_url)

  const scopes = data.scope.split(/\s+/).filter(Boolean)

  return (
    <>
      <Header />
      <main id="main" className="relative overflow-hidden py-8 sm:py-10 lg:py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(to_right,var(--color-ink)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ink)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.04]" />
        <Container className="max-w-5xl">
          <section className="border-ink bg-background border-2 shadow-[8px_8px_0_0_var(--color-ink)]">
            <div className="border-ink grid border-b-2 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="p-5 sm:p-7">
                <p className="label-mono text-accent font-bold">OAuth access request</p>
                <h1 className="font-display mt-4 max-w-3xl text-[clamp(4rem,12vw,9rem)] leading-[0.82] tracking-tight uppercase">
                  Let this app in?
                </h1>
              </div>
              <aside className="border-ink border-t-2 lg:border-t-0 lg:border-l-2">
                <div className="border-ink border-b-2 p-5">
                  <p className="label-mono text-muted-foreground">Signed in as</p>
                  <p className="mt-2 text-sm font-bold break-all">{data.user.email}</p>
                </div>
                <div className="p-5">
                  <p className="label-mono text-muted-foreground">Redirects to</p>
                  <p className="mt-2 font-mono text-xs break-all">{data.redirect_uri}</p>
                </div>
              </aside>
            </div>

            {params.error && (
              <p className="label-mono text-accent border-ink border-b-2 px-5 py-3 font-bold">
                That consent action did not complete. Try again.
              </p>
            )}

            <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="border-ink p-5 sm:p-7 lg:border-r-2">
                <div className="border-ink bg-surface border-2">
                  <div className="border-ink flex items-start justify-between gap-4 border-b-2 p-4">
                    <div className="min-w-0">
                      <p className="label-mono text-muted-foreground">Requesting app</p>
                      <h2 className="mt-2 text-2xl font-black tracking-wide break-words uppercase">
                        {data.client.name}
                      </h2>
                    </div>
                    <span className="bg-accent border-ink grid h-10 w-10 shrink-0 place-items-center border-2">
                      <KeyRound className="text-on-accent h-5 w-5" aria-hidden />
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2">
                    <div className="border-ink border-b-2 p-4 sm:border-r-2 sm:border-b-0">
                      <p className="label-mono text-muted-foreground">Client ID</p>
                      <p className="mt-2 font-mono text-xs break-all">{data.client.id}</p>
                    </div>
                    <div className="p-4">
                      <p className="label-mono text-muted-foreground">App URL</p>
                      {data.client.uri ? (
                        <a
                          href={data.client.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent mt-2 block font-mono text-xs break-all hover:underline"
                        >
                          {data.client.uri}
                        </a>
                      ) : (
                        <p className="text-muted mt-2 font-mono text-xs">No URL provided</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-ink bg-background mt-5 border-2">
                  <div className="border-ink border-b-2 px-4 py-3">
                    <p className="label-mono text-muted-foreground">This app wants to</p>
                  </div>
                  <ul className="divide-ink divide-y-2">
                    {scopes.map((scope) => (
                      <li key={scope} className="grid grid-cols-[auto_1fr] gap-3 px-4 py-3">
                        <Check className="text-accent mt-0.5 h-4 w-4" aria-hidden />
                        <span>
                          <span className="block text-sm font-bold">{scopeText(scope)}</span>
                          <span className="label-mono text-muted-foreground mt-1 block">
                            {scope}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <aside className="bg-surface-raised p-5 sm:p-7">
                <div className="border-ink bg-background border-2">
                  <div className="border-ink border-b-2 p-4">
                    <p className="label-mono text-accent font-bold">Your call</p>
                    <p className="text-muted mt-3 text-sm leading-relaxed">
                      Approving sends you back to the app with an authorization code. Denying sends
                      it back empty-handed.
                    </p>
                  </div>
                  <form className="space-y-3 p-4">
                    <input type="hidden" name="authorizationId" value={authorizationId} />
                    <button
                      formAction={approveOAuthAuthorization}
                      className="label-mono bg-accent text-on-accent border-ink flex w-full cursor-pointer items-center justify-center gap-2 border-2 px-4 py-3 font-bold transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-ink)]"
                    >
                      Approve access
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      formAction={denyOAuthAuthorization}
                      className="label-mono border-ink text-ink flex w-full cursor-pointer items-center justify-center gap-2 border-2 px-4 py-3 font-bold transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-ink)]"
                    >
                      <Ban className="h-4 w-4" aria-hidden />
                      Deny
                    </button>
                  </form>
                </div>
              </aside>
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  )
}
