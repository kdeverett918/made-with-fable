'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

export function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/'
  const authError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [oauthLoading, setOauthLoading] = useState(false)

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/confirm?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    })
    setStatus(error ? 'error' : 'sent')
  }

  async function signInWithGoogle() {
    setOauthLoading(true)
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    })
  }

  if (status === 'sent') {
    return (
      <div className="border-accent/30 bg-accent/10 mt-8 rounded-lg border p-6 text-center">
        <Mail className="text-accent mx-auto h-8 w-8" />
        <p className="mt-3 font-medium">Check your email</p>
        <p className="text-muted mt-1 text-sm">
          We sent a sign-in link to <span className="text-foreground">{email}</span>
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-4">
      {authError && (
        <p className="text-error bg-error/10 border-error/30 rounded-md border px-3 py-2 text-sm">
          That sign-in link didn&apos;t work — it may have expired. Try again.
        </p>
      )}

      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={signInWithGoogle}
        disabled={oauthLoading}
      >
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
        Continue with Google
      </Button>

      <div className="flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs uppercase">or</span>
        <span className="bg-border h-px flex-1" />
      </div>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <Input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
        />
        <Button type="submit" size="lg" className="w-full" disabled={status === 'sending'}>
          {status === 'sending' ? <Spinner className="text-on-accent h-4 w-4" /> : null}
          Email me a sign-in link
        </Button>
        {status === 'error' && (
          <p className="text-error text-sm">Couldn&apos;t send the link. Try again in a minute.</p>
        )}
      </form>
    </div>
  )
}
