import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Container } from '@/components/layout/container'
import { SubmitWizard } from '@/components/submit/submit-wizard'

export const metadata: Metadata = { title: 'Share your creation' }

export default async function SubmitPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/submit')

  return (
    <>
      <Header />
      <main id="main" className="py-12">
        <Container className="max-w-2xl">
          <h1 className="font-display text-3xl font-semibold">Share your creation</h1>
          <p className="text-muted mt-2 text-sm">
            Show the community what you made with Fable. Submissions are reviewed before they go
            live.
          </p>
          <SubmitWizard userId={user.id} />
        </Container>
      </main>
      <Footer />
    </>
  )
}
