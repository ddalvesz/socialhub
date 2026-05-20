'use client'

import { useState } from 'react'
import { Icon } from './Icons'
import { GenericSelect, DateRangeFilter, DateRange } from './FormHelpers'
import { FutebolEvent, MONTHS, WEEKDAYS, fmtBR, buildMonthGrid, parseISO, toISO, todayISO } from '@/lib/types'
import { FUT_TYPES } from '@/lib/data'

function MiniCalendar({ events, year, month }: { events: FutebolEvent[]; year: number; month: number }) {
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
                <div key={k} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 8px', borderRadius: 6,
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

function FutebolFormModal({ onClose, onSave }: { onClose: () => void, onSave: (data: any) => void }) {
  const [draft, setDraft] = useState({ type: 'jogo', name: '', date: todayISO() })
  const set = (k: string, v: any) => setDraft(d => ({ ...d, [k]: v }))
  
  const handleSave = () => {
    if (!draft.name.trim()) return
    onSave(draft)
    onClose()
  }
  
  const tp = FUT_TYPES.find(t => t.id === draft.type)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal form-modal" onClick={e => e.stopPropagation()} style={{ width: 'min(560px, calc(100vw - 40px))' }}>
        <div className="modal-head">
          <div style={{
            width: 40, height: 40, borderRadius: 12, flex: '0 0 40px',
            background: tp?.color || '#999', color: 'white', display: 'grid', placeItems: 'center'
          }}><Icon.ball /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '.04em' }}>NOVO EVENTO FUTEBOL 2026</div>
            <input className="modal-title" value={draft.name} placeholder="Ex: Brasil x Argentina"
              onChange={e => set('name', e.target.value)} autoFocus />
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <label>Tipo</label>
            <GenericSelect value={draft.type} options={[{id: '', label: 'Nenhum'}, ...FUT_TYPES.map(t => ({ id: t.id, label: t.label }))]}
              onChange={v => set('type', v)} width={240} />

            <label>Data</label>
            <input className="field" type="date" value={draft.date}
              onChange={e => set('date', e.target.value)} style={{ maxWidth: 200 }} />
          </div>
        </div>

        <div className="modal-foot">
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handleSave}>Criar evento</button>
        </div>
      </div>
    </div>
  )
}

export default function FutebolView({ initialItems }: { initialItems: FutebolEvent[] }) {
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [filter, setFilter] = useState('all')
  const [month, setMonth] = useState(4)
  const [year] = useState(2026)
  const [showForm, setShowForm] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' })
  const today = todayISO()

  const [items, setItems] = useState<FutebolEvent[]>(initialItems)
  const filtered = (filter === 'all' ? items : items.filter(e => e.type === filter))
    .filter(e => e.date && e.date !== '-')
    .filter(e => {
      if (dateRange.from && e.date < dateRange.from) return false
      if (dateRange.to && e.date > dateRange.to) return false
      return true
    })
  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date))

  const addItem = (data: any) => {
    const id = items.reduce((m, c) => Math.max(m, c.id), 0) + 1
    setItems(arr => [...arr, { id, ...data } as FutebolEvent])
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
        <button className="btn btn-accent" onClick={() => setShowForm(true)}><Icon.plus /> Novo evento</button>
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
                <div key={e.id} className="list-row" style={{ gridTemplateColumns: '40px 1.1fr 2fr 160px', opacity: past ? 0.5 : 1 }}>
                  <div className="cell"><span className="dot" style={{ background: tp.color }} /></div>
                  <div className="cell">
                    <span style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                      background: `color-mix(in oklab, ${tp.color}, white 88%)`,
                      color: tp.color,
                    }}>{tp.label}</span>
                  </div>
                  <div className="cell" style={{ fontSize: 14, fontWeight: 500 }}>{e.name}</div>
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
            <MiniCalendar events={filtered} year={year} month={month} />
          </div>
        )}
      </div>

      {showForm && (
        <FutebolFormModal onClose={() => setShowForm(false)} onSave={addItem} />
      )}
    </>
  )
}
