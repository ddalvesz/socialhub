'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { safeWrite } from '@/lib/supabase/safeWrite'
import {
  Post, Platform, PostSource, AppView, CalendarMode, Campaign, CanalPost, Collection, Linking,
  EventDate, FutebolEvent, Live, Merchan, LiveStatus, SiteLink, Story, StoryStatus, DayAggregate,
  MONTHS, PLATFORMS, TAGS, STATUSES, SOURCES,
  addDaysISO, startOfWeekISO, todayISO, parseISO,
  CONTENT_TYPES_IG, CONTENT_TYPES_OTHER,
  colProgress,
  Brand, BRANDS,
} from '@/lib/types'
import type { TeamProfile } from '@/lib/types'
import {
  campaignToDb, collectionToDb, postToDb, sourceToTable,
  dbToPost, dbToCampaign, dbToCollection, dbToCanalPost,
  dbToLive, dbToMerchan, liveToDb, merchanToDb, dbToStory, storyToDb,
  dbToEventDate, dbToFutebolEvent, futebolEventToDb, dbToDayAggregate,
  dbToSiteLink, siteLinkToDb,
} from '@/lib/supabase/mappers'
import { showToast } from '@/lib/toast'
import BrandSwitcher from './BrandSwitcher'
import { WEEKDAY_NOMES, shortLabel } from '@/lib/livesUtils'
import { Icon, PlatformIcon } from './Icons'
import CalendarGrid from './CalendarGrid'
import WeekView from './WeekView'
import PostModal from './PostModal'
import DuplicateMenu from './DuplicateMenu'
import CampaignsView from './CampaignsView'
import CollectionsView from './CollectionsView'
import StoriesView from './StoriesView'
import ComemorativasView from './ComemorativasView'
import FutebolView from './FutebolView'
import ProfileView from './ProfileView'
import ExportModal from './ExportModal'
import MHView from './MHView'
import ArchivedView from './ArchivedView'
import CanalView from './CanalView'
import LivesView from './LivesView'
import SiteLinksView from './SiteLinksView'
import LiveModal from './LiveModal'
import MerchansModal from './MerchansModal'
import StoryModal from './StoryModal'
import MetricsView from './MetricsView'
import ShareSocialView from './ShareSocialView'
import MetasView from './MetasView'
import ToastHost from './Toast'


interface Props {
  initialPosts: Post[]
  initialCampaigns: Campaign[]
  initialCollections: Collection[]
  initialEventDates: EventDate[]
  initialFutebolEvents: FutebolEvent[]
  initialProducts: string[]
  initialLives: Live[]
  initialMerchans: Merchan[]
  initialStories: Story[]
  initialDayAggregates: DayAggregate[]
  initialProfiles: TeamProfile[]
  userEmail: string
  userName: string
}

function resolveOwnerName(email: string, profiles: TeamProfile[]) {
  const profile = profiles.find(p => p.email === email)
  if (profile) return profile.id
  const name = email.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return name
}

// ─── CalendarListView ─────────────────────────────────────────

