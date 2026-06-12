import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { REDIRECT_COOKIE, sanitizeRedirectPath } from '@/lib/auth/redirect'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  // destination travels in a cookie — query strings on redirect_to are
  // rejected by Supabase's allowlist (see lib/auth/redirect.ts).
  // recovery links land on the set-password page regardless of the cookie.
  const cookieStore = await cookies()
  const cookiePath = decodeURIComponent(cookieStore.get(REDIRECT_COOKIE)?.value ?? '')
  const redirectTo =
    type === 'recovery'
      ? '/settings/password'
      : sanitizeRedirectPath(searchParams.get('redirectTo') ?? cookiePath)

  function done(path: string) {
    const response = NextResponse.redirect(new URL(path, origin))
    response.cookies.delete(REDIRECT_COOKIE)
    return response
  }

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return done(redirectTo)
  }

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) return done(redirectTo)
  }

  return NextResponse.redirect(`${origin}/login?error=link`)
}
