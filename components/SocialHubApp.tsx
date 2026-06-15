'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Post, Platform, PostSource, AppView, CalendarMode, Campaign, Collection, Linking,
  EventDate, FutebolEvent, Live, Merchan, LiveStatus, Story, DayAggregate,
  MONTHS, PLATFORMS, TAGS, STATUSES,
  addDaysISO, startOfWeekISO, todayISO, parseISO,
  CONTENT_TYPES_IG, CONTENT_TYPES_OTHER,
  colProgress,
} from '@/lib/types'
import type { TeamProfile } from '@/lib/types'
import {
  campaignToDb, collectionToDb, postToDb, sourceToTable,
  dbToPost, dbToCampaign, dbToCollection,
  dbToLive, dbToMerchan, liveToDb, merchanToDb, dbToStory, storyToDb,
} from '@/lib/supabase/mappers'
import { WEEKDAY_NOMES } from '@/lib/livesUtils'
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
import LivesView from './LivesView'
import LiveModal from './LiveModal'
import MerchansModal from './MerchansModal'
import StoryModal from './StoryModal'


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

  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [collections, setCollectionsRaw] = useState<Collection[]>(initialCollections)
  const [campaigns, setCampaignsRaw] = useState<Campaign[]>(initialCampaigns)
  const [products, setProducts] = useState<string[]>(initialProducts)
  const [lives, setLives] = useState<Live[]>(initialLives)
  const [merchans, setMerchans] = useState<Merchan[]>(initialMerchans)
  const [stories, setStories] = useState<Story[]>(initialStories)
  const [dayAggregates] = useState<DayAggregate[]>(initialDayAggregates)
  const knownProducts = useMemo(() => {
    const seen = new Set<string>()
    const result: string[] = []
    for (const s of stories) {
      const p = s.produto?.trim()
      if (p && !seen.has(p)) { seen.add(p); result.push(p) }
    }
    return result.sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [stories])
  const [activeLive, setActiveLive] = useState<Live | null>(null)
  const [activeStory, setActiveStory] = useState<Story | null>(null)
  const [merchansOpen, setMerchansOpen] = useState(false)
  const [generatingProposta, setGeneratingProposta] = useState(false)
  const [view, setView] = useState<AppView>('calendar')

  const today = todayISO()
  const todayDate = parseISO(today)

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
            supabase.from('collections').update(collectionToDb(col)).eq('id', col.id).then(() => {})
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
            supabase.from('campaigns').update(campaignToDb(camp)).eq('id', camp.id).then(() => {})
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
    setPosts(arr => arr.map(x => x.id === p.id ? p : x))
    const { id, source, ...rest } = p
    await supabase.from(sourceToTable(source)).update(postToDb(rest, source)).eq('id', id)
  }

  const movePost = async (postId: string, date: string, time?: string) => {
    const post = posts.find(p => p.id === postId)
    if (!post) return
    const updated = { ...post, date, ...(time !== undefined ? { time } : {}) }
    setPosts(arr => arr.map(p => p.id === postId ? updated : p))
    const { id, source, ...rest } = updated
    await supabase.from(sourceToTable(source)).update(postToDb(rest, source)).eq('id', id)
  }

  const deletePost = async (p: Post) => {
    setPosts(arr => arr.filter(x => x.id !== p.id))
    await supabase.from(sourceToTable(p.source)).delete().eq('id', p.id)
  }

  const archivePost = async (p: Post) => {
    setPosts(arr => arr.filter(x => x.id !== p.id))
    await supabase.from(sourceToTable(p.source)).update({ archived: true }).eq('id', p.id)
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
    const { data } = await supabase.from(sourceToTable(source)).insert(postToDb(newPost, source)).select().single()
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
    const { data } = await supabase.from(sourceToTable(targetSource)).insert(postToDb(rest, targetSource)).select().single()
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
    setLives(arr => arr.map(x => x.id === l.id ? l : x))
    const { id, ...rest } = l
    await supabase.from('lives').update(liveToDb(rest)).eq('id', id)
  }

  const createLive = async (defaults: Partial<Live> = {}) => {
    const date = defaults.date ?? today
    const dayIndex = new Date(date + 'T00:00:00').getDay()
    const diaSemana = WEEKDAY_NOMES[dayIndex]
    const payload: Omit<Live, 'id'> = {
      date,
      diaSemana,
      cupomLigado: true,
      criativo: false,
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
      alcance: 0,
      linkUtm: '',
      utmCampaign: '',
      status: 'confirmada' as LiveStatus,
      origem: 'manual',
      notes: '',
      ...defaults,
    }
    const { data } = await supabase.from('lives').insert(liveToDb(payload)).select().single()
    if (data) {
      const created = dbToLive(data as Record<string, unknown>)
      setLives(arr => [...arr, created].sort((a, b) => a.date.localeCompare(b.date)))
      setActiveLive(created)
    }
  }

  const deleteLive = async (l: Live) => {
    setLives(arr => arr.filter(x => x.id !== l.id))
    await supabase.from('lives').delete().eq('id', l.id)
  }

  const approveLive = (l: Live) => saveLive({ ...l, status: 'confirmada' })

  // ─── Stories handlers ──────────────────────────────────────────

  const saveStory = async (s: Story) => {
    setStories(arr => arr.map(x => x.id === s.id ? s : x))
    const { id, produtoSlug, ...rest } = s
    await supabase.from('stories').update(storyToDb(rest)).eq('id', id)
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
        body: JSON.stringify({}),
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
      .insert({ nome, ativo: true, forte: false, sempre_sozinho: false })
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
  }
  const { title, sub } = viewTitles[view]
  const isCalView = view === 'calendar' || view === 'branding'

  const calEvents = view === 'calendar' ? [
    ...initialEventDates.filter(e => e.start && e.end && e.start !== '-' && e.end !== '-' && e.start === e.end),
    ...initialFutebolEvents
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
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sb-brand">
          <img src="/socialhub_logo.svg" alt="SocialHub" style={{ height: 44, width: 'auto', maxWidth: '100%' }} />
        </div>

        <div className="sb-section">
          <div className="sb-label">Calendários</div>
          {([
            { id: 'calendar', label: 'Calendário do mês', icon: <Icon.cal />,      count: monthPosts.length },
            { id: 'branding', label: 'Branding',          icon: <Icon.branding />, count: posts.filter(p => p.source === 'branding' && parseISO(p.date).getFullYear() === year && parseISO(p.date).getMonth() === month).length },
            { id: 'mh',       label: 'Máquina de Hits',  icon: <Icon.mh />,       count: posts.filter(p => p.source === 'mh' && parseISO(p.date).getFullYear() === year && parseISO(p.date).getMonth() === month).length },
          ] as const).map(item => (
            <button key={item.id} className={`sb-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)}>
              {item.icon} <span>{item.label}</span>
              <span className="sb-count">{item.count}</span>
            </button>
          ))}
        </div>

        <div className="sb-section">
          <div className="sb-label">Planejamento</div>
          {([
            { id: 'comemorativas', label: 'Datas comemorativas', icon: <Icon.events /> },
            { id: 'futebol',       label: 'Futebol 2026',        icon: <Icon.ball />   },
            { id: 'campaigns',     label: 'Campanhas',           icon: <Icon.campaign />, count: campaigns.length },
            { id: 'collections',   label: 'Coleções',            icon: <Icon.collections />, count: collections.length },
            { id: 'archived',      label: 'Arquivados',          icon: <Icon.trash /> },
          ] as const).map(item => (
            <button key={item.id} className={`sb-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)}>
              {item.icon} <span>{item.label}</span>
              {'count' in item && <span className="sb-count">{item.count}</span>}
            </button>
          ))}
        </div>

        <div className="sb-section">
          <div className="sb-label">Performance</div>
          <button className={`sb-item ${view === 'lives' ? 'active' : ''}`} onClick={() => setView('lives')}>
            <Icon.mh /> <span>Lives</span>
            <span className="sb-count">{lives.filter(l => l.status === 'realizada').length}</span>
          </button>
          <button className={`sb-item ${view === 'stories' ? 'active' : ''}`} onClick={() => setView('stories')}>
            <Icon.stories /> <span>Stories</span>
            <span className="sb-count">{stories.filter(s => s.status === 'feito').length}</span>
          </button>
        </div>

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

          {view !== 'stories' && (
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
            const { data } = await supabase.from('mh_posts').insert(postToDb(rest, 'mh')).select().single()
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
            onStoryCreated={s => setStories(arr => [s, ...arr])}
            onStoryUpdated={s => setStories(arr => arr.map(x => x.id === s.id ? s : x))}
            onStoryClick={setActiveStory}
          />
        )}
        {view === 'comemorativas' && <ComemorativasView initialItems={initialEventDates} />}
        {view === 'futebol'       && <FutebolView initialItems={initialFutebolEvents} />}
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
      </main>

      {/* Story modal */}
      {activeStory && (
        <StoryModal
          story={activeStory}
          knownProducts={knownProducts}
          onClose={() => setActiveStory(null)}
          onSave={s => { saveStory(s); setActiveStory(null) }}
          onDelete={s => { deleteStory(s); setActiveStory(null) }}
        />
      )}

      {/* Live modal */}
      {activeLive && (
        <LiveModal
          live={activeLive}
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
            await supabase.from('products').insert({ name })
            setProducts(prev => [...prev, name].sort())
          }}
          tagOptions={[...new Set(posts.flatMap(p => p.tags ?? []).filter(Boolean))].sort()}
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
