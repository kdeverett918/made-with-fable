'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

function authorizationIdFrom(formData: FormData) {
  const value = formData.get('authorizationId')
  return typeof value === 'string' && value.length > 0 ? value : null
}

function consentErrorRedirect(authorizationId: string | null, error: string): never {
  const params = new URLSearchParams()
  if (authorizationId) params.set('authorization_id', authorizationId)
  params.set('error', error)
  redirect(`/oauth/consent?${params}`)
}

export async function approveOAuthAuthorization(formData: FormData) {
  const authorizationId = authorizationIdFrom(formData)
  if (!authorizationId) consentErrorRedirect(null, 'missing')

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.oauth.approveAuthorization(authorizationId, {
    skipBrowserRedirect: true,
  })

  if (error || !data?.redirect_url) consentErrorRedirect(authorizationId, 'approve')
  redirect(data.redirect_url)
}

export async function denyOAuthAuthorization(formData: FormData) {
  const authorizationId = authorizationIdFrom(formData)
  if (!authorizationId) consentErrorRedirect(null, 'missing')

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.oauth.denyAuthorization(authorizationId, {
    skipBrowserRedirect: true,
  })

  if (error || !data?.redirect_url) consentErrorRedirect(authorizationId, 'deny')
  redirect(data.redirect_url)
}
