import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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

  // Upsert do perfil com dados Google — usa service role para contornar RLS no callback
  const meta = user.user_metadata ?? {}
  const name = (meta.full_name as string | undefined)
    ?? (meta.name as string | undefined)
    ?? user.email.split('@')[0]
  const initial    = name.charAt(0).toUpperCase()
  const owner_id   = name.split(' ')[0]   // fallback: primeiro nome
  const avatar_url = (meta.avatar_url as string | undefined) ?? null

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await admin.from('profiles').upsert(
    { id: user.id, email: user.email, name, avatar_url, initial, owner_id },
    { onConflict: 'id', ignoreDuplicates: false }
  )

  return NextResponse.redirect(`${origin}${next}`)
}
