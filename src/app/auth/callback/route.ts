import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { REDIRECT_COOKIE, resolveSiteOrigin, sanitizeRedirectPath } from '@/lib/auth/redirect'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  // Not `new URL(request.url).origin`: on Render that resolves to the internal
  // 0.0.0.0:10000 bind address and strands users post-login (see resolveSiteOrigin).
  const origin = resolveSiteOrigin(request)
  const providerError = searchParams.get('error') ?? searchParams.get('error_code')
  const code = searchParams.get('code')

  // destination travels in a cookie — query strings on redirect_to are
  // rejected by Supabase's allowlist (see lib/auth/redirect.ts)
  const cookieStore = await cookies()
  const redirectTo = sanitizeRedirectPath(
    searchParams.get('redirectTo') ??
      decodeURIComponent(cookieStore.get(REDIRECT_COOKIE)?.value ?? ''),
  )

  if (code && !providerError) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const response = NextResponse.redirect(new URL(redirectTo, origin))
      response.cookies.delete(REDIRECT_COOKIE)
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
