import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email?.endsWith('@gocase.com')) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=domain_not_allowed`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
