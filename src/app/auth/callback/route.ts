import { NextResponse } from 'next/server'
import { sanitizeRedirectPath } from '@/lib/auth/redirect'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const providerError = searchParams.get('error') ?? searchParams.get('error_code')
  const code = searchParams.get('code')
  const redirectTo = sanitizeRedirectPath(searchParams.get('redirectTo'))

  if (code && !providerError) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(redirectTo, origin))
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
