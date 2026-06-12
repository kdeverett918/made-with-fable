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

export function authCallbackUrl(origin: string, redirectTo: string | null | undefined) {
  const url = new URL('/auth/callback', origin)
  url.searchParams.set('redirectTo', sanitizeRedirectPath(redirectTo))
  return url.toString()
}

export function authConfirmUrl(origin: string, redirectTo: string | null | undefined) {
  const url = new URL('/auth/confirm', origin)
  url.searchParams.set('redirectTo', sanitizeRedirectPath(redirectTo))
  return url.toString()
}
