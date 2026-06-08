'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Post, MHPayload, MHCreatorId,
  fmtBR, todayISO, addDaysISO, parseISO, MONTHS,
} from '@/lib/types'
import { Icon } from './Icons'
import CalendarGrid from './CalendarGrid'
import { DatePicker } from './FormHelpers'

// ─── Types ────────────────────────────────────────────────────

interface MHCreator {
  id: MHCreatorId
  name: string
  initial: string
  color: string
  dataEntrada: string
  semanaAtual: number
  dropboxPath: string
  isVirtual?: boolean
}

type MHMode = 'pautas' | 'month' | 'list'

interface StatusMH {
  id: string
  label: string
  className: string
  dot: string
}

interface VideoForm {
  _id: string
  hook: string
  ref: string
  product: string
  audio: string
  notes: string
  prazo: string
}

// ─── Constants ────────────────────────────────────────────────

const CREATORS: MHCreator[] = [
  { id: 'CARINA',    name: 'Carina',    initial: 'C', color: 'oklch(0.65 0.17 18)',  dataEntrada: '2024-10-05', semanaAtual: 88, dropboxPath: '/MKT SOCIAL/CREATORS/CARINA' },
  { id: 'REBECA',    name: 'Rebeca',    initial: 'R', color: 'oklch(0.6 0.16 290)',  dataEntrada: '2025-03-31', semanaAtual: 32, dropboxPath: '/MKT SOCIAL/CREATORS/REBECA' },
  { id: 'THA',       name: 'Tha',       initial: 'T', color: 'oklch(0.62 0.15 150)', dataEntrada: '2025-07-14', semanaAtual: 45, dropboxPath: '/MKT SOCIAL/CREATORS/THA' },
  { id: 'MARINA',    name: 'Marina',    initial: 'M', color: 'oklch(0.6 0.16 230)',  dataEntrada: '2026-01-19', semanaAtual: 18, dropboxPath: '/MKT SOCIAL/CREATORS/MARINA' },
  { id: 'RECICLADO', name: 'Reciclado', initial: '↻', color: 'oklch(0.55 0.05 280)', dataEntrada: '2025-10-06', semanaAtual: 32, dropboxPath: '/MKT SOCIAL/CREATORS/RECICLADO', isVirtual: true },
]

const CREATORS_BY_ID = Object.fromEntries(CREATORS.map(c => [c.id, c])) as Record<MHCreatorId, MHCreator>

const STATUSES_MH: StatusMH[] = [
  { id: 'pauta',    label: 'Em pauta',     className: 's-pauta',    dot: 'oklch(0.55 0.12 280)' },
  { id: 'entregue', label: 'Entregue',     className: 's-entregue', dot: 'oklch(0.55 0.14 165)' },
  { id: 'prod',     label: 'Em produção',  className: 's-prod',     dot: 'oklch(0.62 0.13 75)'  },
  { id: 'sched',    label: 'Agendado',     className: 's-sched',    dot: 'oklch(0.6 0.13 265)'  },
  { id: 'pub',      label: 'Publicado',    className: 's-pub',      dot: 'oklch(0.6 0.13 150)'  },
  { id: 'cancel',   label: 'Cancelado',    className: 's-cancel',   dot: 'oklch(0.6 0.05 25)'   },
]

// ─── Helpers ──────────────────────────────────────────────────

const semanaLabel = (n: number) => `S${String(n).padStart(2, '0')}`
const videoLabel  = (n: number) => `V${String(n).padStart(2, '0')}`

function pad2(n: number) { return String(n).padStart(2, '0') }

