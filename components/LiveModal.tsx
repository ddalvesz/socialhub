'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Brand, Live, Merchan, SiteLink } from '@/lib/types'
import { LIVE_STATUSES, LIVE_STATUS_BY_ID } from '@/lib/types'
import { fmtBRL, fmtPct } from '@/lib/livesUtils'
import { buildUtmForLive } from '@/lib/storiesUtils'
import { Icon } from './Icons'
import { Popover, DatePicker } from './FormHelpers'

/* ── CopyBtn ─────────────────────────────────────────────── */

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

// ─── LiveStatusSelect ────────────────────────────────────────

function LiveStatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const cur = LIVE_STATUS_BY_ID[value as keyof typeof LIVE_STATUS_BY_ID] ?? LIVE_STATUSES[0]
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button className={`status-pill ${cur.className}`} onClick={() => setOpen(o => !o)}>
        <span className="sdot" />{cur.label}<Icon.chevD />
      </button>
      <Popover open={open} onClose={() => setOpen(false)}>
        {LIVE_STATUSES.map(s => (
          <button key={s.id} className="po-item" onClick={() => { onChange(s.id); setOpen(false) }}>
            <span className="pdot" style={{ background: s.dot }} />
            {s.label}
            {s.id === value && <span className="check"><Icon.check /></span>}
          </button>
        ))}
      </Popover>
    </div>
  )
}

// ─── MerchanSelect ───────────────────────────────────────────

