'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CanalPost, PostStatus, Campaign, Brand } from '@/lib/types'
import { fmtBR } from '@/lib/types'
import { dbToCanalPost, canalPostToDb } from '@/lib/supabase/mappers'

// ─── Constants ───────────────────────────────────────────────

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const CANAL_GRID = '40px 122px minmax(0,1fr) 150px 132px 132px 116px'

const CANAL_TAGS: { id: string; label: string; color: string }[] = [
  { id: 'Engajamento',   label: 'Engajamento',   color: 'oklch(0.55 0.12 215)' },
  { id: 'Promocional',   label: 'Promocional',   color: 'oklch(0.58 0.17 25)'  },
  { id: 'Lançamento',    label: 'Lançamento',    color: 'oklch(0.52 0.15 290)' },
  { id: 'Institucional', label: 'Institucional', color: 'oklch(0.50 0.06 60)'  },
]

const CANAL_STATUSES: { id: PostStatus; label: string; cls: string }[] = [
  { id: 'prod',     label: 'Produção',   cls: 's-prod'    },
  { id: 'sched',    label: 'Agendado',   cls: 's-sched'   },
  { id: 'pub',      label: 'Publicado',  cls: 's-pub'     },
  { id: 'cancel',   label: 'Cancelado',  cls: 's-cancel'  },
  { id: 'pauta',    label: 'Pauta',      cls: 's-pauta'   },
  { id: 'entregue', label: 'Entregue',   cls: 's-entregue'},
]
const STATUS_BY_ID = Object.fromEntries(CANAL_STATUSES.map(s => [s.id, s]))
const TAG_BY_ID    = Object.fromEntries(CANAL_TAGS.map(t => [t.id, t]))

// ─── Helpers ─────────────────────────────────────────────────

function fmtBRL(v: number) {
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
function fmtBRLk(v: number) {
  return v >= 1000 ? `R$ ${Math.round(v / 1000)}k` : fmtBRL(v)
}
function monthKey(date: string) {
  const [y, m] = date.split('-')
  return `${MONTHS[Number(m) - 1]} ${y}`
}
function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// ─── Sub-components ──────────────────────────────────────────

function TagPill({ tag }: { tag: string }) {
  const t = TAG_BY_ID[tag]
  if (!t) return <span style={{ color: 'var(--ink-4)' }}>—</span>
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 11px', borderRadius: 999, fontSize: 12, fontWeight: 500,
      background: `color-mix(in oklab, ${t.color}, white 86%)`, color: t.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
      {t.label}
    </span>
  )
}

function StatusPill({ status }: { status: PostStatus }) {
  const s = STATUS_BY_ID[status]
  if (!s) return null
  return (
    <span className={`status-pill ${s.cls}`} style={{ pointerEvents: 'none' }}>
      <span className="sdot" />{s.label}
    </span>
  )
}

function CampChip({ campaign, campaigns }: { campaign: string; campaigns: Campaign[] }) {
  if (!campaign) return <span style={{ color: 'var(--ink-4)' }}>Sem campanha</span>
  const found = campaigns.find(c => c.slug === campaign || c.nome === campaign)
  const color = 'oklch(0.58 0.14 250)'
  return (
    <span className="canal-camp-chip" style={{ '--cc': color } as React.CSSProperties}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z"/>
      </svg>
      <span className="ccn">{found?.nome ?? campaign}</span>
    </span>
  )
}

function ExpCell({ label, children, span }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div className="exp-cell" style={span ? { gridColumn: `span ${span}` } : undefined}>
      <label>{label}</label>
      <div className="v">{children}</div>
    </div>
  )
}

// ─── Popover ─────────────────────────────────────────────────

function Popover({ open, onClose, children, width }: {
  open: boolean; onClose: () => void; children: React.ReactNode; width?: number
}) {
  if (!open) return null
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={onClose} />
      <div className="popover" style={{ top: '100%', marginTop: 4, left: 0, minWidth: width ?? 220, zIndex: 56 }}>
        {children}
      </div>
    </>
  )
}