function formatBriefingTxt({ creator, semana, videos, generatedBy, generatedAt }: {
  creator: MHCreatorId; semana: number; videos: VideoForm[]; generatedBy: string; generatedAt: number
}) {
  const c = CREATORS_BY_ID[creator]
  const fmt = (iso: string) => { if (!iso) return '—'; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}` }
  const gen = new Date(generatedAt)
  const genStr = `${pad2(gen.getDate())}/${pad2(gen.getMonth() + 1)}/${gen.getFullYear()} ${pad2(gen.getHours())}:${pad2(gen.getMinutes())}`
  const div = '═'.repeat(60)
  const sub = '─'.repeat(60)
  let out = `PAUTAS — ${c?.name?.toUpperCase() || creator} · SEMANA ${semana}\n${div}\nGerada em ${genStr} por ${generatedBy}\n\n\n`
  videos.forEach((v, i) => {
    out += `📹 VÍDEO ${pad2(i + 1)}\n${sub}\n`
    out += `HOOK / TAKE INICIAL\n  ${v.hook || '—'}\n\n`
    out += `REFERÊNCIA\n  ${v.ref || '—'}\n\n`
    out += `PRODUTO FOCO\n  ${v.product || '—'}\n\n`
    out += `ÁUDIO SUGERIDO\n  ${v.audio || '—'}\n\n`
    out += `PRAZO DE ENTREGA\n  ${fmt(v.prazo)}\n\n`
    out += `OBSERVAÇÕES\n  ${v.notes || '—'}\n\n\n`
  })
  out += `${div}\n${videos.length} vídeo${videos.length === 1 ? '' : 's'} nesta semana · arquivo gerado automaticamente pelo SocialHub`
  return out
}

// ─── Mock data ────────────────────────────────────────────────

type RawPost = {
  creator: MHCreatorId; semanaCreator: number; numVideo: number
  hook: string; product?: string; audio?: string; prazo: string; ref?: string
  primary: { date: string; time: string; status: string; type?: string }
  repost?: { date: string; time: string; status: string; type?: string } | null
  notes?: string; caption?: string; link?: string; coverLink?: string; dropboxLink?: string
}

const MH_POSTS_RAW: RawPost[] = [
  { creator: 'CARINA', semanaCreator: 85, numVideo: 1, hook: 'pov: aquela amiga que acha tudo aesthetic', product: 'Tote Puffer · Case', audio: 'pop indie / Phoebe Bridgers', prazo: '2026-05-18', ref: 'https://www.tiktok.com/@wayshot_app/video/7559708189260893470', primary: { date: '2026-05-20', time: '18:00', status: 'pub', type: 'Reels' }, repost: { date: '2026-06-03', time: '12:00', status: 'sched', type: 'Vídeo' }, notes: 'Take ainda mais lento, sem cortes na primeira metade.', caption: 'minha melhor amiga é assim 🤍✨ #gocase #aesthetic', link: 'https://dropbox.com/video-01-com-texto.mp4', coverLink: 'https://dropbox.com/video-01-capa.jpg' },
  { creator: 'CARINA', semanaCreator: 85, numVideo: 2, hook: 'eu narrando todos os passos da viagem pra minha mãe', product: 'Tote Puffer · Mala de Bordo Trip', audio: 'voz natural, sem música', prazo: '2026-05-18', ref: '', primary: { date: '2026-05-21', time: '12:00', status: 'pub' }, repost: { date: '2026-06-04', time: '12:00', status: 'sched' } },
  { creator: 'CARINA', semanaCreator: 85, numVideo: 3, hook: 'dia 1 sem beber coca zero / dia 2 / dia 1 / dia 1', product: 'Case Classic', audio: 'piano triste', prazo: '2026-05-22', ref: 'https://vt.tiktok.com/ZSa2yBQjx/', primary: { date: '2026-05-22', time: '18:00', status: 'sched' }, repost: null },
  { creator: 'CARINA', semanaCreator: 85, numVideo: 4, hook: 'eu tentando fazer caber na mala 48 roupas, 16 biquínis, 1 kg de glitter', product: 'Mala de Bordo Trip', audio: 'beat acelerado', prazo: '2026-05-25', ref: 'https://www.instagram.com/p/DQQVHhNDEeX/', primary: { date: '2026-05-25', time: '12:00', status: 'entregue' }, dropboxLink: '/Creators/Carina/SEMANA 85/' },
  { creator: 'CARINA', semanaCreator: 85, numVideo: 5, hook: 'eu decidindo entre ficar em casa e ter FOMO ou sair e ficar desconfortável o tempo inteiro', product: 'Tote Shopper', audio: 'lo-fi', prazo: '2026-05-25', ref: 'https://www.tiktok.com/@joannastz/video/7595722066523852052', primary: { date: '2026-05-26', time: '18:00', status: 'pauta' } },
  { creator: 'REBECA', semanaCreator: 60, numVideo: 1, hook: 'pov: você odeia fazer duas viagens', product: 'Copo Life · Case', audio: 'trend audio TikTok BR', prazo: '2026-05-15', ref: 'https://www.instagram.com/reel/DT-fBD1DfdJ/', primary: { date: '2026-05-19', time: '18:00', status: 'pub' }, repost: { date: '2026-06-02', time: '12:00', status: 'sched' } },
  { creator: 'REBECA', semanaCreator: 60, numVideo: 2, hook: 'pessoas normais x pessoas estranhas usando mochila', product: 'Mochila Pop', audio: '', prazo: '2026-05-20', ref: 'https://www.tiktok.com/@gocase/video/7322493386747858181', primary: { date: '2026-05-23', time: '12:00', status: 'entregue' }, dropboxLink: '/Creators/Rebeca/SEMANA 60/' },
  { creator: 'REBECA', semanaCreator: 60, numVideo: 3, hook: 'pov: você tem medo do seu namorado pegar seu celular? eu com medo dele comer meu sushi', product: 'Case', audio: 'pop romântico irônico', prazo: '2026-05-25', ref: 'https://www.instagram.com/reels/C_1OP6fSuwe/', primary: { date: '2026-05-26', time: '18:00', status: 'pauta' } },
  { creator: 'REBECA', semanaCreator: 59, numVideo: 5, hook: 'quando ta todo mundo se divertindo e eu tô no cantinho desinstalando até a calculadora', product: 'Case', audio: '', prazo: '2026-05-08', ref: 'https://www.instagram.com/reel/DTgWJ03lMTV/', primary: { date: '2026-05-15', time: '12:00', status: 'pub' }, repost: { date: '2026-05-28', time: '12:00', status: 'sched' } },
  { creator: 'THA', semanaCreator: 45, numVideo: 1, hook: 'pov: eu chegando no escritório quarta feira 14h', product: 'Tote Puffer · Copo Térmico', audio: 'música preguiçosa', prazo: '2026-05-27', ref: '', primary: { date: '2026-05-28', time: '12:00', status: 'pauta' } },
  { creator: 'THA', semanaCreator: 45, numVideo: 2, hook: 'a dica que vai mudar sua vida: (tirar adesivo com secador)', product: 'Case', audio: '', prazo: '2026-05-22', ref: '', primary: { date: '2026-05-22', time: '19:00', status: 'entregue' }, dropboxLink: '/Creators/Tha/SEMANA 45/' },
  { creator: 'THA', semanaCreator: 44, numVideo: 1, hook: 'vai viajar pra onde no carnaval', product: 'Tote Puffer', audio: '', prazo: '2026-05-12', ref: '', primary: { date: '2026-05-13', time: '12:00', status: 'pub' }, repost: { date: '2026-05-20', time: '12:00', status: 'pub' } },
  { creator: 'MARINA', semanaCreator: 18, numVideo: 1, hook: '"desculpa não te responder ontem, cheguei em casa e dormi" o que eu imagino:', product: 'Case · Tote Puffer', audio: 'música tensa', prazo: '2026-05-21', ref: 'https://www.instagram.com/reel/DN1pe15XK58/', primary: { date: '2026-05-22', time: '17:00', status: 'sched' } },
  { creator: 'MARINA', semanaCreator: 18, numVideo: 2, hook: 'eu com vergonha de postar uma foto MINHA no MEU instagram', product: 'Case', audio: '', prazo: '2026-05-26', ref: 'https://www.instagram.com/reel/DTspnaZDW_y/', primary: { date: '2026-05-27', time: '12:00', status: 'pauta' } },
  { creator: 'MARINA', semanaCreator: 17, numVideo: 3, hook: 'eu vendo meu namorado montar meu prato depois de cozinhar pra mim', product: 'Taça Térmica Drink', audio: '', prazo: '2026-05-08', ref: 'https://www.tiktok.com/@duasnacoesumamor/video/7597626795017473298', primary: { date: '2026-05-14', time: '17:00', status: 'pub' }, repost: { date: '2026-05-21', time: '12:00', status: 'pub' } },
  { creator: 'RECICLADO', semanaCreator: 32, numVideo: 1, hook: 'testando se a cerveja de 600ml cabe no copo de 470ml', product: 'Copo Térmico', audio: '', prazo: '2026-05-10', ref: '', primary: { date: '2026-05-12', time: '18:00', status: 'pub' }, repost: { date: '2026-05-12', time: '18:00', status: 'pub' }, notes: 'Conteúdo reciclado do acervo Q1.' },
]

function ownerToCreatorId(owner: string): MHCreatorId {
  const map: Record<string, MHCreatorId> = {
    carina: 'CARINA', rebeca: 'REBECA', tha: 'THA', marina: 'MARINA', reciclado: 'RECICLADO',
  }
  return map[owner.toLowerCase()] ?? 'CARINA'
}

function buildMHPosts(): Post[] {
  return MH_POSTS_RAW.map((r, i) => ({
    id: String(1000 + i),
    source: 'mh' as const,
    title: r.hook,
    owner: CREATORS_BY_ID[r.creator]?.name ?? r.creator,
    platform: 'ig' as const,
    date: r.primary.date,
    time: r.primary.time,
    status: r.primary.status as Post['status'],
    format: 'Reels',
    tags: ['trends'],
    campaign: '',
    product: r.product ?? '',
    caption: r.caption || '',
    link: r.link || '',
    coverLink: r.coverLink || '',
    ref: r.ref || '',
    obs: r.notes || '',
    deadline: r.prazo || '',
    videoLink: '',
    slideLinks: [],
    semana: r.semanaCreator,
    numVideo: r.numVideo,
    audio: r.audio || '',
    prazo: r.prazo,
    dropboxLink: r.dropboxLink || '',
    briefingFile: `/Creators/${CREATORS_BY_ID[r.creator]?.name || r.creator}/pautas-semana-${r.semanaCreator}.txt`,
  }))
}

// ─── Sub-components ───────────────────────────────────────────

function CreatorChip({ id, size = 'md', onClick }: { id: MHCreatorId; size?: 'md' | 'sm'; onClick?: () => void }) {
  const c = CREATORS_BY_ID[id]
  if (!c) return null
  return (
    <span className={`creator-chip ${size === 'sm' ? 'size-sm' : ''}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <span className="cc-av" style={{ background: c.color }}>{c.initial}</span>
      {c.name}
    </span>
  )
}

