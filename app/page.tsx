import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SocialHubApp from '@/components/SocialHubApp'
import type { Post } from '@/lib/types'
import {
  dbToCampaign, dbToCollection, dbToEventDate, dbToFutebolEvent, dbToPost,
} from '@/lib/supabase/mappers'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: mhPosts },
    { data: brandingPosts },
    { data: tiktokPosts },
    { data: twitterPosts },
    { data: canalPosts },
    { data: copaPosts },
    { data: campaigns },
    { data: collections },
    { data: eventDates },
    { data: futebolEvents },
    { data: products },
  ] = await Promise.all([
    supabase.from('mh_posts').select('*').order('date', { ascending: true }),
    supabase.from('branding_posts').select('*').order('date', { ascending: true }),
    supabase.from('tiktok_posts').select('*').order('date', { ascending: true }),
    supabase.from('twitter_posts').select('*').order('date', { ascending: true }),
    supabase.from('canal_posts').select('*').order('date', { ascending: true }),
    supabase.from('copa_posts').select('*').order('date', { ascending: true }),
    supabase.from('campaigns').select('*').order('id', { ascending: true }),
    supabase.from('collections').select('*').order('id', { ascending: true }),
    supabase.from('event_dates').select('*').order('start_date', { ascending: true }),
    supabase.from('futebol_events').select('*').order('date', { ascending: true }),
    supabase.from('products').select('name').order('name', { ascending: true }),
  ])

  const allPosts: Post[] = [
    ...(mhPosts      ?? []).map(r => dbToPost(r as Record<string, unknown>, 'mh')),
    ...(brandingPosts ?? []).map(r => dbToPost(r as Record<string, unknown>, 'branding')),
    ...(tiktokPosts  ?? []).map(r => dbToPost(r as Record<string, unknown>, 'tiktok')),
    ...(twitterPosts ?? []).map(r => dbToPost(r as Record<string, unknown>, 'twitter')),
    ...(canalPosts   ?? []).map(r => dbToPost(r as Record<string, unknown>, 'canal')),
    ...(copaPosts    ?? []).map(r => dbToPost(r as Record<string, unknown>, 'copa')),
  ].sort((a, b) => a.date.localeCompare(b.date))

  const userEmail = user.email ?? ''
  const userName = (user.user_metadata?.full_name as string | undefined)
    ?? (user.user_metadata?.name as string | undefined)
    ?? userEmail

  return (
    <SocialHubApp
      initialPosts={allPosts}
      initialCampaigns={(campaigns ?? []).map(dbToCampaign)}
      initialCollections={(collections ?? []).map(dbToCollection)}
      initialEventDates={(eventDates ?? []).map(dbToEventDate)}
      initialFutebolEvents={(futebolEvents ?? []).map(dbToFutebolEvent)}
      initialProducts={(products ?? []).map(p => (p as { name: string }).name)}
      userEmail={userEmail}
      userName={userName}
    />
  )
}
