'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import type { Brand, SiteLink, Story, StoryStatus } from '@/lib/types'
import { STORY_STATUS_META, buildUtmForStory, fmtBRL } from '@/lib/storiesUtils'
import { Popover } from './FormHelpers'
import { Icon } from './Icons'

/* ── Constants ────────────────────────────────────────────── */


const STATUS_OPTS: { id: StoryStatus; label: string }[] = [
  { id: 'nao_iniciado', label: 'Não iniciado' },
  { id: 'em_andamento', label: 'Em andamento' },
  { id: 'feito',        label: 'Feito'        },
  { id: 'nao_postado',  label: 'Não postado'  },
  { id: 'proposta',     label: 'Proposta'     },
  { id: 'postado',      label: 'Postado'      },
]

const WEEKDAY_NOMES_LONG = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado']

function statusCls(s: StoryStatus) {
  return s === 'nao_iniciado' ? 's-st-ni'
    : s === 'em_andamento'   ? 's-st-ea'
    : s === 'feito'          ? 's-st-feito'
    : s === 'proposta'       ? 's-st-post'
    : s === 'postado'        ? 's-st-postado'
    : 's-st-np'
}

/* ── CopyBtn ──────────────────────────────────────────────── */

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className={`btn-copy-utm ${copied ? 'copied' : ''}`}
      style={{ alignSelf: 'flex-end', flexShrink: 0 }}
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
    >
      {copied ? 'Copiado!' : 'Copiar'}
    </button>
  )
}

/* ── StoryStatusPill ──────────────────────────────────────── */

function StoryStatusPill({ value, onChange }: { value: StoryStatus; onChange: (v: StoryStatus) => void }) {
  const [open, setOpen] = useState(false)
  const meta = STORY_STATUS_META[value]
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button className={`status-pill ${statusCls(value)}`} onClick={() => setOpen(o => !o)}>
        <span className="sdot" />{meta?.label ?? value}<Icon.chevD />
      </button>
      <Popover open={open} onClose={() => setOpen(false)}>
        {STATUS_OPTS.map(s => {
          const m = STORY_STATUS_META[s.id]
          return (
            <button key={s.id} className="po-item" onClick={() => { onChange(s.id); setOpen(false) }}>
              <span className="pdot" style={{ background: m?.dot ?? 'var(--ink-4)' }} />
              {s.label}
              {s.id === value && <span className="check"><Icon.check /></span>}
            </button>
          )
        })}
      </Popover>
    </div>
  )
}

/* ── ProdutoCombobox (fallback sem site_links) ─────────────── */

