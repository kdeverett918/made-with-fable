'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Settings, Shield, User } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/avatar'
import type { Profile } from '@/types/database'

export function AuthMenu({ profile }: { profile: Profile | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!profile) {
    return (
      <Link
        href="/login"
        className="label-mono text-muted hover:text-ink -mx-3 -my-2 flex min-h-11 items-center px-3 py-2 font-bold hover:underline"
      >
        Sign in
      </Link>
    )
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const itemClass =
    'label-mono flex w-full items-center gap-2 px-3 py-2 text-muted hover:bg-ink hover:text-background transition-colors'

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="focus-visible:outline-ring flex cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Avatar
          src={profile.avatar_url}
          name={profile.display_name ?? profile.username}
          size={34}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="border-ink bg-background animate-scale-in absolute right-0 mt-2 w-48 overflow-hidden border-2 py-1 shadow-[4px_4px_0_0_var(--color-ink)]"
        >
          <Link
            href={`/u/${profile.username}`}
            className={itemClass}
            onClick={() => setOpen(false)}
          >
            <User className="h-4 w-4" aria-hidden /> My profile
          </Link>
          <Link href="/settings/profile" className={itemClass} onClick={() => setOpen(false)}>
            <Settings className="h-4 w-4" aria-hidden /> Settings
          </Link>
          {profile.is_admin && (
            <Link href="/admin" className={itemClass} onClick={() => setOpen(false)}>
              <Shield className="h-4 w-4" aria-hidden /> Admin
            </Link>
          )}
          <button onClick={signOut} className={itemClass} role="menuitem">
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
