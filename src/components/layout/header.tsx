import Link from 'next/link'
import { Plus, Sparkles } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Container } from '@/components/layout/container'
import { AuthMenu } from '@/components/layout/auth-menu'
import { buttonVariants } from '@/components/ui/button'
import type { Profile } from '@/types/database'

export async function Header() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="text-accent h-5 w-5" aria-hidden />
          <span className="font-display text-lg font-semibold tracking-tight">
            Made with <span className="text-accent">Fable</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/submit" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
            <Plus className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Share your creation</span>
            <span className="sm:hidden">Share</span>
          </Link>
          <AuthMenu profile={profile} />
        </div>
      </Container>
    </header>
  )
}
