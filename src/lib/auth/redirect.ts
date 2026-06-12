const FALLBACK_REDIRECT = '/'

export function sanitizeRedirectPath(value: string | null | undefined) {
  if (!value) return FALLBACK_REDIRECT

  try {
    const url = new URL(value, 'https://made-with-fable.local')

    if (url.origin !== 'https://made-with-fable.local') return FALLBACK_REDIRECT
    if (!url.pathname.startsWith('/') || url.pathname.startsWith('//')) return FALLBACK_REDIRECT
    if (url.pathname === '/login' || url.pathname.startsWith('/auth/')) return FALLBACK_REDIRECT

    return `${url.pathname}${url.search}${url.hash}` || FALLBACK_REDIRECT
  } catch {
    return FALLBACK_REDIRECT
  }
}

/**
 * Supabase's redirect allowlist globs do not match query strings — a
 * redirect_to with `?redirectTo=` is silently replaced by the Site URL,
 * stranding the auth code on the home page. So the auth redirect URLs stay
 * bare and the post-auth destination travels in this short-lived cookie.
 */
export const REDIRECT_COOKIE = 'mwf-redirect'

/** Client-side: remember where to land after auth completes. */
export function rememberRedirect(redirectTo: string | null | undefined) {
  const path = sanitizeRedirectPath(redirectTo)
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; secure' : ''
  document.cookie = `${REDIRECT_COOKIE}=${encodeURIComponent(path)}; path=/; max-age=600; samesite=lax${secure}`
}

export function authCallbackUrl(origin: string) {
  return new URL('/auth/callback', origin).toString()
}

export function authConfirmUrl(origin: string) {
  return new URL('/auth/confirm', origin).toString()
}