function CnStatusSelect({ value, onChange }: { value: PostStatus; onChange: (v: PostStatus) => void }) {
  const [open, setOpen] = useState(false)
  const cur = STATUS_BY_ID[value] ?? CANAL_STATUSES[0]
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button className={`status-pill ${cur.cls}`} onClick={() => setOpen(o => !o)} type="button">
        <span className="sdot" />{cur.label}
        <svg viewBox="0 0 10 6" width={10} height={6} fill="none" stroke="currentColor" strokeWidth="1.8" style={{ marginLeft: 4 }}>
          <path d="M1 1l4 4 4-4"/>
        </svg>
      </button>
      <Popover open={open} onClose={() => setOpen(false)}>
        {CANAL_STATUSES.map(s => (
          <button key={s.id} className="po-item" type="button" onClick={() => { onChange(s.id); setOpen(false) }}>
            <span className="pdot" style={{ background: `var(--${s.cls.replace('s-','s-')})` }} />
            {s.label}
            {s.id === value && <span className="check">✓</span>}
          </button>
        ))}
      </Popover>
    </div>
  )
}

function CnTagSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const cur = TAG_BY_ID[value]
  return (
    <div className="field-wrap" style={{ position: 'relative', width: '100%' }}>
      <button className="field" type="button"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', width: '100%' }}
        onClick={() => setOpen(o => !o)}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: cur ? 'var(--ink)' : 'var(--ink-3)' }}>
          {cur && <span style={{ width: 8, height: 8, borderRadius: '50%', background: cur.color }} />}
          {cur ? cur.label : 'Selecionar tag…'}
        </span>
        <svg viewBox="0 0 10 6" width={10} height={6} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M1 1l4 4 4-4"/>
        </svg>
      </button>
      <Popover open={open} onClose={() => setOpen(false)}>
        {CANAL_TAGS.map(t => (
          <button key={t.id} className="po-item" type="button" onClick={() => { onChange(t.id); setOpen(false) }}>
            <span className="pdot" style={{ background: t.color }} />
            {t.label}
            {t.id === value && <span className="check">✓</span>}
          </button>
        ))}
      </Popover>
    </div>
  )
}

function CnCampSelect({ value, onChange, campaigns }: {
  value: string; onChange: (v: string) => void; campaigns: Campaign[]
}) {
  const [open, setOpen] = useState(false)
  const cur = campaigns.find(c => c.slug === value || c.nome === value)
  return (
    <div className="field-wrap" style={{ position: 'relative', width: '100%' }}>
      <button className="field" type="button"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', width: '100%' }}
        onClick={() => setOpen(o => !o)}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0, color: cur ? 'var(--ink)' : 'var(--ink-3)' }}>
          {cur && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.58 0.14 250)', flexShrink: 0 }} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cur ? cur.nome : 'Sem campanha'}
          </span>
        </span>
        <svg viewBox="0 0 10 6" width={10} height={6} fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flexShrink: 0 }}>
          <path d="M1 1l4 4 4-4"/>
        </svg>
      </button>
      <Popover open={open} onClose={() => setOpen(false)} width={260}>
        <button className="po-item" type="button" onClick={() => { onChange(''); setOpen(false) }}>
          <span className="pdot" style={{ background: 'var(--surface-3)', border: '1px dashed var(--line-2)' }} />
          Sem campanha
          {!value && <span className="check">✓</span>}
        </button>
        <div className="po-divider" />
        {campaigns.map(c => (
          <button key={c.id} className="po-item" type="button" onClick={() => { onChange(c.slug); setOpen(false) }}>
            <span className="pdot" style={{ background: 'oklch(0.58 0.14 250)' }} />
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</span>
            {(c.slug === value || c.nome === value) && <span className="check">✓</span>}
          </button>
        ))}
      </Popover>
    </div>
  )
}

