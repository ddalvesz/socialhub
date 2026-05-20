'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Post, Platform, AppView, CalendarMode, Campaign, Collection, Linking,
  EventDate, FutebolEvent,
  MONTHS, PLATFORMS, TAGS, STATUSES,
  addDaysISO, startOfWeekISO, todayISO, parseISO,
  CONTENT_TYPES_IG, CONTENT_TYPES_OTHER,
  colProgress,
} from '@/lib/types'
import { TEAM_PROFILES } from '@/lib/data'
import {
  campaignToDb, collectionToDb,
} from '@/lib/supabase/mappers'
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


interface Props {
  initialPosts: Post[]
  initialCampaigns: Campaign[]
  initialCollections: Collection[]
  initialEventDates: EventDate[]
  initialFutebolEvents: FutebolEvent[]
  userEmail: string
  userName: string
}

function getOwnerName(email: string) {
  const profile = TEAM_PROFILES.find(p => p.email === email)
  if (profile) return profile.id
  const name = email.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return name
}

function getMeId(email: string) {
  const profile = TEAM_PROFILES.find(p => p.email === email)
  return profile?.id ?? getOwnerName(email)
}

export default function SocialHubApp({ initialPosts, initialCampaigns, initialCollections, initialEventDates, initialFutebolEvents, userEmail, userName }: Props) {
  const supabase = createClient()
  const meId = getMeId(userEmail)
  const ownerName = getOwnerName(userEmail)

  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [collections, setCollectionsRaw] = useState<Collection[]>(initialCollections)
  const [campaigns, setCampaignsRaw] = useState<Campaign[]>(initialCampaigns)
  const [view, setView] = useState<AppView>('calendar')

  const today = todayISO()
  const todayDate = parseISO(today)

  const [year, setYear] = useState(todayDate.getFullYear())
  const [month, setMonth] = useState(todayDate.getMonth())
  const [calMode, setCalMode] = useState<CalendarMode>('month')
  const [weekStart, setWeekStart] = useState(() => startOfWeekISO(today))

  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const [activePost, setActivePost] = useState<Post | null>(null)
  const [duplicateFor, setDuplicateFor] = useState<Post | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [profileId, setProfileId] = useState(meId)
  const [photos, setPhotos] = useState<Record<string, string>>({})

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
  let shownPosts = posts
  if (view === 'branding') shownPosts = posts.filter(p => p.tags?.includes('branding'))
  if (view === 'mh')       shownPosts = posts.filter(p => p.tags?.includes('mh'))
  if (platformFilter !== 'all') shownPosts = shownPosts.filter(p => p.platform === platformFilter)
  if (tagFilter !== 'all')      shownPosts = shownPosts.filter(p => p.tags?.includes(tagFilter))
  if (search.trim()) {
    const q = search.toLowerCase()
    shownPosts = shownPosts.filter(p =>
      p.title.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q)
    )
  }

  const monthPosts = posts.filter(p => {
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
    const upper = p.title.toUpperCase()
    const COPA_KEYWORDS = ['WHIND', 'WHINDERSSON', 'KÉFERA', 'KEFERA', 'TACI', 'CAFU', 'MELODY', 'COPA']
    const isCopa = COPA_KEYWORDS.some(k => upper.includes(k))
    const isMH = p.title.includes('[MH]')

    let tags = [...(p.tags ?? [])]
    if (isMH)   tags = Array.from(new Set([...tags, 'mh']))
    if (isCopa) tags = Array.from(new Set([...tags, 'futebol']))

    const saved = {
      ...p,
      tags,
      linha: isCopa ? 'copa' : p.linha,
    }
    setPosts(arr => arr.map(x => x.id === saved.id ? saved : x))
    const { id, user_id, ...payload } = saved
    await supabase.from('posts').update(payload).eq('id', id)
  }

  const deletePost = async (p: Post) => {
    setPosts(arr => arr.filter(x => x.id !== p.id))
    await supabase.from('posts').delete().eq('id', p.id)
  }

  const createPost = async (defaults: Partial<Post>) => {
    const newPost: Omit<Post, 'id' | 'user_id'> = {
      title: '',
      owner: ownerName,
      platform: 'ig',
      date: defaults.date ?? today,
      time: '12:00',
      status: 'prod',
      complexity: 3,
      type: 'Reels',
      tags: [],
      linha: 'produtos',
      campanha: null,
      link: '',
      ref: '',
      notes: '',
      ...defaults,
    }
    const { data, error } = await supabase.from('posts').insert(newPost).select().single()
    if (data) {
      setPosts(arr => [...arr, data as Post])
      setActivePost(data as Post)
    }
  }

  const duplicateToPlatform = async (newPlatform: string) => {
    if (!duplicateFor) return
    const newPost = { ...duplicateFor, platform: newPlatform as Platform, status: 'prod' as const }
    if (newPlatform === 'ig' && !CONTENT_TYPES_IG.includes(newPost.type)) newPost.type = 'Reels'
    if (newPlatform !== 'ig' && !CONTENT_TYPES_OTHER.includes(newPost.type)) newPost.type = 'Vídeo'
    const { id, user_id, ...payload } = newPost
    const { data } = await supabase.from('posts').insert(payload).select().single()
    if (data) {
      setPosts(arr => [...arr, data as Post])
      setDuplicateFor(null)
      setActivePost(data as Post)
    }
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
  const meProfile = TEAM_PROFILES.find(p => p.id === meId)
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
    profile:       { title: 'Perfil',               sub: profileId === meId ? 'Seu perfil' : 'Equipe' },
  }
  const { title, sub } = viewTitles[view]
  const isCalView = view === 'calendar' || view === 'branding' || view === 'mh'

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
          <span className="wordmark">SocialHub</span>
          <span className="dot">.</span>
        </div>

        <div className="sb-section">
          <div className="sb-label">Calendários</div>
          {([
            { id: 'calendar', label: 'Calendário do mês', icon: <Icon.cal />,      count: monthPosts.length },
            { id: 'stories',  label: 'Stories',           icon: <Icon.stories />,  count: monthPosts.filter(p => p.platform === 'ig' && p.format === 'Story').length },
            { id: 'branding', label: 'Branding',          icon: <Icon.branding />, count: posts.filter(p => p.tags?.includes('branding')).length },
            { id: 'mh',       label: 'Máquina de Hits',  icon: <Icon.mh />,       count: posts.filter(p => p.tags?.includes('mh')).length },
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
          ] as const).map(item => (
            <button key={item.id} className={`sb-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)}>
              {item.icon} <span>{item.label}</span>
              {'count' in item && <span className="sb-count">{item.count}</span>}
            </button>
          ))}
        </div>

        <div
          className={`sb-user ${view === 'profile' ? 'active' : ''}`}
          onClick={() => { setView('profile'); setProfileId(meId) }}
          title="Abrir meu perfil"
        >
          {photos[meId] ? (
            <img src={photos[meId]} alt={userName} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flex: '0 0 34px' }} />
          ) : (
            <div className="sb-avatar">{meInitial}</div>
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
                <button className={`tag-chip ${tagFilter === 'all' ? 'active' : ''}`} onClick={() => setTagFilter('all')}>Todas tags</button>
                {TAGS.map(t => (
                  <button key={t.id} className={`tag-chip ${tagFilter === t.id ? 'active' : ''}`} onClick={() => setTagFilter(t.id)}>
                    {t.label}
                  </button>
                ))}
              </>
            )}

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
        {isCalView && (
          <div className="cal-wrap">
            {calMode === 'month' ? (
              <CalendarGrid
                year={year}
                month={month}
                posts={shownPosts}
                events={calEvents}
                onPostClick={setActivePost}
                onNewPost={date => createPost({ date })}
              />
            ) : (
              <WeekView
                weekStart={weekStart}
                posts={shownPosts}
                onPostClick={setActivePost}
              />
            )}
          </div>
        )}

        {view === 'stories'       && <StoriesView />}
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
        {view === 'profile'       && (
          <ProfileView
            posts={posts}
            profileId={profileId}
            meId={meId}
            onSelectProfile={setProfileId}
            onPostClick={setActivePost}
            photos={photos}
            onSetPhoto={(id, url) => setPhotos(p => ({ ...p, [id]: url }))}
          />
        )}
      </main>

      {/* Export modal */}
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}

      {/* Post modal */}
      {activePost && (
        <PostModal
          post={activePost}
          onClose={() => setActivePost(null)}
          onSave={savePost}
          onDelete={deletePost}
          onDuplicate={p => setDuplicateFor(p)}
          showProduct={view === 'mh' || activePost.product !== undefined}
          campaigns={campaigns}
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
