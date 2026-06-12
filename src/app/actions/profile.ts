'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const profileSchema = z.object({
  username: z
    .string()
    .regex(/^[a-z0-9_]{3,24}$/, 'Use 3–24 lowercase letters, numbers, or underscores'),
  display_name: z.string().max(60).optional().or(z.literal('')),
  bio: z.string().max(280).optional().or(z.literal('')),
  website_url: z
    .url('Enter a valid URL')
    .refine((u) => /^https?:\/\//i.test(u), 'Enter an http(s) URL')
    .optional()
    .or(z.literal('')),
  avatar_url: z.string().optional().or(z.literal('')),
})

export type ProfileFormState = { ok: boolean; error?: string }

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }

  const parsed = profileSchema.safeParse({
    username: formData.get('username'),
    display_name: formData.get('display_name'),
    bio: formData.get('bio'),
    website_url: formData.get('website_url'),
    avatar_url: formData.get('avatar_url'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      username: parsed.data.username,
      display_name: parsed.data.display_name || null,
      bio: parsed.data.bio || null,
      website_url: parsed.data.website_url || null,
      avatar_url: parsed.data.avatar_url || null,
    })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'That username is taken' }
    return { ok: false, error: 'Could not save profile' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}