function FreeCombobox({ value, onChange, suggestions: allSuggestions, placeholder }: {
  value: string
  onChange: (v: string) => void
  suggestions: string[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState(value)
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setQ(value) }, [value])

  const suggestions = useMemo(() => {
    const trimmed = q.trim().toLowerCase()
    if (!trimmed) return allSuggestions.slice(0, 12)
    return allSuggestions.filter(p => p.toLowerCase().includes(trimmed)).slice(0, 12)
  }, [q, allSuggestions])

  const commit = (v: string) => { onChange(v); setQ(v); setOpen(false) }

  const openDropdown = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect()
      setRect({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    setOpen(true)
  }

  const showDropdown = open && suggestions.length > 0

  return (
    <div style={{ width: '100%' }}>
      <input
        ref={inputRef}
        className="field"
        value={q}
        placeholder={placeholder ?? ''}
        onChange={e => { setQ(e.target.value); onChange(e.target.value); openDropdown() }}
        onFocus={openDropdown}
        onKeyDown={e => { if (e.key === 'Escape') setOpen(false); if (e.key === 'Enter') { setOpen(false); inputRef.current?.blur() } }}
        autoComplete="off"
      />
      {showDropdown && rect && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setOpen(false)} />
          <div className="popover" style={{
            position: 'fixed', top: rect.top, left: rect.left, width: rect.width,
            zIndex: 56, maxHeight: 220, overflowY: 'auto',
          }}>
            {suggestions.map(p => (
              <button key={p} className="po-item" onMouseDown={e => { e.preventDefault(); commit(p) }}>
                {p}
                {p === value && <span className="check"><Icon.check /></span>}
              </button>
            ))}
            {q.trim() && !allSuggestions.includes(q.trim()) && (
              <>
                <div className="po-divider" />
                <button className="po-item po-item-add" onMouseDown={e => { e.preventDefault(); commit(q.trim()) }}>
                  <Icon.plus /> Usar &ldquo;{q.trim()}&rdquo;
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ── SiteLinkSelector (quando site_links disponíveis) ──────── */

function SiteLinkSelector({ value, siteLinks, onChange }: {
  value: string
  siteLinks: SiteLink[]
  onChange: (produto: string, link: string) => void
}) {
  const categorias = useMemo(() =>
    Array.from(new Set(siteLinks.map(sl => sl.categoria))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
  [siteLinks])

  const currentSiteLink = siteLinks.find(sl => sl.produto === value)
  const [catSel, setCatSel] = useState(currentSiteLink?.categoria ?? '')

  const produtosFiltrados = useMemo(() =>
    catSel ? siteLinks.filter(sl => sl.categoria === catSel) : siteLinks,
  [siteLinks, catSel])

  const handleCat = (cat: string) => {
    setCatSel(cat)
    // Se o produto atual não está nesta categoria, limpa a seleção
    const still = siteLinks.find(sl => sl.produto === value && sl.categoria === cat)
    if (!still) onChange('', '')
  }

  const handleProduto = (sl: SiteLink) => {
    onChange(sl.produto, sl.link)
  }

  const produtoNaoEncontrado = value.trim() && !currentSiteLink

  return (
    <div style={{ display: 'contents' }}>
      <label>Categoria do produto</label>
      <select
        className="field"
        value={catSel}
        onChange={e => handleCat(e.target.value)}
        style={{ paddingRight: 32 }}
      >
        <option value="">Todas as categorias</option>
        {categorias.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <label>Produto foco</label>
      <div>
        <select
          className="field"
          value={value}
          onChange={e => {
            const sl = siteLinks.find(x => x.produto === e.target.value)
            if (sl) handleProduto(sl)
          }}
          style={{ paddingRight: 32, width: '100%' }}
        >
          <option value="">Selecionar produto…</option>
          {produtosFiltrados.map(sl => (
            <option key={sl.id} value={sl.produto}>{sl.produto}</option>
          ))}
        </select>

        {produtoNaoEncontrado && (
          <div className="utm-aviso" style={{ marginTop: 6 }}>
            <Icon.info />
            <span>
              &ldquo;{value}&rdquo; não encontrado nos Links do Site.{' '}
              Adicione-o na aba <strong>Links do Site</strong> para gerar UTM automaticamente.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── StoryModal ──────────────────────────────────────────── */

interface Props {
  story: Story
  brand: Brand
  knownProducts: string[]
  knownCategorias: string[]
  siteLinks: SiteLink[]
  onClose: () => void
  onSave: (s: Story) => void
  onDelete: (s: Story) => void
}

export default function StoryModal({ story, brand, knownProducts, knownCategorias, siteLinks, onClose, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState<Story>(story)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => { setDraft(story); setConfirmDelete(false) }, [story.id])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const set = <K extends keyof Story>(k: K, v: Story[K]) => setDraft(d => ({ ...d, [k]: v }))
  const setMany = (obj: Partial<Story>) => setDraft(d => ({ ...d, ...obj }))

  // Resolve o baseLink do produto selecionado nos site_links
  const currentSiteLink = useMemo(() =>
    siteLinks.find(sl => sl.produto === draft.produto?.trim()),
  [siteLinks, draft.produto])

  // Gera UTM quando tem produto + site_link com link cadastrado
  const utm = useMemo(() => {
    if (!draft.date || !draft.produto?.trim()) return null
    if (siteLinks.length > 0 && !currentSiteLink) return null  // produto não encontrado nos links
    const baseLink = currentSiteLink?.link ?? ''
    if (siteLinks.length > 0 && !baseLink) return null
    return buildUtmForStory(brand, draft.date, draft.hora, draft.produto.trim(), baseLink)
  }, [brand, draft.date, draft.hora, draft.produto, currentSiteLink, siteLinks.length])

  // Sincroniza UTM no draft quando produto/data/hora mudam
  useEffect(() => {
    if (utm) {
      setDraft(d => ({ ...d, linkUtm: utm.url, rastreioReceita: utm.campaign }))
    }
  }, [utm?.url, utm?.campaign])

  const dateObj = new Date(draft.date + 'T00:00:00')
  const diaSemanaLabel = WEEKDAY_NOMES_LONG[dateObj.getDay()]
  const [, mm, dd] = draft.date.split('-')
  const dateDisplay = `${dd}/${mm}/${draft.date.split('-')[0]}`
  const selectStyle = { paddingRight: 32 }
  const usarSiteLinks = siteLinks.length > 0

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-post" onClick={e => e.stopPropagation()} style={{ maxWidth: 860, width: '90vw' }}>

        {/* Header */}
        <div className="modal-head">
          <div className="platform-mark" style={{ background: 'oklch(0.55 0.18 290)' }}>
            <span style={{ color: 'white', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.03em' }}>STORY</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-title-row">
              <input
                className="modal-title"
                value={draft.produto || ''}
                onChange={e => set('produto', e.target.value)}
                placeholder="Produto foco"
              />
            </div>
            <div className="modal-subhead">
              <StoryStatusPill value={draft.status} onChange={v => set('status', v)} />
              <span className="modal-date-pill">
                {dateDisplay} · {diaSemanaLabel}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* LEFT */}
          <div className="col left">
            <div className="modal-col-head">
              <Icon.settings /> Configuração
            </div>

            <div className="modal-grid">
              <label>Data</label>
              <input
                className="field"
                type="date"
                value={draft.date}
                onChange={e => set('date', e.target.value)}
                style={{ maxWidth: 180 }}
              />

              <label>Hora</label>
              <select
                className="field"
                value={draft.hora}
                onChange={e => set('hora', Number(e.target.value))}
                style={{ maxWidth: 120, ...selectStyle }}
              >
                {[7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22].map(h => (
                  <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>
                ))}
              </select>

              {usarSiteLinks ? (
                <SiteLinkSelector
                  value={draft.produto || ''}
                  siteLinks={siteLinks}
                  onChange={(produto, link) => setMany({ produto, ...(link ? { linkUtm: link } : {}) })}
                />
              ) : (
                <>
                  <label>Produto foco</label>
                  <FreeCombobox
                    value={draft.produto || ''}
                    onChange={v => setMany({ produto: v })}
                    suggestions={knownProducts}
                    placeholder="Ex: Garrafinha Mini"
                  />
                </>
              )}

              <label>Tipo de conteúdo</label>
              <FreeCombobox
                value={draft.categoria || ''}
                onChange={v => set('categoria', v)}
                suggestions={knownCategorias}
                placeholder="Ex: GOFLASH"
              />
            </div>

            {/* Resultado total */}
            {(draft.receita != null || draft.orders != null) && (
              <div className="mh-section" style={{ marginTop: 20 }}>
                <div className="mh-section-head">
                  <Icon.branding /> Resultado total
                </div>
                <div className="live-recap">
                  {draft.receita != null && (
                    <div className="live-recap-row">
                      <span>Receita rastreada</span>
                      <strong>{fmtBRL(draft.receita)}</strong>
                    </div>
                  )}
                  {draft.orders != null && (
                    <div className="live-recap-row">
                      <span>Orders totais</span>
                      <strong>{draft.orders}</strong>
                    </div>
                  )}
                  {draft.receita != null && draft.orders != null && draft.orders > 0 && (
                    <div className="live-recap-row">
                      <span>Ticket médio</span>
                      <strong>{fmtBRL(draft.receita / draft.orders)}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="col right">
            <div className="modal-col-head">
              <Icon.branding /> Rastreamento
            </div>

            {/* UTM — topo da coluna */}
            {utm && (
              <div className="st-utm-block" style={{ marginBottom: 16 }}>
                <div className="st-utm-block-label">
                  <svg viewBox="0 0 16 16" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="8" cy="8" r="6"/><polyline points="8 5 8 8 10 10"/>
                  </svg>
                  UTM gerada automaticamente
                </div>
                <div className="st-utm-row">
                  <div className="st-utm-field">
                    <div className="st-utm-field-lbl">Código</div>
                    <div className="st-utm-code">{utm.campaign}</div>
                  </div>
                  <CopyBtn text={utm.campaign} />
                </div>
                <div className="st-utm-row">
                  <div className="st-utm-field">
                    <div className="st-utm-field-lbl">URL</div>
                    <div className="st-utm-url-text">{utm.url}</div>
                  </div>
                  <CopyBtn text={utm.url} />
                </div>
              </div>
            )}

            {/* Aviso: produto digitado mas não cadastrado nos links */}
            {usarSiteLinks && draft.produto?.trim() && !currentSiteLink && (
              <div className="utm-aviso" style={{ marginBottom: 16 }}>
                <Icon.info />
                <span>
                  Produto não encontrado nos Links do Site. Adicione-o na aba{' '}
                  <strong>Links do Site</strong> para gerar a UTM automaticamente.
                </span>
              </div>
            )}

            <div className="modal-grid">
              <label>Receita</label>
              <div className="live-money-input" style={{ maxWidth: 200 }}>
                <span className="prefix">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.receita ?? ''}
                  onChange={e => set('receita', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="0,00"
                />
              </div>

              <label>Orders</label>
              <input
                className="field"
                type="number"
                min="0"
                style={{ maxWidth: 120 }}
                value={draft.orders ?? ''}
                onChange={e => set('orders', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="—"
              />
            </div>

            <div className="stacked" style={{ marginTop: 18 }}>
              <label>Criativo</label>
              <input
                className="field"
                placeholder="Link ou descrição do criativo do story"
                value={draft.linkMidia || ''}
                onChange={e => set('linkMidia', e.target.value || null)}
              />
            </div>

            <div className="stacked" style={{ marginTop: 12 }}>
              <label>Observações</label>
              <textarea
                className="field"
                rows={4}
                placeholder="Notas sobre o story, performance, contexto..."
                value={draft.notes || ''}
                onChange={e => set('notes', e.target.value || null)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-foot">
          {story.id !== '__new__' && (!confirmDelete ? (
            <button className="danger" onClick={() => setConfirmDelete(true)}>
              <Icon.trash /> Excluir
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>Confirmar exclusão?</span>
              <button className="danger" onClick={() => { onDelete(draft); onClose() }}>Sim, excluir</button>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Não</button>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={() => onSave(draft)}>
            {story.id === '__new__' ? 'Criar story' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
