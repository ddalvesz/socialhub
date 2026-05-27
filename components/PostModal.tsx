'use client'

import { useState, useEffect, useRef } from 'react'
import { Icon, PlatformIcon } from './Icons'
import { Popover, GenericSelect, DatePicker } from './FormHelpers'
import {
  Post, Platform, PostStatus, Campaign,
  PLATFORMS, STATUSES, LINHAS_ED,
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
  campaigns?: Campaign[]
  products?: string[]
  tagOptions?: string[]
  onAddProduct?: (name: string) => Promise<void>
  allPosts?: Post[]
  onLinkedPostClick?: (post: Post) => void
}

// ─── Tags multi-select combo ──────────────────────────────────
function TagsComboBox({ value, options, onChange }: { value: string[]; options: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQ('') }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const available = options.filter(o => !value.includes(o) && o.toLowerCase().includes(q.toLowerCase()))
  const showNew = q.trim() && !options.some(o => o.toLowerCase() === q.trim().toLowerCase()) && !value.includes(q.trim())

  const add = (tag: string) => { onChange([...value, tag]); setQ('') }
  const remove = (tag: string) => onChange(value.filter(t => t !== tag))

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div
        className="field"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 34, padding: '4px 8px', cursor: 'text' }}
        onClick={() => setOpen(true)}
      >
        {value.map(t => (
          <span key={t} className="modal-tag" style={{ margin: 0 }}>
            {t}
            <span className="x" onMouseDown={e => { e.stopPropagation(); remove(t) }}><Icon.x /></span>
          </span>
        ))}
        <input
          style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, minWidth: 80, flex: 1 }}
          placeholder={value.length === 0 ? 'Digite ou selecione...' : ''}
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Enter' && q.trim()) { e.preventDefault(); add(q.trim()); }
            if (e.key === 'Backspace' && !q && value.length > 0) remove(value[value.length - 1])
          }}
        />
      </div>
      {open && (available.length > 0 || showNew) && (
        <div className="popover" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 200, maxHeight: 220, overflowY: 'auto' }}>
          {available.map(o => (
            <button key={o} className="po-item" onMouseDown={() => add(o)}>{o}</button>
          ))}
          {showNew && (
            <button className="po-item" style={{ color: 'var(--accent)', fontWeight: 500 }} onMouseDown={() => add(q.trim())}>
              + Criar "{q.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Status select ───────────────────────────────────────────
function StatusSelect({ value, onChange }: { value: PostStatus; onChange: (v: PostStatus) => void }) {
  const [open, setOpen] = useState(false)
  const cur = STATUSES.find(s => s.id === value)!
  const dotColors: Record<PostStatus, string> = {
    prod: 'oklch(0.62 0.13 75)', sched: 'oklch(0.6 0.13 265)',
    pub: 'oklch(0.6 0.13 150)', cancel: 'oklch(0.6 0.05 25)',
    pauta: 'oklch(0.62 0.13 200)', entregue: 'oklch(0.62 0.13 130)',
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
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        className="field"
        style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', width: '100%', justifyContent: 'space-between' }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 18, height: 18, borderRadius: 5, background: cur.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <PlatformIcon platform={cur.id} size={11} color="white" />
          </span>
          {cur.label}
        </span>
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

// ─── Main modal ──────────────────────────────────────────────
export default function PostModal({ post, onClose, onSave, onDelete, onDuplicate, showProduct, campaigns = [], products = [], tagOptions = [], onAddProduct, allPosts = [], onLinkedPostClick }: Props) {
  const [draft, setDraft] = useState<Post>(post)
  const [newProduct, setNewProduct] = useState('')
  const [addingProduct, setAddingProduct] = useState(false)

  useEffect(() => { setDraft(post) }, [post.id])
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const plat = PLATFORMS.find(p => p.id === draft.platform)!
  const set = <K extends keyof Post>(k: K, v: Post[K]) => setDraft(d => ({ ...d, [k]: v }))
  const linkedPost = draft.linkedPostId ? allPosts.find(p => p.id === draft.linkedPostId) : undefined
  const linkedPlat = linkedPost ? PLATFORMS.find(p => p.id === linkedPost.platform) : undefined
  const formats = draft.platform === 'ig' ? CONTENT_TYPES_IG : CONTENT_TYPES_OTHER

  const teamOptions    = TEAM_NAMES.map(t => ({ id: t, label: t }))
  const lineaOptions   = LINHAS_ED.map(l => ({ id: l.id, label: l.label }))
  const campOptions    = [{ id: '', label: 'Sem campanha' }, ...campaigns.map(c => ({ id: c.slug, label: c.nome }))]
  const DEFAULT_PRODUCTS = [
    'Cases','Garrafas','Garrafa Fresh','Garrafa Magsafe','Garrafa Flip',
    'Tote Daily','Tote Mini','Tote Shopper','Tote Pop','Tote Moon','Tote Care',
    'Bolsa Fitness','Bolsa Move','Bolsa Joy',
    'Mochila Care','Mochila Rodinhas','Lancheiras','Copo Vibe','Taça Termica',
  ]
  const productList    = products.length > 0 ? products : DEFAULT_PRODUCTS
  const productOptions = productList.map(p => ({ id: p, label: p }))

  const handleAddProduct = async () => {
    const name = newProduct.trim()
    if (!name) return
    await onAddProduct?.(name)
    set('product', name)
    setNewProduct('')
    setAddingProduct(false)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-post" onClick={e => e.stopPropagation()}>

        {/* Header */}
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
                {draft.source} · {String(draft.id).slice(0, 8)}
              </span>
              {linkedPost && linkedPlat && (
                <button
                  onClick={() => onLinkedPostClick?.(linkedPost)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: 11,
                    background: 'var(--surface-2)', border: '1px solid var(--line)',
                    borderRadius: 6, padding: '2px 8px', cursor: 'pointer', color: 'var(--ink-2)',
                  }}
                  title="Abrir post vinculado"
                >
                  <span style={{ width: 13, height: 13, borderRadius: 3, background: linkedPlat.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <PlatformIcon platform={linkedPlat.id} size={8} color="white" />
                  </span>
                  {linkedPlat.label}
                </button>
              )}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        {/* Body — 2 columns */}
        <div className="modal-body">

          {/* LEFT — Detalhes */}
          <div className="col left">
            <div className="modal-col-head">
              <Icon.settings /> Detalhes
            </div>
            <div className="modal-grid">
              <label>Dono</label>
              <div className="field-wrap">
                <GenericSelect value={draft.owner} options={teamOptions} onChange={v => set('owner', v)} width="100%" />
              </div>

              <label>Plataforma</label>
              <PlatformSelect value={draft.platform} onChange={v => set('platform', v)} />

              <label>Data e hora</label>
              <div className="field-inline">
                <DatePicker value={draft.date} onChange={v => set('date', v)} />
                <input className="field" type="time" value={draft.time} onChange={e => set('time', e.target.value)} />
              </div>

              <label>Formato</label>
              <div className="field-wrap">
                <GenericSelect value={draft.format} options={formats.map(t => ({ id: t, label: t }))} onChange={v => set('format', v)} width="100%" />
              </div>

              {showProduct && (
                <>
                  <label style={{ alignSelf: 'flex-start', paddingTop: 6 }}>Produto</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <GenericSelect value={draft.product || ''} options={productOptions} onChange={v => set('product', v)} width="100%" />
                    {addingProduct ? (
                      <div className="field-inline">
                        <input
                          className="field"
                          placeholder="Nome do produto..."
                          value={newProduct}
                          onChange={e => setNewProduct(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddProduct(); if (e.key === 'Escape') setAddingProduct(false) }}
                          autoFocus
                        />
                        <button className="btn btn-accent" style={{ fontSize: 12, padding: '4px 10px' }} onClick={handleAddProduct}>Salvar</button>
                        <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setAddingProduct(false)}>✕</button>
                      </div>
                    ) : (
                      <button className="modal-tag-add" onClick={() => setAddingProduct(true)}>+ Novo produto</button>
                    )}
                  </div>
                </>
              )}

              <label>Tags</label>
              <TagsComboBox
                value={draft.tags || []}
                options={[...new Set([...tagOptions, ...LINHAS_ED.map(l => l.label)])].filter(Boolean)}
                onChange={v => set('tags', v)}
              />

              <label>Campanha</label>
              <div className="field-wrap">
                <GenericSelect value={draft.campaign || ''} options={campOptions} onChange={v => set('campaign', v)} placeholder="Sem campanha" width="100%" />
              </div>
            </div>
          </div>

          {/* RIGHT — Conteúdo */}
          <div className="col right">
            <div className="modal-col-head">
              <Icon.branding /> Conteúdo
            </div>

            <div className="stacked">
              <label>Legenda</label>
              <div style={{ position: 'relative' }}>
                <textarea
                  className="field legenda"
                  placeholder="Escreva aqui a legenda que vai com o post..."
                  value={draft.caption || ''}
                  onChange={e => set('caption', e.target.value)}
                />
                {draft.caption && (
                  <span className="caption-count">{draft.caption.length} car.</span>
                )}
              </div>
            </div>

            <div className="stacked">
              <label>Link da mídia <span className="hint">vídeo, drive, dropbox...</span></label>
              <div className="field link-field">
                <Icon.media />
                <input placeholder="https://..." value={draft.videoLink || ''} onChange={e => set('videoLink', e.target.value)} />
              </div>
            </div>

            {(draft.format === 'Reels' || draft.format === 'Vídeo') && (
              <div className="stacked">
                <label>Link da capa</label>
                <div className="field link-field">
                  <Icon.cover />
                  <input placeholder="https://..." value={draft.coverLink || ''} onChange={e => set('coverLink', e.target.value)} />
                </div>
              </div>
            )}

            {draft.format === 'Carrossel' && (
              <div className="stacked">
                <label>
                  Imagens do carrossel
                  <span className="hint">{(draft.slideLinks ?? []).filter(Boolean).length}/10</span>
                </label>
                {Array.from({ length: Math.min(10, (draft.slideLinks ?? []).filter(Boolean).length + 1) }).map((_, i) => (
                  <div key={i} className="field link-field" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', minWidth: 18, textAlign: 'center' }}>{i + 1}</span>
                    <input
                      placeholder={`https://... (slide ${i + 1})`}
                      value={(draft.slideLinks ?? [])[i] ?? ''}
                      onChange={e => {
                        const updated = [...(draft.slideLinks ?? [])]
                        updated[i] = e.target.value
                        // remove trailing empty slots
                        while (updated.length > 0 && !updated[updated.length - 1]) updated.pop()
                        set('slideLinks', updated)
                      }}
                    />
                  </div>
                ))}
                {(draft.slideLinks ?? []).filter(Boolean).length < 10 && (draft.slideLinks ?? []).filter(Boolean).length === (draft.slideLinks ?? []).length && (
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 12, padding: '4px 10px', marginTop: 2 }}
                    onClick={() => set('slideLinks', [...(draft.slideLinks ?? []), ''])}
                  >
                    + Adicionar imagem
                  </button>
                )}
              </div>
            )}

            <div className="stacked">
              <label>Link de referência</label>
              <div className="field link-field">
                <Icon.ref />
                <input placeholder="https://..." value={draft.ref || ''} onChange={e => set('ref', e.target.value)} />
              </div>
            </div>

            <div className="stacked">
              <label>Link do Post publicado</label>
              <div className="field link-field">
                <Icon.post />
                <input placeholder="https://..." value={draft.link || ''} onChange={e => set('link', e.target.value)} />
              </div>
            </div>

            <div className="stacked">
              <label>Observações</label>
              <textarea
                className="field"
                rows={2}
                placeholder="Comentários internos..."
                value={draft.obs || ''}
                onChange={e => set('obs', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
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