export function MerchanSelect({ value, merchans, onChange, onAddMerchan, placeholder = 'Selecionar merchan…', allowClear = false }: {
  value: string
  merchans: Merchan[]
  onChange: (v: string) => void
  onAddMerchan: (nome: string) => Promise<Merchan>
  placeholder?: string
  allowClear?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [filter, setFilter] = useState('')
  const cur = merchans.find(m => m.nome === value)

  const submit = async () => {
    const nm = newName.trim()
    if (!nm) return
    const m = await onAddMerchan(nm)
    onChange(m.nome)
    setOpen(false); setAdding(false); setNewName('')
  }

  const filtered = filter
    ? merchans.filter(m => m.nome.toLowerCase().includes(filter.toLowerCase()))
    : merchans

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button className="field merchan-select-trigger" onClick={() => setOpen(o => !o)}>
        {cur ? (
          <>
            <span className="msel-dot" style={{ background: cur.color }} />
            <span className="msel-name" title={cur.nome}>{cur.nome}</span>
          </>
        ) : (
          <span className="msel-placeholder">{placeholder}</span>
        )}
        <Icon.chevD />
      </button>
      <Popover open={open} onClose={() => { setOpen(false); setAdding(false); setNewName(''); setFilter('') }}>
        <div className="po-search">
          <Icon.search />
          <input
            autoFocus
            placeholder="Buscar merchan..."
            value={filter}
            onChange={e => setFilter(e.target.value)} />
        </div>
        <div className="po-scroll">
          {allowClear && (
            <button className="po-item po-item-clear" onClick={() => { onChange(''); setOpen(false) }}>
              <span className="pdot" style={{ background: 'var(--surface-3)', border: '1px dashed var(--line-2)' }} />
              Sem cupom
              {!value && <span className="check"><Icon.check /></span>}
            </button>
          )}
          {filtered.map(m => (
            <button key={m.id} className="po-item" onClick={() => { onChange(m.nome); setOpen(false); setFilter('') }} title={m.nome}>
              <span className="pdot" style={{ background: m.color }} />
              <span className="po-item-name">{m.nome}</span>
              {m.forte && <span className="merchan-flag-tag forte">forte</span>}
              {m.sempreSozinho && <span className="merchan-flag-tag solo">solo</span>}
              {m.nome === value && <span className="check"><Icon.check /></span>}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="po-empty">Nenhum merchan encontrado</div>
          )}
        </div>
        <div className="po-divider" />
        {!adding ? (
          <button className="po-item po-item-add" onClick={() => setAdding(true)}>
            <Icon.plus /> Novo merchan
          </button>
        ) : (
          <div style={{ padding: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              className="po-input"
              autoFocus
              placeholder="Nome do merchan…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setAdding(false); setNewName('') } }} />
            <button className="btn btn-accent" style={{ padding: '6px 10px', fontSize: 12 }} onClick={submit}>OK</button>
          </div>
        )}
      </Popover>
    </div>
  )
}

// ─── LiveModal ───────────────────────────────────────────────

interface Props {
  live: Live
  brand: Brand
  merchans: Merchan[]
  siteLinks: SiteLink[]
  onClose: () => void
  onSave: (l: Live) => void
  onDelete: (l: Live) => void
  onAddMerchan: (nome: string) => Promise<Merchan>
}

export default function LiveModal({ live, brand, merchans, siteLinks, onClose, onSave, onDelete, onAddMerchan }: Props) {
  const [draft, setDraft] = useState<Live>(live)

  useEffect(() => { setDraft(live) }, [live.id])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const set = <K extends keyof Live>(k: K, v: Live[K]) => setDraft(d => ({ ...d, [k]: v }))
  const setMany = (obj: Partial<Live>) => setDraft(d => ({ ...d, ...obj }))

  // Cupom e UTM são fontes de atribuição independentes (a mesma compra pode entrar
  // pelo link UTM e usar o cupom da live), então nunca são somadas — "receita total"
  // é só a soma dos cupons; UTM sempre aparece separada.
  const receitaCupom = (draft.receita1 || 0) + (draft.receita2 || 0)

  // ── UTM automática ──────────────────────────────────────────
  const isGocase = brand === 'gocase'

  const currentSiteLink = useMemo(() =>
    siteLinks.find(sl => sl.produto === draft.produto?.trim()),
  [siteLinks, draft.produto])

  const utm = useMemo(() => {
    if (!draft.date) return null
    if (isGocase) {
      return buildUtmForLive('gocase', draft.date, draft.hora ?? '')
    }
    // Gobeauté: precisa de hora + produto com link cadastrado
    if (!draft.hora || !draft.produto?.trim() || !currentSiteLink) return null
    return buildUtmForLive(brand, draft.date, draft.hora, draft.produto.trim(), currentSiteLink.link)
  }, [brand, isGocase, draft.date, draft.hora, draft.produto, currentSiteLink])

  // Sincroniza linkUtm e utmCampaign no draft quando UTM muda
  useEffect(() => {
    if (utm) {
      setDraft(d => ({ ...d, linkUtm: utm.url, utmCampaign: utm.campaign }))
    }
  }, [utm?.url, utm?.campaign])

  const categorias = useMemo(() =>
    Array.from(new Set(siteLinks.map(sl => sl.categoria))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
  [siteLinks])

  const [catSel, setCatSel] = useState(() =>
    siteLinks.find(sl => sl.produto === live.produto)?.categoria ?? ''
  )
  const [showCupom2, setShowCupom2] = useState(() => !!(live.merchan2 || live.nominal2))

  const produtosFiltrados = useMemo(() =>
    catSel ? siteLinks.filter(sl => sl.categoria === catSel) : siteLinks,
  [siteLinks, catSel])

  const produtoNaoEncontrado = !isGocase && draft.produto?.trim() && !currentSiteLink
  useEffect(() => {
    if (receitaCupom !== draft.receitaTotal) set('receitaTotal', receitaCupom)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.receita1, draft.receita2])

  const m1 = merchans.find(m => m.nome === draft.merchan1)
  const m2 = merchans.find(m => m.nome === draft.merchan2)

  const dateObj = new Date(draft.date + 'T00:00:00')
  const WEEKDAY_NOMES_LOCAL = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
  const diaSemanaLabel = WEEKDAY_NOMES_LOCAL[dateObj.getDay()]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-post" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="platform-mark" style={{ background: 'oklch(0.6 0.18 25)' }}>
            <span style={{ color: 'white', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, letterSpacing: '0.03em' }}>LIVE</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-title-row">
              <input
                className="modal-title"
                value={draft.nominal1 || ''}
                onChange={e => set('nominal1', e.target.value)}
                placeholder="Código do cupom (ex: SEXTATOP)" />
            </div>
            <div className="modal-subhead">
              <LiveStatusSelect value={draft.status} onChange={v => set('status', v as Live['status'])} />
              <span className="modal-date-pill">
                {dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} · {diaSemanaLabel}
              </span>
              {draft.origem && (
                <span className="origem-pill" title="Origem do registro">
                  {draft.origem === 'skill' ? '🤖' : '📥'} import
                </span>
              )}
              <label className="flag-toggle">
                <input type="checkbox" checked={!!draft.cupomLigado} onChange={e => set('cupomLigado', e.target.checked)} />
                <span>cupom ligado</span>
              </label>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginLeft: 'auto' }}>
                #{String(draft.id).padStart(4, '0')}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          {/* LEFT — Cupons */}
          <div className="col left">
            <div className="modal-col-head">
              <Icon.settings /> Cupons da live
            </div>

            <div className="modal-grid">
              <label>Data</label>
              <DatePicker
                value={draft.date}
                onChange={v => set('date', v)}
                style={{ maxWidth: 200 }} />

              <label>Hora</label>
              <input
                className="field"
                type="time"
                value={draft.hora || ''}
                onChange={e => set('hora', e.target.value)}
                style={{ maxWidth: 120 }} />
            </div>

            {/* Seletor de produto — apenas gobeauté */}
            {!isGocase && siteLinks.length > 0 && (
              <div className="modal-grid" style={{ marginBottom: 8, marginTop: 16 }}>
                <label>Categoria</label>
                <select
                  className="field"
                  value={catSel}
                  onChange={e => {
                    setCatSel(e.target.value)
                    const still = siteLinks.find(sl => sl.produto === draft.produto && sl.categoria === e.target.value)
                    if (!still) set('produto', '')
                  }}
                  style={{ paddingRight: 32 }}
                >
                  <option value="">Todas as categorias</option>
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <label>Produto</label>
                <div>
                  <select
                    className="field"
                    value={draft.produto || ''}
                    onChange={e => {
                      const sl = siteLinks.find(x => x.produto === e.target.value)
                      set('produto', e.target.value)
                      if (sl) set('linkUtm', sl.link)
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
                        Produto não encontrado nos Links do Site. Adicione-o na aba{' '}
                        <strong>Links do Site</strong> para gerar UTM automaticamente.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CUPOM 1 */}
            <div className="cupom-block">
              <div className="cupom-head">
                <span className="cupom-tag cupom-1">CUPOM 1</span>
                <span className="cupom-hint">principal · obrigatório</span>
              </div>
              <div className="modal-grid">
                <label>Merchan</label>
                <MerchanSelect
                  value={draft.merchan1}
                  merchans={merchans.filter(m => m.ativo)}
                  onChange={v => set('merchan1', v)}
                  onAddMerchan={onAddMerchan} />

                <label>Código</label>
                <input
                  className="field"
                  value={draft.nominal1 || ''}
                  onChange={e => set('nominal1', e.target.value)}
                  placeholder="Ex: SEXTATOP, LIVE10..." />

                <label>Receita</label>
                <div className="live-money-input">
                  <span className="prefix">R$</span>
                  <input
                    type="number"
                    min="0"
                    value={draft.receita1 || 0}
                    onChange={e => set('receita1', Number(e.target.value))} />
                </div>

                <label>Orders cupom</label>
                <input
                  className="field"
                  type="number"
                  min="0"
                  style={{ maxWidth: 120 }}
                  value={draft.ordersCupom ?? ''}
                  onChange={e => set('ordersCupom', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="—" />
              </div>
            </div>

            {/* CUPOM 2 */}
            {m1?.sempreSozinho ? (
              <div className="cupom-block disabled">
                <div className="cupom-head">
                  <span className="cupom-tag cupom-2">CUPOM 2</span>
                  <span className="cupom-hint">«{m1.nome}» sempre vai sozinho</span>
                </div>
              </div>
            ) : showCupom2 ? (
              <div className="cupom-block">
                <div className="cupom-head">
                  <span className="cupom-tag cupom-2">CUPOM 2</span>
                  <span className="cupom-hint">secundário</span>
                  <button className="link-btn" onClick={() => { setMany({ merchan2: '', nominal2: '', receita2: 0 }); setShowCupom2(false) }}>
                    remover
                  </button>
                </div>
                <div className="modal-grid">
                  <label>Merchan</label>
                  <MerchanSelect
                    value={draft.merchan2}
                    merchans={merchans.filter(m => m.ativo && !m.sempreSozinho && m.nome !== draft.merchan1)}
                    onChange={v => set('merchan2', v)}
                    onAddMerchan={onAddMerchan}
                    placeholder="Sem merchan"
                    allowClear />

                  <label>Código</label>
                  <input
                    className="field"
                    value={draft.nominal2 || ''}
                    onChange={e => set('nominal2', e.target.value)}
                    placeholder="Código do segundo cupom" />

                  <label>Receita</label>
                  <div className="live-money-input">
                    <span className="prefix">R$</span>
                    <input
                      type="number"
                      min="0"
                      value={draft.receita2 || 0}
                      onChange={e => set('receita2', Number(e.target.value))} />
                  </div>
                </div>
              </div>
            ) : (
              <button
                className="link-btn"
                style={{ alignSelf: 'flex-start', marginBottom: 8, fontSize: 13 }}
                onClick={() => setShowCupom2(true)}
              >
                + Adicionar cupom 2
              </button>
            )}

            {/* Total + sinaleiras */}
            <div className="mh-section">
              <div className="mh-section-head">
                <Icon.branding /> Resultado
              </div>
              <div className="live-total-row">
                <div className="live-recap" style={{ flex: 1 }}>
                  <div className="live-recap-row">
                    <span>Receita cupom</span>
                    <strong>{fmtBRL(receitaCupom)}</strong>
                  </div>
                  {m1 && draft.receita1 > 0 && (
                    <div className="live-recap-row">
                      <span className="recap-cupom">
                        <span className="dot" style={{ background: m1.color }} />
                        Cupom 1
                      </span>
                      <strong>{fmtBRL(draft.receita1)}{receitaCupom > 0 ? <span className="live-recap-sub"> · {fmtPct(draft.receita1 / receitaCupom)}</span> : ''}</strong>
                    </div>
                  )}
                  {m2 && draft.receita2 > 0 && (
                    <div className="live-recap-row">
                      <span className="recap-cupom">
                        <span className="dot" style={{ background: m2.color }} />
                        Cupom 2
                      </span>
                      <strong>{fmtBRL(draft.receita2)}<span className="live-recap-sub"> · {fmtPct(draft.receita2 / receitaCupom)}</span></strong>
                    </div>
                  )}
                  {draft.ordersCupom != null && draft.ordersCupom > 0 && receitaCupom > 0 && (
                    <div className="live-recap-row">
                      <span>Ticket médio cupom</span>
                      <strong>{fmtBRL(receitaCupom / draft.ordersCupom)}</strong>
                    </div>
                  )}

                  <div className="live-recap-row" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--line)' }}>
                    <span>Receita UTM</span>
                    <strong>{fmtBRL(draft.receitaUtm)}</strong>
                  </div>
                  {draft.ordersUtm != null && draft.ordersUtm > 0 && draft.receitaUtm > 0 && (
                    <div className="live-recap-row">
                      <span>Ticket médio UTM</span>
                      <strong>{fmtBRL(draft.receitaUtm / draft.ordersUtm)}</strong>
                    </div>
                  )}

                  {draft.ordersTotal != null && (
                    <div className="live-recap-row" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--line)' }}>
                      <span>Orders totais (referência)</span>
                      <strong>{draft.ordersTotal}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Métricas + notas */}
          <div className="col right">
            <div className="modal-col-head">
              <Icon.branding /> Métricas secundárias
            </div>

            {/* UTM gerada */}
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

            <div className="live-modal-hint">
              Alcance e receita UTM são opcionais — a maior parte do histórico não tem esses dados.
            </div>

            <div className="modal-grid">
              <label>Receita UTM</label>
              <div className="live-money-input" style={{ maxWidth: 200 }}>
                <span className="prefix">R$</span>
                <input
                  type="number"
                  min="0"
                  value={draft.receitaUtm || 0}
                  onChange={e => set('receitaUtm', Number(e.target.value))} />
              </div>

              <label>Orders UTM</label>
              <input
                className="field"
                type="number"
                min="0"
                style={{ maxWidth: 120 }}
                value={draft.ordersUtm ?? ''}
                onChange={e => set('ordersUtm', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="—" />

              <label>Alcance</label>
              <input
                className="field"
                type="number"
                min="0"
                style={{ maxWidth: 200 }}
                value={draft.alcance || 0}
                onChange={e => set('alcance', Number(e.target.value))}
                placeholder="0 = sem dado" />
            </div>

            <div className="stacked" style={{ marginTop: 18 }}>
              <label>Criativo</label>
              <input
                className="field"
                placeholder="Link ou descrição do criativo usado na live"
                value={draft.criativo || ''}
                onChange={e => set('criativo', e.target.value)} />
            </div>

            <div className="stacked" style={{ marginTop: 12 }}>
              <label>Observações</label>
              <textarea
                className="field"
                rows={4}
                placeholder="Notas sobre a live, performance, contexto..."
                value={draft.notes || ''}
                onChange={e => set('notes', e.target.value)} />
            </div>

          </div>
        </div>

        <div className="modal-foot">
          {draft.id !== '__new__' && (
            <button className="danger" onClick={() => { onDelete(draft); onClose() }}>
              <Icon.trash /> Excluir
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={() => onSave({ ...draft, receitaTotal: receitaCupom })}>
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  )
}
