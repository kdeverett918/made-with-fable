import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <main
      id="main"
      className="bg-background relative isolate flex min-h-dvh items-center overflow-hidden px-4 py-8 sm:px-6 lg:px-10"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-ink)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ink)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.035]" />
      <div className="border-ink bg-background mx-auto grid w-full max-w-6xl border-2 shadow-[10px_10px_0_0_var(--color-ink)] lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="border-ink relative min-h-[360px] border-b-2 p-5 sm:p-8 lg:min-h-[620px] lg:border-r-2 lg:border-b-0 lg:p-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-stretch gap-3">
              <Link
                href="/"
                className="label-mono border-ink hover:bg-ink hover:text-background flex items-center border-2 px-3 py-2 font-bold transition-colors"
              >
                ← Back to the board
              </Link>
              <p className="label-mono border-ink border-2 px-3 py-2 font-bold">Access desk</p>
            </div>
            <p className="label-mono bg-accent text-on-accent px-3 py-2 font-bold">Members only</p>
          </div>
          <div className="mt-16 sm:mt-20 lg:mt-28">
            <p className="label-mono text-accent mb-4 font-bold">Made with Fable / Auth</p>
            <h1 className="font-display max-w-3xl text-[clamp(4.25rem,16vw,12rem)] leading-[0.82] tracking-tight uppercase">
              Sign
              <br />
              in
            </h1>
          </div>
          <div className="border-ink mt-8 grid border-2 sm:absolute sm:right-8 sm:bottom-8 sm:left-auto sm:mt-0 sm:w-80 lg:right-10 lg:bottom-10">
            <div className="border-ink border-b-2 px-4 py-3">
              <p className="label-mono text-muted-foreground">Workflow</p>
            </div>
            <div className="divide-ink grid grid-cols-3 divide-x-2">
              <p className="label-mono px-3 py-4 font-bold">Submit</p>
              <p className="label-mono px-3 py-4 font-bold">Like</p>
              <p className="label-mono px-3 py-4 font-bold">Review</p>
            </div>
          </div>
        </section>

        <section className="animate-scale-in p-4 sm:p-6 lg:p-8" aria-label="Sign in options">
          <div className="border-ink bg-surface border-2">
            <div className="border-ink grid grid-cols-[1fr_auto] border-b-2">
              <div className="px-5 py-4">
                <p className="label-mono text-muted-foreground">Gate 01</p>
                <h2 className="font-display mt-1 text-4xl leading-none uppercase">Access</h2>
              </div>
              <div className="border-ink flex items-center border-l-2 px-4">
                <span className="bg-accent block h-5 w-5" aria-hidden />
              </div>
            </div>
            <div className="px-5 py-5 sm:px-6 sm:py-6">
              <Suspense>
                <LoginForm />
              </Suspense>
            </div>
          </div>
          <p className="label-mono text-muted border-ink mt-4 border-2 border-dashed px-4 py-3">
            Submit projects, manage your profile, and help keep the board sharp.
          </p>
        </section>
      </div>
    </main>
  )
}