function PautaStatusBadge({ status }: { status: string }) {
  const s = STATUSES_MH.find(x => x.id === status)
  if (!s) return null
  return (
    <span className={`pauta-status ${s.className}`}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

function PautaPlatformPair({ post, allPosts, onTTClick }: {
  post: Post
  allPosts: Post[]
  onTTClick: (p: Post) => void
}) {
  const ttPost = post.linkedPostId ? allPosts.find(p => p.id === post.linkedPostId && p.platform === 'tiktok') : undefined
  return (
    <div className="platforms">
      <div className="pauta-plat ig" title={`Instagram · ${fmtBR(post.date)} ${post.time}`}>
        IG
        {post.status === 'pub' && <span className="tick" />}
      </div>
      {ttPost ? (
        <div
          className="pauta-plat tt"
          title={`TikTok · ${fmtBR(ttPost.date)} ${ttPost.time} — clique para abrir`}
          style={{ cursor: 'pointer' }}
          onClick={e => { e.stopPropagation(); onTTClick(ttPost) }}
        >
          TT
          {ttPost.status === 'pub' && <span className="tick" />}
        </div>
      ) : (
        <div className="pauta-plat muted" title="Sem post TikTok vinculado">TT</div>
      )}
    </div>
  )
}

function PautaRow({ post, onClick, allPosts }: { post: Post; onClick: (p: Post) => void; allPosts: Post[] }) {
  const today = todayISO()
  const prazo = post.prazo
  const isLate = prazo && prazo < today && (post.status === 'pauta' || post.status === 'entregue')
  return (
    <div className="pauta-row" onClick={() => onClick(post)}>
      <div className="num">{videoLabel(post.numVideo ?? 1)}</div>
      <div>
        <div className="hook">{post.title}</div>
        {post.product && <div className="product">{post.product}</div>}
      </div>
      <div>
        <CreatorChip id={ownerToCreatorId(post.owner)} size="sm" />
      </div>
      <PautaPlatformPair post={post} allPosts={allPosts} onTTClick={onClick} />
      <div>
        <PautaStatusBadge status={post.status} />
      </div>
      <div className={`pauta-prazo ${isLate ? 'late' : ''}`}>
        <span className="lbl">Prazo</span>
        {prazo ? fmtBR(prazo) : '—'}
      </div>
    </div>
  )
}

// ─── PautasView ───────────────────────────────────────────────

function PautasView({
  posts, allPosts, onPostClick, creatorFilter, onCreatorFilterChange,
  onCreatePauta, onSimulateSync, syncing, lastSyncResult, onSelectCreator,
}: {
  posts: Post[]
  allPosts: Post[]
  onPostClick: (p: Post) => void
  creatorFilter: string
  onCreatorFilterChange: (id: string) => void
  onCreatePauta: () => void
  onSimulateSync: () => void
  syncing?: boolean
  lastSyncResult: { found: number } | null
  onSelectCreator: (id: MHCreatorId) => void
}) {
  const today = todayISO()

  const filtered = useMemo(() => {
    let arr = posts
    if (creatorFilter && creatorFilter !== 'all') arr = arr.filter(p => ownerToCreatorId(p.owner) === creatorFilter)
    return arr
  }, [posts, creatorFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, { creator: MHCreatorId; semana: number; posts: Post[] }>()
    for (const p of filtered) {
      const creator = ownerToCreatorId(p.owner)
      const semana = p.semana ?? 0
      const key = `${creator}::${semana}`
      if (!map.has(key)) map.set(key, { creator, semana, posts: [] })
      map.get(key)!.posts.push(p)
    }
    for (const g of map.values()) g.posts.sort((a, b) => (a.numVideo ?? 0) - (b.numVideo ?? 0))
    const creatorOrder = Object.fromEntries(CREATORS.map((c, i) => [c.id, i]))
    return Array.from(map.values()).sort((a, b) => {
      if (b.semana !== a.semana) return b.semana - a.semana
      return creatorOrder[a.creator] - creatorOrder[b.creator]
    })
  }, [filtered])

  return (
    <div className="pautas-view">
      {/* Dropbox sync banner */}
      <div className="dropbox-sync-banner">
        <div className="left">
          <div className="dropbox-sync-icon">☰</div>
          <div>
            {lastSyncResult ? (
              <>
                <strong>{lastSyncResult.found} entrega{lastSyncResult.found === 1 ? '' : 's'} detectada{lastSyncResult.found === 1 ? '' : 's'} no Dropbox</strong>
                {' · sincronizado agora'}
              </>
            ) : (
              <>
                <strong>Verificação de entregas no Dropbox</strong>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
                  Olha as pastas SEMANA N de cada creator e marca como <em>Entregue</em> quando encontrar arquivos
                </span>
              </>
            )}
          </div>
        </div>
        <button className="dropbox-sync-btn" onClick={onSimulateSync} disabled={syncing}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={syncing ? { animation: 'spin 1s linear infinite' } : undefined}><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>
          {syncing ? 'Sincronizando…' : 'Sync agora'}
        </button>
      </div>

      {/* Filter bar */}
      <div className="pautas-filter">
        <span className="label">Creator:</span>
        <button className={`creator-filter-pill all ${creatorFilter === 'all' ? 'active' : ''}`} onClick={() => onCreatorFilterChange('all')}>
          Todos
        </button>
        {CREATORS.map(c => (
          <button key={c.id} className={`creator-filter-pill ${creatorFilter === c.id ? 'active' : ''}`} onClick={() => onCreatorFilterChange(c.id)}>
            <span className="cfp-av" style={{ background: c.color }}>{c.initial}</span>
            {c.name}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: creatorFilter === c.id ? 'rgba(255,255,255,.7)' : 'var(--ink-3)', marginLeft: 4 }}>
              {semanaLabel(c.semanaAtual)}
            </span>
          </button>
        ))}
      </div>

      {/* CTA */}
      <div className="pauta-cta">
        <div>
          Adiciona N vídeos de uma vez e atualiza o <strong>Google Docs</strong> da creator com as pautas da semana.
        </div>
        <button className="pauta-cta-btn" onClick={onCreatePauta}>
          <Icon.plus /> Nova pauta da semana
        </button>
      </div>

      {/* Groups */}
      {grouped.map(g => {
        const c = CREATORS_BY_ID[g.creator]
        const counts = {
          pauta:    g.posts.filter(p => p.status === 'pauta').length,
          entregue: g.posts.filter(p => p.status === 'entregue').length,
          sched:    g.posts.filter(p => p.status === 'sched').length,
          pub:      g.posts.filter(p => p.status === 'pub').length,
        }
        const isCurrent = g.semana === c.semanaAtual
        const weeksAgo = c.semanaAtual - g.semana
        return (
          <div className="pauta-group" key={`${g.creator}-${g.semana}`}>
            <div className="pauta-group-head">
              <div className="pauta-group-left">
                <div className="pauta-group-creator" onClick={() => onSelectCreator(g.creator)} style={{ cursor: 'pointer' }}>
                  <div className="pauta-group-avatar" style={{ background: c.color }}>{c.initial}</div>
                  <div>
                    <div className="pauta-group-name">{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                      {isCurrent ? 'semana atual' : `há ${weeksAgo} semana${weeksAgo === 1 ? '' : 's'}`}
                    </div>
                  </div>
                </div>
                <div className="pauta-group-semana">{semanaLabel(g.semana)}</div>
              </div>
              <div className="pauta-group-counts">
                {counts.pauta > 0    && <span className="cnt"><strong>{counts.pauta}</strong>em pauta</span>}
                {counts.entregue > 0 && <span className="cnt"><strong>{counts.entregue}</strong>entregues</span>}
                {counts.sched > 0    && <span className="cnt"><strong>{counts.sched}</strong>agendados</span>}
                {counts.pub > 0      && <span className="cnt"><strong>{counts.pub}</strong>publicados</span>}
              </div>
            </div>
            {g.posts.map(p => (
              <PautaRow key={p.id} post={p} onClick={onPostClick} allPosts={allPosts} />
            ))}
          </div>
        )
      })}

      {grouped.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--ink-3)' }}>
          Nenhuma pauta encontrada para este creator.
        </div>
      )}
    </div>
  )
}

