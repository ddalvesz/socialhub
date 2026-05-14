import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SocialHubApp from '@/components/SocialHubApp'
import type { Post } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .order('date', { ascending: true })

  const userEmail = user.email ?? ''
  const userName = (user.user_metadata?.full_name as string | undefined)
    ?? (user.user_metadata?.name as string | undefined)
    ?? userEmail

  return (
    <SocialHubApp
      initialPosts={(posts ?? []) as Post[]}
      userEmail={userEmail}
      userName={userName}
    />
  )
}
