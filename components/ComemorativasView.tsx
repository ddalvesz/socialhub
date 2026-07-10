'use client'

import { useState } from 'react'
import { Icon } from './Icons'
import { GenericSelect, PackToggle, FieldCheckbox, DateRangeFilter, DateRange, DatePicker } from './FormHelpers'
import { EventDate, MONTHS, WEEKDAYS, fmtBR, buildMonthGrid, parseISO, toISO, todayISO, FORMATS_LIST } from '@/lib/types'
import { EVENT_TYPES } from '@/lib/data'

function getColor(e: EventDate) {
  return EVENT_TYPES.find(t => t.id === e.type)?.color ?? '#999'
}

function MiniCalendar({ events, year, month, onEventClick }: {
  events: EventDate[]
  year: number
  month: number
  onEventClick: (e: EventDate) => void
}) {
  const cells = buildMonthGrid(year, month)
  const today = todayISO()
  const byDay: Record<string, EventDate[]> = {}

  events.forEach(e => {
    const s = parseISO(e.start)
    const en = parseISO(e.end)
    for (const d = new Date(s); d <= en; d.setDate(d.getDate() + 1)) {
      const iso = toISO(d.getFullYear(), d.getMonth(), d.getDate())
      ;(byDay[iso] = byDay[iso] || []).push(e)
    }
  })

  return (
    <div className="cal-grid">
      {WEEKDAYS.map(w => <div key={w} className="cal-head">{w}</div>)}
      {cells.map((c, i) => {
        const isToday = c.iso === today
        const dayE = byDay[c.iso] || []
        return (
          <div key={i} className={`cal-cell ${c.other ? 'other' : ''} ${isToday ? 'today' : ''}`}>
            <div className="cal-num-row">
              <span className="cal-num-box">{c.day}</span>
            </div>
            {dayE.slice(0, 3).map((e, k) => {
              const color = getColor(e)
              return (
                <div key={k} onClick={() => onEventClick(e)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 8px', borderRadius: 6, cursor: 'pointer',
                  background: `color-mix(in oklab, ${color}, white 88%)`,
                  color: `color-mix(in oklab, ${color}, black 25%)`,
                  fontSize: 11.5, fontWeight: 500,
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{e.name}</span>
                  <span className={`event-pack ${e.pack.toLowerCase()}`} style={{ background: 'rgba(255,255,255,.5)', border: 'none' }}>{e.pack}</span>
                </div>
              )
            })}
            {dayE.length > 3 && <div className="cal-more">+{dayE.length - 3}</div>}
          </div>
        )
      })}
    </div>
  )
}

function ComemorativaFormModal({
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  initial: EventDate | null
  onClose: () => void
  onSave: (data: Omit<EventDate, 'id'>) => Promise<void>
  onDelete?: () => Promise<void>
}) {
  const isNew = initial === null
  const [draft, setDraft] = useState<Omit<EventDate, 'id'>>({
    type:      initial?.type      ?? 'evento',
    name:      initial?.name      ?? '',
    start:     initial?.start     ?? todayISO(),
    end:       initial?.end       ?? todayISO(),
    pack:      initial?.pack      ?? 'M',
    potencial: initial?.potencial ?? true,
    postado:   initial?.postado   ?? false,
    format:    initial?.format    ?? 'Estático',
  })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (k: keyof typeof draft, v: any) => setDraft(d => ({ ...d, [k]: v }))

  const handleSave = async () => {
    if (!draft.name.trim()) return
    setSaving(true)
    await onSave({ ...draft, end: draft.end || draft.start })
    setSaving(false)
    onClose()
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setSaving(true)
    await onDelete!()
    setSaving(false)
    onClose()
  }

  const tp = EVENT_TYPES.find(t => t.id === draft.type)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal form-modal" onClick={e => e.stopPropagation()} style={{ width: 'min(640px, calc(100vw - 40px))' }}>
        <div className="modal-head">
          <div style={{
            width: 40, height: 40, borderRadius: 12, flex: '0 0 40px',
            background: tp?.color || '#999', color: 'white', display: 'grid', placeItems: 'center'
          }}><Icon.events /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '.04em' }}>
              {isNew ? 'NOVA DATA COMEMORATIVA' : 'EDITAR DATA COMEMORATIVA'}
            </div>
            <input className="modal-title" value={draft.name} placeholder="Nome da data"
              onChange={e => set('name', e.target.value)} autoFocus />
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <label>Tipo</label>
            <GenericSelect value={draft.type} options={EVENT_TYPES.map(t => ({ id: t.id, label: t.label }))}
              onChange={v => set('type', v)} width={220} />

            <label>Início</label>
            <DatePicker value={draft.start}
              onChange={v => set('start', v)} style={{ maxWidth: 200 }} />

            <label>Fim</label>
            <DatePicker value={draft.end}
              onChange={v => set('end', v)} style={{ maxWidth: 200 }} />

            <label>Pacote</label>
            <PackToggle value={draft.pack} onChange={v => set('pack', v)} />

            <label>Formato</label>
            <GenericSelect value={draft.format} options={[{id: '', label: 'Nenhum'}, ...FORMATS_LIST.map(f => ({ id: f, label: f }))]}
              onChange={v => set('format', v)} width={200} />

            <label>Status</label>
            <div className="field-inline">
              <FieldCheckbox label="Potencial" value={draft.potencial} onChange={v => set('potencial', v)} />
              <FieldCheckbox label="Já postado" value={draft.postado} onChange={v => set('postado', v)} />
            </div>
          </div>
        </div>

        <div className="modal-foot">
          {!isNew && onDelete && (
            <button
              className="btn btn-ghost"
              onClick={handleDelete}
              disabled={saving}
              style={{ color: confirmDelete ? 'var(--red)' : undefined }}
            >
              {confirmDelete ? 'Confirmar exclusão' : 'Excluir'}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handleSave} disabled={saving || !draft.name.trim()}>
            {isNew ? 'Criar data' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ComemorativasView({
  initialItems,
  onSave,
  onDelete,
}: {
  initialItems: EventDate[]
  onSave: (e: EventDate) => Promise<EventDate>
  onDelete: (id: number) => Promise<void>
}) {
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [filter, setFilter] = useState('all')
  const [month, setMonth] = useState(4)
  const [year] = useState(2026)
  const [items, setItems] = useState<EventDate[]>(initialItems)
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' })
  const [modalTarget, setModalTarget] = useState<EventDate | null | undefined>(undefined)
  // undefined = closed, null = new, EventDate = editing

  const filtered = (filter === 'all' ? items : items.filter(e => e.type === filter))
    .filter(e => {
      if (dateRange.from && e.end < dateRange.from) return false
      if (dateRange.to && e.start > dateRange.to) return false
      return true
    })

  const toggleField = async (e: EventDate, field: 'potencial' | 'postado') => {
    const updated = { ...e, [field]: !e[field] }
    setItems(arr => arr.map(x => x.id === e.id ? updated : x))
    await onSave(updated)
  }

  const handleSave = async (data: Omit<EventDate, 'id'>) => {
    if (modalTarget === null) {
      // create
      const created = await onSave({ id: 0, ...data })
      setItems(arr => [...arr, created])
    } else if (modalTarget) {
      // update
      const updated = { ...modalTarget, ...data }
      await onSave(updated)
      setItems(arr => arr.map(x => x.id === updated.id ? updated : x))
    }
  }

  const handleDelete = async () => {
    if (!modalTarget) return
    await onDelete(modalTarget.id)
    setItems(arr => arr.filter(x => x.id !== modalTarget.id))
  }

  return (
    <>
      <div className="filter-bar">
        <button className={`platform-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todas</button>
        {EVENT_TYPES.map(t => (
          <button key={t.id} className={`platform-pill ${filter === t.id ? 'active' : ''}`} onClick={() => setFilter(t.id)}>
            <span className="dot" style={{ background: t.color }} />
            {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <div className="view-toggle">
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>Lista</button>
          <button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>Calendário</button>
        </div>
        <button className="btn btn-accent" onClick={() => setModalTarget(null)}><Icon.plus /> Nova data</button>
      </div>

      <div className="list-wrap">
        {view === 'list' ? (
          <div className="list">
            <div className="list-row list-head" style={{ gridTemplateColumns: '40px 1.6fr 1.1fr 0.9fr 80px 90px 90px 1fr' }}>
              {['', 'Nome', 'Período', 'Tipo', 'Pacote', 'Potencial', 'Postado', 'Formato'].map((h, i) => (
                <div key={i} className="cell">{h}</div>
              ))}
            </div>
            {filtered.map(e => {
              const tp = EVENT_TYPES.find(t => t.id === e.type)!
              return (
                <div key={e.id} className="list-row" onClick={() => setModalTarget(e)}
                  style={{ gridTemplateColumns: '40px 1.6fr 1.1fr 0.9fr 80px 90px 90px 1fr', cursor: 'pointer' }}>
                  <div className="cell"><span className="dot" style={{ background: tp.color }} /></div>
                  <div className="cell" style={{ fontWeight: 500, fontSize: 13 }}>{e.name}</div>
                  <div className="cell" style={{ fontSize: 13, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtBR(e.start)}{e.end !== e.start ? ` → ${fmtBR(e.end)}` : ''}
                  </div>
                  <div className="cell">
                    <span style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                      background: `color-mix(in oklab, ${tp.color}, white 88%)`,
                      color: tp.color,
                    }}>{tp.label}</span>
                  </div>
                  <div className="cell"><span className={`event-pack ${e.pack.toLowerCase()}`}>{e.pack}</span></div>
                  <div className="cell">
                    <button className={`check-cell ${e.potencial ? 'on' : ''}`} onClick={ev => { ev.stopPropagation(); toggleField(e, 'potencial') }}>
                      {e.potencial && <Icon.check />}
                    </button>
                  </div>
                  <div className="cell">
                    <button className={`check-cell ${e.postado ? 'on' : ''}`} onClick={ev => { ev.stopPropagation(); toggleField(e, 'postado') }}>
                      {e.postado && <Icon.check />}
                    </button>
                  </div>
                  <div className="cell" style={{ color: 'var(--ink-2)' }}>{e.format}</div>
                </div>
              )
            })}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div className="month-nav">
                <button onClick={() => setMonth(m => Math.max(0, m - 1))}><Icon.chevL /></button>
                <div className="label">{MONTHS[month]} {year}</div>
                <button onClick={() => setMonth(m => Math.min(11, m + 1))}><Icon.chevR /></button>
              </div>
            </div>
            <MiniCalendar events={filtered} year={year} month={month} onEventClick={setModalTarget} />
          </div>
        )}
      </div>

      {modalTarget !== undefined && (
        <ComemorativaFormModal
          initial={modalTarget}
          onClose={() => setModalTarget(undefined)}
          onSave={handleSave}
          onDelete={modalTarget ? handleDelete : undefined}
        />
      )}
    </>
  )
}
