'use client'

import { useState, useEffect } from 'react'
import type { Live, Merchan } from '@/lib/types'
import { LIVE_STATUSES, LIVE_STATUS_BY_ID } from '@/lib/types'
import { fmtBRL, fmtPct } from '@/lib/livesUtils'
import { Icon } from './Icons'
import { Popover } from './FormHelpers'

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
  merchans: Merchan[]
  onClose: () => void
  onSave: (l: Live) => void
  onDelete: (l: Live) => void
  onAddMerchan: (nome: string) => Promise<Merchan>
}

export default function LiveModal({ live, merchans, onClose, onSave, onDelete, onAddMerchan }: Props) {
  const [draft, setDraft] = useState<Live>(live)

  useEffect(() => { setDraft(live) }, [live.id])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const set = <K extends keyof Live>(k: K, v: Live[K]) => setDraft(d => ({ ...d, [k]: v }))
  const setMany = (obj: Partial<Live>) => setDraft(d => ({ ...d, ...obj }))

  const total = (draft.receita1 || 0) + (draft.receita2 || 0)
  useEffect(() => {
    if (total !== draft.receitaTotal) set('receitaTotal', total)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.receita1, draft.receita2])

  const m1 = merchans.find(m => m.nome === draft.merchan1)
  const m2 = merchans.find(m => m.nome === draft.merchan2)
  const utmPct = total > 0 && draft.receitaUtm > 0 ? draft.receitaUtm / total : 0

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
              <input
                className="field"
                type="date"
                value={draft.date}
                onChange={e => set('date', e.target.value)}
                style={{ maxWidth: 200 }} />
            </div>

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
              </div>
            </div>

            {/* CUPOM 2 */}
            <div className={`cupom-block ${m1?.sempreSozinho ? 'disabled' : ''}`}>
              <div className="cupom-head">
                <span className="cupom-tag cupom-2">CUPOM 2</span>
                <span className="cupom-hint">
                  {m1?.sempreSozinho
                    ? `«${m1.nome}» sempre vai sozinho`
                    : draft.merchan2 ? 'secundário' : 'opcional — vazio se a live só teve 1 cupom'}
                </span>
                {draft.merchan2 && !m1?.sempreSozinho && (
                  <button className="link-btn" onClick={() => setMany({ merchan2: '', nominal2: '', receita2: 0 })}>
                    remover
                  </button>
                )}
              </div>
              {!m1?.sempreSozinho && (
                <div className="modal-grid">
                  <label>Merchan</label>
                  <MerchanSelect
                    value={draft.merchan2}
                    merchans={merchans.filter(m => m.ativo && !m.sempreSozinho && m.nome !== draft.merchan1)}
                    onChange={v => set('merchan2', v)}
                    onAddMerchan={onAddMerchan}
                    placeholder="Sem cupom 2"
                    allowClear />

                  {draft.merchan2 && (
                    <>
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
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Total + sinaleiras */}
            <div className="mh-section">
              <div className="mh-section-head">
                <Icon.branding /> Resultado total
              </div>
              <div className="live-total-row">
                <div>
                  <div className="live-total-label">Receita total (auto)</div>
                  <div className="live-total-val">{fmtBRL(total)}</div>
                  {draft.receita1 > 0 && draft.receita2 > 0 && (
                    <div className="live-total-split">
                      {fmtBRL(draft.receita1)} <span>+</span> {fmtBRL(draft.receita2)}
                    </div>
                  )}
                </div>
                <div className="live-flags">
                  <label className="flag-toggle">
                    <input type="checkbox" checked={!!draft.cupomLigado} onChange={e => set('cupomLigado', e.target.checked)} />
                    <span>cupom ligado</span>
                  </label>
                  <label className="flag-toggle">
                    <input type="checkbox" checked={!!draft.criativo} onChange={e => set('criativo', e.target.checked)} />
                    <span>tinha criativo</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Métricas + notas */}
          <div className="col right">
            <div className="modal-col-head">
              <Icon.branding /> Métricas secundárias
            </div>
            <div className="live-modal-hint">
              UTM e alcance são opcionais — a maior parte do histórico não tem esses dados.
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

              <label>% UTM</label>
              <div className="readonly-cell">{utmPct > 0 ? fmtPct(utmPct) : '—'}</div>

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
              <label>Observações</label>
              <textarea
                className="field"
                rows={5}
                placeholder="Notas sobre a live, performance, contexto..."
                value={draft.notes || ''}
                onChange={e => set('notes', e.target.value)} />
            </div>

            {draft.status === 'realizada' && total > 0 && (
              <div className="stacked" style={{ marginTop: 18 }}>
                <label>Resumo</label>
                <div className="live-recap">
                  <div className="live-recap-row">
                    <span>Receita total</span>
                    <strong>{fmtBRL(total)}</strong>
                  </div>
                  {m1 && (
                    <div className="live-recap-row">
                      <span className="recap-cupom">
                        <span className="dot" style={{ background: m1.color }} />
                        Cupom 1
                      </span>
                      <strong>{fmtBRL(draft.receita1)} <span className="live-recap-sub">{total > 0 ? `· ${fmtPct(draft.receita1 / total)}` : ''}</span></strong>
                    </div>
                  )}
                  {m2 && draft.receita2 > 0 && (
                    <div className="live-recap-row">
                      <span className="recap-cupom">
                        <span className="dot" style={{ background: m2.color }} />
                        Cupom 2
                      </span>
                      <strong>{fmtBRL(draft.receita2)} <span className="live-recap-sub">· {fmtPct(draft.receita2 / total)}</span></strong>
                    </div>
                  )}
                  {utmPct > 0 && (
                    <div className="live-recap-row">
                      <span>UTM</span>
                      <strong>{fmtBRL(draft.receitaUtm)} <span className="live-recap-sub">· {fmtPct(utmPct)}</span></strong>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-foot">
          <button className="danger" onClick={() => { onDelete(draft); onClose() }}>
            <Icon.trash /> Excluir
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={() => onSave({ ...draft, receitaTotal: total })}>
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  )
}
