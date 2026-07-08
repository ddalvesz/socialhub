'use client'

import { useState } from 'react'
import { Icon } from './Icons'
import { GenericSelect, DateRangeFilter, DateRange, DatePicker } from './FormHelpers'
import { FutebolEvent, MONTHS, WEEKDAYS, fmtBR, buildMonthGrid, parseISO, toISO, todayISO } from '@/lib/types'
import { FUT_TYPES } from '@/lib/data'

function MiniCalendar({ events, year, month, onEventClick }: {
  events: FutebolEvent[]
  year: number
  month: number
  onEventClick: (e: FutebolEvent) => void
}) {
  const cells = buildMonthGrid(year, month)
  const today = todayISO()
  const byDay: Record<string, FutebolEvent[]> = {}

  events.forEach(e => {
    ;(byDay[e.date] = byDay[e.date] || []).push(e)
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
              const tp = FUT_TYPES.find(t => t.id === e.type)
              const color = tp?.color ?? '#999'
              return (
                <div key={k} onClick={() => onEventClick(e)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 8px', borderRadius: 6, cursor: 'pointer',
                  background: `color-mix(in oklab, ${color}, white 88%)`,
                  color: `color-mix(in oklab, ${color}, black 25%)`,
                  fontSize: 11.5, fontWeight: 500,
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{e.name}</span>
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

function FutebolModal({
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  initial: FutebolEvent | null
  onClose: () => void
  onSave: (data: Omit<FutebolEvent, 'id'>) => Promise<void>
  onDelete?: () => Promise<void>
}) {
  const isNew = initial === null
  const [draft, setDraft] = useState<Omit<FutebolEvent, 'id'>>({
    type:  initial?.type  ?? 'jogo',
    name:  initial?.name  ?? '',
    date:  initial?.date  ?? todayISO(),
    notes: initial?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (k: keyof typeof draft, v: string) => setDraft(d => ({ ...d, [k]: v }))

  const handleSave = async () => {
    if (!draft.name.trim()) return
    setSaving(true)
    await onSave(draft)
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

  const tp = FUT_TYPES.find(t => t.id === draft.type)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal form-modal" onClick={e => e.stopPropagation()} style={{ width: 'min(560px, calc(100vw - 40px))' }}>
        <div className="modal-head">
          <div style={{
            width: 40, height: 40, borderRadius: 12, flex: '0 0 40px',
            background: tp?.color || '#999', color: 'white', display: 'grid', placeItems: 'center',
          }}><Icon.ball /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '.04em' }}>
              {isNew ? 'NOVO EVENTO FUTEBOL 2026' : 'EDITAR EVENTO FUTEBOL 2026'}
            </div>
            <input className="modal-title" value={draft.name} placeholder="Ex: Brasil x Argentina"
              onChange={e => set('name', e.target.value)} autoFocus />
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <label>Tipo</label>
            <GenericSelect value={draft.type}
              options={[{ id: '', label: 'Nenhum' }, ...FUT_TYPES.map(t => ({ id: t.id, label: t.label }))]}
              onChange={v => set('type', v)} width={240} />

            <label>Data</label>
            <DatePicker value={draft.date}
              onChange={v => set('date', v)} style={{ maxWidth: 200 }} />

            <label style={{ alignSelf: 'flex-start', paddingTop: 6 }}>Observações</label>
            <textarea className="field" value={draft.notes} placeholder="Detalhes sobre o evento..."
              onChange={e => set('notes', e.target.value)}
              rows={4} style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 14 }} />
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
            {isNew ? 'Criar evento' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FutebolView({
  initialItems,
  onSave,
  onDelete,
}: {
  initialItems: FutebolEvent[]
  onSave: (e: FutebolEvent) => Promise<FutebolEvent>
  onDelete: (id: number) => Promise<void>
}) {
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [filter, setFilter] = useState('all')
  const [month, setMonth] = useState(4)
  const [year] = useState(2026)
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' })
  const today = todayISO()

  const [items, setItems] = useState<FutebolEvent[]>(initialItems)
  const [modalTarget, setModalTarget] = useState<FutebolEvent | null | undefined>(undefined)
  // undefined = closed, null = new, FutebolEvent = editing

  const filtered = (filter === 'all' ? items : items.filter(e => e.type === filter))
    .filter(e => e.date && e.date !== '-')
    .filter(e => {
      if (dateRange.from && e.date < dateRange.from) return false
      if (dateRange.to && e.date > dateRange.to) return false
      return true
    })
  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date))

  const handleSave = async (data: Omit<FutebolEvent, 'id'>) => {
    if (modalTarget === null) {
      // create
      const created = await onSave({ id: 0, ...data })
      setItems(arr => [...arr, created].sort((a, b) => a.date.localeCompare(b.date)))
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
        <button className={`platform-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todos</button>
        {FUT_TYPES.map(t => (
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
        <button className="btn btn-accent" onClick={() => setModalTarget(null)}><Icon.plus /> Novo evento</button>
      </div>

      <div className="list-wrap">
        {view === 'list' ? (
          <div className="list">
            <div className="list-row list-head" style={{ gridTemplateColumns: '40px 1.1fr 2fr 160px' }}>
              {['', 'Tipo', 'Nome', 'Data'].map((h, i) => (
                <div key={i} className="cell">{h}</div>
              ))}
            </div>
            {sorted.map(e => {
              const tp = FUT_TYPES.find(t => t.id === e.type) ?? { color: '#999', label: e.type }
              const past = e.date < today
              return (
                <div key={e.id} className="list-row" onClick={() => setModalTarget(e)}
                  style={{ gridTemplateColumns: '40px 1.1fr 2fr 160px', opacity: past ? 0.5 : 1, cursor: 'pointer' }}>
                  <div className="cell"><span className="dot" style={{ background: tp.color }} /></div>
                  <div className="cell">
                    <span style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                      background: `color-mix(in oklab, ${tp.color}, white 88%)`,
                      color: tp.color,
                    }}>{tp.label}</span>
                  </div>
                  <div className="cell" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{e.name}</span>
                    {e.notes && (
                      <span style={{ fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 400 }}>
                        {e.notes}
                      </span>
                    )}
                  </div>
                  <div className="cell" style={{ fontSize: 13, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtBR(e.date)}
                  </div>
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
        <FutebolModal
          initial={modalTarget}
          onClose={() => setModalTarget(undefined)}
          onSave={handleSave}
          onDelete={modalTarget ? handleDelete : undefined}
        />
      )}
    </>
  )
}
