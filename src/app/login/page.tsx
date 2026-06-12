import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-6">
      <div className="animate-scale-in w-full max-w-sm">
        <h1 className="font-display text-center text-3xl font-semibold">
          Sign in to <span className="text-accent">Made with Fable</span>
        </h1>
        <p className="text-muted mt-2 text-center text-sm">
          Sign in to submit your creations, like, and comment.
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
