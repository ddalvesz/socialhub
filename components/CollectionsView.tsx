'use client'

import { useState, useEffect } from 'react'
import { Icon } from './Icons'
import { GenericSelect, PackToggle, FieldCheckbox, DateRangeFilter, DateRange } from './FormHelpers'
import {
  Collection, Campaign, Linking, ExtraTask,
  COLECAO_TIPOS, COL_STATUS, COL_CONFIRMADO,
  ILUSTRA_TASKS, MKT_TASKS, colProgress,
  fmtBR, todayISO,
} from '@/lib/types'
import { TEAM_NAMES } from '@/lib/data'

// ─── ColStatusPill ────────────────────────────────────────────
function ColStatusPill({ value, onChange, size = 'sm' }: { value: string; onChange: (v: string) => void; size?: 'sm' | 'lg' }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = { current: null as HTMLButtonElement | null }
  const cur = COL_STATUS.find(s => s.id === value) || COL_STATUS[0]

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen(o => !o)
  }

  return (
    <div style={{ display: 'inline-block' }} onClick={e => e.stopPropagation()}>
      <button
        ref={el => { btnRef.current = el }}
        type="button"
        onClick={toggle}
        className="col-status-chip"
        style={{
          background: `color-mix(in oklab, ${cur.color}, white 90%)`,
          color: cur.color,
          borderColor: `color-mix(in oklab, ${cur.color}, white 75%)`,
          fontSize: size === 'lg' ? 12.5 : 11.5,
          padding: size === 'lg' ? '5px 12px' : '3px 10px',
        }}>
        <span className="sdot" style={{ background: cur.color }} />
        {cur.label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && pos && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 60 }} onClick={() => setOpen(false)} />
          <div className="col-status-menu" style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 61 }}>
            {COL_STATUS.map(s => (
              <button key={s.id} type="button"
                onClick={e => { e.stopPropagation(); onChange(s.id); setOpen(false) }}
                className={value === s.id ? 'active' : ''}>
                <span className="sdot" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── ColConfirmadoPill ────────────────────────────────────────
function ColConfirmadoPill({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = { current: null as HTMLButtonElement | null }
  const cur = COL_CONFIRMADO.find(s => s.id === value) || COL_CONFIRMADO[0]

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen(o => !o)
  }

  return (
    <div style={{ display: 'inline-block' }} onClick={e => e.stopPropagation()}>
      <button
        ref={el => { btnRef.current = el }}
        type="button"
        onClick={toggle}
        className="col-status-chip"
        style={{
          background: `color-mix(in oklab, ${cur.color}, white 90%)`,
          color: cur.color,
          borderColor: `color-mix(in oklab, ${cur.color}, white 75%)`,
        }}>
        <span className="sdot" style={{ background: cur.color }} />
        {cur.label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && pos && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 60 }} onClick={() => setOpen(false)} />
          <div className="col-status-menu" style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 61 }}>
            {COL_CONFIRMADO.map(s => (
              <button key={s.id} type="button"
                onClick={e => { e.stopPropagation(); onChange(s.id); setOpen(false) }}
                className={value === s.id ? 'active' : ''}>
                <span className="sdot" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── MiniSwitch ───────────────────────────────────────────────
function MiniSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button"
      className={`mini-switch ${value ? 'on' : ''}`}
      onClick={e => { e.stopPropagation(); onChange(!value) }}>
      <span className="ms-knob" />
    </button>
  )
}

// ─── TaskRow ──────────────────────────────────────────────────
function TaskRow({ task, scope, collection, onChange }: {
  task: { key: string; label: string; optional: boolean }
  scope: 'ilustra' | 'marketing'
  collection: Collection
  onChange: (patch: Record<string, unknown>) => void
}) {
  const scopeData = collection[scope] as any
  const isOpt = task.optional
  const enabled = isOpt ? !!scopeData[`${task.key}Enabled`] : true
  const done = !!scopeData[task.key]

  const toggleDone = () => {
    if (!enabled) return
    onChange({ [task.key]: !done })
  }
  const toggleEnabled = (v: boolean) => {
    const patch: Record<string, unknown> = { [`${task.key}Enabled`]: v }
    if (!v) patch[task.key] = false
    onChange(patch)
  }

  return (
    <div className={`task-row ${!enabled ? 'disabled' : ''} ${done ? 'done' : ''}`}
      onClick={toggleDone}>
      <span className={`check-cell ${done ? 'on' : ''}`} style={!enabled ? { opacity: .3 } : undefined}>
        {done && <Icon.check />}
      </span>
      <div className="task-label">{task.label}</div>
      {isOpt
        ? <MiniSwitch value={enabled} onChange={toggleEnabled} />
        : <span className="task-required">obrigatória</span>}
    </div>
  )
}

// ─── ExtraTaskSection ─────────────────────────────────────────
function ExtraTaskSection({ tasks, onChange }: {
  tasks: ExtraTask[]
  onChange: (updated: ExtraTask[]) => void
}) {
  const [input, setInput] = useState('')

  const add = () => {
    const label = input.trim()
    if (!label) return
    onChange([...tasks, { id: Date.now().toString(), label, done: false }])
    setInput('')
  }

  const toggle = (id: string) =>
    onChange(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))

  const remove = (id: string) =>
    onChange(tasks.filter(t => t.id !== id))

  return (
    <div className="extra-tasks">
      {tasks.map(t => (
        <div key={t.id} className={`task-row extra ${t.done ? 'done' : ''}`} onClick={() => toggle(t.id)}>
          <span className={`check-cell ${t.done ? 'on' : ''}`}>
            {t.done && <Icon.check />}
          </span>
          <div className="task-label">{t.label}</div>
          <button
            className="extra-task-del"
            onClick={e => { e.stopPropagation(); remove(t.id) }}
            title="Remover"
          >×</button>
        </div>
      ))}
      <div className="extra-task-add" onClick={e => e.stopPropagation()}>
        <input
          className="extra-task-input"
          placeholder="Nova tarefa…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add() }}
        />
        <button className="extra-task-btn" onClick={add} disabled={!input.trim()}>+</button>
      </div>
    </div>
  )
}

// ─── ScopePanel ───────────────────────────────────────────────
function ScopePanel({ scope, title, accent, collection, onChange, children, tasks }: {
  scope: 'ilustra' | 'marketing'
  title: string
  accent: string
  collection: Collection
  onChange: (patch: Record<string, unknown>) => void
  children?: React.ReactNode
  tasks: { key: string; label: string; optional: boolean }[]
}) {
  return (
    <div className="scope-panel" style={{ '--scope-accent': accent } as React.CSSProperties}>
      <div className="scope-head">
        <div className="scope-title">
          <span className="scope-dot" />
          <span>{title}</span>
        </div>
        <ColStatusPill
          value={(collection[scope] as any).status}
          onChange={v => onChange({ status: v })}
          size="lg" />
      </div>
      {children}
      <div className="task-list">
        {tasks.map(t => (
          <TaskRow key={t.key} task={t} scope={scope}
            collection={collection}
            onChange={patch => onChange(patch)} />
        ))}
      </div>
      <ExtraTaskSection
        tasks={(collection[scope] as any).extraTasks ?? []}
        onChange={updated => onChange({ extraTasks: updated })}
      />
    </div>
  )
}

// ─── CollectionFormModal ──────────────────────────────────────
function CollectionFormModal({ initial, onClose, onSave }: { initial?: Collection | null; onClose: () => void; onSave: (c: any) => void }) {
  const blank: Omit<Collection, 'id'> = {
    nome: '', tipo: 'autoral',
    mes: '', dataSite: todayISO(), dataMarketing: todayISO(),
    confirmado: 'negociacao', launched: false,
    ilustra: { status: 'naoIniciada', criacao: false, adaptacao: false, aprovEnabled: false, aprov: false, cadastro: false },
    marketing: { status: 'naoIniciada', pack: 'M', dono: TEAM_NAMES[0],
      banner: false,
      pedidoEnabled: false, pedido: false, loadingEnabled: false, loading: false,
      postEnabled: false, post: false, carrosselEnabled: false, carrossel: false,
      reelsEnabled: false, reels: false, trincaEnabled: false, trinca: false,
      shootingEnabled: false, shooting: false, storiesEnabled: false, stories: false,
      influsEnabled: false, influs: false },
  }
  const [draft, setDraft] = useState<any>(() => ({ ...blank, ...(initial || {}) }))
  const set = (k: string, v: any) => setDraft((d: any) => ({ ...d, [k]: v }))
  const isNew = !initial
  const tipo = COLECAO_TIPOS.find(t => t.id === draft.tipo)

  const handleSave = () => {
    if (!draft.nome.trim()) return
    onSave(draft)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{
            width: 40, height: 40, borderRadius: 12, flex: '0 0 40px',
            background: tipo?.color || 'var(--accent)', color: 'white', display: 'grid', placeItems: 'center',
          }}>
            <Icon.collections />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '.04em' }}>
              {isNew ? 'NOVA COLEÇÃO' : 'EDITAR COLEÇÃO'}
            </div>
            <input className="modal-title" value={draft.nome} placeholder="Nome da coleção"
              onChange={e => set('nome', e.target.value)} autoFocus />
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <div className="modal-section-label">Informações gerais</div>

            <label>Tipo</label>
            <GenericSelect value={draft.tipo}
              options={COLECAO_TIPOS.map(t => ({ id: t.id, label: t.label }))}
              onChange={v => set('tipo', v)} width={240} />

            <label>Mês</label>
            <input className="field" value={draft.mes} placeholder="ex: Maio"
              onChange={e => set('mes', e.target.value)} style={{ maxWidth: 200 }} />

            <label>Pacote</label>
            <PackToggle value={draft.marketing.pack}
              onChange={v => set('marketing', { ...draft.marketing, pack: v })} />

            <label>Dono (marketing)</label>
            <GenericSelect value={draft.marketing.dono}
              options={TEAM_NAMES.map(t => ({ id: t, label: t }))}
              onChange={v => set('marketing', { ...draft.marketing, dono: v })} width={200} />

            <div className="modal-section-label">Cronograma</div>

            <label>Data lançamento site</label>
            <input className="field" type="date" value={draft.dataSite}
              onChange={e => set('dataSite', e.target.value)} style={{ maxWidth: 200 }} />

            <label>Início do marketing</label>
            <input className="field" type="date" value={draft.dataMarketing}
              onChange={e => set('dataMarketing', e.target.value)} style={{ maxWidth: 200 }} />

            <div className="modal-section-label">Status</div>

            <label>Confirmada?</label>
            <div className="field-inline" style={{ flexWrap: 'wrap' }}>
              {COL_CONFIRMADO.map(s => (
                <button key={s.id} type="button"
                  onClick={() => set('confirmado', s.id)}
                  className="col-status-chip"
                  style={{
                    background: draft.confirmado === s.id ? `color-mix(in oklab, ${s.color}, white 88%)` : 'var(--surface)',
                    color: draft.confirmado === s.id ? s.color : 'var(--ink-3)',
                    borderColor: draft.confirmado === s.id ? `color-mix(in oklab, ${s.color}, white 70%)` : 'var(--line)',
                  }}>
                  <span className="sdot" style={{ background: s.color }} />{s.label}
                </button>
              ))}
            </div>

            <label>Lançada?</label>
            <FieldCheckbox label="Marcar como lançada (já está no site)"
              value={draft.launched} onChange={v => set('launched', v)} />
          </div>
        </div>

        <div className="modal-foot">
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handleSave}>
            {isNew ? 'Criar coleção' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CampaignLinkSection ──────────────────────────────────────
function CampaignLinkSection({ collection, campaigns, pickerOpen, onTogglePicker, onLink, onCreate, onUnlink, onNavigate }: {
  collection: Collection
  campaigns: Campaign[]
  pickerOpen: boolean
  onTogglePicker: () => void
  onLink: (id: number) => void
  onCreate: () => void
  onUnlink: () => void
  onNavigate: (id: number) => void
}) {
  const linked = collection.campaignId != null
    ? campaigns.find(c => c.id === collection.campaignId)
    : null
  const available = campaigns.filter(c => c.colecaoId == null || c.colecaoId === collection.id)

  return (
    <div className="link-section" onClick={e => e.stopPropagation()}>
      <div className="link-section-head">
        <Icon.campaign />
        <span className="link-section-label">Campanha</span>
        <span className="link-section-sub">
          {linked ? 'Esta coleção é uma campanha — progresso e lançamento sincronizam' : 'Marque se esta coleção também é uma campanha'}
        </span>
      </div>
      {linked ? (
        <div className="link-chip-row">
          <button className="link-chip" onClick={() => onNavigate(linked.id)} type="button">
            <span className="link-chip-icon"><Icon.campaign /></span>
            <span className="link-chip-name">{linked.nome}</span>
            <span className="link-chip-meta">
              <span className={`event-pack ${linked.pack.toLowerCase()}`}>{linked.pack}</span>
              <span>· abrir campanha</span>
              <Icon.chevR />
            </span>
          </button>
          <button className="link-unlink" onClick={onUnlink} type="button" title="Desvincular">
            <Icon.x />
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <button className="btn btn-ghost link-add-btn" onClick={onTogglePicker} type="button">
            <Icon.plus /> Marcar como campanha
          </button>
          {pickerOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={onTogglePicker} />
              <div className="link-picker">
                <div className="link-picker-head">Vincular a uma campanha</div>
                {available.length > 0 ? (
                  <div className="link-picker-list">
                    {available.map(camp => (
                      <button key={camp.id} type="button" onClick={() => onLink(camp.id)}>
                        <span className={`event-pack ${camp.pack.toLowerCase()}`}>{camp.pack}</span>
                        <span className="lp-name">{camp.nome}</span>
                        <span className="lp-sub">{camp.mes}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="link-picker-empty">Todas as campanhas já têm coleção vinculada</div>
                )}
                <button type="button" className="link-picker-create" onClick={onCreate}>
                  <Icon.plus /> Criar nova campanha a partir desta coleção
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── CollectionsView ──────────────────────────────────────────
interface CollectionsViewProps {
  linking: Linking
  onNavigateCampaign: (id: number) => void
}

export default function CollectionsView({ linking, onNavigateCampaign }: CollectionsViewProps) {
  const { collections, setCollections, campaigns,
    linkColCamp, unlinkColCamp, createCampaignFromCollection,
    setCollectionLaunched } = linking

  const [filterTipo, setFilterTipo] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' })
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Collection | null>(null)
  const [pickerOpen, setPickerOpen] = useState<number | null>(null)

  useEffect(() => {
    const h = (e: Event) => setExpanded((e as CustomEvent).detail)
    window.addEventListener('focusCollection', h)
    return () => window.removeEventListener('focusCollection', h)
  }, [])

  let filtered = collections
  if (filterTipo !== 'all') filtered = filtered.filter(c => c.tipo === filterTipo)
  if (filterStatus === 'launched')   filtered = filtered.filter(c => c.launched)
  if (filterStatus === 'pending')    filtered = filtered.filter(c => !c.launched && c.confirmado !== 'cancelada')
  if (filterStatus === 'cancelada')  filtered = filtered.filter(c => c.confirmado === 'cancelada')
  if (filterStatus === 'negociacao') filtered = filtered.filter(c => c.confirmado === 'negociacao')
  const hasDateFilter = dateRange.from || dateRange.to
  if (!hasDateFilter) filtered = filtered.filter(c => !c.dataSite || c.dataSite === '-' || c.dataSite >= '2026-01-01')
  if (dateRange.from) filtered = filtered.filter(c => !c.dataSite || c.dataSite >= dateRange.from)
  if (dateRange.to)   filtered = filtered.filter(c => !c.dataSite || c.dataSite <= dateRange.to)

  const update = (id: number, patch: Partial<Collection>) =>
    setCollections(arr => arr.map(c => c.id === id ? { ...c, ...patch } : c))

  const updateScope = (id: number, scope: 'ilustra' | 'marketing', patch: Record<string, unknown>) =>
    setCollections(arr => arr.map(c => c.id === id ? { ...c, [scope]: { ...c[scope], ...patch } } : c))

  const remove = (id: number) => {
    const col = collections.find(c => c.id === id)
    if (col?.campaignId != null) unlinkColCamp(id, col.campaignId)
    setCollections(arr => arr.filter(c => c.id !== id))
  }

  const add = (data: any) => {
    const id = collections.reduce((m, c) => Math.max(m, c.id), 0) + 1
    setCollections(arr => [...arr, { id, campaignId: null, ...data }])
  }

  const saveEdit = (data: any) => {
    setCollections(arr => arr.map(c => c.id === data.id ? { ...c, ...data } : c))
  }

  const gridCols = '32px 2fr 0.9fr 100px 0.8fr 0.8fr 1.1fr 1.1fr 1.1fr 1fr'

  return (
    <>
      <div className="filter-bar" style={{ paddingTop: 16 }}>
        <button className={`platform-pill ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}>Todas</button>
        <button className={`platform-pill ${filterStatus === 'pending' ? 'active' : ''}`}
          onClick={() => setFilterStatus('pending')}>
          <span className="dot" style={{ background: 'oklch(0.62 0.13 75)' }} />Em andamento
        </button>
        <button className={`platform-pill ${filterStatus === 'launched' ? 'active' : ''}`}
          onClick={() => setFilterStatus('launched')}>
          <span className="dot" style={{ background: 'oklch(0.6 0.13 150)' }} />Lançadas
        </button>
        <button className={`platform-pill ${filterStatus === 'negociacao' ? 'active' : ''}`}
          onClick={() => setFilterStatus('negociacao')}>
          <span className="dot" style={{ background: 'oklch(0.62 0.13 75)' }} />Em negociação
        </button>
        <button className={`platform-pill ${filterStatus === 'cancelada' ? 'active' : ''}`}
          onClick={() => setFilterStatus('cancelada')}>
          <span className="dot" style={{ background: 'oklch(0.6 0.05 25)' }} />Canceladas
        </button>

        <div style={{ width: 1, height: 18, background: 'var(--line)', margin: '0 6px' }} />

        <button className={`platform-pill ${filterTipo === 'all' ? 'active' : ''}`}
          onClick={() => setFilterTipo('all')}>Todos os tipos</button>
        {COLECAO_TIPOS.map(t => (
          <button key={t.id}
            className={`platform-pill ${filterTipo === t.id ? 'active' : ''}`}
            onClick={() => setFilterTipo(t.id)}>
            <span className="dot" style={{ background: t.color }} />{t.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <span className="count-pill">{filtered.length} {filtered.length === 1 ? 'coleção' : 'coleções'}</span>
        <button className="btn btn-accent" onClick={() => setShowForm(true)}>
          <Icon.plus /> Nova coleção
        </button>
      </div>

      <div className="list-wrap">
        <div className="list">
          <div className="list-row list-head" style={{ gridTemplateColumns: gridCols }}>
            <div className="cell" />
            <div className="cell">Coleção</div>
            <div className="cell">Tipo</div>
            <div className="cell">Mês</div>
            <div className="cell">Site</div>
            <div className="cell">Marketing</div>
            <div className="cell">Ilustra</div>
            <div className="cell">Marketing</div>
            <div className="cell">Confirmada</div>
            <div className="cell">Progresso</div>
          </div>

          {filtered.map(c => {
            const isOpen = expanded === c.id
            const tipo = COLECAO_TIPOS.find(t => t.id === c.tipo)!
            const prog = colProgress(c)
            const cancelled = c.confirmado === 'cancelada'

            return (
              <div key={c.id}>
                <div
                  className={`list-row expandable ${isOpen ? 'expanded' : ''}`}
                  style={{ gridTemplateColumns: gridCols, opacity: cancelled ? 0.55 : 1 }}
                  onClick={() => setExpanded(isOpen ? null : c.id)}
                >
                  <div className="cell" style={{ padding: '14px 0 14px 16px' }}>
                    <span style={{
                      display: 'inline-grid', placeItems: 'center',
                      width: 24, height: 24, borderRadius: 999, color: 'var(--ink-3)',
                      transition: 'transform .2s',
                      transform: isOpen ? 'rotate(0)' : 'rotate(-90deg)',
                    }}>
                      <Icon.chevD />
                    </span>
                  </div>

                  <div className="cell" style={{ fontWeight: 500, fontSize: 13.5,
                    textDecoration: cancelled ? 'line-through' : 'none' }}>
                    {c.nome}
                    {c.campaignId != null && (
                      <span className="link-badge" title="Esta coleção é uma campanha">
                        <Icon.campaign /> Campanha
                      </span>
                    )}
                    {c.launched && (
                      <span style={{
                        marginLeft: 10, fontSize: 10.5, fontWeight: 600,
                        padding: '2px 7px', borderRadius: 999,
                        background: 'color-mix(in oklab, var(--s-pub), white 88%)',
                        color: 'var(--s-pub)', letterSpacing: '.04em',
                      }}>NO SITE</span>
                    )}
                  </div>

                  <div className="cell">
                    <span style={{
                      padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                      background: `color-mix(in oklab, ${tipo.color}, white 88%)`,
                      color: tipo.color,
                    }}>{tipo.label}</span>
                  </div>

                  <div className="cell" style={{ color: 'var(--ink-2)' }}>{c.mes}</div>

                  <div className="cell" style={{ fontSize: 13, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtBR(c.dataSite)}
                  </div>

                  <div className="cell" style={{ fontSize: 13, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtBR(c.dataMarketing)}
                  </div>

                  <div className="cell">
                    <ColStatusPill value={c.ilustra.status}
                      onChange={v => updateScope(c.id, 'ilustra', { status: v })} />
                  </div>

                  <div className="cell">
                    <ColStatusPill value={c.marketing.status}
                      onChange={v => updateScope(c.id, 'marketing', { status: v })} />
                  </div>

                  <div className="cell">
                    <ColConfirmadoPill value={c.confirmado}
                      onChange={v => update(c.id, { confirmado: v })} />
                  </div>

                  <div className="cell">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="progress" style={{ flex: 1 }}>
                        <div style={{ width: `${prog}%` }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--ink-3)', minWidth: 30, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {prog}%
                      </span>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="list-expansion">
                    {/* Quick facts */}
                    <div className="exp-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                      <div className="exp-cell"><label>Mês</label><div className="v">{c.mes || '—'}</div></div>
                      <div className="exp-cell"><label>Lançamento site</label><div className="v">{fmtBR(c.dataSite)}</div></div>
                      <div className="exp-cell"><label>Início marketing</label><div className="v">{fmtBR(c.dataMarketing)}</div></div>
                      <div className="exp-cell">
                        <label>Pacote · Dono</label>
                        <div className="v" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`event-pack ${c.marketing.pack.toLowerCase()}`}>{c.marketing.pack}</span>
                          <span className="sb-avatar" style={{ width: 22, height: 22, fontSize: 12, flex: '0 0 22px' }}>
                            {c.marketing.dono.charAt(0)}
                          </span>
                          {c.marketing.dono}
                        </div>
                      </div>
                      <div className="exp-cell">
                        <label>Conclusão</label>
                        <div className="v" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress" style={{ flex: 1, maxWidth: 130 }}>
                            <div style={{ width: `${prog}%` }} />
                          </div>
                          <span style={{ fontSize: 11 }}>{prog}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Campanha link */}
                    <CampaignLinkSection
                      collection={c}
                      campaigns={campaigns}
                      pickerOpen={pickerOpen === c.id}
                      onTogglePicker={() => setPickerOpen(pickerOpen === c.id ? null : c.id)}
                      onLink={campaignId => { linkColCamp(c.id, campaignId); setPickerOpen(null) }}
                      onCreate={() => { createCampaignFromCollection(c); setPickerOpen(null) }}
                      onUnlink={() => unlinkColCamp(c.id, c.campaignId!)}
                      onNavigate={onNavigateCampaign}
                    />

                    {/* Two scope panels */}
                    <div className="scope-grid">
                      <ScopePanel scope="ilustra" title="Ilustra"
                        accent="oklch(0.6 0.16 320)"
                        collection={c} tasks={ILUSTRA_TASKS}
                        onChange={patch => updateScope(c.id, 'ilustra', patch)} />

                      <ScopePanel scope="marketing" title="Marketing"
                        accent="oklch(0.6 0.16 230)"
                        collection={c} tasks={MKT_TASKS}
                        onChange={patch => updateScope(c.id, 'marketing', patch)}>
                        <div className="scope-meta">
                          <div className="scope-meta-cell">
                            <label>Pacote</label>
                            <PackToggle value={c.marketing.pack}
                              onChange={v => updateScope(c.id, 'marketing', { pack: v })} />
                          </div>
                          <div className="scope-meta-cell">
                            <label>Dono</label>
                            <GenericSelect value={c.marketing.dono}
                              options={TEAM_NAMES.map(t => ({ id: t, label: t }))}
                              onChange={v => updateScope(c.id, 'marketing', { dono: v })}
                              width={180} />
                          </div>
                        </div>
                      </ScopePanel>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
                      <button className="btn btn-ghost" onClick={e => { e.stopPropagation(); setEditing(c) }}>
                        Editar informações
                      </button>
                      <FieldCheckbox label="Marcar como lançada (já no site)"
                        value={c.launched}
                        onChange={v => setCollectionLaunched(c.id, v)} />
                      <div style={{ flex: 1 }} />
                      <button className="btn btn-ghost" style={{ color: 'var(--ink-3)' }}
                        onClick={e => { e.stopPropagation(); remove(c.id); setExpanded(null) }}>
                        <Icon.trash /> Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-3)' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 4 }}>
                Nenhuma coleção
              </div>
              <div style={{ fontSize: 13 }}>Ajuste os filtros ou crie uma nova coleção.</div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <CollectionFormModal onClose={() => setShowForm(false)} onSave={add} />
      )}
      {editing && (
        <CollectionFormModal initial={editing}
          onClose={() => setEditing(null)}
          onSave={saveEdit} />
      )}
    </>
  )
}
