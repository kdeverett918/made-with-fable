import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Container } from '@/components/layout/container'
import { ProfileForm } from '@/components/settings/profile-form'

export const metadata: Metadata = { title: 'Profile settings' }

export default async function ProfileSettingsPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/settings/profile')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  return (
    <>
      <Header />
      <main id="main" className="relative overflow-hidden py-8 sm:py-10 lg:py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(to_right,var(--color-ink)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ink)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.04]" />
        <Container className="max-w-5xl">
          <section className="border-ink bg-background grid border-2 shadow-[8px_8px_0_0_var(--color-ink)] md:grid-cols-[minmax(0,1fr)_280px]">
            <div className="border-ink border-b-2 p-5 sm:p-7 md:border-r-2 md:border-b-0 lg:p-9">
              <p className="label-mono text-accent mb-4 font-bold">Profile plate / Public</p>
              <h1 className="font-display max-w-3xl text-[clamp(4.25rem,12vw,8.75rem)] leading-[0.82] tracking-tight uppercase">
                Profile settings
              </h1>
            </div>
            <aside className="divide-ink grid divide-y-2">
              <div className="p-5">
                <p className="label-mono text-muted-foreground">Visible as</p>
                <p className="text-muted mt-3 text-sm leading-relaxed">
                  This is how you appear next to your creations, comments, and moderation history.
                </p>
              </div>
              <div className="p-5">
                <p className="label-mono text-muted-foreground">Handle</p>
                <p className="font-display text-accent mt-2 text-5xl leading-none uppercase">
                  @{profile.username}
                </p>
              </div>
            </aside>
          </section>
          <ProfileForm profile={profile} userId={user.id} />
        </Container>
      </main>
      <Footer />
    </>
  )
}
