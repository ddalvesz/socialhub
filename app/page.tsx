import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SocialHubApp from '@/components/SocialHubApp'
import type { Post } from '@/lib/types'
import {
  dbToCampaign, dbToCollection, dbToEventDate, dbToFutebolEvent, dbToPost,
  dbToLive, dbToMerchan, dbToStory, dbToDayAggregate, dbToProfile,
} from '@/lib/supabase/mappers'
import { TEAM_PROFILES } from '@/lib/data'

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
    { data: livesData },
    { data: merchansData },
    { data: storiesData },
    { data: dayAggregatesData },
    { data: profilesData },
  ] = await Promise.all([
    supabase.from('mh_posts').select('*').eq('archived', false).order('date', { ascending: true }),
    supabase.from('branding_posts').select('*').eq('archived', false).order('date', { ascending: true }),
    supabase.from('tiktok_posts').select('*').eq('archived', false).order('date', { ascending: true }),
    supabase.from('twitter_posts').select('*').eq('archived', false).order('date', { ascending: true }),
    supabase.from('canal_posts').select('*').eq('archived', false).order('date', { ascending: true }),
    supabase.from('copa_posts').select('*').eq('archived', false).order('date', { ascending: true }),
    supabase.from('campaigns').select('*').eq('archived', false).order('id', { ascending: true }),
    supabase.from('collections').select('*').order('id', { ascending: true }),
    supabase.from('event_dates').select('*').order('start_date', { ascending: true }),
    supabase.from('futebol_events').select('*').order('date', { ascending: true }),
    supabase.from('products').select('name').order('name', { ascending: true }),
    supabase.from('lives').select('*').order('date', { ascending: true }),
    supabase.from('merchans').select('*').order('nome', { ascending: true }),
    supabase.from('stories').select('*').order('date', { ascending: false }),
    supabase.from('stories_day_aggregates').select('*').order('date', { ascending: true }),
    supabase.from('profiles').select('*').order('name', { ascending: true }),
  ])

  const allPosts: Post[] = [
    ...(mhPosts      ?? []).map(r => dbToPost(r as Record<string, unknown>, 'mh')),
    ...(brandingPosts ?? []).map(r => dbToPost(r as Record<string, unknown>, 'branding')),
    ...(tiktokPosts  ?? []).map(r => dbToPost(r as Record<string, unknown>, 'tiktok')),
    ...(twitterPosts ?? []).map(r => dbToPost(r as Record<string, unknown>, 'twitter')),
    ...(canalPosts   ?? []).map(r => dbToPost(r as Record<string, unknown>, 'canal')),
    ...(copaPosts    ?? []).map(r => dbToPost(r as Record<string, unknown>, 'copa')),
  ].sort((a, b) => a.date.localeCompare(b.date))

  // Merge: hardcoded como fallback para membros que ainda não logaram;
  // profiles do DB sobrepõem quando há match por owner_id.
  const dbProfiles = (profilesData ?? []).map(r => dbToProfile(r as Record<string, unknown>))
  const dbOwnerIds = new Set(dbProfiles.map(p => p.id))
  const fallbackProfiles = TEAM_PROFILES.filter(p => !dbOwnerIds.has(p.id))
  const mergedProfiles = [...dbProfiles, ...fallbackProfiles]

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
      initialLives={(livesData ?? []).map(r => dbToLive(r as Record<string, unknown>))}
      initialMerchans={(merchansData ?? []).map(r => dbToMerchan(r as Record<string, unknown>))}
      initialStories={(storiesData ?? []).map(r => dbToStory(r as Record<string, unknown>))}
      initialDayAggregates={(dayAggregatesData ?? []).map(r => dbToDayAggregate(r as Record<string, unknown>))}
      initialProfiles={mergedProfiles}
      userEmail={userEmail}
      userName={userName}
    />
  )
}
