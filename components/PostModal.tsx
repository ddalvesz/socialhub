'use client'

import { useState, useEffect, useRef } from 'react'
import { Icon, PlatformIcon } from './Icons'
import { Popover, GenericSelect } from './FormHelpers'
import {
  Post, Platform, PostStatus,
  PLATFORMS, STATUSES, TAGS, LINHAS_ED, CAMP_LIST,
  CONTENT_TYPES_IG, CONTENT_TYPES_OTHER,
} from '@/lib/types'
import { TEAM_NAMES } from '@/lib/data'

interface Props {
  post: Post
  onClose: () => void
  onSave: (post: Post) => void
  onDelete: (post: Post) => void
  onDuplicate: (post: Post) => void
  showProduct?: boolean
}



// ─── Status select ───────────────────────────────────────────
function StatusSelect({ value, onChange }: { value: PostStatus; onChange: (v: PostStatus) => void }) {
  const [open, setOpen] = useState(false)
  const cur = STATUSES.find(s => s.id === value)!
  const dotColors: Record<PostStatus, string> = {
    prod: 'oklch(0.62 0.13 75)', sched: 'oklch(0.6 0.13 265)',
    pub: 'oklch(0.6 0.13 150)', cancel: 'oklch(0.6 0.05 25)',
  }
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button className={`status-pill ${cur.className}`} onClick={() => setOpen(o => !o)}>
        <span className="sdot" />
        {cur.label}
        <Icon.chevD />
      </button>
      <Popover open={open} onClose={() => setOpen(false)}>
        {STATUSES.map(s => (
          <button key={s.id} className="po-item" onClick={() => { onChange(s.id); setOpen(false) }}>
            <span className="pdot" style={{ background: dotColors[s.id] }} />
            {s.label}
            {s.id === value && <span className="check"><Icon.check /></span>}
          </button>
        ))}
      </Popover>
    </div>
  )
}

// ─── Platform select ─────────────────────────────────────────
function PlatformSelect({ value, onChange }: { value: Platform; onChange: (v: Platform) => void }) {
  const [open, setOpen] = useState(false)
  const cur = PLATFORMS.find(p => p.id === value)!
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button className="field" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, paddingRight: 10, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <span style={{ width: 18, height: 18, borderRadius: 5, background: cur.color, display: 'grid', placeItems: 'center' }}>
          <PlatformIcon platform={cur.id} size={11} color="white" />
        </span>
        {cur.label}
        <Icon.chevD />
      </button>
      <Popover open={open} onClose={() => setOpen(false)}>
        {PLATFORMS.map(p => (
          <button key={p.id} className="po-item" onClick={() => { onChange(p.id); setOpen(false) }}>
            <span style={{ width: 16, height: 16, borderRadius: 4, background: p.color, display: 'grid', placeItems: 'center' }}>
              <PlatformIcon platform={p.id} size={10} color="white" />
            </span>
            {p.label}
            {p.id === value && <span className="check"><Icon.check /></span>}
          </button>
        ))}
      </Popover>
    </div>
  )
}



// ─── Tags field ──────────────────────────────────────────────
function TagsField({ tags, onChange }: { tags: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const filtered = TAGS.filter(t => t.label.toLowerCase().includes(q.toLowerCase()))
  const toggle = (id: string) => {
    onChange(tags.includes(id) ? tags.filter(t => t !== id) : [...tags, id])
  }
  return (
    <div className="modal-tags" style={{ position: 'relative' }}>
      {tags.map(t => {
        const tag = TAGS.find(x => x.id === t) || { label: t }
        return (
          <span key={t} className="modal-tag">
            {tag.label}
            <span className="x" onClick={() => onChange(tags.filter(x => x !== t))}><Icon.x /></span>
          </span>
        )
      })}
      <button className="modal-tag-add" onClick={() => setOpen(true)}>+ Tag</button>
      <Popover open={open} onClose={() => { setOpen(false); setQ('') }}>
        <input className="po-input" placeholder="Buscar tag..." value={q} onChange={e => setQ(e.target.value)} autoFocus />
        <div style={{ marginTop: 4 }}>
          {filtered.map(t => (
            <button key={t.id} className="po-item" onClick={() => toggle(t.id)}>
              {t.label}
              {tags.includes(t.id) && <span className="check"><Icon.check /></span>}
            </button>
          ))}
        </div>
      </Popover>
    </div>
  )
}

// ─── Stars ───────────────────────────────────────────────────
function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} className={n <= value ? 'on' : ''} onClick={() => onChange(n)}>
          <Icon.star />
        </button>
      ))}
    </div>
  )
}

