'use client'

import { useState, useRef } from 'react'
import { Icon, PlatformIcon } from './Icons'
import { Post, STATUSES, PLATFORMS, MONTH_ABBR } from '@/lib/types'
import { TEAM_PROFILES } from '@/lib/data'
import type { TeamProfile } from '@/lib/types'

// ─── Avatar ──────────────────────────────────────────────────
function ProfileAvatar({
  profile, size = 80, photo, editable = false, onPickPhoto,
}: {
  profile: TeamProfile; size?: number; photo?: string
  editable?: boolean; onPickPhoto?: (dataUrl: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="profile-avatar-wrap" style={{ width: size, height: size }}>
      {photo ? (
        <img src={photo} alt={profile.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
      ) : (
        <div className="profile-avatar" style={{
          width: '100%', height: '100%',
          background: `linear-gradient(135deg, ${profile.color}, color-mix(in oklab, ${profile.color}, black 15%))`,
          fontSize: size * 0.4,
        }}>
          {profile.initial}
        </div>
      )}
      {editable && (
        <>
          <button className="profile-avatar-edit" onClick={() => ref.current?.click()} title="Trocar foto">
            <Icon.camera />
          </button>
          <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
            const f = e.target.files?.[0]
            if (!f || !onPickPhoto) return
            const reader = new FileReader()
            reader.onload = () => onPickPhoto(reader.result as string)
            reader.readAsDataURL(f)
          }} />
        </>
      )}
    </div>
  )
}

// ─── Stats ───────────────────────────────────────────────────
function ProfileStats({ posts, profileId }: { posts: Post[]; profileId: string }) {
  const mine = posts.filter(p => p.owner === profileId)
  const counts = {
    total: mine.length,
    prod:  mine.filter(p => p.status === 'prod').length,
    sched: mine.filter(p => p.status === 'sched').length,
    pub:   mine.filter(p => p.status === 'pub').length,
  }
  return (
    <div className="profile-stats">
      <div className="stat">
        <div className="stat-n">{counts.total}</div>
        <div className="stat-l">Posts atribuídos</div>
      </div>
      <div className="stat">
        <div className="stat-n" style={{ color: 'var(--s-prod)' }}>{counts.prod}</div>
        <div className="stat-l">Em produção</div>
      </div>
      <div className="stat">
        <div className="stat-n" style={{ color: 'var(--s-sched)' }}>{counts.sched}</div>
        <div className="stat-l">Agendados</div>
      </div>
      <div className="stat">
        <div className="stat-n" style={{ color: 'var(--s-pub)' }}>{counts.pub}</div>
        <div className="stat-l">Publicados</div>
      </div>
    </div>
  )
}

