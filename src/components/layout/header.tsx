import Link from 'next/link'
import { Asterisk } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AuthMenu } from '@/components/layout/auth-menu'
import { NavLinks } from '@/components/layout/nav-links'
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
    <header className="border-ink bg-background sticky top-0 z-40 border-b-2">
      <div className="flex items-stretch">
        <Link
          href="/"
          className="label-mono hover:bg-ink hover:text-background flex items-center gap-2 px-4 py-3 font-bold transition-colors"
        >
          <Asterisk className="text-accent h-4 w-4" aria-hidden />
          Fable Community
        </Link>
        <nav className="border-ink hidden items-stretch border-l-2 sm:flex" aria-label="Main">
          <NavLinks />
        </nav>
        <div className="border-ink ml-auto flex items-center gap-3 border-l-2 py-2 pr-4 pl-4">
          <Link
            href="/submit"
            className="label-mono bg-accent text-on-accent hover:bg-accent-deep hidden px-3 py-1.5 font-bold transition-colors sm:inline-block"
          >
            Submit a project →
          </Link>
          <AuthMenu profile={profile} />
        </div>
      </div>
      <nav className="border-ink flex items-stretch border-t-2 sm:hidden" aria-label="Main">
        <NavLinks variant="mobile" />
      </nav>
    </header>
  )
}
