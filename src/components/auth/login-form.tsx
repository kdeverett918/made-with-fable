'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { authCallbackUrl, sanitizeRedirectPath } from '@/lib/auth/redirect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

export function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = sanitizeRedirectPath(searchParams.get('redirectTo'))
  const authError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [oauthLoading, setOauthLoading] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setOauthError(null)
    setStatus('sending')
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: authCallbackUrl(location.origin, redirectTo),
        shouldCreateUser: true,
      },
    })
    setStatus(error ? 'error' : 'sent')
  }

  async function signInWithGoogle() {
    setOauthLoading(true)
    setOauthError(null)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: authCallbackUrl(location.origin, redirectTo),
      },
    })
    if (error) {
      setOauthError('Google sign-in is not ready yet. Use email while the provider is being wired.')
      setOauthLoading(false)
    }
  }

  if (status === 'sent') {
    return (
      <div className="border-ink bg-background border-2" role="status" aria-live="polite">
        <div className="border-ink flex items-center justify-between border-b-2 px-4 py-3">
          <p className="label-mono text-accent font-bold">Link dispatched</p>
          <Mail className="text-accent h-5 w-5" aria-hidden />
        </div>
        <div className="p-5">
          <p className="font-display text-accent text-5xl leading-none uppercase">
            Check your email
          </p>
          <p className="label-mono text-muted mt-4">
            We sent a sign-in link to <span className="text-ink font-bold">{email}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {authError && (
        <p className="label-mono border-accent text-accent border-2 px-3 py-2" role="alert">
          That sign-in link did not work. It may have expired. Try again.
        </p>
      )}

      <Button
        variant="secondary"
        size="lg"
        className="h-14 w-full justify-between px-4 text-left"
        onClick={signInWithGoogle}
        disabled={oauthLoading}
      >
        <span>Continue with Google</span>
        <span className="border-ink bg-background flex h-8 w-8 items-center justify-center border-2">
          {oauthLoading ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
              />
            </svg>
          )}
        </span>
      </Button>
      {oauthError && (
        <p className="label-mono text-accent" role="alert">
          {oauthError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <span className="bg-ink h-0.5 flex-1" />
        <span className="label-mono border-ink text-muted-foreground border-2 px-2 py-1">OR</span>
        <span className="bg-ink h-0.5 flex-1" />
      </div>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <label className="block">
          <span className="label-mono mb-2 block font-bold">Email address</span>
          <Input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="h-12"
          />
        </label>
        <Button type="submit" size="lg" className="h-14 w-full" disabled={status === 'sending'}>
          {status === 'sending' ? <Spinner className="text-on-accent h-4 w-4" /> : null}
          Email me a sign-in link
        </Button>
        {status === 'error' && (
          <p className="label-mono text-accent" role="alert">
            Could not send the link. Try again in a minute.
          </p>
        )}
      </form>

      <div className="border-ink grid grid-cols-2 border-2 text-center">
        <p className="label-mono border-ink text-muted border-r-2 px-3 py-3">No password</p>
        <p className="label-mono text-muted px-3 py-3">One-time link</p>
      </div>
    </div>
  )
}
