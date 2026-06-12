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
      <main id="main" className="py-12">
        <Container className="max-w-xl">
          <h1 className="font-display text-3xl font-semibold">Profile settings</h1>
          <p className="text-muted mt-2 text-sm">This is how you appear next to your creations.</p>
          <ProfileForm profile={profile} userId={user.id} />
        </Container>
      </main>
      <Footer />
    </>
  )
}
