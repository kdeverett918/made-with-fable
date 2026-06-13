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

/**
 * The public origin to build server-side auth redirects from.
 *
 * On Render the standalone server binds to 0.0.0.0:10000, so
 * `new URL(request.url).origin` is the *internal* address — redirecting there
 * strands users on an unreachable `https://0.0.0.0:10000` page after OAuth or
 * magic-link sign-in (password sign-in is unaffected because it redirects
 * client-side). Resolve the real external origin instead: trust the proxy's
 * forwarded host when it matches an allowed site host (keeps apex/www cookie
 * consistency), else fall back to the configured NEXT_PUBLIC_SITE_URL, else the
 * request origin (correct in local dev).
 */
export function resolveSiteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL

  const allowedHosts = new Set<string>(['made-with-fable.onrender.com'])
  if (configured) {
    try {
      const host = new URL(configured).host
      allowedHosts.add(host)
      allowedHosts.add(host.startsWith('www.') ? host.slice(4) : `www.${host}`)
    } catch {
      // malformed env — ignored, handled by the fallbacks below
    }
  }

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  if (forwardedHost && allowedHosts.has(forwardedHost)) {
    return `${forwardedProto || 'https'}://${forwardedHost}`
  }

  if (configured) {
    try {
      return new URL(configured).origin
    } catch {
      // fall through to the request origin
    }
  }

  return new URL(request.url).origin
}

export function authCallbackUrl(origin: string) {
  return new URL('/auth/callback', origin).toString()
}

export function authConfirmUrl(origin: string) {
  return new URL('/auth/confirm', origin).toString()
}