// ─── Main modal ──────────────────────────────────────────────
export default function PostModal({ post, onClose, onSave, onDelete, onDuplicate, showProduct }: Props) {
  const [draft, setDraft] = useState<Post>(post)

  useEffect(() => { setDraft(post) }, [post.id])
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const plat = PLATFORMS.find(p => p.id === draft.platform)!
  const set = <K extends keyof Post>(k: K, v: Post[K]) => setDraft(d => ({ ...d, [k]: v }))
  const types = draft.platform === 'ig' ? CONTENT_TYPES_IG : CONTENT_TYPES_OTHER

  const teamOptions = TEAM_NAMES.map(t => ({ id: t, label: t }))
  const lineaOptions = LINHAS_ED.map(l => ({ id: l.id, label: l.label }))
  const campOptions = [{ id: '', label: 'Sem campanha' }, ...CAMP_LIST]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className={`platform-mark plat-${plat.id}`}>
            <PlatformIcon platform={plat.id} size={20} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <input
              className="modal-title"
              value={draft.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Título do post"
            />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
              <StatusSelect value={draft.status} onChange={v => set('status', v)} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                #{String(draft.id).padStart(4, '0')}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <label>Dono</label>
            <GenericSelect value={draft.owner} options={teamOptions} onChange={v => set('owner', v)} width={180} />

            <label>Plataforma</label>
            <PlatformSelect value={draft.platform} onChange={v => set('platform', v)} />

            <label>Data e horário</label>
            <div className="field-inline">
              <input className="field" type="date" value={draft.date} onChange={e => set('date', e.target.value)} style={{ width: 180 }} />
              <input className="field" type="time" value={draft.time} onChange={e => set('time', e.target.value)} style={{ width: 120 }} />
            </div>

            <label>Tipo de conteúdo</label>
            <GenericSelect value={draft.type} options={types.map(t => ({ id: t, label: t }))} onChange={v => set('type', v)} />

            <label>Complexidade</label>
            <div className="field-inline">
              <Stars value={draft.complexity} onChange={v => set('complexity', v)} />
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{draft.complexity}/5</span>
            </div>

            {showProduct && (
              <>
                <label>Produto</label>
                <input className="field" placeholder="ex: Carteira Care..." value={draft.product || ''} onChange={e => set('product', e.target.value)} />
              </>
            )}

            <label>Tags</label>
            <TagsField tags={draft.tags || []} onChange={v => set('tags', v)} />

            <label>Linha editorial</label>
            <GenericSelect value={draft.linha} options={lineaOptions} onChange={v => set('linha', v)} />

            <label>Campanha</label>
            <GenericSelect value={draft.campanha || ''} options={campOptions} onChange={v => set('campanha', v || null)} placeholder="Sem campanha" />

            <label>Link do conteúdo</label>
            <input className="field" placeholder="https://..." value={draft.link} onChange={e => set('link', e.target.value)} />

            <label>Link de referência</label>
            <input className="field" placeholder="https://..." value={draft.ref} onChange={e => set('ref', e.target.value)} />

            <label style={{ alignSelf: 'flex-start', paddingTop: 10 }}>Observações</label>
            <textarea className="field" rows={3} placeholder="Comentários internos..." value={draft.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        <div className="modal-foot">
          <button className="danger" onClick={() => { onDelete(draft); onClose() }}>
            <Icon.trash /> Excluir
          </button>
          <button className="btn btn-ghost" onClick={() => onDuplicate(draft)}>
            <Icon.copy /> Duplicar
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={() => { onSave(draft); onClose() }}>Salvar alterações</button>
        </div>
      </div>
    </div>
  )
}