function CalendarListView({ posts, year, month, onPostClick, selectedIds, onToggle }: {
  posts: Post[]; year: number; month: number; onPostClick: (p: Post) => void
  selectedIds: Set<string>; onToggle: (id: string) => void
}) {
  const today = todayISO()
  const weekday = (iso: string) => {
    const d = parseISO(iso)
    return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()]
  }

  const monthPosts = posts
    .filter(p => { const d = parseISO(p.date); return d.getFullYear() === year && d.getMonth() === month })
    .sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.time.localeCompare(b.time))

  const grouped: [string, Post[]][] = []
  for (const p of monthPosts) {
    const last = grouped[grouped.length - 1]
    if (last && last[0] === p.date) last[1].push(p)
    else grouped.push([p.date, [p]])
  }

  if (grouped.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--ink-3)' }}>
        Nenhum post neste mês.
      </div>
    )
  }

  return (
    <div className="pautas-view" style={{ paddingTop: 16 }}>
      {grouped.map(([date, dayPosts]) => {
        const isToday = date === today
        const isPast = date < today
        return (
          <div key={date} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', paddingBottom: 2 }}>
            <div style={{
              width: 64, flexShrink: 0, paddingTop: 10, textAlign: 'right',
              fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.3,
              color: isToday ? 'var(--accent)' : isPast ? 'var(--ink-3)' : 'var(--ink-2)',
              fontWeight: isToday ? 700 : 500,
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{date.slice(8)}</div>
              <div style={{ fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{weekday(date)}</div>
              {isToday && <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2, fontWeight: 700 }}>hoje</div>}
            </div>
            <div style={{ flex: 1, borderLeft: `2px solid ${isToday ? 'var(--accent-soft)' : 'var(--border)'}`, paddingLeft: 16, paddingTop: 8, paddingBottom: 8 }}>
              {dayPosts.map(p => {
                const status = STATUSES.find(s => s.id === p.status)
                const platColors: Record<string, { bg: string; fg: string }> = {
                  ig: { bg: 'oklch(0.9 0.05 300)', fg: 'oklch(0.45 0.12 300)' },
                  tiktok: { bg: 'oklch(0.92 0.04 0)', fg: 'oklch(0.4 0.1 0)' },
                  youtube: { bg: 'oklch(0.93 0.06 20)', fg: 'oklch(0.45 0.16 20)' },
                }
                const pc = platColors[p.platform] ?? { bg: 'var(--surface-2)', fg: 'var(--ink-3)' }
                return (
                  <div
                    key={p.id}
                    onClick={() => onPostClick(p)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', marginBottom: 4, borderRadius: 10, background: selectedIds.has(p.id) ? 'var(--accent-softer)' : 'var(--surface)', border: selectedIds.has(p.id) ? '1px solid var(--accent-soft)' : '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => { if (!selectedIds.has(p.id)) e.currentTarget.style.background = 'var(--accent-softer)' }}
                    onMouseLeave={e => { if (!selectedIds.has(p.id)) e.currentTarget.style.background = 'var(--surface)' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onClick={e => e.stopPropagation()}
                      onChange={() => onToggle(p.id)}
                      style={{ width: 15, height: 15, flexShrink: 0, accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-3)', width: 40, flexShrink: 0 }}>{p.time}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', padding: '2px 6px', borderRadius: 5, background: pc.bg, color: pc.fg, flexShrink: 0 }}>
                      {p.platform === 'tiktok' ? 'TT' : p.platform === 'youtube' ? 'YT' : p.platform?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                      {(p.product || p.campaign) && (
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {[p.product, p.campaign].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                    {p.format && <div style={{ fontSize: 11, color: 'var(--ink-3)', flexShrink: 0 }}>{p.format}</div>}
                    {p.owner && <div style={{ fontSize: 11, color: 'var(--ink-3)', flexShrink: 0 }}>{p.owner}</div>}
                    {status && (
                      <span className={`status-pill ${status.className}`} style={{ flexShrink: 0 }}>
                        <span className="sdot" />{status.label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function SocialHubApp({ initialPosts, initialCampaigns, initialCollections, initialEventDates, initialFutebolEvents, initialProducts, initialLives, initialMerchans, initialStories, initialDayAggregates, initialProfiles, userEmail, userName }: Props) {
  const supabase = createClient()
  const meId = resolveOwnerName(userEmail, initialProfiles)
  const ownerName = meId

  const [brand, setBrandState] = useState<Brand>('gocase')
  const [brandLoading, setBrandLoading] = useState(false)

  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [collections, setCollectionsRaw] = useState<Collection[]>(initialCollections)
  const [campaigns, setCampaignsRaw] = useState<Campaign[]>(initialCampaigns)
  const [products, setProducts] = useState<string[]>(initialProducts)
  const [lives, setLives] = useState<Live[]>(initialLives)
  const [merchans, setMerchans] = useState<Merchan[]>(initialMerchans)
  const [stories, setStories] = useState<Story[]>(initialStories)
  const [dayAggregates, setDayAggregates] = useState<DayAggregate[]>(initialDayAggregates)
  const [eventDates, setEventDates] = useState<EventDate[]>(initialEventDates)
  const [futebolEvents, setFutebolEvents] = useState<FutebolEvent[]>(initialFutebolEvents)
  const [canalPosts, setCanalPosts] = useState<CanalPost[]>([])
  const [siteLinks, setSiteLinks] = useState<SiteLink[]>([])
  const knownProducts = useMemo(() => {
    const seen = new Set<string>()
    const result: string[] = []
    for (const s of stories) {
      const p = s.produto?.trim()
      if (p && !seen.has(p)) { seen.add(p); result.push(p) }
    }
    return result.sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [stories])
  const knownCategorias = useMemo(() => {
    const seen = new Set<string>()
    const result: string[] = []
    for (const s of stories) {
      const c = s.categoria?.trim()
      if (c && !seen.has(c)) { seen.add(c); result.push(c) }
    }
    return result.sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [stories])
  const fetchForBrand = useCallback(async (b: Brand) => {
    setBrandLoading(true)
    try {
      const [
        { data: mhData }, { data: brandingData }, { data: tiktokData },
        { data: twitterData }, { data: canalData }, { data: copaData },
        { data: campaignsData }, { data: collectionsData },
        { data: eventDatesData }, { data: futebolData },
        { data: productsData }, { data: livesData }, { data: merchansData },
        { data: storiesData, error: storiesError }, { data: dayAggData },
        { data: siteLinksData },
      ] = await Promise.all([
        supabase.from('mh_posts').select('*').eq('brand', b).eq('archived', false).order('date', { ascending: true }),
        supabase.from('branding_posts').select('*').eq('brand', b).eq('archived', false).order('date', { ascending: true }),
        supabase.from('tiktok_posts').select('*').eq('brand', b).eq('archived', false).order('date', { ascending: true }),
        supabase.from('twitter_posts').select('*').eq('brand', b).eq('archived', false).order('date', { ascending: true }),
        supabase.from('canal_posts').select('*').eq('brand', b).eq('archived', false).order('date', { ascending: true }),
        supabase.from('copa_posts').select('*').eq('brand', b).eq('archived', false).order('date', { ascending: true }),
        supabase.from('campaigns').select('*').eq('brand', b).eq('archived', false).order('id', { ascending: true }),
        supabase.from('collections').select('*').eq('brand', b).order('id', { ascending: true }),
        supabase.from('event_dates').select('*').eq('brand', b).order('start_date', { ascending: true }),
        supabase.from('futebol_events').select('*').eq('brand', b).order('date', { ascending: true }),
        supabase.from('products').select('name').eq('brand', b).order('name', { ascending: true }),
        supabase.from('lives').select('*').eq('brand', b).order('date', { ascending: true }),
        supabase.from('merchans').select('*').eq('brand', b).order('nome', { ascending: true }),
        supabase.from('stories').select('*').eq('brand', b).order('date', { ascending: false }),
        supabase.from('stories_day_aggregates_live').select('*').eq('brand', b).order('date', { ascending: true }),
        supabase.from('site_links').select('*').eq('brand', b).order('categoria', { ascending: true }),
      ])
      const allPosts: Post[] = [
        ...(mhData      ?? []).map(r => dbToPost(r as Record<string, unknown>, 'mh')),
        ...(brandingData ?? []).map(r => dbToPost(r as Record<string, unknown>, 'branding')),
        ...(tiktokData  ?? []).map(r => dbToPost(r as Record<string, unknown>, 'tiktok')),
        ...(twitterData ?? []).map(r => dbToPost(r as Record<string, unknown>, 'twitter')),
        ...(canalData   ?? []).map(r => dbToPost(r as Record<string, unknown>, 'canal')),
        ...(copaData    ?? []).map(r => dbToPost(r as Record<string, unknown>, 'copa')),
      ].sort((a, z) => a.date.localeCompare(z.date))
      setPosts(allPosts)
      setCampaignsRaw((campaignsData ?? []).map(dbToCampaign))
      setCollectionsRaw((collectionsData ?? []).map(dbToCollection))
      setEventDates((eventDatesData ?? []).map(r => dbToEventDate(r as Record<string, unknown>)))
      setFutebolEvents((futebolData ?? []).map(r => dbToFutebolEvent(r as Record<string, unknown>)))
      setProducts((productsData ?? []).map(p => (p as { name: string }).name))
      setLives((livesData ?? []).map(r => dbToLive(r as Record<string, unknown>)))
      setMerchans((merchansData ?? []).map(r => dbToMerchan(r as Record<string, unknown>)))

      setStories((storiesData ?? []).map(r => dbToStory(r as Record<string, unknown>)))
      setDayAggregates((dayAggData ?? []).map(r => dbToDayAggregate(r as Record<string, unknown>)))
      setCanalPosts((canalData ?? []).map(r => dbToCanalPost(r as Record<string, unknown>)))
      setSiteLinks((siteLinksData ?? []).map(r => dbToSiteLink(r as Record<string, unknown>)))
    } finally {
      setBrandLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    const stored = localStorage.getItem('activeBrand') as Brand | null
    if (stored && stored !== 'gocase') {
      setBrandState(stored)
      applyBrandTheme(stored)
      fetchForBrand(stored)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyBrandTheme = useCallback((b: Brand) => {
    const { theme } = BRANDS.find(x => x.slug === b)!
    const root = document.documentElement
    root.style.setProperty('--accent',                  theme.accent)
    root.style.setProperty('--accent-deep',             theme.accentDeep)
    root.style.setProperty('--accent-soft',             theme.accentSoft)
    root.style.setProperty('--accent-softer',           theme.accentSofter)
    root.style.setProperty('--accent-gradient',         theme.accentGradient)
    root.style.setProperty('--accent-gradient-soft',    theme.accentGradientSoft)
    root.style.setProperty('--accent-gradient-softer',  theme.accentGradientSofter)
  }, [])

  const BRAND_VIEWS: Record<Brand, AppView[]> = {
    gocase:   ['calendar','branding','mh','comemorativas','futebol','campaigns','collections','archived','lives','stories','site_links','metrics','metas','profile'],
    barbours: ['calendar','canal','comemorativas','campaigns','archived','lives','stories','site_links','metas','profile'],
    kokeshi:  ['calendar','campaigns','lives','stories','site_links','metas','profile'],
    lescent:  ['calendar','campaigns','lives','stories','site_links','metas','profile'],
  }
  // A qual aba/AppView cada calendário (PostSource) pertence — usado para
  // só oferecer, no seletor do post, os calendários que existem para a marca ativa.
  const SOURCE_VIEW: Partial<Record<PostSource, AppView>> = {
    branding: 'branding',
    mh:       'mh',
    copa:     'futebol',
    canal:    'canal',
  }
  const sourceOptions = SOURCES.filter(s => {
    const v = SOURCE_VIEW[s.id]
    return v ? BRAND_VIEWS[brand].includes(v) : false
  })
  const handleBrandChange = (b: Brand) => {
    setBrandState(b)
    localStorage.setItem('activeBrand', b)
    applyBrandTheme(b)
    fetchForBrand(b)
    setView(v => BRAND_VIEWS[b].includes(v) ? v : 'calendar')
  }

  const [activeLive, setActiveLive] = useState<Live | null>(null)
  const [activeStory, setActiveStory] = useState<Story | null>(null)
  const [merchansOpen, setMerchansOpen] = useState(false)
  const [generatingProposta, setGeneratingProposta] = useState(false)
  const [view, setView] = useState<AppView>('calendar')

  const today = todayISO()
  const todayDate = parseISO(today)
  const storiesCount = (() => {
    const d = new Date(today); d.setDate(d.getDate() - 30)
    const cutoff = d.toISOString().slice(0, 10)
    return stories.filter(s => (s.status === 'postado' || s.status === 'feito') && s.date >= cutoff).length
  })()

  const [year, setYear] = useState(todayDate.getFullYear())
  const [month, setMonth] = useState(todayDate.getMonth())
  const [calMode, setCalMode] = useState<CalendarMode>('month')
  const [weekStart, setWeekStart] = useState(() => startOfWeekISO(today))

  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<'all' | 'mh' | 'branding' | 'futebol' | 'campanha'>('all')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [statusDropOpen, setStatusDropOpen] = useState(false)
  const [search, setSearch] = useState('')

  const [activePost, setActivePost] = useState<Post | null>(null)
  const [duplicateFor, setDuplicateFor] = useState<Post | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const toggleSelected = (id: string) =>
    setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  const [profileId, setProfileId] = useState(meId)
  const [profileOverrides, setProfileOverrides] = useState<Partial<TeamProfile>>({})
  // profiles com isMe marcado e avatarUrl do Google
  const profiles = useMemo(() =>
    initialProfiles.map(p => p.id === meId ? { ...p, isMe: true, ...profileOverrides } : { ...p, isMe: false }),
  [initialProfiles, meId, profileOverrides])

  const handleProfileUpdate = useCallback((updated: Partial<TeamProfile>) => {
    setProfileOverrides(prev => ({ ...prev, ...updated }))
  }, [])

  // ─── Realtime subscriptions ──────────────────────────────────
  useEffect(() => {
    const POST_TABLES: { table: string; source: PostSource }[] = [
      { table: 'mh_posts',       source: 'mh'       },
      { table: 'branding_posts', source: 'branding' },
      { table: 'tiktok_posts',   source: 'tiktok'   },
      { table: 'twitter_posts',  source: 'twitter'  },
      { table: 'canal_posts',    source: 'canal'    },
      { table: 'copa_posts',     source: 'copa'     },
    ]

    let ch = supabase.channel('rt-socialhub')

    for (const { table, source } of POST_TABLES) {
      ch = ch
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table }, ({ new: row }) => {
          const p = dbToPost(row as Record<string, unknown>, source)
          if (p.archived) return
          setPosts(arr => arr.some(x => x.id === p.id) ? arr : [...arr, p].sort((a, b) => a.date.localeCompare(b.date)))
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table }, ({ new: row }) => {
          const p = dbToPost(row as Record<string, unknown>, source)
          if (p.archived) setPosts(arr => arr.filter(x => x.id !== p.id))
          else setPosts(arr => arr.map(x => x.id === p.id ? p : x))
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table }, ({ old: row }) => {
          const id = String((row as Record<string, unknown>).id)
          setPosts(arr => arr.filter(x => x.id !== id))
        })
    }

    ch = ch
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'campaigns' }, ({ new: row }) => {
        const c = dbToCampaign(row as Record<string, unknown>)
        if (c.archived) return
        setCampaignsRaw(arr => arr.some(x => x.id === c.id) ? arr : [...arr, c])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'campaigns' }, ({ new: row }) => {
        const c = dbToCampaign(row as Record<string, unknown>)
        if (c.archived) setCampaignsRaw(arr => arr.filter(x => x.id !== c.id))
        else setCampaignsRaw(arr => arr.map(x => x.id === c.id ? c : x))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'campaigns' }, ({ old: row }) => {
        setCampaignsRaw(arr => arr.filter(x => x.id !== (row as Record<string, unknown>).id))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'collections' }, ({ new: row }) => {
        const c = dbToCollection(row as Record<string, unknown>)
        setCollectionsRaw(arr => arr.some(x => x.id === c.id) ? arr : [...arr, c])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'collections' }, ({ new: row }) => {
        const c = dbToCollection(row as Record<string, unknown>)
        setCollectionsRaw(arr => arr.map(x => x.id === c.id ? c : x))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'collections' }, ({ old: row }) => {
        setCollectionsRaw(arr => arr.filter(x => x.id !== (row as Record<string, unknown>).id))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lives' }, ({ new: row }) => {
        const l = dbToLive(row as Record<string, unknown>)
        setLives(arr => arr.some(x => x.id === l.id) ? arr : [...arr, l].sort((a, b) => a.date.localeCompare(b.date)))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lives' }, ({ new: row }) => {
        const l = dbToLive(row as Record<string, unknown>)
        setLives(arr => arr.map(x => x.id === l.id ? l : x))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'lives' }, ({ old: row }) => {
        setLives(arr => arr.filter(x => x.id !== String((row as Record<string, unknown>).id)))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'merchans' }, ({ new: row }) => {
        const m = dbToMerchan(row as Record<string, unknown>)
        setMerchans(arr => arr.some(x => x.id === m.id) ? arr : [...arr, m])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'merchans' }, ({ new: row }) => {
        const m = dbToMerchan(row as Record<string, unknown>)
        setMerchans(arr => arr.map(x => x.id === m.id ? m : x))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'merchans' }, ({ old: row }) => {
        setMerchans(arr => arr.filter(x => x.id !== String((row as Record<string, unknown>).id)))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories' }, ({ new: row }) => {
        const s = dbToStory(row as Record<string, unknown>)
        setStories(arr => arr.some(x => x.id === s.id) ? arr : [s, ...arr])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stories' }, ({ new: row }) => {
        const s = dbToStory(row as Record<string, unknown>)
        setStories(arr => arr.map(x => x.id === s.id ? s : x))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'stories' }, ({ old: row }) => {
        setStories(arr => arr.filter(x => x.id !== String((row as Record<string, unknown>).id)))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'site_links' }, ({ new: row }) => {
        const sl = dbToSiteLink(row as Record<string, unknown>)
        setSiteLinks(arr => arr.some(x => x.id === sl.id) ? arr : [...arr, sl])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_links' }, ({ new: row }) => {
        const sl = dbToSiteLink(row as Record<string, unknown>)
        setSiteLinks(arr => arr.map(x => x.id === sl.id ? sl : x))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'site_links' }, ({ old: row }) => {
        setSiteLinks(arr => arr.filter(x => x.id !== String((row as Record<string, unknown>).id)))
      })

    ch.subscribe()
    return () => { supabase.removeChannel(ch) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Persistent state setters ────────────────────────────────
  const setCollections = useCallback((fn: (arr: Collection[]) => Collection[]) => {
    setCollectionsRaw(prev => {
      const next = fn(prev)
      const prevMap = new Map(prev.map(c => [c.id, c]))
      const changed = next.filter(col => {
        const old = prevMap.get(col.id)
        return !old || JSON.stringify(old) !== JSON.stringify(col)
      })
      if (changed.length > 0) {
        setTimeout(() => {
          changed.forEach(col => {
            const old = prevMap.get(col.id)
            safeWrite(
              supabase.from('collections').update(collectionToDb(col)).eq('id', col.id),
              'Falha ao salvar a coleção. A alteração foi desfeita.',
            ).then(ok => {
              if (!ok && old) setCollectionsRaw(arr => arr.map(c => c.id === col.id ? old : c))
            })
          })
        }, 0)
      }
      return next
    })
  }, [supabase])

  const setCampaigns = useCallback((fn: (arr: Campaign[]) => Campaign[]) => {
    setCampaignsRaw(prev => {
      const next = fn(prev)
      const prevMap = new Map(prev.map(c => [c.id, c]))
      const changed = next.filter(camp => {
        const old = prevMap.get(camp.id)
        return !old || JSON.stringify(old) !== JSON.stringify(camp)
      })
      if (changed.length > 0) {
        setTimeout(() => {
          changed.forEach(camp => {
            const old = prevMap.get(camp.id)
            safeWrite(
              supabase.from('campaigns').update(campaignToDb(camp)).eq('id', camp.id),
              'Falha ao salvar a campanha. A alteração foi desfeita.',
            ).then(ok => {
              if (!ok && old) setCampaignsRaw(arr => arr.map(c => c.id === camp.id ? old : c))
            })
          })
        }, 0)
      }
      return next
    })
  }, [supabase])

  // ─── Filtering ────────────────────────────────────────────────
  const calendarPosts = posts.filter(p => p.source !== 'mh' || p.status !== 'pauta')
  let shownPosts: typeof posts
  if (view === 'branding')      shownPosts = posts.filter(p => p.source === 'branding')
  else if (view === 'mh')       shownPosts = posts.filter(p => p.source === 'mh')
  else if (tagFilter === 'mh')       shownPosts = posts.filter(p => p.source === 'mh' && p.status !== 'pauta')
  else if (tagFilter === 'branding') shownPosts = posts.filter(p => p.source === 'branding')
  else if (tagFilter === 'futebol')  shownPosts = posts.filter(p => p.tags?.includes('FUTEBOL'))
  else if (tagFilter === 'campanha') shownPosts = posts.filter(p => !!p.campaign?.trim())
  else shownPosts = calendarPosts
  if (platformFilter !== 'all') shownPosts = shownPosts.filter(p => p.platform === platformFilter)
  if (statusFilter.length > 0) shownPosts = shownPosts.filter(p => statusFilter.includes(p.status))
  if (search.trim()) {
    const q = search.toLowerCase()
    shownPosts = shownPosts.filter(p =>
      p.title.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q)
    )
  }

  const monthPosts = calendarPosts.filter(p => {
    const d = parseISO(p.date)
    return d.getFullYear() === year && d.getMonth() === month
  })

  // ─── Navigation ───────────────────────────────────────────────
  const goPrev = () => {
    if (calMode === 'week') { setWeekStart(w => addDaysISO(w, -7)); return }
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  const goNext = () => {
    if (calMode === 'week') { setWeekStart(w => addDaysISO(w, 7)); return }
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
  }
  const goTodayMain = () => { setYear(todayDate.getFullYear()); setMonth(todayDate.getMonth()); setWeekStart(startOfWeekISO(today)) }
  const goToday = () => {
    const t = parseISO(today)
    setYear(t.getFullYear()); setMonth(t.getMonth())
    setWeekStart(startOfWeekISO(today))
  }

  const weekLabel = (() => {
    if (calMode !== 'week') return null
    const s = parseISO(weekStart)
    const e = parseISO(addDaysISO(weekStart, 6))
    if (s.getMonth() === e.getMonth())
      return `${s.getDate()} – ${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`
    return `${s.getDate()} ${MONTHS[s.getMonth()].slice(0,3)} – ${e.getDate()} ${MONTHS[e.getMonth()].slice(0,3)} ${e.getFullYear()}`
  })()

  // ─── CRUD ─────────────────────────────────────────────────────
  const savePost = async (p: Post) => {
    const prev = posts
    const original = posts.find(x => x.id === p.id)

    // Post mudou de calendário (ex: Branding → Máquina de Hits): cada calendário
    // é uma tabela física própria, então "salvar" aqui significa mover a linha.
    if (original && original.source !== p.source) {
      setPosts(arr => arr.filter(x => x.id !== p.id))
      const { id, source, ...rest } = p
      const { data, error } = await supabase.from(sourceToTable(source)).insert({ ...postToDb(rest, source), brand }).select().single()
      if (error || !data) {
        console.error(error)
        showToast('Falha ao mover o post para o novo calendário.')
        setPosts(prev)
        return
      }
      await safeWrite(
        supabase.from(sourceToTable(original.source)).delete().eq('id', id),
        'Post movido, mas houve falha ao remover a cópia do calendário anterior.',
      )
      const moved = { ...p, id: String(data.id) } as Post
      setPosts(arr => [...arr, moved])
      setActivePost(moved)
      return
    }

    setPosts(arr => arr.map(x => x.id === p.id ? p : x))
    const { id, source, ...rest } = p
    const ok = await safeWrite(
      supabase.from(sourceToTable(source)).update(postToDb(rest, source)).eq('id', id),
      'Falha ao salvar o post. As alterações foram desfeitas.',
    )
    if (!ok) setPosts(prev)
  }

  const movePost = async (postId: string, date: string, time?: string) => {
    const post = posts.find(p => p.id === postId)
    if (!post) return
    const prev = posts
    const updated = { ...post, date, ...(time !== undefined ? { time } : {}) }
    setPosts(arr => arr.map(p => p.id === postId ? updated : p))
    const { id, source, ...rest } = updated
    const ok = await safeWrite(
      supabase.from(sourceToTable(source)).update(postToDb(rest, source)).eq('id', id),
      'Falha ao mover o post. A alteração foi desfeita.',
    )
    if (!ok) setPosts(prev)
  }

  const deletePost = async (p: Post) => {
    const prev = posts
    setPosts(arr => arr.filter(x => x.id !== p.id))
    const ok = await safeWrite(
      supabase.from(sourceToTable(p.source)).delete().eq('id', p.id),
      'Falha ao excluir o post. Ele foi restaurado.',
    )
    if (!ok) setPosts(prev)
  }

  const archivePost = async (p: Post) => {
    const prev = posts
    setPosts(arr => arr.filter(x => x.id !== p.id))
    const ok = await safeWrite(
      supabase.from(sourceToTable(p.source)).update({ archived: true }).eq('id', p.id),
      'Falha ao arquivar o post. Ele foi restaurado.',
    )
    if (!ok) setPosts(prev)
  }

  const createPost = async (defaults: Partial<Post> & { source?: PostSource }) => {
    const source: PostSource = defaults.source ?? (
      view === 'branding' ? 'branding' :
      view === 'mh' ? 'mh' :
      tagFilter === 'mh' ? 'mh' :
      tagFilter === 'branding' ? 'branding' :
      tagFilter === 'futebol' ? 'copa' :
      'branding'
    )
    const platform = defaults.platform ?? (source === 'tiktok' ? 'tiktok' : source === 'twitter' ? 'twitter' : source === 'canal' ? 'canal' : 'ig')
    const newPost = {
      title:    '',
      owner:    ownerName,
      platform,
      date:     defaults.date ?? today,
      time:     '12:00',
      status:   'prod' as const,
      format:   platform === 'ig' ? 'Reels' : 'Vídeo',
      tags:     [] as string[],
      campaign: '',
      product:  '',
      ref:      '',
      link:     '',
      obs:      '',
      deadline: '',
      caption:  '',
      videoLink:'',
      coverLink:'',
      slideLinks:[],
      ...defaults,
    }
    const { data } = await supabase.from(sourceToTable(source)).insert({ ...postToDb(newPost, source), brand }).select().single()
    if (data) {
      const created = { ...newPost, id: String(data.id), source } as Post
      setPosts(arr => [...arr, created])
      setActivePost(created)
    }
  }

  const duplicateToPlatform = async (newPlatform: string) => {
    if (!duplicateFor) return
    // Determina a tabela alvo com base na plataforma
    const targetSource: PostSource = newPlatform === 'tiktok' ? 'tiktok'
      : newPlatform === 'twitter' ? 'twitter'
      : duplicateFor.source
    const newPost = {
      ...duplicateFor,
      platform:          newPlatform as Platform,
      status:            'prod' as const,
      linkedPostId:      duplicateFor.id,
      linkedPostSource:  duplicateFor.source,
    }
    if (newPlatform === 'ig'     && !CONTENT_TYPES_IG.includes(newPost.format))    newPost.format = 'Reels'
    if (newPlatform !== 'ig'     && !CONTENT_TYPES_OTHER.includes(newPost.format)) newPost.format = 'Vídeo'
    const { id, source, ...rest } = newPost
    const { data } = await supabase.from(sourceToTable(targetSource)).insert({ ...postToDb(rest, targetSource), brand }).select().single()
    if (data) {
      const created = { ...newPost, id: String(data.id), source: targetSource } as Post
      // Vincula o post original ao novo
      await supabase.from(sourceToTable(duplicateFor.source))
        .update({ linked_post_id: data.id, linked_post_source: targetSource })
        .eq('id', duplicateFor.id)
      setPosts(arr => arr.map(p => p.id === duplicateFor.id
        ? { ...p, linkedPostId: String(data.id), linkedPostSource: targetSource }
        : p
      ))
      setPosts(arr => [...arr, created])
      setDuplicateFor(null)
      setActivePost(created)
    }
  }

  // ─── Lives handlers ───────────────────────────────────────────

  const saveLive = async (l: Live) => {
    if (l.id === '__new__') {
      const { id: _id, ...rest } = l
      const { data } = await supabase.from('lives').insert({ ...liveToDb(rest), brand }).select().single()
      if (data) {
        const created = dbToLive(data as Record<string, unknown>)
        setLives(arr => [...arr, created].sort((a, b) => a.date.localeCompare(b.date)))
      }
    } else {
      setLives(arr => arr.map(x => x.id === l.id ? l : x))
      const { id, ...rest } = l
      await supabase.from('lives').update(liveToDb(rest)).eq('id', id)
    }
  }

  const createLive = (defaults: Partial<Live> = {}) => {
    const date = defaults.date ?? today
    const dayIndex = new Date(date + 'T00:00:00').getDay()
    const diaSemana = WEEKDAY_NOMES[dayIndex]
    const draft: Live = {
      id: '__new__',
      date,
      hora: '',
      diaSemana,
      cupomLigado: true,
      criativo: '',
      merchan1: '',
      nominal1: '',
      receita1: 0,
      merchan2: '',
      nominal2: '',
      receita2: 0,
      cupomExtra: '',
      receitaExtra: 0,
      receitaTotal: 0,
      receitaUtm: 0,
      ordersCupom: null,
      ordersUtm: null,
      ordersTotal: null,
      alcance: 0,
      produto: '',
      linkUtm: '',
      utmCampaign: '',
      status: 'confirmada' as LiveStatus,
      origem: 'manual',
      notes: '',
      ...defaults,
    }
    setActiveLive(draft)
  }

  const quickCreateLive = async (partial: { date: string; hora: string; merchan1: string; nominal1: string; status: LiveStatus }) => {
    const dayIndex = new Date(partial.date + 'T00:00:00').getDay()
    const diaSemana = WEEKDAY_NOMES[dayIndex]
    await saveLive({
      id: '__new__',
      date: partial.date,
      hora: partial.hora,
      diaSemana,
      cupomLigado: true,
      criativo: '',
      merchan1: partial.merchan1,
      nominal1: partial.nominal1,
      receita1: 0,
      merchan2: '',
      nominal2: '',
      receita2: 0,
      cupomExtra: '',
      receitaExtra: 0,
      receitaTotal: 0,
      receitaUtm: 0,
      ordersCupom: null,
      ordersUtm: null,
      ordersTotal: null,
      alcance: 0,
      produto: '',
      linkUtm: '',
      utmCampaign: '',
      status: partial.status,
      origem: 'manual',
      notes: '',
    })
  }

  const deleteLive = async (l: Live) => {
    setLives(arr => arr.filter(x => x.id !== l.id))
    await supabase.from('lives').delete().eq('id', l.id)
  }

  const approveLive = (l: Live) => saveLive({ ...l, status: 'confirmada' })

  // ─── FutebolEvents handlers ────────────────────────────────────

  const saveFutebolEvent = async (e: FutebolEvent): Promise<FutebolEvent> => {
    if (e.id === 0) {
      const { data } = await supabase.from('futebol_events').insert({ ...futebolEventToDb(e), brand }).select().single()
      const created = dbToFutebolEvent(data as Record<string, unknown>)
      setFutebolEvents(arr => [...arr, created].sort((a, b) => a.date.localeCompare(b.date)))
      return created
    } else {
      const { id, ...rest } = e
      await supabase.from('futebol_events').update(futebolEventToDb({ ...rest, id })).eq('id', id)
      setFutebolEvents(arr => arr.map(x => x.id === id ? e : x))
      return e
    }
  }

  const deleteFutebolEvent = async (id: number) => {
    setFutebolEvents(arr => arr.filter(x => x.id !== id))
    await supabase.from('futebol_events').delete().eq('id', id)
  }

  // ─── SiteLinks handlers ────────────────────────────────────────

  const addSiteLink = async (sl: Omit<SiteLink, 'id'>): Promise<SiteLink> => {
    const { data, error } = await supabase.from('site_links').insert(siteLinkToDb(sl)).select().single()
    if (error || !data) throw new Error(error?.message ?? 'Erro ao salvar')
    const created = dbToSiteLink(data as Record<string, unknown>)
    setSiteLinks(arr => [...arr, created])
    return created
  }

  const updateSiteLink = async (sl: SiteLink): Promise<void> => {
    setSiteLinks(arr => arr.map(x => x.id === sl.id ? sl : x))
    await supabase.from('site_links').update(siteLinkToDb(sl)).eq('id', sl.id)
  }

  const deleteSiteLink = async (id: string): Promise<void> => {
    setSiteLinks(arr => arr.filter(x => x.id !== id))
    await supabase.from('site_links').delete().eq('id', id)
  }

  // ─── Stories handlers ──────────────────────────────────────────

  const saveStory = async (s: Story) => {
    const { id, produtoSlug, ...rest } = s
    if (id === '__new__') {
      const d = new Date(s.date + 'T00:00:00')
      const WDAYS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
      const payload = { ...storyToDb(rest), brand, dia_semana: WDAYS[d.getDay()] }
      const { data, error } = await supabase.from('stories').insert(payload).select().single()
      if (error || !data) return
      const created = dbToStory(data as Record<string, unknown>)
      setStories(arr => [created, ...arr])
    } else {
      setStories(arr => arr.map(x => x.id === s.id ? s : x))
      await supabase.from('stories').update(storyToDb(rest)).eq('id', id)
    }
  }

  const createStory = () => {
    setActiveStory({
      id: '__new__', date: today, hora: 18, diaSemana: '', utm: '',
      produto: '', produtoSlug: '', categoria: '', status: 'nao_iniciado',
      linkMidia: null, linkUtm: null, rastreioReceita: null, receita: null,
      orders: null, notes: null, origem: 'manual',
    })
  }

  const quickCreateStory = async (partial: { date: string; hora: number; produto: string; categoria: string; status: StoryStatus }) => {
    await saveStory({
      id: '__new__', date: partial.date, hora: partial.hora, diaSemana: '', utm: '',
      produto: partial.produto, produtoSlug: '', categoria: partial.categoria, status: partial.status,
      linkMidia: null, linkUtm: null, rastreioReceita: null, receita: null,
      orders: null, notes: null, origem: 'manual',
    })
  }

  const deleteStory = async (s: Story) => {
    setStories(arr => arr.filter(x => x.id !== s.id))
    await supabase.from('stories').delete().eq('id', s.id)
  }

  const approveAllPropostas = async () => {
    const propostas = lives.filter(l => l.status === 'proposta')
    setLives(arr => arr.map(l => l.status === 'proposta' ? { ...l, status: 'confirmada' as LiveStatus } : l))
    await Promise.all(
      propostas.map(l => supabase.from('lives').update({ status: 'confirmada' }).eq('id', l.id))
    )
  }

  const discardProposta = (l: Live) => deleteLive(l)

  const generateProposta = async () => {
    setGeneratingProposta(true)
    try {
      const r = await fetch('/api/lives/gerar-proposta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand }),
      })
      const json = await r.json()
      if (!r.ok) {
        alert(json.error ?? 'Erro ao gerar proposta')
        return
      }
      const novas: Live[] = json.lives ?? []
      setLives(prev => {
        const map = new Map(prev.map(l => [l.id, l]))
        for (const n of novas) map.set(n.id, n)
        return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
      })
      const puladas: { date: string; status: string }[] = json.puladas ?? []
      if (puladas.length > 0) {
        alert(`${puladas.length} dia(s) não foram alterados (já confirmados ou realizados).`)
      }
    } finally {
      setGeneratingProposta(false)
    }
  }

  const onAddMerchan = async (nome: string): Promise<Merchan> => {
    const existing = merchans.find(m => m.nome === nome)
    if (existing) return existing
    const { data } = await supabase
      .from('merchans')
      .insert({ nome, ativo: true, forte: false, sempre_sozinho: false, brand })
      .select()
      .single()
    const created = dbToMerchan(data as Record<string, unknown>)
    setMerchans(prev => [...prev, created])
    return created
  }

  const saveMerchan = async (m: Merchan, patch: Partial<Pick<Merchan, 'ativo' | 'forte' | 'sempreSozinho'>>) => {
    const updated = { ...m, ...patch }
    setMerchans(arr => arr.map(x => x.id === m.id ? updated : x))
    await supabase.from('merchans').update(merchanToDb(updated)).eq('id', m.id)
  }

  const renameMerchan = async (m: Merchan, novoNome: string) => {
    const updated = dbToMerchan({ ...merchanToDb(m), id: m.id, nome: novoNome })
    setMerchans(arr => arr.map(x => x.id === m.id ? updated : x))
    setLives(arr => arr.map(l => ({
      ...l,
      merchan1: l.merchan1 === m.nome ? novoNome : l.merchan1,
      merchan2: l.merchan2 === m.nome ? novoNome : l.merchan2,
    })))
    await supabase.from('merchans').update({ nome: novoNome }).eq('id', m.id)
    await supabase.from('lives').update({ merchan1: novoNome }).eq('merchan1', m.nome)
    await supabase.from('lives').update({ merchan2: novoNome }).eq('merchan2', m.nome)
  }

  const renameShortMerchan = async (m: Merchan, novoShort: string) => {
    const updated = { ...m, short: novoShort || shortLabel(m.nome) }
    setMerchans(arr => arr.map(x => x.id === m.id ? updated : x))
    await supabase.from('merchans').update({ short: novoShort || null }).eq('id', m.id)
  }

  const deleteMerchan = async (m: Merchan) => {
    const inUse = lives.some(l => l.merchan1 === m.nome || l.merchan2 === m.nome)
    if (inUse) return
    setMerchans(arr => arr.filter(x => x.id !== m.id))
    await supabase.from('merchans').delete().eq('id', m.id)
  }

  // ─── Linking handlers ─────────────────────────────────────────
  const linkColCamp = (collectionId: number, campaignId: number) => {
    setCollections(arr => arr.map(c => {
      if (c.id === collectionId) return { ...c, campaignId }
      if (c.campaignId === campaignId) return { ...c, campaignId: null }
      return c
    }))
    setCampaigns(arr => arr.map(c => {
      if (c.id === campaignId) return { ...c, colecaoId: collectionId }
      if (c.colecaoId === collectionId) return { ...c, colecaoId: null }
      return c
    }))
  }

  const unlinkColCamp = (collectionId: number, campaignId: number) => {
    setCollections(arr => arr.map(c => c.id === collectionId ? { ...c, campaignId: null } : c))
    setCampaigns(arr => arr.map(c => c.id === campaignId ? { ...c, colecaoId: null } : c))
  }

  const createCampaignFromCollection = async (collection: Collection): Promise<Campaign> => {
    const slug = collection.nome.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').slice(0, 40)
    const payload = {
      slug, nome: collection.nome,
      pack: collection.marketing.pack, dono: collection.marketing.dono,
      tipo: 'Coleção', mes: collection.mes || '',
      data_insta: collection.dataMarketing || todayISO(),
      data_site: collection.dataSite || '-',
      data_comercial: '-', data_final: '',
      previsao: collection.dataSite || todayISO(),
      launched: collection.launched, progresso: 0,
      colecao_id: collection.id,
      brand,
    }
    const { data } = await supabase.from('campaigns').insert(payload).select().single()
    if (!data) throw new Error('Falha ao criar campanha')
    const newCamp: Campaign = {
      id: data.id, slug: data.slug, nome: data.nome,
      pack: data.pack, dono: data.dono, tipo: data.tipo, mes: data.mes,
      dataInsta: data.data_insta, dataSite: data.data_site,
      dataComercial: data.data_comercial, dataFinal: data.data_final,
      previsao: data.previsao, launched: data.launched, progresso: data.progresso,
      colecaoId: data.colecao_id ?? null,
    }
    setCampaignsRaw(arr => [...arr, newCamp])
    setCollectionsRaw(arr => arr.map(c => c.id === collection.id ? { ...c, campaignId: newCamp.id } : c))
    supabase.from('collections').update({ campaign_id: newCamp.id }).eq('id', collection.id).then(() => {})
    return newCamp
  }

  const createCollectionFromCampaign = async (campaign: Campaign): Promise<Collection> => {
    const payload = {
      nome: campaign.nome, tipo: 'autoral',
      mes: campaign.mes || '',
      data_site: campaign.dataSite && campaign.dataSite !== '-' ? campaign.dataSite : campaign.previsao || todayISO(),
      data_marketing: campaign.dataInsta || todayISO(),
      confirmado: 'ok', launched: campaign.launched,
      campaign_id: campaign.id,
      ilustra: { status: 'naoIniciada', criacao: false, adaptacao: false, aprovEnabled: false, aprov: false, cadastro: false },
      marketing: { status: 'naoIniciada', pack: campaign.pack, dono: campaign.dono,
        banner: false,
        pedidoEnabled: false, pedido: false, loadingEnabled: false, loading: false,
        postEnabled: false, post: false, carrosselEnabled: false, carrossel: false,
        reelsEnabled: false, reels: false, trincaEnabled: false, trinca: false,
        shootingEnabled: false, shooting: false, storiesEnabled: false, stories: false,
        influsEnabled: false, influs: false },
      brand,
    }
    const { data } = await supabase.from('collections').insert(payload).select().single()
    if (!data) throw new Error('Falha ao criar coleção')
    const newCol: Collection = {
      id: data.id, nome: data.nome, tipo: data.tipo, mes: data.mes,
      dataSite: data.data_site, dataMarketing: data.data_marketing,
      confirmado: data.confirmado, launched: data.launched,
      campaignId: data.campaign_id ?? null,
      ilustra: data.ilustra, marketing: data.marketing,
    }
    setCollectionsRaw(arr => [...arr, newCol])
    setCampaignsRaw(arr => arr.map(c => c.id === campaign.id ? { ...c, colecaoId: newCol.id } : c))
    supabase.from('campaigns').update({ colecao_id: newCol.id }).eq('id', campaign.id).then(() => {})
    return newCol
  }

  const setCollectionLaunched = (collectionId: number, launched: boolean) => {
    const col = collections.find(c => c.id === collectionId)
    setCollections(arr => arr.map(c => c.id === collectionId ? { ...c, launched } : c))
    if (col?.campaignId != null) {
      setCampaigns(arr => arr.map(c => c.id === col.campaignId ? { ...c, launched } : c))
    }
  }

  const setCampaignLaunched = (campaignId: number, launched: boolean) => {
    const cmp = campaigns.find(c => c.id === campaignId)
    setCampaigns(arr => arr.map(c => c.id === campaignId ? { ...c, launched } : c))
    if (cmp?.colecaoId != null) {
      setCollections(arr => arr.map(c => c.id === cmp.colecaoId ? { ...c, launched } : c))
    }
  }

  const linking: Linking = {
    collections, campaigns, setCollections, setCampaigns,
    linkColCamp, unlinkColCamp,
    createCampaignFromCollection, createCollectionFromCampaign,
    setCollectionLaunched, setCampaignLaunched,
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // ─── Sidebar user ─────────────────────────────────────────────
  const meProfile = profiles.find(p => p.id === meId)
  const meInitial = meProfile?.initial ?? ownerName.charAt(0).toUpperCase()

  // ─── View titles ──────────────────────────────────────────────
  const viewTitles: Record<AppView, { title: string; sub: string }> = {
    calendar:      { title: 'Calendário',          sub: 'Todos os canais'                        },
    stories:       { title: 'Stories',             sub: 'Calendário · Lista · Performance'       },
    branding:      { title: 'Branding',             sub: 'Posts com tag Branding'                },
    mh:            { title: 'Máquina de Hits',      sub: 'Posts MH'                              },
    comemorativas: { title: 'Datas comemorativas',  sub: 'Pauta anual'                           },
    futebol:       { title: 'Futebol 2026',         sub: 'Calendário esportivo'                  },
    campaigns:     { title: 'Campanhas',            sub: 'Controle e cronograma'                 },
    collections:   { title: 'Coleções',             sub: 'Ilustra · Marketing'                   },
    lives:         { title: 'Lives',                sub: 'Performance · Proposta semanal'        },
    profile:       { title: 'Perfil',               sub: profileId === meId ? 'Seu perfil' : 'Equipe' },
    archived:      { title: 'Arquivados',           sub: 'Itens arquivados'                      },
    canal:         { title: 'Canal',                sub: 'Mensagens · WhatsApp / Telegram'       },
    site_links:    { title: 'Links do Site',        sub: 'Catálogo de produtos e UTMs'            },
    metrics:       { title: 'KPIs Sociais',          sub: 'Instagram · TikTok · 2026'             },
    share_social:  { title: 'Share Social',          sub: 'Receita · Meta · Canal Social'         },
    metas:         { title: 'Metas',                sub: 'Receita Social · KPIs de Instagram e TikTok' },
  }
  const { title, sub } = viewTitles[view]
  const isCalView = view === 'calendar' || view === 'branding'

  const calEvents = view === 'calendar' ? [
    ...eventDates.filter(e => e.start && e.end && e.start !== '-' && e.end !== '-' && e.start === e.end),
    ...futebolEvents
      .filter(f => f.date && f.date !== '-')
      .map(f => ({
        id: f.id, type: f.type, name: f.name,
        start: f.date, end: f.date,
        pack: 'PP' as const, potencial: false, postado: false, format: 'Story',
      }))
  ] : []
  const navLabel = calMode === 'week' ? weekLabel : `${MONTHS[month]} ${year}`

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="app">
      <ToastHost />
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sb-brand">
          <img src="/socialhub_logo.svg" alt="SocialHub" style={{ height: 44, width: 'auto', maxWidth: '100%' }} />
        </div>

        <div style={{ padding: '0 12px 8px' }}>
          <BrandSwitcher brand={brand} onChange={handleBrandChange} loading={brandLoading} />
        </div>

        {/* ── Sidebar: Gocase ─────────────────────────────── */}
        {brand === 'gocase' && (<>
          <div className="sb-section">
            <div className="sb-label">Calendários</div>
            <button className={`sb-item ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>
              <Icon.cal /> <span>Calendário do mês</span>
              <span className="sb-count">{monthPosts.length}</span>
            </button>
            <button className={`sb-item ${view === 'branding' ? 'active' : ''}`} onClick={() => setView('branding')}>
              <Icon.branding /> <span>Branding</span>
              <span className="sb-count">{posts.filter(p => p.source === 'branding' && parseISO(p.date).getFullYear() === year && parseISO(p.date).getMonth() === month).length}</span>
            </button>
            <button className={`sb-item ${view === 'mh' ? 'active' : ''}`} onClick={() => setView('mh')}>
              <Icon.mh /> <span>Máquina de Hits</span>
              <span className="sb-count">{posts.filter(p => p.source === 'mh' && parseISO(p.date).getFullYear() === year && parseISO(p.date).getMonth() === month).length}</span>
            </button>
          </div>
          <div className="sb-section">
            <div className="sb-label">Planejamento</div>
            <button className={`sb-item ${view === 'comemorativas' ? 'active' : ''}`} onClick={() => setView('comemorativas')}><Icon.events /> <span>Datas comemorativas</span></button>
            <button className={`sb-item ${view === 'futebol' ? 'active' : ''}`} onClick={() => setView('futebol')}><Icon.ball /> <span>Futebol 2026</span></button>
            <button className={`sb-item ${view === 'campaigns' ? 'active' : ''}`} onClick={() => setView('campaigns')}><Icon.campaign /> <span>Campanhas</span><span className="sb-count">{campaigns.length}</span></button>
            <button className={`sb-item ${view === 'collections' ? 'active' : ''}`} onClick={() => setView('collections')}><Icon.collections /> <span>Coleções</span><span className="sb-count">{collections.length}</span></button>
            <button className={`sb-item ${view === 'site_links' ? 'active' : ''}`} onClick={() => setView('site_links')}><Icon.link /> <span>Links do Site</span></button>
            <button className={`sb-item ${view === 'archived' ? 'active' : ''}`} onClick={() => setView('archived')}><Icon.trash /> <span>Arquivados</span></button>
          </div>
          <div className="sb-section">
          </div>
          <div className="sb-section" style={{ marginTop: -5 }}>
            <div className="sb-label">Performance</div>
            <button className={`sb-item ${view === 'metrics' ? 'active' : ''}`} onClick={() => setView('metrics')}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <rect x="2" y="11" width="3" height="5" rx="1"/>
                <rect x="7.5" y="6" width="3" height="10" rx="1"/>
                <rect x="13" y="2" width="3" height="14" rx="1"/>
              </svg>
              <span>KPIs</span>
            </button>
            <button className={`sb-item ${view === 'share_social' ? 'active' : ''}`} onClick={() => setView('share_social')}>
              <Icon.share /> <span>Share Social</span>
            </button>
            <button className={`sb-item ${view === 'metas' ? 'active' : ''}`} onClick={() => setView('metas')}>
              <Icon.target /> <span>Metas</span>
            </button>
            <button className={`sb-item ${view === 'lives' ? 'active' : ''}`} onClick={() => setView('lives')}><Icon.live /> <span>Lives</span><span className="sb-count">{lives.filter(l => l.status === 'realizada').length}</span></button>
            <button className={`sb-item ${view === 'stories' ? 'active' : ''}`} onClick={() => setView('stories')}><Icon.stories /> <span>Stories</span><span className="sb-count">{storiesCount}</span></button>
          </div>
        </>)}

        {/* ── Sidebar: Barbour's ──────────────────────────── */}
        {brand === 'barbours' && (<>
          <div className="sb-section">
            <div className="sb-label">Calendários</div>
            <button className={`sb-item ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>
              <Icon.cal /> <span>Calendário do mês</span>
              <span className="sb-count">{monthPosts.length}</span>
            </button>
            <button className={`sb-item ${view === 'canal' ? 'active' : ''}`} onClick={() => setView('canal')}>
              <Icon.canal /> <span>Canal</span>
              <span className="sb-count">{canalPosts.length}</span>
            </button>
          </div>
          <div className="sb-section">
            <div className="sb-label">Planejamento</div>
            <button className={`sb-item ${view === 'comemorativas' ? 'active' : ''}`} onClick={() => setView('comemorativas')}><Icon.events /> <span>Datas comemorativas</span></button>
            <button className={`sb-item ${view === 'campaigns' ? 'active' : ''}`} onClick={() => setView('campaigns')}><Icon.campaign /> <span>Campanhas</span><span className="sb-count">{campaigns.length}</span></button>
            <button className={`sb-item ${view === 'site_links' ? 'active' : ''}`} onClick={() => setView('site_links')}><Icon.link /> <span>Links do Site</span></button>
            <button className={`sb-item ${view === 'archived' ? 'active' : ''}`} onClick={() => setView('archived')}><Icon.trash /> <span>Arquivados</span></button>
          </div>
          <div className="sb-section">
            <div className="sb-label">Performance</div>
            <button className={`sb-item ${view === 'metrics' ? 'active' : ''}`} onClick={() => setView('metrics')}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <rect x="2" y="11" width="3" height="5" rx="1"/>
                <rect x="7.5" y="6" width="3" height="10" rx="1"/>
                <rect x="13" y="2" width="3" height="14" rx="1"/>
              </svg>
              <span>KPIs</span>
            </button>
            <button className={`sb-item ${view === 'share_social' ? 'active' : ''}`} onClick={() => setView('share_social')}>
              <Icon.share /> <span>Share Social</span>
            </button>
            <button className={`sb-item ${view === 'metas' ? 'active' : ''}`} onClick={() => setView('metas')}>
              <Icon.target /> <span>Metas</span>
            </button>
            <button className={`sb-item ${view === 'lives' ? 'active' : ''}`} onClick={() => setView('lives')}><Icon.live /> <span>Lives</span><span className="sb-count">{lives.filter(l => l.status === 'realizada').length}</span></button>
            <button className={`sb-item ${view === 'stories' ? 'active' : ''}`} onClick={() => setView('stories')}><Icon.stories /> <span>Stories</span><span className="sb-count">{storiesCount}</span></button>
          </div>
        </>)}

        {/* ── Sidebar: Kokeshi / Lescent ──────────────────── */}
        {(brand === 'kokeshi' || brand === 'lescent') && (
          <div className="sb-section">
            <button className={`sb-item ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>
              <Icon.cal /> <span>Calendário do mês</span>
              <span className="sb-count">{monthPosts.length}</span>
            </button>
            <button className={`sb-item ${view === 'campaigns' ? 'active' : ''}`} onClick={() => setView('campaigns')}><Icon.campaign /> <span>Campanhas</span><span className="sb-count">{campaigns.length}</span></button>
            <button className={`sb-item ${view === 'site_links' ? 'active' : ''}`} onClick={() => setView('site_links')}><Icon.link /> <span>Links do Site</span></button>
            <button className={`sb-item ${view === 'metrics' ? 'active' : ''}`} onClick={() => setView('metrics')}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <rect x="2" y="11" width="3" height="5" rx="1"/>
                <rect x="7.5" y="6" width="3" height="10" rx="1"/>
                <rect x="13" y="2" width="3" height="14" rx="1"/>
              </svg>
              <span>KPIs</span>
            </button>
            <button className={`sb-item ${view === 'share_social' ? 'active' : ''}`} onClick={() => setView('share_social')}>
              <Icon.share /> <span>Share Social</span>
            </button>
            <button className={`sb-item ${view === 'metas' ? 'active' : ''}`} onClick={() => setView('metas')}>
              <Icon.target /> <span>Metas</span>
            </button>
            <button className={`sb-item ${view === 'lives' ? 'active' : ''}`} onClick={() => setView('lives')}><Icon.live /> <span>Lives</span><span className="sb-count">{lives.filter(l => l.status === 'realizada').length}</span></button>
            <button className={`sb-item ${view === 'stories' ? 'active' : ''}`} onClick={() => setView('stories')}><Icon.stories /> <span>Stories</span><span className="sb-count">{storiesCount}</span></button>
          </div>
        )}

        <div
          className={`sb-user ${view === 'profile' ? 'active' : ''}`}
          onClick={() => { setView('profile'); setProfileId(meId) }}
          title="Abrir meu perfil"
        >
          {meProfile?.avatarUrl ? (
            <img src={meProfile.avatarUrl} alt={userName} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flex: '0 0 34px' }} referrerPolicy="no-referrer" />
          ) : (
            <div className="sb-avatar" style={meProfile?.color ? { background: `linear-gradient(135deg, ${meProfile.color}, color-mix(in oklab, ${meProfile.color}, black 15%))` } : undefined}>{meInitial}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {meProfile?.name ?? userName}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{meProfile?.role ?? 'Social Media'}</div>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="main">
        {/* Topbar */}
        <div className="topbar">
          <div className="tb-title">{title}</div>
          <div className="tb-sub">{sub}</div>

          {isCalView && (
            <>
              <div className="month-nav" style={{ marginLeft: 8 }}>
                <button onClick={goPrev}><Icon.chevL /></button>
                <div className="label">{navLabel}</div>
                <button onClick={goNext}><Icon.chevR /></button>
              </div>
              <button className="today-btn" onClick={goToday}>Hoje</button>
              <div className="view-toggle" style={{ marginLeft: 4 }}>
                <button className={calMode === 'month' ? 'active' : ''} onClick={() => setCalMode('month')}>Mês</button>
                <button className={calMode === 'week' ? 'active' : ''} onClick={() => setCalMode('week')}>Semana</button>
                <button className={calMode === 'list' ? 'active' : ''} onClick={() => setCalMode('list')}>Lista</button>
              </div>
            </>
          )}

          <div className="tb-spacer" />

          {isCalView && (
            <div className="search-box">
              <Icon.search />
              <input placeholder="Buscar posts..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          )}

          {view !== 'stories' && view !== 'canal' && view !== 'metrics' && view !== 'metas' && (
            <button className="btn btn-accent" onClick={() => createPost({})}>
              <Icon.plus /> Novo post
            </button>
          )}

          <button
            className="btn btn-ghost"
            onClick={() => setShowExport(true)}
            title="Exportar para Metricool"
            style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v13M7 12l5 5 5-5"/><path d="M4 19h16"/>
            </svg>
            CSV
            {selectedIds.size > 0 && (
              <span style={{ background: 'var(--accent)', color: 'white', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 6px', lineHeight: 1.5 }}>
                {selectedIds.size}
              </span>
            )}
          </button>

          <button className="btn btn-ghost" onClick={handleLogout} title="Sair" style={{ padding: '9px 12px' }}>
            <Icon.logout />
          </button>
        </div>

        {/* Filter bar (calendar views) */}
        {isCalView && (
          <div className="filter-bar">
            <button className={`platform-pill ${platformFilter === 'all' ? 'active' : ''}`} onClick={() => setPlatformFilter('all')}>
              Todas as redes
            </button>
            {PLATFORMS.map(p => (
              <button key={p.id} className={`platform-pill ${platformFilter === p.id ? 'active' : ''}`} onClick={() => setPlatformFilter(p.id)}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: p.color, display: 'grid', placeItems: 'center' }}>
                  <PlatformIcon platform={p.id} size={9} color="white" />
                </span>
                {p.label}
              </button>
            ))}

            {view === 'calendar' && (
              <>
                <div style={{ width: 1, height: 18, background: 'var(--line)', margin: '0 8px' }} />
                <button className={`tag-chip ${tagFilter === 'all' ? 'active' : ''}`} onClick={() => setTagFilter('all')}>Todas</button>
                <button className={`tag-chip ${tagFilter === 'mh' ? 'active' : ''}`} onClick={() => setTagFilter('mh')}>Máquina de Hits</button>
                <button className={`tag-chip ${tagFilter === 'branding' ? 'active' : ''}`} onClick={() => setTagFilter('branding')}>Branding</button>
                <button className={`tag-chip ${tagFilter === 'futebol' ? 'active' : ''}`} onClick={() => setTagFilter('futebol')}>Futebol</button>
                <button className={`tag-chip ${tagFilter === 'campanha' ? 'active' : ''}`} onClick={() => setTagFilter('campanha')}>Campanha</button>
              </>
            )}

            {/* Status multi-select filter */}
            <div style={{ position: 'relative' }}>
              <button
                className={`platform-pill ${statusFilter.length > 0 ? 'active' : ''}`}
                onClick={() => setStatusDropOpen(o => !o)}
                style={{ gap: 6 }}
              >
                Status{statusFilter.length > 0 ? ` (${statusFilter.length})` : ''}
                {statusFilter.length > 0 && (
                  <span
                    onMouseDown={e => { e.stopPropagation(); setStatusFilter([]) }}
                    style={{ display: 'grid', placeItems: 'center', width: 14, height: 14, borderRadius: '50%', background: 'rgba(255,255,255,.3)' }}
                  >
                    <Icon.x />
                  </span>
                )}
              </button>
              {statusDropOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setStatusDropOpen(false)} />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 60,
                    background: 'var(--surface)', border: '1px solid var(--line-2)',
                    borderRadius: 12, boxShadow: '0 12px 32px -8px rgba(40,30,70,.2), 0 3px 8px rgba(40,30,70,.07)',
                    padding: '8px 6px', minWidth: 180,
                  }}>
                    {STATUSES.map(s => {
                      const on = statusFilter.includes(s.id)
                      return (
                        <button
                          key={s.id}
                          onClick={() => setStatusFilter(prev => on ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                            padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: on ? 'var(--surface-2)' : 'transparent',
                            fontSize: 13, fontWeight: on ? 600 : 400, color: 'var(--ink)',
                          }}
                        >
                          <span style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid var(--line)`, display: 'grid', placeItems: 'center', background: on ? 'var(--accent)' : 'transparent', borderColor: on ? 'var(--accent)' : undefined, flexShrink: 0 }}>
                            {on && <Icon.check />}
                          </span>
                          <span className={`status-pill ${s.className}`} style={{ cursor: 'default' }}><span className="sdot" />{s.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            <div style={{ flex: 1 }} />
            <span className="count-pill">
              {shownPosts.filter(p => {
                const d = parseISO(p.date)
                return d.getFullYear() === year && d.getMonth() === month
              }).length} posts neste mês
            </span>
          </div>
        )}

        {/* Calendar views */}
        {isCalView && calMode !== 'list' && (
          <div className="cal-wrap">
            {calMode === 'month' ? (
              <CalendarGrid
                year={year}
                month={month}
                posts={shownPosts}
                events={calEvents}
                onPostClick={setActivePost}
                onNewPost={date => createPost({ date })}
                onPostDrop={(postId, date) => movePost(postId, date)}
              />
            ) : (
              <WeekView
                weekStart={weekStart}
                posts={shownPosts}
                events={calEvents}
                onPostClick={setActivePost}
                onPostDrop={(postId, date, time) => movePost(postId, date, time)}
              />
            )}
          </div>
        )}

        {isCalView && calMode === 'list' && (
          <CalendarListView
            posts={shownPosts}
            year={year}
            month={month}
            onPostClick={setActivePost}
            selectedIds={selectedIds}
            onToggle={toggleSelected}
          />
        )}

        {view === 'mh'            && <MHView onPostClick={setActivePost} allPosts={posts} onPostsAdded={async (newPosts) => {
          for (const p of newPosts) {
            const { id, source, ...rest } = p
            const { data } = await supabase.from('mh_posts').insert({ ...postToDb(rest, 'mh'), brand }).select().single()
            if (data) setPosts(arr => [...arr, { ...p, id: String(data.id), source: 'mh' as const }])
          }
        }} onPostsUpdated={(updatedPosts) => {
          setPosts(arr => arr.map(p => {
            const u = updatedPosts.find(u => u.id === p.id)
            return u ?? p
          }))
        }} />}
        {view === 'stories'       && (
          <StoriesView
            stories={stories}
            dayAggregates={dayAggregates}
            knownProducts={knownProducts}
            knownCategorias={knownCategorias}
            onStoryCreated={s => setStories(arr => [s, ...arr])}
            onStoryUpdated={saveStory}
            onQuickCreateStory={quickCreateStory}
            onStoryClick={setActiveStory}
            onNewStory={createStory}
          />
        )}
        {view === 'canal'         && (
          <CanalView
            posts={canalPosts}
            brand={brand}
            campaigns={campaigns}
            onPostAdded={p   => setCanalPosts(arr => [...arr, p])}
            onPostUpdated={p => setCanalPosts(arr => arr.map(x => x.id === p.id ? p : x))}
            onPostDeleted={id => setCanalPosts(arr => arr.filter(x => x.id !== id))}
          />
        )}
        {view === 'comemorativas' && <ComemorativasView initialItems={eventDates} />}
        {view === 'futebol'       && <FutebolView initialItems={futebolEvents} onSave={saveFutebolEvent} onDelete={deleteFutebolEvent} />}
        {view === 'campaigns'     && (
          <CampaignsView
            posts={posts}
            onPostClick={setActivePost}
            linking={linking}
            onNavigateCollection={id => {
              setView('collections')
              setTimeout(() => window.dispatchEvent(new CustomEvent('focusCollection', { detail: id })), 0)
            }}
            onDeleteCampaign={id => supabase.from('campaigns').delete().eq('id', id).then(() => {})}
            onArchiveCampaign={id => supabase.from('campaigns').update({ archived: true }).eq('id', id).then(() => {})}
          />
        )}
        {view === 'collections'   && (
          <CollectionsView
            linking={linking}
            onNavigateCampaign={id => {
              setView('campaigns')
              setTimeout(() => window.dispatchEvent(new CustomEvent('focusCampaign', { detail: id })), 0)
            }}
          />
        )}
        {view === 'lives'         && (
          <LivesView
            lives={lives}
            merchans={merchans}
            onLiveClick={setActiveLive}
            onNewLive={createLive}
            onOpenMerchans={() => setMerchansOpen(true)}
            onApproveProposta={approveLive}
            onApproveAll={approveAllPropostas}
            onDiscardProposta={discardProposta}
            onGenerateProposta={generateProposta}
            generatingProposta={generatingProposta}
            onStatusChange={(live, newStatus) => saveLive({ ...live, status: newStatus as LiveStatus })}
            onQuickCreateLive={quickCreateLive}
            onAddMerchan={onAddMerchan}
          />
        )}
        {view === 'profile'       && (
          <ProfileView
            posts={posts}
            profiles={profiles}
            campaigns={campaigns}
            profileId={profileId}
            meId={meId}
            onSelectProfile={setProfileId}
            onPostClick={setActivePost}
            onProfileUpdate={handleProfileUpdate}
          />
        )}
        {view === 'archived' && <ArchivedView />}
        {view === 'metrics'  && <MetricsView brand={brand} />}
        {view === 'share_social' && <ShareSocialView brand={brand} />}
        {view === 'metas' && <MetasView brand={brand} />}
        {view === 'site_links' && (
          <SiteLinksView
            brand={brand}
            siteLinks={siteLinks}
            onAdd={addSiteLink}
            onUpdate={updateSiteLink}
            onDelete={deleteSiteLink}
          />
        )}
      </main>

      {/* Story modal */}
      {activeStory && (
        <StoryModal
          story={activeStory}
          brand={brand}
          knownProducts={knownProducts}
          knownCategorias={knownCategorias}
          siteLinks={siteLinks}
          onClose={() => setActiveStory(null)}
          onSave={s => { saveStory(s); setActiveStory(null) }}
          onDelete={s => { deleteStory(s); setActiveStory(null) }}
        />
      )}

      {/* Live modal */}
      {activeLive && (
        <LiveModal
          live={activeLive}
          brand={brand}
          siteLinks={siteLinks}
          merchans={merchans}
          onClose={() => setActiveLive(null)}
          onSave={l => { saveLive(l); setActiveLive(null) }}
          onDelete={l => { deleteLive(l); setActiveLive(null) }}
          onAddMerchan={onAddMerchan}
        />
      )}

      {/* Merchans modal */}
      {merchansOpen && (
        <MerchansModal
          merchans={merchans}
          lives={lives}
          onClose={() => setMerchansOpen(false)}
          onChange={saveMerchan}
          onAdd={nome => onAddMerchan(nome)}
          onRename={renameMerchan}
          onRenameShort={renameShortMerchan}
          onDelete={deleteMerchan}
        />
      )}

      {/* Export modal */}
      {showExport && <ExportModal onClose={() => setShowExport(false)} selectedIds={selectedIds.size > 0 ? selectedIds : undefined} />}

      {/* Post modal */}
      {activePost && (
        <PostModal
          post={activePost}
          onClose={() => setActivePost(null)}
          onSave={savePost}
          onDelete={deletePost}
          onArchive={archivePost}
          onDuplicate={p => setDuplicateFor(p)}
          showProduct={view === 'mh' || activePost.product !== undefined}
          campaigns={campaigns}
          products={products}
          onAddProduct={async (name) => {
            await supabase.from('products').insert({ name, brand })
            setProducts(prev => [...prev, name].sort())
          }}
          tagOptions={[...new Set(posts.flatMap(p => p.tags ?? []).filter(Boolean))].sort()}
          sourceOptions={sourceOptions}
          allPosts={posts}
          onLinkedPostClick={p => setActivePost(p)}
        />
      )}

      {/* Duplicate menu */}
      {duplicateFor && (
        <DuplicateMenu
          post={duplicateFor}
          onClose={() => setDuplicateFor(null)}
          onDuplicate={duplicateToPlatform}
        />
      )}
    </div>
  )
}
