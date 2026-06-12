'use client'

import { useActionState, useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'
import { nanoid } from 'nanoid'
import { Camera } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { mediaUrl } from '@/lib/storage'
import { updateProfile, type ProfileFormState } from '@/app/actions/profile'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import type { Profile } from '@/types/database'

export function ProfileForm({ profile, userId }: { profile: Profile; userId: string }) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(updateProfile, {
    ok: false,
  })
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 512,
        maxSizeMB: 0.3,
        fileType: 'image/webp',
      })
      const path = `${userId}/avatar-${nanoid(8)}.webp`
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.storage.from('media').upload(path, compressed, {
        contentType: 'image/webp',
      })
      if (!error) setAvatarUrl(mediaUrl(path))
    } finally {
      setUploading(false)
    }
  }

  return (
    <form
      action={formAction}
      className="border-ink bg-background mt-10 border-2 shadow-[6px_6px_0_0_var(--color-ink)]"
    >
      <input type="hidden" name="avatar_url" value={avatarUrl} />

      <div className="grid md:grid-cols-[260px_minmax(0,1fr)]">
        <section className="border-ink border-b-2 p-5 sm:p-6 md:border-r-2 md:border-b-0">
          <p className="label-mono text-muted-foreground">Avatar block</p>
          <div className="mt-5 flex items-end gap-4 md:block">
            <Avatar
              src={avatarUrl || null}
              name={profile.display_name ?? profile.username}
              size={112}
              className="bg-background"
            />
            <div className="min-w-0 md:mt-5">
              <p className="truncate text-sm font-bold tracking-wide uppercase">
                {profile.display_name || profile.username}
              </p>
              <p className="label-mono text-muted-foreground mt-1">@{profile.username}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="mt-5 w-full justify-between"
          >
            Change photo
            {uploading ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Camera className="h-4 w-4" aria-hidden />
            )}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onAvatarPick}
          />
          <p className="label-mono text-muted-foreground mt-4">WebP upload, 512px max.</p>
        </section>

        <section className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="label-mono mb-2 block font-bold">Username</span>
              <Input
                name="username"
                defaultValue={profile.username}
                required
                pattern="[a-z0-9_]{3,24}"
                title="3-24 lowercase letters, numbers, or underscores"
                className="h-12"
              />
            </label>

            <label className="block">
              <span className="label-mono mb-2 block font-bold">Display name</span>
              <Input
                name="display_name"
                defaultValue={profile.display_name ?? ''}
                maxLength={60}
                className="h-12"
              />
            </label>
          </div>

          <label className="block">
            <span className="label-mono mb-2 block font-bold">Bio</span>
            <Textarea name="bio" defaultValue={profile.bio ?? ''} maxLength={280} rows={4} />
          </label>

          <label className="block">
            <span className="label-mono mb-2 block font-bold">Website</span>
            <Input
              name="website_url"
              type="url"
              placeholder="https://"
              defaultValue={profile.website_url ?? ''}
              className="h-12"
            />
          </label>

          {state.error && (
            <p className="label-mono border-accent text-accent border-2 px-3 py-2" role="alert">
              {state.error}
            </p>
          )}
          {state.ok && !pending && (
            <p className="label-mono border-success text-success border-2 px-3 py-2" role="status">
              Saved.
            </p>
          )}
        </section>
      </div>

      <div className="border-ink bg-surface-raised flex justify-end border-t-2 px-5 py-4 sm:px-6">
        <Button type="submit" disabled={pending || uploading}>
          {pending ? <Spinner className="text-on-accent h-4 w-4" /> : null}
          Save profile
        </Button>
      </div>
    </form>
  )
}