function CnMoney({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="canal-money">
      <span className="cm-prefix">R$</span>
      <input
        type="number" min="0" step="1"
        value={value ?? ''}
        placeholder="0"
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────

interface ModalProps {
  post: CanalPost
  isNew: boolean
  campaigns: Campaign[]
  onClose: () => void
  onSave: (draft: CanalPost) => void
  onDelete: (post: CanalPost) => void
}

function CanalMessageModal({ post, isNew, campaigns, onClose, onSave, onDelete }: ModalProps) {
  const [draft, setDraft] = useState<CanalPost>(post)

  useEffect(() => { setDraft(post) }, [post.id])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const set = <K extends keyof CanalPost>(k: K, v: CanalPost[K]) =>
    setDraft(d => ({ ...d, [k]: v }))

  const utmPct = (draft.revenue ?? 0) > 0 && (draft.receitaUtm ?? 0) > 0
    ? (draft.receitaUtm! / draft.revenue!) : 0

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-post" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-head">
          <div className="canal-head-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11l18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 0 1-5.8-1.1V14" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              className="modal-title"
              value={draft.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Título da mensagem"
            />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
              <CnStatusSelect value={draft.status} onChange={v => set('status', v)} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                {isNew ? 'nova mensagem' : `#${draft.id.slice(-4)}`}
              </span>
            </div>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* LEFT — Detalhes */}
          <div className="col left">
            <div className="modal-col-head">
              <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
              </svg>
              Detalhes
            </div>
            <div className="modal-grid">
              <label>Data</label>
              <input className="field" type="date" value={draft.date} onChange={e => set('date', e.target.value)} />

              <label>Tag</label>
              <CnTagSelect value={draft.tag} onChange={v => set('tag', v)} />

              <label>Campanha</label>
              <CnCampSelect value={draft.campaign} onChange={v => set('campaign', v)} campaigns={campaigns} />

              <label>Cupom</label>
              <input
                className="field canal-mono-input"
                placeholder="ex: VANILOVER (opcional)"
                value={draft.cupom || ''}
                onChange={e => set('cupom', e.target.value.toUpperCase().replace(/\s/g, ''))}
              />
            </div>

            <div className="canal-modal-note">
              Mensagens de engajamento normalmente não têm cupom nem receita — deixe em branco.
            </div>
          </div>

          {/* RIGHT — Mensagem & Conversão */}
          <div className="col right">
            <div className="modal-col-head">
              <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Mensagem
            </div>
            <div className="stacked">
              <label>Texto que vai no canal</label>
              <textarea
                className="field legenda"
                placeholder="Escreva aqui a mensagem que será enviada no canal de transmissão…"
                value={draft.content || ''}
                onChange={e => set('content', e.target.value)}
              />
            </div>

            <div className="canal-conv-head">Conversão</div>

            <div className="stacked">
              <label>Link UTM</label>
              <div className="field link-field">
                <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                <input
                  placeholder="https://barbours.com.br/?utm_source=canal…"
                  value={draft.cupomUtm || ''}
                  onChange={e => set('cupomUtm', e.target.value)}
                />
              </div>
            </div>

            <div className="canal-money-row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>Receita total</label>
                <CnMoney value={draft.revenue} onChange={v => set('revenue', v)} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>Receita da UTM</label>
                <CnMoney value={draft.receitaUtm} onChange={v => set('receitaUtm', v)} />
              </div>
            </div>

            {utmPct > 0 && (
              <div className="canal-utm-pct">
                <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                </svg>
                {Math.round(utmPct * 100)}% da receita veio pela UTM do canal
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-foot">
          {!isNew && (
            <button className="danger" type="button" onClick={() => { onDelete(draft); onClose() }}>
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
              Excluir
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" type="button" onClick={() => { onSave(draft); onClose() }}>
            {isNew ? 'Criar mensagem' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────

interface Props {
  posts: CanalPost[]
  brand: Brand
  campaigns: Campaign[]
  onPostAdded:   (p: CanalPost) => void
  onPostUpdated: (p: CanalPost) => void
  onPostDeleted: (id: string) => void
}

// ─── Main Component ──────────────────────────────────────────

export default function CanalView({ posts, brand, campaigns, onPostAdded, onPostUpdated, onPostDeleted }: Props) {
  const supabase = createClient()

  const [messages, setMessages] = useState<CanalPost[]>(posts)
  const [filter, setFilter]     = useState<string>('all')
  const [query, setQuery]       = useState('')
  const [copied, setCopied]     = useState<string | null>(null)
  const [editing, setEditing]   = useState<{ post: CanalPost; isNew: boolean } | null>(null)

  useEffect(() => { setMessages(posts) }, [posts])

  // default: expand first message
  const [expandedId, setExpandedId] = useState<string | null>(() => posts[0]?.id ?? null)
  useEffect(() => {
    if (!expandedId && posts.length > 0) setExpandedId(posts[0].id)
  }, [posts])

  // ── Derived ──
  const filtered = useMemo(() => {
    let arr = [...messages].sort((a, b) => a.date.localeCompare(b.date))
    const statusIds = CANAL_STATUSES.map(s => s.id as string)
    if (filter !== 'all') {
      if (statusIds.includes(filter)) arr = arr.filter(m => m.status === filter)
      else arr = arr.filter(m => m.tag === filter)
    }
    const q = query.trim().toLowerCase()
    if (q) arr = arr.filter(m =>
      m.title.toLowerCase().includes(q) ||
      (m.content || '').toLowerCase().includes(q) ||
      (m.cupom || '').toLowerCase().includes(q)
    )
    return arr
  }, [messages, filter, query])

  const groups = useMemo(() => {
    const out: { key: string; items: CanalPost[] }[] = []
    let cur: { key: string; items: CanalPost[] } | null = null
    filtered.forEach(m => {
      const key = monthKey(m.date)
      if (!cur || cur.key !== key) { cur = { key, items: [] }; out.push(cur) }
      cur.items.push(m)
    })
    return out
  }, [filtered])

  const receitaTotal = useMemo(() => filtered.reduce((s, m) => s + (m.revenue ?? 0), 0), [filtered])

  const availableTags = useMemo(() => {
    const set = new Set(messages.map(m => m.tag).filter(Boolean))
    return CANAL_TAGS.filter(t => set.has(t.id))
  }, [messages])

  // ── CRUD ──
  function blankPost(): CanalPost {
    return {
      id: crypto.randomUUID(),
      date: todayISO(), time: '',
      title: '', content: '',
      tag: 'Engajamento', campaign: '',
      cupom: '', cupomUtm: '',
      revenue: null, receitaUtm: null,
      status: 'prod', obs: '', owner: '',
      brand,
    }
  }

  async function handleSave(draft: CanalPost) {
    const isNew = !messages.some(m => m.id === draft.id)
    const row = canalPostToDb(draft)
    if (isNew) {
      const { data } = await supabase.from('canal_posts').insert({ ...row, id: undefined }).select().single()
      const saved = data ? dbToCanalPost(data as Record<string, unknown>) : draft
      setMessages(arr => [...arr, saved])
      onPostAdded(saved)
      setExpandedId(saved.id)
    } else {
      await supabase.from('canal_posts').update(row).eq('id', draft.id)
      setMessages(arr => arr.map(m => m.id === draft.id ? draft : m))
      onPostUpdated(draft)
    }
  }

  async function handleDelete(post: CanalPost) {
    await supabase.from('canal_posts').delete().eq('id', post.id)
    setMessages(arr => arr.filter(m => m.id !== post.id))
    onPostDeleted(post.id)
    if (expandedId === post.id) setExpandedId(null)
  }

  function handleDuplicate(post: CanalPost) {
    const copy: CanalPost = { ...post, id: crypto.randomUUID(), title: `${post.title} (cópia)`, status: 'prod' }
    setEditing({ post: copy, isNew: true })
  }

  function copyUtm(id: string, url: string) {
    try { navigator.clipboard?.writeText(url) } catch {}
    setCopied(id)
    setTimeout(() => setCopied(c => c === id ? null : c), 1400)
  }

  // ── Render ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Filter bar */}
      <div className="filter-bar" style={{ padding: '4px 32px 18px' }}>
        {/* Search */}
        <div className="search-box canal-search">
          <svg viewBox="0 0 16 16" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5l3 3"/>
          </svg>
          <input placeholder="Buscar…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>

        {/* Status pills */}
        {([
          { id: 'all',   label: 'Todos'     },
          { id: 'pub',   label: 'Publicado' },
          { id: 'sched', label: 'Agendado'  },
          { id: 'prod',  label: 'Produção'  },
        ] as const).map(f => (
          <button key={f.id}
            className={`platform-pill ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: 'var(--line)', margin: '0 4px' }} />

        {/* Tag pills */}
        {availableTags.map(t => (
          <button key={t.id}
            className={`platform-pill ${filter === t.id ? 'active' : ''}`}
            onClick={() => setFilter(f => f === t.id ? 'all' : t.id)}>
            <span className="dot" style={{ background: t.color }} />{t.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* Revenue pill */}
        {receitaTotal > 0 && (
          <span className="count-pill canal-rev-pill">{fmtBRLk(receitaTotal)} em receita</span>
        )}

        {/* Count pill */}
        <span className="count-pill">
          {filtered.length} {filtered.length === 1 ? 'mensagem' : 'mensagens'}
        </span>

        {/* Novo post */}
        <button className="btn btn-accent" onClick={() => setEditing({ post: blankPost(), isNew: true })}>
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Novo post
        </button>
      </div>

      {/* List */}
      <div className="list-wrap" style={{ paddingTop: 0 }}>
        <div className="list">

          {/* Header */}
          <div className="list-row list-head" style={{ gridTemplateColumns: CANAL_GRID }}>
            <div className="cell" />
            <div className="cell">Data</div>
            <div className="cell">Título</div>
            <div className="cell">Tag</div>
            <div className="cell">Cupom</div>
            <div className="cell">Status</div>
            <div className="cell" style={{ justifyContent: 'flex-end' }}>Receita</div>
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: '46px 16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              Nenhuma mensagem encontrada.
            </div>
          )}

          {groups.map(g => (
            <div key={g.key}>
              {/* Month divider */}
              <div className="canal-month-row">
                <span className="cmr-label">{g.key}</span>
                <span className="cmr-count">· {g.items.length} {g.items.length === 1 ? 'mensagem' : 'mensagens'}</span>
              </div>

              {g.items.map(m => {
                const isOpen = expandedId === m.id
                const d = new Date(m.date + 'T00:00:00')
                const utmPct = (m.revenue ?? 0) > 0 && (m.receitaUtm ?? 0) > 0
                  ? m.receitaUtm! / m.revenue! : 0

                return (
                  <div key={m.id}>
                    {/* Row */}
                    <div
                      className={`list-row expandable ${isOpen ? 'expanded' : ''}`}
                      style={{ gridTemplateColumns: CANAL_GRID }}
                      onClick={() => setExpandedId(isOpen ? null : m.id)}
                    >
                      {/* Chevron */}
                      <div className="cell" style={{ padding: '14px 0 14px 16px' }}>
                        <span style={{
                          display: 'inline-grid', placeItems: 'center',
                          width: 24, height: 24, borderRadius: 999, color: 'var(--ink-3)',
                          transition: 'transform .2s',
                          transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                        }}>
                          <svg viewBox="0 0 10 6" width={10} height={6} fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M1 1l4 4 4-4"/>
                          </svg>
                        </span>
                      </div>

                      {/* Data */}
                      <div className="cell canal-date">
                        <span className="cd-day">{fmtBR(m.date)}</span>
                        <span className="cd-dow">{WEEKDAYS[d.getDay()]}</span>
                      </div>

                      {/* Título */}
                      <div className="cell canal-title">{m.title}</div>

                      {/* Tag */}
                      <div className="cell"><TagPill tag={m.tag} /></div>

                      {/* Cupom */}
                      <div className="cell">
                        {m.cupom
                          ? <span className="canal-cupom">{m.cupom}</span>
                          : <span style={{ color: 'var(--ink-4)' }}>—</span>}
                      </div>

                      {/* Status */}
                      <div className="cell"><StatusPill status={m.status} /></div>

                      {/* Receita */}
                      <div className="cell canal-receita" style={{ justifyContent: 'flex-end' }}>
                        {(m.revenue ?? 0) > 0
                          ? <span className="cr-val">{fmtBRL(m.revenue!)}</span>
                          : <span style={{ color: 'var(--ink-4)' }}>—</span>}
                      </div>
                    </div>

                    {/* Expansion */}
                    {isOpen && (
                      <div className="list-expansion canal-expansion">
                        {/* Mensagem card */}
                        <div className="canal-msg">
                          <div className="canal-msg-label">Mensagem</div>
                          {m.content
                            ? <div className="canal-msg-body" style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                            : <div className="canal-msg-empty">Sem mensagem cadastrada.</div>}
                        </div>

                        {/* Detail grid */}
                        <div className="exp-grid canal-exp-grid">
                          <ExpCell label="Campanha vinculada">
                            <CampChip campaign={m.campaign} campaigns={campaigns} />
                          </ExpCell>
                          <ExpCell label="Tag"><TagPill tag={m.tag} /></ExpCell>
                          <ExpCell label="Cupom">
                            {m.cupom
                              ? <span className="canal-cupom">{m.cupom}</span>
                              : <span style={{ color: 'var(--ink-4)' }}>—</span>}
                          </ExpCell>
                          <ExpCell label="Receita">
                            {(m.revenue ?? 0) > 0
                              ? <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtBRL(m.revenue!)}</span>
                              : <span style={{ color: 'var(--ink-4)' }}>—</span>}
                          </ExpCell>

                          <ExpCell label="Link UTM" span={2}>
                            {m.cupomUtm ? (
                              <div className="canal-utm">
                                <span className="canal-utm-url" title={m.cupomUtm}>{m.cupomUtm}</span>
                                <button
                                  className="canal-utm-copy"
                                  type="button"
                                  onClick={e => { e.stopPropagation(); copyUtm(m.id, m.cupomUtm) }}
                                >
                                  {copied === m.id ? (
                                    <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                  ) : (
                                    <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>
                                    </svg>
                                  )}
                                  {copied === m.id ? 'copiado' : 'copiar'}
                                </button>
                              </div>
                            ) : <span style={{ color: 'var(--ink-4)' }}>—</span>}
                          </ExpCell>

                          <ExpCell label="Receita da UTM">
                            {(m.receitaUtm ?? 0) > 0
                              ? <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtBRL(m.receitaUtm!)}</span>
                              : <span style={{ color: 'var(--ink-4)' }}>—</span>}
                          </ExpCell>
                          <ExpCell label="% via UTM">
                            {utmPct > 0
                              ? <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(utmPct * 100)}%</span>
                              : <span style={{ color: 'var(--ink-4)' }}>—</span>}
                          </ExpCell>
                        </div>

                        {/* Actions */}
                        <div className="canal-exp-actions">
                          <button className="btn btn-accent" type="button"
                            onClick={e => { e.stopPropagation(); setEditing({ post: m, isNew: false }) }}>
                            Editar mensagem
                          </button>
                          <button className="btn btn-ghost" type="button"
                            onClick={e => { e.stopPropagation(); handleDuplicate(m) }}>
                            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>
                            </svg>
                            Duplicar
                          </button>
                          <div style={{ flex: 1 }} />
                          <button className="btn btn-ghost" type="button"
                            style={{ color: 'var(--ink-3)' }}
                            onClick={e => { e.stopPropagation(); handleDelete(m) }}>
                            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                            Excluir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {editing && (
        <CanalMessageModal
          post={editing.post}
          isNew={editing.isNew}
          campaigns={campaigns}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
