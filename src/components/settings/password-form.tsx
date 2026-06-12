'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

export function PasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setStatus('saving')
    const supabase = createSupabaseBrowserClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(
        updateError.message.includes('weak')
          ? 'Use at least 8 characters with letters and a number.'
          : updateError.message,
      )
      setStatus('idle')
      return
    }
    setStatus('done')
    setTimeout(() => router.push('/'), 1500)
  }

  if (status === 'done') {
    return (
      <div className="border-ink border-2 p-5" role="status">
        <p className="font-display text-accent text-3xl uppercase">Password set</p>
        <p className="label-mono text-muted mt-2">You are signed in. Taking you to the board…</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="label-mono mb-2 block font-bold">New password</span>
        <Input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="h-12"
        />
        <span className="label-mono text-muted-foreground mt-1.5 block">
          8+ characters with letters and a number
        </span>
      </label>
      <label className="block">
        <span className="label-mono mb-2 block font-bold">Confirm password</span>
        <Input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className="h-12"
        />
      </label>
      {error && (
        <p className="label-mono text-accent border-accent border-2 px-3 py-2" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={status === 'saving'}>
        {status === 'saving' ? <Spinner className="text-on-accent h-4 w-4" /> : null}
        Save password
      </Button>
    </form>
  )
}