// ─── Activities ───────────────────────────────────────────────
function ActivitiesList({ posts, profile, onPostClick }: {
  posts: Post[]; profile: TeamProfile; onPostClick: (p: Post) => void
}) {
  const [statusFilter, setStatusFilter] = useState('all')
  let mine = posts.filter(p => p.owner === profile.id)
  if (statusFilter !== 'all') mine = mine.filter(p => p.status === statusFilter)
  mine.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        <button className={`tag-chip ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>Todos</button>
        {STATUSES.map(s => (
          <button key={s.id} className={`tag-chip ${statusFilter === s.id ? 'active' : ''}`} onClick={() => setStatusFilter(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {mine.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: 60, textAlign: 'center', color: 'var(--ink-3)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 4 }}>Nenhuma atividade</div>
          <div style={{ fontSize: 13 }}>Nenhum post com esse status.</div>
        </div>
      ) : (
        <div className="activity-list">
          {mine.map(p => {
            const plat = PLATFORMS.find(x => x.id === p.platform)!
            const status = STATUSES.find(s => s.id === p.status)!
            const d = new Date(p.date + 'T12:00:00')
            return (
              <div key={p.id} className="activity-row" onClick={() => onPostClick(p)}>
                <div className="ar-date">
                  <div className="day">{d.getDate()}</div>
                  <div className="month">{MONTH_ABBR[d.getMonth()]}</div>
                </div>
                <span style={{ width: 28, height: 28, flex: '0 0 28px', borderRadius: 8, background: plat.color, display: 'grid', placeItems: 'center' }}>
                  <PlatformIcon platform={p.platform} size={14} color="white" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ar-title">{p.title}</div>
                  <div className="ar-meta">
                    <span>{p.time}</span>
                    <span>·</span>
                    <span>{p.type}</span>
                  </div>
                </div>
                <span className={`status-pill ${status.className}`}>
                  <span className="sdot" />{status.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Team grid ───────────────────────────────────────────────
function TeamGrid({ posts, currentId, onSelect, photos }: {
  posts: Post[]; currentId: string; onSelect: (id: string) => void; photos: Record<string, string>
}) {
  return (
    <div className="team-grid">
      {TEAM_PROFILES.map(p => {
        const count = posts.filter(x => x.owner === p.id).length
        const photo = photos[p.id]
        return (
          <button key={p.id} className={`team-card ${p.id === currentId ? 'current' : ''}`} onClick={() => onSelect(p.id)}>
            <ProfileAvatar profile={p} photo={photo} size={56} />
            <div style={{ marginTop: 14 }}>
              <div className="tc-name">
                {p.name}
                {p.isMe && <span className="me-tag">você</span>}
              </div>
              <div className="tc-role">{p.role}</div>
            </div>
            <div className="tc-stat">
              <span className="n">{count}</span>
              <span>posts atribuídos</span>
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
  profileId: string
  meId: string
  onSelectProfile: (id: string) => void
  onPostClick: (p: Post) => void
  photos: Record<string, string>
  onSetPhoto: (id: string, dataUrl: string) => void
}

export default function ProfileView({ posts, profileId, meId, onSelectProfile, onPostClick, photos, onSetPhoto }: Props) {
  const profile = TEAM_PROFILES.find(p => p.id === profileId) ?? TEAM_PROFILES[0]
  const [tab, setTab] = useState<'activities' | 'team'>('activities')
  const isMe = profile.id === meId
  const photo = photos[profile.id]

  const fmtDate = (iso: string) => {
    const d = new Date(iso + 'T12:00:00')
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
  }

  return (
    <div className="profile-wrap">
      <div className="profile-hero">
        {!isMe && (
          <button className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => onSelectProfile(meId)}>
            <Icon.chevL /> Voltar ao meu perfil
          </button>
        )}
        <div className="profile-hero-card">
          <ProfileAvatar
            profile={profile}
            size={96}
            photo={photo}
            editable={isMe}
            onPickPhoto={d => onSetPhoto(profile.id, d)}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ph-name">
              {profile.name}
              {isMe && <span className="me-tag">você</span>}
            </div>
            <div className="ph-role">{profile.role}</div>
            <div className="ph-meta">
              <span><Icon.mail /> {profile.email}</span>
              <span><Icon.cal /> Na equipe desde {fmtDate(profile.joined)}</span>
            </div>
          </div>
          {isMe && (
            <button className="btn btn-ghost">
              <Icon.settings /> Editar perfil
            </button>
          )}
        </div>
        <ProfileStats posts={posts} profileId={profile.id} />
      </div>

      <div className="profile-tabs">
        <button className={tab === 'activities' ? 'active' : ''} onClick={() => setTab('activities')}>
          Atividades atribuídas
        </button>
        {isMe && (
          <button className={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}>
            Equipe
          </button>
        )}
      </div>

      <div>
        {tab === 'activities' && (
          <ActivitiesList posts={posts} profile={profile} onPostClick={onPostClick} />
        )}
        {tab === 'team' && isMe && (
          <TeamGrid posts={posts} currentId={profile.id} onSelect={onSelectProfile} photos={photos} />
        )}
      </div>
    </div>
  )
}