// ─── CreatorProfileView ───────────────────────────────────────

function creatorMetrics(creatorId: MHCreatorId, allPosts: Post[]) {
  const c = CREATORS_BY_ID[creatorId]
  if (!c) return null
  const mine = allPosts.filter(p => ownerToCreatorId(p.owner) === creatorId)
  const semanaAtual = c.semanaAtual
  const avgPerWeek = 2.4 + (creatorId === 'CARINA' ? 0.8 : 0) + (creatorId === 'RECICLADO' ? -1.4 : 0)
  const total = Math.round(avgPerWeek * semanaAtual)
  const thisWeek = mine.filter(p => p.semana === semanaAtual).length
  const emPauta = mine.filter(p => p.status === 'pauta').length
  const noPrazoPct = creatorId === 'CARINA' ? 94 : creatorId === 'REBECA' ? 91 : creatorId === 'THA' ? 92 : creatorId === 'MARINA' ? 88 : 85
  const histogram = Array.from({ length: 12 }, (_, i) => {
    const sem = semanaAtual - (11 - i)
    const seed = (creatorId.charCodeAt(0) + sem) % 7
    const val = Math.max(0, Math.round(avgPerWeek + (seed - 3) * 0.5))
    return { semana: sem, count: val, isCurrent: i === 11 }
  })
  return { semanaAtual, total, thisWeek: thisWeek || histogram[11].count, emPauta, avgPerWeek: avgPerWeek.toFixed(1), noPrazoPct, histogram, posts: mine }
}

