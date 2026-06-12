import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const redirectTo = searchParams.get('redirectTo') ?? '/'

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo.startsWith('/') ? redirectTo : '/'}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link`)
}
