'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  authCallbackUrl,
  authConfirmUrl,
  rememberRedirect,
  sanitizeRedirectPath,
} from '@/lib/auth/redirect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

type Method = 'password' | 'magic'
type SentKind = 'magic' | 'confirm' | 'recovery'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = sanitizeRedirectPath(searchParams.get('redirectTo'))
  const authError = searchParams.get('error')

  const [method, setMethod] = useState<Method>('password')
  const [creating, setCreating] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<SentKind | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [oauthLoading, setOauthLoading] = useState(false)

  const supabase = () => createSupabaseBrowserClient()

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    rememberRedirect(redirectTo)
    setError(null)
    setBusy(true)
    if (creating) {
      const { data, error: signUpError } = await supabase().auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: authConfirmUrl(location.origin) },
      })
      setBusy(false)
      if (signUpError) {
        setError(
          /weak|short|character/i.test(signUpError.message)
            ? 'Passwords need 8+ characters with letters and a number.'
            : signUpError.message,
        )
        return
      }
      if (data.session) {
        router.push(redirectTo)
        router.refresh()
        return
      }
      setSent('confirm')
      return
    }

    const { error: signInError } = await supabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setBusy(false)
    if (signInError) {
      setError(
        /invalid login credentials/i.test(signInError.message)
          ? 'Wrong email or password. If you signed up with a magic link or Google, use those - or reset your password below.'
          : signInError.message,
      )
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    rememberRedirect(redirectTo)
    setError(null)
    setBusy(true)
    const { error: otpError } = await supabase().auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: authCallbackUrl(location.origin),
        shouldCreateUser: true,
      },
    })
    setBusy(false)
    if (otpError) {
      setError('Could not send the link. Try again in a minute.')
      return
    }
    setSent('magic')
  }

  async function forgotPassword() {
    if (!email.trim()) {
      setError('Enter your email first, then tap "Forgot password" again.')
      return
    }
    setError(null)
    setBusy(true)
    const { error: resetError } = await supabase().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: authConfirmUrl(location.origin),
    })
    setBusy(false)
    if (resetError) {
      setError('Could not send the reset link. Try again in a minute.')
      return
    }
    setSent('recovery')
  }

  async function signInWithGoogle() {
    rememberRedirect(redirectTo)
    setOauthLoading(true)
    setError(null)
    const { error: oauthError } = await supabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authCallbackUrl(location.origin) },
    })
    if (oauthError) {
      setError('Google sign-in hit a snag. Try email instead.')
      setOauthLoading(false)
    }
  }

  if (sent) {
    const copy: Record<SentKind, { title: string; body: string }> = {
      magic: { title: 'Check your email', body: 'We sent a sign-in link to' },
      confirm: { title: 'Confirm your email', body: 'We sent a confirmation link to' },
      recovery: { title: 'Reset link sent', body: 'We sent a password reset link to' },
    }
    return (
      <div className="border-ink bg-background border-2" role="status" aria-live="polite">
        <div className="border-ink flex items-center justify-between border-b-2 px-4 py-3">
          <p className="label-mono text-accent font-bold">Link dispatched</p>
          <Mail className="text-accent h-5 w-5" aria-hidden />
        </div>
        <div className="p-5">
          <p className="font-display text-accent text-4xl leading-none uppercase">
            {copy[sent].title}
          </p>
          <p className="label-mono text-muted mt-4">
            {copy[sent].body} <span className="text-ink font-bold">{email}</span>
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

      <div className="flex items-center gap-3">
        <span className="bg-ink h-0.5 flex-1" />
        <span className="label-mono border-ink text-muted-foreground border-2 px-2 py-1">OR</span>
        <span className="bg-ink h-0.5 flex-1" />
      </div>

      {/* method toggle */}
      <div
        className="border-ink grid grid-cols-2 border-2"
        role="tablist"
        aria-label="Sign-in method"
      >
        {(
          [
            ['password', 'Password'],
            ['magic', 'Magic link'],
          ] as Array<[Method, string]>
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={method === value}
            onClick={() => {
              setMethod(value)
              setError(null)
            }}
            className={cn(
              'label-mono cursor-pointer px-3 py-2.5 font-bold transition-colors',
              method === value ? 'bg-ink text-background' : 'text-muted hover:text-ink',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={method === 'password' ? submitPassword : sendMagicLink} className="space-y-3">
        <label className="block" htmlFor="login-email">
          <span className="label-mono mb-2 block font-bold">Email address</span>
          <Input
            id="login-email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="h-12"
          />
        </label>

        {method === 'password' && (
          <label className="block" htmlFor="login-password">
            <span className="label-mono mb-2 block font-bold">Password</span>
            <Input
              id="login-password"
              name="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={creating ? 'new-password' : 'current-password'}
              className="h-12"
            />
            {creating && (
              <span className="label-mono text-muted-foreground mt-1.5 block">
                8+ characters with letters and a number
              </span>
            )}
          </label>
        )}

        {error && (
          <p className="label-mono text-accent border-accent border-2 px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="h-14 w-full" disabled={busy}>
          {busy ? <Spinner className="text-on-accent h-4 w-4" /> : null}
          {method === 'magic' ? 'Email me a sign-in link' : creating ? 'Create account' : 'Sign in'}
        </Button>
      </form>

      {method === 'password' && (
        <div className="label-mono flex items-center justify-between">
          <button
            onClick={() => {
              setCreating((v) => !v)
              setError(null)
            }}
            className="text-accent cursor-pointer font-bold hover:underline"
          >
            {creating ? '<- Have an account? Sign in' : 'New here? Create account'}
          </button>
          {!creating && (
            <button
              onClick={forgotPassword}
              disabled={busy}
              className="text-muted hover:text-ink cursor-pointer hover:underline"
            >
              Forgot password?
            </button>
          )}
        </div>
      )}
    </div>
  )
}
