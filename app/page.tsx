import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SocialHubApp from '@/components/SocialHubApp'
import type { Post } from '@/lib/types'
import {
  dbToCampaign, dbToCollection, dbToEventDate, dbToFutebolEvent,
} from '@/lib/supabase/mappers'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: posts },
    { data: campaigns },
    { data: collections },
    { data: eventDates },
    { data: futebolEvents },
  ] = await Promise.all([
    supabase.from('posts').select('*').order('date', { ascending: true }),
    supabase.from('campaigns').select('*').order('id', { ascending: true }),
    supabase.from('collections').select('*').order('id', { ascending: true }),
    supabase.from('event_dates').select('*').order('start_date', { ascending: true }),
    supabase.from('futebol_events').select('*').order('date', { ascending: true }),
  ])

  const userEmail = user.email ?? ''
  const userName = (user.user_metadata?.full_name as string | undefined)
    ?? (user.user_metadata?.name as string | undefined)
    ?? userEmail

  return (
    <SocialHubApp
      initialPosts={(posts ?? []) as Post[]}
      initialCampaigns={(campaigns ?? []).map(dbToCampaign)}
      initialCollections={(collections ?? []).map(dbToCollection)}
      initialEventDates={(eventDates ?? []).map(dbToEventDate)}
      initialFutebolEvents={(futebolEvents ?? []).map(dbToFutebolEvent)}
      userEmail={userEmail}
      userName={userName}
    />
  )
}
