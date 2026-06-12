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
    <form action={formAction} className="mt-8 space-y-6">
      <input type="hidden" name="avatar_url" value={avatarUrl} />

      <div className="flex items-center gap-4">
        <Avatar src={avatarUrl || null} name={profile.display_name ?? profile.username} size={72} />
        <div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Camera className="h-4 w-4" aria-hidden />
            )}
            Change photo
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onAvatarPick}
          />
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Username</span>
        <Input
          name="username"
          defaultValue={profile.username}
          required
          pattern="[a-z0-9_]{3,24}"
          title="3–24 lowercase letters, numbers, or underscores"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Display name</span>
        <Input name="display_name" defaultValue={profile.display_name ?? ''} maxLength={60} />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Bio</span>
        <Textarea name="bio" defaultValue={profile.bio ?? ''} maxLength={280} rows={3} />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Website</span>
        <Input
          name="website_url"
          type="url"
          placeholder="https://"
          defaultValue={profile.website_url ?? ''}
        />
      </label>

      {state.error && <p className="text-error text-sm">{state.error}</p>}
      {state.ok && !pending && <p className="text-success text-sm">Saved.</p>}

      <Button type="submit" disabled={pending || uploading}>
        {pending ? <Spinner className="text-on-accent h-4 w-4" /> : null}
        Save profile
      </Button>
    </form>
  )
}