function CreatorProfileView({ creatorId, posts, allPosts, onBack, onPostClick }: {
  creatorId: MHCreatorId; posts: Post[]; allPosts: Post[]; onBack: () => void; onPostClick: (p: Post) => void
}) {
  const today = todayISO()
  const c = CREATORS_BY_ID[creatorId]
  const metrics = creatorMetrics(creatorId, posts)
  if (!c || !metrics) return null

  const maxBar = Math.max(...metrics.histogram.map(h => h.count), 1)
  const recentPosts = metrics.posts
    .slice()
    .sort((a, b) => ((b.semana ?? 0) - (a.semana ?? 0)) || ((b.numVideo ?? 0) - (a.numVideo ?? 0)))
    .slice(0, 8)

  return (
    <div className="cp-wrap">
      <div style={{ marginBottom: 12 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', fontSize: 12.5, padding: '4px 0', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          ← Voltar
        </button>
      </div>

      <div className="cp-header">
        <div className="cp-avatar" style={{ background: c.color }}>{c.initial}</div>
        <div className="cp-id">
          <div className="cp-name">{c.name}</div>
          <div className="cp-meta">
            <span>Creator contratad{c.name.endsWith('a') ? 'a' : 'o'}</span>
            <span>·</span>
            <span>Desde {fmtBR(c.dataEntrada)}</span>
            <span>·</span>
            <span><strong>{semanaLabel(c.semanaAtual)}</strong> · {c.semanaAtual} semanas no time</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 8, letterSpacing: '0.03em' }}>
            📁 {c.dropboxPath}
          </div>
        </div>
        <div className="cp-headline">
          <div className="cp-onTime">Entregas no prazo</div>
          <div className="cp-onTime-val">{metrics.noPrazoPct}%</div>
        </div>
      </div>

      <div className="cp-stats">
        {[
          { label: 'Vídeos totais', val: metrics.total, sub: 'desde a entrada' },
          { label: 'Esta semana', val: metrics.thisWeek, sub: semanaLabel(c.semanaAtual) },
          { label: 'Em pauta agora', val: metrics.emPauta, sub: 'aguardando entrega' },
          { label: 'Média / semana', val: metrics.avgPerWeek, sub: 'vídeos por semana' },
        ].map(s => (
          <div key={s.label} className="cp-stat">
            <div className="cp-stat-label">{s.label}</div>
            <div className="cp-stat-val">{s.val}</div>
            <div className="cp-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="cp-histogram">
        <div className="cp-histogram-title">
          <span>Últimas 12 semanas</span>
          <span className="helper">passe o mouse para ver o número</span>
        </div>
        <div className="cp-bars" style={{ paddingBottom: 18, marginBottom: 4 }}>
          {metrics.histogram.map((h, i) => (
            <div key={i} className={`cp-bar ${h.isCurrent ? 'current' : ''}`} style={{ height: `${(h.count / maxBar) * 100}%` }} title={`${semanaLabel(h.semana)}: ${h.count} vídeos`}>
              <div className="cp-bar-val">{h.count}</div>
              <div className="cp-bar-label">{h.semana}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="cp-section-title">Pautas recentes</div>
      {recentPosts.length === 0 ? (
        <div style={{ color: 'var(--ink-3)', fontSize: 13, padding: '20px 0' }}>Nenhuma pauta cadastrada ainda.</div>
      ) : (
        <div className="pauta-group" style={{ marginBottom: 0 }}>
          {recentPosts.map(p => {
            const prazo = p.prazo
            const isLate = prazo && prazo < today && (p.status === 'pauta' || p.status === 'entregue')
            return (
              <div key={p.id} className="pauta-row" onClick={() => onPostClick(p)}>
                <div className="num">{semanaLabel(p.semana ?? 0)} · {videoLabel(p.numVideo ?? 1)}</div>
                <div>
                  <div className="hook">{p.title}</div>
                  {p.product && <div className="product">{p.product}</div>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>IG {fmtBR(p.date)}</div>
                <PautaPlatformPair post={p} allPosts={allPosts} onTTClick={onPostClick} />
                <div><PautaStatusBadge status={p.status} /></div>
                <div className={`pauta-prazo ${isLate ? 'late' : ''}`}>
                  <span className="lbl">Prazo</span>
                  {prazo ? fmtBR(prazo) : '—'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── BatchPautaModal ──────────────────────────────────────────

function emptyVideo(prazoDefault: string): VideoForm {
  return { _id: Math.random().toString(36).slice(2), hook: '', ref: '', product: '', audio: '', notes: '', prazo: prazoDefault }
}

function BatchPautaModal({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: (posts: Post[], meta: { docUrl: string }) => void
}) {
  const [creatorId, setCreatorId] = useState<MHCreatorId>('CARINA')
  const creator = CREATORS_BY_ID[creatorId]
  const nextSemana = creator.semanaAtual + 1
  const [semanaInput, setSemanaInput] = useState<string>(String(nextSemana))
  const semana = parseInt(semanaInput, 10) || nextSemana
  const defaultPrazo = addDaysISO(todayISO(), 7)
  const [videos, setVideos] = useState<VideoForm[]>([emptyVideo(defaultPrazo)])
  const [step, setStep] = useState<'form' | 'sending' | 'done' | 'error'>('form')
  const [docUrl, setDocUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [creatorOpen, setCreatorOpen] = useState(false)

  if (!open) return null

  const setVideo = (idx: number, k: keyof VideoForm, v: string) =>
    setVideos(arr => arr.map((vid, i) => i === idx ? { ...vid, [k]: v } : vid))
  const addVideo = () => setVideos(arr => [...arr, emptyVideo(defaultPrazo)])
  const removeVideo = (idx: number) => setVideos(arr => arr.filter((_, i) => i !== idx))
  const canGenerate = videos.some(v => v.hook.trim().length > 0)

  const handleConfirm = async () => {
    const filled = videos.filter(v => v.hook.trim().length > 0)
    setStep('sending')
    try {
      const res = await fetch('/api/mh/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator: creatorId,
          semana: semana,
          videos: filled.map(v => ({
            hook: v.hook, referencia: v.ref, produto: v.product,
            audio: v.audio, obs: v.notes, prazo: v.prazo,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido')
      setDocUrl(data.docUrl)

      const today = todayISO()
      const creatorName = CREATORS_BY_ID[creatorId]?.name ?? creatorId
      const newPosts: Post[] = filled.map((v, i) => ({
        id: String(Date.now() + i),
        source: 'mh' as const,
        title: v.hook,
        owner: creatorName,
        platform: 'ig' as const,
        date: addDaysISO(today, 7 + i),
        time: '12:00',
        status: 'pauta' as const,
        format: 'Reels',
        tags: ['trends'],
        campaign: '',
        product: v.product,
        caption: '',
        link: '',
        ref: v.ref || '',
        obs: v.notes || '',
        deadline: v.prazo,
        videoLink: '',
        coverLink: '',
        slideLinks: [],
        semana: semana,
        numVideo: i + 1,
        audio: v.audio || '',
        prazo: v.prazo,
        dropboxLink: '',
        briefingFile: data.docUrl,
      }))
      onCreated(newPosts, { docUrl: data.docUrl })
      setStep('done')
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : String(e))
      setStep('error')
    }
  }

  const reset = () => { setVideos([emptyVideo(defaultPrazo)]); setStep('form'); setDocUrl(''); setErrorMsg('') }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal batch-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ width: 44, height: 44, borderRadius: 11, background: 'oklch(0.55 0.12 280)', display: 'grid', placeItems: 'center', color: 'white', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: '0.03em', flexShrink: 0 }}>
            MH
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>
              {step === 'form' || step === 'sending' ? 'Nova pauta em lote' : step === 'done' ? 'Pauta criada' : 'Erro'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
              {(step === 'form' || step === 'sending') && (
                <>
                  <span style={{ color: 'var(--ink)' }}>Criar pauta de</span>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setCreatorOpen(o => !o)} disabled={step === 'sending'} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px 4px 5px', borderRadius: 8, border: '1.5px solid var(--accent-soft)', background: 'var(--accent-softer)', cursor: 'pointer', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: creator.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>{creator.initial}</span>
                      {creator.name}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    {creatorOpen && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setCreatorOpen(false)} />
                        <div className="popover" style={{ top: '100%', marginTop: 4, left: 0, minWidth: 200, zIndex: 56 }}>
                          {CREATORS.map(cc => (
                            <button key={cc.id} className="po-item" onClick={() => { setCreatorId(cc.id); setSemanaInput(String(cc.semanaAtual + 1)); setCreatorOpen(false) }}>
                              <span style={{ width: 20, height: 20, borderRadius: '50%', background: cc.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, marginRight: 4 }}>{cc.initial}</span>
                              {cc.name}
                              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{semanaLabel(cc.semanaAtual + 1)}</span>
                              {cc.id === creatorId && <span style={{ color: 'var(--accent)' }}>✓</span>}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <span style={{ color: 'var(--ink)' }}>· semana</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-mono)', background: 'var(--accent-soft)', color: 'var(--accent-deep)', padding: '2px 8px', borderRadius: 7, fontSize: 16, gap: 2 }}>
                    S<input
                      type="number"
                      min={1}
                      value={semanaInput}
                      onChange={e => setSemanaInput(e.target.value)}
                      disabled={step === 'sending'}
                      style={{ width: 40, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--accent-deep)', padding: 0, textAlign: 'left' }}
                    />
                  </span>
                </>
              )}
              {step === 'done' && <span>✓ {videos.filter(v => v.hook.trim()).length} vídeos adicionados às pautas de {creator.name}</span>}
              {step === 'error' && <span style={{ color: 'oklch(0.55 0.18 25)' }}>Não foi possível criar o briefing</span>}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {(step === 'form' || step === 'sending') && (
          <div className="batch-body">
            <div className="batch-helper">
              Adiciona os vídeos da semana <strong>{semanaLabel(semana)}</strong> para <strong>{creator.name}</strong> e atualiza o Google Docs dela com as pautas. Cada vídeo aparece em Pautas com status <span className="pauta-status s-pauta" style={{ display: 'inline-flex', padding: '1px 7px', fontSize: 10.5, verticalAlign: 'middle' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: 'oklch(0.55 0.12 280)' }} /> Em pauta</span>.
            </div>
            {videos.map((v, i) => (
              <div className="batch-video" key={v._id} style={{ opacity: step === 'sending' ? 0.5 : 1 }}>
                <div className="batch-video-head">
                  <div className="batch-video-num">VÍDEO {pad2(i + 1)}</div>
                  {videos.length > 1 && step === 'form' && (
                    <button className="batch-video-remove" onClick={() => removeVideo(i)}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      remover
                    </button>
                  )}
                </div>
                <div className="batch-grid">
                  <div className="batch-field full"><label>Hook / Take inicial</label><textarea className="field" rows={2} placeholder="Ex: pov: aquela amiga que acha tudo aesthetic" value={v.hook} onChange={e => setVideo(i, 'hook', e.target.value)} disabled={step === 'sending'} /></div>
                  <div className="batch-field full"><label>Link de referência</label><input className="field" placeholder="https://www.instagram.com/reel/..." value={v.ref} onChange={e => setVideo(i, 'ref', e.target.value)} disabled={step === 'sending'} /></div>
                  <div className="batch-field"><label>Produto foco</label><input className="field" placeholder="Ex: Tote Puffer · Case" value={v.product} onChange={e => setVideo(i, 'product', e.target.value)} disabled={step === 'sending'} /></div>
                  <div className="batch-field"><label>Áudio sugerido</label><input className="field" placeholder="Ex: pop indie, trend BR..." value={v.audio} onChange={e => setVideo(i, 'audio', e.target.value)} disabled={step === 'sending'} /></div>
                  <div className="batch-field"><label>Prazo de entrega</label><DatePicker value={v.prazo} onChange={val => setVideo(i, 'prazo', val)} /></div>
                  <div className="batch-field"><label>Observações</label><input className="field" placeholder="Detalhes, adaptações..." value={v.notes} onChange={e => setVideo(i, 'notes', e.target.value)} disabled={step === 'sending'} /></div>
                </div>
              </div>
            ))}
            {step === 'form' && (
              <button className="batch-add" onClick={addVideo}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                Adicionar vídeo
              </button>
            )}
          </div>
        )}

        {step === 'done' && (
          <div className="batch-body" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, margin: '8px auto 16px', borderRadius: '50%', background: 'oklch(0.95 0.045 165)', color: 'oklch(0.45 0.14 165)', display: 'grid', placeItems: 'center', fontSize: 32, fontWeight: 700 }}>✓</div>
            <div style={{ fontSize: 17, color: 'var(--ink)', marginBottom: 6, fontWeight: 600 }}>{videos.filter(v => v.hook.trim()).length} vídeos criados</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 18 }}>
              Semana adicionada ao briefing de {creator.name} no Google Docs.
            </div>
            <a href={docUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent)', textDecoration: 'none', border: '1px solid var(--accent-soft)', borderRadius: 8, padding: '7px 14px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Abrir Pautas {creator.name}
            </a>
          </div>
        )}

        {step === 'error' && (
          <div className="batch-body" style={{ padding: '24px' }}>
            <div style={{ background: 'oklch(0.97 0.02 25)', border: '1px solid oklch(0.85 0.08 25)', borderRadius: 10, padding: '16px 20px', color: 'oklch(0.45 0.18 25)', fontSize: 13 }}>
              <strong>Erro ao criar briefing:</strong><br />
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, wordBreak: 'break-all' }}>{errorMsg}</code>
            </div>
          </div>
        )}

        <div className="modal-foot">
          {step === 'form' && (
            <>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{videos.filter(v => v.hook.trim()).length} de {videos.length} preenchidos</div>
              <div style={{ flex: 1 }} />
              <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
              <button className="btn btn-accent" onClick={handleConfirm} disabled={!canGenerate} style={{ opacity: canGenerate ? 1 : 0.5, cursor: canGenerate ? 'pointer' : 'not-allowed' }}>
                Criar pauta e atualizar Google Doc
              </button>
            </>
          )}
          {step === 'sending' && (
            <>
              <div style={{ flex: 1 }} />
              <button className="btn btn-accent" disabled style={{ opacity: 0.6, cursor: 'wait' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>
                Atualizando Google Doc…
              </button>
            </>
          )}
          {step === 'done' && (
            <>
              <button className="btn btn-ghost" onClick={reset}>Criar mais uma pauta</button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-accent" onClick={onClose}>Concluir</button>
            </>
          )}
          {step === 'error' && (
            <>
              <button className="btn btn-ghost" onClick={() => setStep('form')}>← Voltar e tentar novamente</button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-ghost" onClick={onClose}>Fechar</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ListView ─────────────────────────────────────────────────

const STATUS_ORDER = ['sched', 'entregue', 'prod', 'pauta', 'pub', 'cancel']

function ListView({
  posts, allPosts, onPostClick, year, month,
}: {
  posts: Post[]
  allPosts: Post[]
  onPostClick: (p: Post) => void
  year: number
  month: number
}) {
  const [statusFilter, setStatusFilter] = useState<string>('sched')
  const [creatorFilter, setCreatorFilter] = useState<string>('all')
  const today = todayISO()

  const filtered = useMemo(() => {
    return posts
      .filter(p => {
        const d = parseISO(p.date)
        if (d.getFullYear() !== year || d.getMonth() !== month) return false
        if (statusFilter !== 'all' && p.status !== statusFilter) return false
        if (creatorFilter !== 'all' && ownerToCreatorId(p.owner) !== creatorFilter) return false
        return true
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        return a.time.localeCompare(b.time)
      })
  }, [posts, year, month, statusFilter, creatorFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, Post[]>()
    for (const p of filtered) {
      if (!map.has(p.date)) map.set(p.date, [])
      map.get(p.date)!.push(p)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const weekday = (iso: string) => {
    const d = parseISO(iso)
    return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()]
  }

  const platformLabel = (p: Post) => p.platform === 'tiktok' ? 'TT' : p.platform === 'ig' ? 'IG' : p.platform?.toUpperCase() ?? 'IG'

  return (
    <div className="pautas-view">
      {/* Filters */}
      <div className="pautas-filter" style={{ flexWrap: 'wrap', gap: 6 }}>
        <span className="label">Status:</span>
        {[{ id: 'all', label: 'Todos' }, ...STATUSES_MH.map(s => ({ id: s.id, label: s.label }))].map(s => (
          <button
            key={s.id}
            className={`creator-filter-pill ${statusFilter === s.id ? 'active' : ''}`}
            onClick={() => setStatusFilter(s.id)}
          >
            {s.id !== 'all' && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUSES_MH.find(x => x.id === s.id)?.dot, flexShrink: 0 }} />
            )}
            {s.label}
          </button>
        ))}
        <span className="label" style={{ marginLeft: 8 }}>Creator:</span>
        <button className={`creator-filter-pill all ${creatorFilter === 'all' ? 'active' : ''}`} onClick={() => setCreatorFilter('all')}>Todos</button>
        {CREATORS.map(c => (
          <button key={c.id} className={`creator-filter-pill ${creatorFilter === c.id ? 'active' : ''}`} onClick={() => setCreatorFilter(c.id)}>
            <span className="cfp-av" style={{ background: c.color }}>{c.initial}</span>
            {c.name}
          </button>
        ))}
      </div>

      {/* Count */}
      <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: '0 0 8px', marginTop: -4 }}>
        {filtered.length} post{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* List */}
      {grouped.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--ink-3)' }}>
          Nenhum post encontrado para este mês / filtro.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {grouped.map(([date, dayPosts]) => {
            const isToday = date === today
            const isPast = date < today
            return (
              <div key={date} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', paddingBottom: 2 }}>
                {/* Date column */}
                <div style={{
                  width: 64, flexShrink: 0, paddingTop: 10,
                  textAlign: 'right', fontFamily: 'var(--font-mono)',
                  fontSize: 12.5, lineHeight: 1.3,
                  color: isToday ? 'var(--accent)' : isPast ? 'var(--ink-3)' : 'var(--ink-2)',
                  fontWeight: isToday ? 700 : 500,
                }}>
                  <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{date.slice(8)}</div>
                  <div style={{ fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{weekday(date)}</div>
                  {isToday && <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2, fontWeight: 700 }}>hoje</div>}
                </div>

                {/* Posts column */}
                <div style={{ flex: 1, borderLeft: `2px solid ${isToday ? 'var(--accent-soft)' : 'var(--border)'}`, paddingLeft: 16, paddingTop: 8, paddingBottom: 8 }}>
                  {dayPosts.map(p => {
                    const creator = CREATORS_BY_ID[ownerToCreatorId(p.owner)]
                    const status = STATUSES_MH.find(s => s.id === p.status)
                    return (
                      <div
                        key={p.id}
                        onClick={() => onPostClick(p)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 12px', marginBottom: 4, borderRadius: 10,
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          cursor: 'pointer', transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-softer)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
                      >
                        {/* Time */}
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-3)', width: 40, flexShrink: 0 }}>{p.time}</div>

                        {/* Platform */}
                        <div style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                          padding: '2px 6px', borderRadius: 5,
                          background: p.platform === 'tiktok' ? 'oklch(0.92 0.04 0)' : 'oklch(0.9 0.05 300)',
                          color: p.platform === 'tiktok' ? 'oklch(0.4 0.1 0)' : 'oklch(0.45 0.12 300)',
                          flexShrink: 0,
                        }}>
                          {platformLabel(p)}
                        </div>

                        {/* Creator chip */}
                        {creator && (
                          <span style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: creator.color, color: 'white',
                            display: 'grid', placeItems: 'center',
                            fontSize: 10, fontWeight: 700, flexShrink: 0,
                          }} title={creator.name}>{creator.initial}</span>
                        )}

                        {/* Title */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.title}
                          </div>
                          {p.product && (
                            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.product}
                            </div>
                          )}
                        </div>

                        {/* Format */}
                        {p.format && (
                          <div style={{ fontSize: 11, color: 'var(--ink-3)', flexShrink: 0 }}>{p.format}</div>
                        )}

                        {/* Status badge */}
                        {status && (
                          <span className={`pauta-status ${status.className}`} style={{ flexShrink: 0 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.dot, flexShrink: 0 }} />
                            {status.label}
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
      )}
    </div>
  )
}

// ─── MHView (main export) ─────────────────────────────────────

interface MHViewProps {
  onPostClick: (p: Post) => void
  allPosts?: Post[]
  onPostsAdded?: (posts: Post[]) => Promise<void>
  onPostsUpdated?: (posts: Post[]) => void
}

export default function MHView({ onPostClick, allPosts = [], onPostsAdded, onPostsUpdated }: MHViewProps) {
  const today = todayISO()
  const todayDate = parseISO(today)
  const router = useRouter()

  const [mhMode, setMhMode] = useState<MHMode>('pautas')
  const [creatorFilter, setCreatorFilter] = useState('all')
  const [activeCreator, setActiveCreator] = useState<MHCreatorId | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<{ found: number } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [year, setYear] = useState(todayDate.getFullYear())
  const [month, setMonth] = useState(todayDate.getMonth())

  const mhPosts = useMemo(() => allPosts.filter(p => p.source === 'mh'), [allPosts])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/mh/dropbox-sync', { method: 'POST' })
      const data = await res.json() as { updated?: string[]; error?: string }
      if (data.error) { setLastSyncResult({ found: 0 }); return }
      const ids: string[] = data.updated ?? []
      setLastSyncResult({ found: ids.length })
      if (ids.length > 0) {
        const updated = mhPosts
          .filter(p => ids.includes(p.id))
          .map(p => ({ ...p, status: 'entregue' as const, dropboxLink: `/MKT SOCIAL/CREATORS/${(p.owner ?? '').toUpperCase()}/Semana ${p.semana}` }))
        onPostsUpdated?.(updated)
      }
    } catch {
      setLastSyncResult({ found: 0 })
    } finally {
      setSyncing(false)
      setTimeout(() => setLastSyncResult(null), 6000)
    }
  }

  const handleBatchCreated = (newPosts: Post[]) => {
    onPostsAdded?.(newPosts)
    setBatchOpen(false)
  }

  const mhCountMonth = mhPosts.filter(p => {
    const d = parseISO(p.date)
    return d.getFullYear() === year && d.getMonth() === month
  }).length

  const goPrev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const goNext = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  if (activeCreator) {
    return (
      <CreatorProfileView
        creatorId={activeCreator}
        posts={mhPosts}
        allPosts={allPosts}
        onBack={() => setActiveCreator(null)}
        onPostClick={onPostClick}
      />
    )
  }

  return (
    <>
      {/* MH inner controls bar */}
      <div className="mh-controls">
        <div className="view-toggle">
          <button className={mhMode === 'pautas' ? 'active' : ''} onClick={() => setMhMode('pautas')}>Pautas</button>
          <button className={mhMode === 'month' ? 'active' : ''} onClick={() => setMhMode('month')}>Calendário</button>
          <button className={mhMode === 'list' ? 'active' : ''} onClick={() => setMhMode('list')}>Lista</button>
        </div>

        {(mhMode === 'month' || mhMode === 'list') && (
          <>
            <div className="month-nav" style={{ marginLeft: 8 }}>
              <button onClick={goPrev}><Icon.chevL /></button>
              <div className="label">{MONTHS[month]} {year}</div>
              <button onClick={goNext}><Icon.chevR /></button>
            </div>
            {mhMode === 'month' && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{mhCountMonth} posts neste mês</span>}
          </>
        )}

        <div className="mh-controls-spacer" />

        <button className="btn btn-accent" onClick={() => setBatchOpen(true)}>
          <Icon.plus /> Nova pauta da semana
        </button>
      </div>

      {/* Views */}
      {mhMode === 'pautas' && (
        <PautasView
          posts={mhPosts}
          allPosts={allPosts}
          onPostClick={onPostClick}
          creatorFilter={creatorFilter}
          onCreatorFilterChange={setCreatorFilter}
          onCreatePauta={() => setBatchOpen(true)}
          onSimulateSync={handleSync}
          syncing={syncing}
          lastSyncResult={lastSyncResult}
          onSelectCreator={id => setActiveCreator(id)}
        />
      )}

      {mhMode === 'month' && (
        <div className="cal-wrap">
          <CalendarGrid
            year={year}
            month={month}
            posts={mhPosts}
            events={[]}
            onPostClick={onPostClick}
            onNewPost={() => {}}
            onPostDrop={() => {}}
          />
        </div>
      )}

      {mhMode === 'list' && (
        <ListView
          posts={mhPosts}
          allPosts={allPosts}
          onPostClick={onPostClick}
          year={year}
          month={month}
        />
      )}

      <BatchPautaModal
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        onCreated={handleBatchCreated}
      />
    </>
  )
}

export { CREATORS, CREATORS_BY_ID, semanaLabel }
