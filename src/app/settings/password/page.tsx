import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Container } from '@/components/layout/container'
import { PasswordForm } from '@/components/settings/password-form'

export const metadata: Metadata = { title: 'Set password' }

export default async function PasswordPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/settings/password')

  return (
    <>
      <Header />
      <main id="main" className="py-12">
        <Container className="max-w-md">
          <h1 className="font-display text-4xl leading-none tracking-tight uppercase">
            Set your password
          </h1>
          <p className="label-mono text-muted mt-3 mb-8">
            For {user.email}. You can always sign in with a magic link or Google instead.
          </p>
          <PasswordForm />
        </Container>
      </main>
      <Footer />
    </>
  )
}
