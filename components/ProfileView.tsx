'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Icon, PlatformIcon } from './Icons'
import { Post, Campaign, STATUSES, PLATFORMS, MONTH_ABBR } from '@/lib/types'
import type { TeamProfile } from '@/lib/types'

// ─── Avatar ──────────────────────────────────────────────────
function ProfileAvatar({ profile, size = 80 }: { profile: TeamProfile; size?: number }) {
  const [imgError, setImgError] = useState(false)

  if (profile.avatarUrl && !imgError) {
    return (
      <img
        src={profile.avatarUrl}
        alt={profile.name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        style={{
          width: size, height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          display: 'block',
          boxShadow: '0 6px 20px rgba(30,20,50,.12)',
        }}
      />
    )
  }

  return (
    <div
      className="profile-avatar"
      style={{
        width: size, height: size,
        flexShrink: 0,
        background: `linear-gradient(135deg, ${profile.color}, color-mix(in oklab, ${profile.color}, black 15%))`,
        fontSize: size * 0.4,
      }}
    >
      {profile.initial}
    </div>
  )
}

// ─── Edit Modal ───────────────────────────────────────────────
function EditModal({ profile, onClose, onSave }: {
  profile: TeamProfile
  onClose: () => void
  onSave: (updated: { name: string; role: string }) => void
}) {
  const [name, setName] = useState(profile.name)
  const [role, setRole] = useState(profile.role)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile.supabaseId) { setError('Perfil sem ID Supabase.'); return }
    setSaving(true)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('profiles')
      .update({ name: name.trim(), role: role.trim() })
      .eq('id', profile.supabaseId)
    setSaving(false)
    if (err) { setError(err.message); return }
    onSave({ name: name.trim(), role: role.trim() })
    onClose()
  }

  return (
    <div className="edit-modal-backdrop" onClick={onClose}>
      <div className="edit-modal" onClick={e => e.stopPropagation()}>
        <h3>Editar perfil</h3>
        <form onSubmit={handleSubmit}>
          <div className="edit-field">
            <label>Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="edit-field">
            <label>Cargo / Função</label>
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="Ex: Social Media Manager" />
          </div>
          {error && <div style={{ fontSize: 12, color: 'var(--s-cancel)', marginBottom: 8 }}>{error}</div>}
          <div className="edit-modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Stats 6 cards (current month) ───────────────────────────
const STATUS_COLOR: Record<string, string> = {
  pauta:    'var(--accent)',
  prod:     'var(--s-prod)',
  sched:    'var(--s-sched)',
  pub:      'var(--s-pub)',
  entregue: '#22c55e',
  cancel:   'var(--s-cancel)',
}

function ProfileStats6({ posts, profileId }: { posts: Post[]; profileId: string }) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const mine = posts.filter(p => p.owner === profileId && p.date.startsWith(currentMonth))

  const cards = [
    { label: 'Posts atribuídos', n: mine.length,                                                    color: 'var(--ink)' },
    { label: 'Em pauta',         n: mine.filter(p => p.status === 'pauta').length,                  color: STATUS_COLOR.pauta },
    { label: 'Em produção',      n: mine.filter(p => p.status === 'prod').length,                   color: STATUS_COLOR.prod },
    { label: 'Agendados',        n: mine.filter(p => p.status === 'sched').length,                  color: STATUS_COLOR.sched },
    { label: 'Publicados',       n: mine.filter(p => p.status === 'pub').length,                    color: STATUS_COLOR.pub },
    { label: 'Entregues',        n: mine.filter(p => p.status === 'entregue').length,               color: STATUS_COLOR.entregue },
  ]

  return (
    <div className="profile-stats-6">
      {cards.map(c => (
        <div key={c.label} className="stat6">
          <div className="n" style={{ color: c.color }}>{c.n}</div>
          <div className="l">{c.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Info Cards ───────────────────────────────────────────────
function BarRow({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div className="bar-row">
      <span className="label">{label}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="count">{count}</span>
    </div>
  )
}

function PlatformsCard({ posts }: { posts: Post[] }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of posts) map[p.platform] = (map[p.platform] ?? 0) + 1
    return map
  }, [posts])
  const max = Math.max(...Object.values(counts), 1)

  return (
    <div className="profile-info-card">
      <div className="pic-title">Plataformas</div>
      {PLATFORMS.map(pl => counts[pl.id] ? (
        <BarRow key={pl.id} label={pl.label} count={counts[pl.id]} max={max} color={pl.color} />
      ) : null)}
      {Object.keys(counts).length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Sem posts</div>}
    </div>
  )
}

function FormatsCard({ posts }: { posts: Post[] }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of posts) if (p.format) map[p.format] = (map[p.format] ?? 0) + 1
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [posts])
  const max = counts[0]?.[1] ?? 1

  return (
    <div className="profile-info-card">
      <div className="pic-title">Tipo de conteúdo</div>
      {counts.map(([fmt, n]) => (
        <BarRow key={fmt} label={fmt} count={n} max={max} color="var(--accent)" />
      ))}
      {counts.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Sem posts</div>}
    </div>
  )
}

function StatusDistCard({ posts }: { posts: Post[] }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of posts) map[p.status] = (map[p.status] ?? 0) + 1
    return map
  }, [posts])
  const total = posts.length || 1

  return (
    <div className="profile-info-card">
      <div className="pic-title">Distribuição por status</div>
      {STATUSES.filter(s => counts[s.id]).map(s => {
        const n = counts[s.id] ?? 0
        const pct = Math.round((n / total) * 100)
        return (
          <div key={s.id} className="bar-row">
            <span className="label">{s.label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${pct}%`, background: STATUS_COLOR[s.id] ?? 'var(--ink-3)' }} />
            </div>
            <span className="count">{pct}%</span>
          </div>
        )
      })}
      {posts.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Sem posts</div>}
    </div>
  )
}

function CampaignsCard({ posts, campaigns, profileId }: { posts: Post[]; campaigns: Campaign[]; profileId: string }) {
  const linked = useMemo(() => {
    const ownerSlugs = new Set(posts.filter(p => p.owner === profileId && p.campaign).map(p => p.campaign))
    return campaigns
      .filter(c => ownerSlugs.has(c.slug))
      .map(c => ({
        ...c,
        postCount: posts.filter(p => p.owner === profileId && p.campaign === c.slug).length,
      }))
      .sort((a, b) => b.postCount - a.postCount)
  }, [posts, campaigns, profileId])

  return (
    <div className="profile-info-card" style={{ gridColumn: '1 / -1' }}>
      <div className="pic-title">Campanhas vinculadas</div>
      {linked.length === 0 && (
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Nenhuma campanha vinculada</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
        {linked.map(c => (
          <div key={c.id} className="camp-row" style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 14 }}>
            <div className="camp-name">{c.nome}</div>
            <div className="camp-meta">{c.postCount} post{c.postCount !== 1 ? 's' : ''} atribuídos · {c.progresso ?? 0}% concluído</div>
            <div className="bar-track" style={{ marginTop: 4 }}>
              <div className="bar-fill" style={{ width: `${c.progresso ?? 0}%`, background: 'var(--accent)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Activities List ──────────────────────────────────────────
function ActivitiesList({ posts, profile, onPostClick }: {
  posts: Post[]; profile: TeamProfile; onPostClick: (p: Post) => void
}) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')

  // meses disponíveis extraídos dos posts deste membro
  const availableMonths = useMemo(() => {
    const seen = new Set<string>()
    const result: { value: string; label: string }[] = []
    const allMine = posts.filter(p => p.owner === profile.id).sort((a, b) => b.date.localeCompare(a.date))
    for (const p of allMine) {
      const ym = p.date.slice(0, 7) // "2026-06"
      if (!seen.has(ym)) {
        seen.add(ym)
        const d = new Date(p.date + 'T12:00:00')
        const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        result.push({ value: ym, label: label.charAt(0).toUpperCase() + label.slice(1) })
      }
    }
    return result
  }, [posts, profile.id])

  let mine = posts.filter(p => p.owner === profile.id)
  if (monthFilter !== 'all') mine = mine.filter(p => p.date.startsWith(monthFilter))
  if (statusFilter !== 'all') mine = mine.filter(p => p.status === statusFilter)
  mine.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))

  const baseCount = monthFilter === 'all'
    ? posts.filter(p => p.owner === profile.id).length
    : posts.filter(p => p.owner === profile.id && p.date.startsWith(monthFilter)).length

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <select
          value={monthFilter}
          onChange={e => { setMonthFilter(e.target.value); setStatusFilter('all') }}
          style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--ink)', cursor: 'pointer' }}
        >
          <option value="all">Todos os meses</option>
          {availableMonths.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        <button className={`tag-chip ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
          Todos ({baseCount})
        </button>
        {STATUSES.map(s => {
          const n = posts.filter(p => p.owner === profile.id && p.status === s.id && (monthFilter === 'all' || p.date.startsWith(monthFilter))).length
          if (!n) return null
          return (
            <button key={s.id} className={`tag-chip ${statusFilter === s.id ? 'active' : ''}`} onClick={() => setStatusFilter(s.id)}>
              {s.label} ({n})
            </button>
          )
        })}
      </div>

      {mine.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: 60, textAlign: 'center', color: 'var(--ink-3)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 4 }}>Nenhuma atividade</div>
          <div style={{ fontSize: 13 }}>Nenhum post com esse status.</div>
        </div>
      ) : (
        <div className="activity-list">
          {mine.map(p => {
            const plat   = PLATFORMS.find(x => x.id === p.platform)
            const status = STATUSES.find(s => s.id === p.status)
            const d      = new Date(p.date + 'T12:00:00')
            return (
              <div key={p.id} className="activity-row" onClick={() => onPostClick(p)}>
                <div className="ar-date">
                  <div className="day">{d.getDate()}</div>
                  <div className="month">{MONTH_ABBR[d.getMonth()]}</div>
                </div>
                {plat && (
                  <span style={{ width: 28, height: 28, flex: '0 0 28px', borderRadius: 8, background: plat.color, display: 'grid', placeItems: 'center' }}>
                    <PlatformIcon platform={p.platform} size={14} color="white" />
                  </span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ar-title">{p.title}</div>
                  <div className="ar-meta">
                    <span>{p.time}</span>
                    <span>·</span>
                    <span>{p.format}</span>
                    {p.campaign && (
                      <>
                        <span>·</span>
                        <span style={{ background: 'var(--accent-softer)', color: 'var(--accent-deep)', padding: '1px 7px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                          {p.campaign}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {status && (
                  <span className={`status-pill ${status.className}`}>
                    <span className="sdot" />{status.label}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Team Grid ────────────────────────────────────────────────
function TeamGrid({ posts, profiles, currentId, onSelect }: {
  posts: Post[]; profiles: TeamProfile[]; currentId: string; onSelect: (id: string) => void
}) {
  const inProgress = new Set(['pauta', 'prod', 'sched'])
  const done       = new Set(['pub', 'entregue'])

  return (
    <div className="team-grid">
      {profiles.map(p => {
        const mine    = posts.filter(x => x.owner === p.id)
        const ongoing = mine.filter(x => inProgress.has(x.status)).length
        const concluded = mine.filter(x => done.has(x.status)).length
        return (
          <button key={p.id} className={`team-card ${p.id === currentId ? 'current' : ''}`} onClick={() => onSelect(p.id)}>
            <ProfileAvatar profile={p} size={52} />
            <div style={{ marginTop: 12 }}>
              <div className="tc-name">
                {p.name}
                {p.isMe && <span className="me-tag">você</span>}
              </div>
              {p.role && <div className="tc-role">{p.role}</div>}
            </div>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)', width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--ink-3)' }}>Total atribuídos</span>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{mine.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--ink-3)' }}>Em andamento</span>
                <span style={{ fontWeight: 600, color: 'var(--s-prod)' }}>{ongoing}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--ink-3)' }}>Concluídos</span>
                <span style={{ fontWeight: 600, color: 'var(--s-pub)' }}>{concluded}</span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── Profile View ─────────────────────────────────────────────
interface Props {
  posts: Post[]
  profiles: TeamProfile[]
  campaigns: Campaign[]
  profileId: string
  meId: string
  onSelectProfile: (id: string) => void
  onPostClick: (p: Post) => void
  onProfileUpdate: (updated: Partial<TeamProfile>) => void
}

export default function ProfileView({ posts, profiles, campaigns, profileId, meId, onSelectProfile, onPostClick, onProfileUpdate }: Props) {
  const profile = profiles.find(p => p.id === profileId) ?? profiles.find(p => p.isMe) ?? profiles[0]
  const [tab, setTab] = useState<'activities' | 'team'>('activities')
  const [editOpen, setEditOpen] = useState(false)
  const isMe = profile?.id === meId

  if (!profile) return null

  const allMine = posts.filter(p => p.owner === profile.id)

  return (
    <div className="profile-wrap">
      {/* Banner */}
      <div className="profile-hero">
        {!isMe && (
          <button className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => onSelectProfile(profiles.find(p => p.isMe)?.id ?? meId)}>
            <Icon.chevL /> Voltar ao meu perfil
          </button>
        )}
        <div className="profile-hero-card">
          <div className="profile-avatar-wrap">
            <ProfileAvatar profile={profile} size={96} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ph-name">
              {profile.name}
              {isMe && <span className="me-tag">você</span>}
            </div>
            {profile.role && <div className="ph-role">{profile.role}</div>}
            <div className="ph-meta">
              <span><Icon.mail /> {profile.email}</span>
            </div>
          </div>
          {isMe && (
            <button className="btn btn-ghost" style={{ flexShrink: 0 }} onClick={() => setEditOpen(true)}>
              <Icon.settings /> Editar perfil
            </button>
          )}
        </div>
      </div>

      {/* Stats do mês vigente */}
      <ProfileStats6 posts={posts} profileId={profile.id} />

      {/* Info cards */}
      <div className="profile-info-grid">
        <PlatformsCard posts={allMine} />
        <FormatsCard posts={allMine} />
        <StatusDistCard posts={allMine} />
        <CampaignsCard posts={posts} campaigns={campaigns} profileId={profile.id} />
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={tab === 'activities' ? 'active' : ''} onClick={() => setTab('activities')}>
          Atividades atribuídas
        </button>
        <button className={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}>
          Equipe
        </button>
      </div>

      <div>
        {tab === 'activities' && (
          <ActivitiesList posts={posts} profile={profile} onPostClick={onPostClick} />
        )}
        {tab === 'team' && (
          <TeamGrid posts={posts} profiles={profiles} currentId={profile.id} onSelect={onSelectProfile} />
        )}
      </div>

      {editOpen && (
        <EditModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSave={onProfileUpdate}
        />
      )}
    </div>
  )
}
