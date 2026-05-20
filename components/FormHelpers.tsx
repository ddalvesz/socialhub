'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Icon } from './Icons'
import { todayISO, MONTHS, fmtBR } from '@/lib/types'

export function Popover({ open, onClose, anchor = 'left', children }: {
  open: boolean; onClose: () => void; anchor?: 'left' | 'right'; children: React.ReactNode
}) {
  if (!open) return null
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={onClose} />
      <div className="popover" style={{ top: '100%', marginTop: 4, [anchor]: 0 }}>
        {children}
      </div>
    </>
  )
}

export function GenericSelect({ value, options, onChange, placeholder = 'Selecionar...', width = 200 }: {
  value: string | null; options: { id: string; label: string }[];
  onChange: (v: string) => void; placeholder?: string; width?: number | string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const filtered = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()))
  const cur = options.find(o => o.id === value)
  return (
    <div style={{ position: 'relative', display: 'inline-block', width }}>
      <button className="field" type="button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', width: '100%' }} onClick={() => setOpen(o => !o)}>
        <span style={{ color: cur ? 'var(--ink)' : 'var(--ink-3)' }}>{cur ? cur.label : placeholder}</span>
        <Icon.chevD />
      </button>
      <Popover open={open} onClose={() => { setOpen(false); setQ('') }}>
        <input className="po-input" placeholder="Buscar..." value={q} onChange={e => setQ(e.target.value)} autoFocus />
        <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 4 }}>
          {filtered.map(o => (
            <button key={o.id} className="po-item" type="button" onClick={() => { onChange(o.id); setOpen(false); setQ('') }}>
              {o.label}
              {o.id === value && <span className="check"><Icon.check /></span>}
            </button>
          ))}
        </div>
      </Popover>
    </div>
  )
}

export function PackToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="pack-toggle-row">
      {['PP', 'P', 'M', 'G'].map((p) =>
        <button key={p} className={value === p ? 'active' : ''} onClick={() => onChange(p)} type="button">
          {p}
        </button>
      )}
    </div>
  )
}

export function FieldCheckbox({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className="field-checkbox" onClick={() => onChange(!value)} type="button">
      <span className={`check-cell ${value ? 'on' : ''}`}>
        {value && <Icon.check />}
      </span>
      {label}
    </button>
  )
}

// ─── Date input dd/mm/aaaa ────────────────────────────────────
function parseBRtoISO(br: string): string {
  const [d, m, y] = br.split('/')
  if (!d || !m || !y || y.length < 4) return ''
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function isoToBR(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  let out = digits
  if (digits.length > 2) out = digits.slice(0, 2) + '/' + digits.slice(2)
  if (digits.length > 4) out = out.slice(0, 5) + '/' + digits.slice(4)
  return out
}

function DateInput({ value, onChange, placeholder = 'dd/mm/aaaa' }: {
  value: string
  onChange: (iso: string) => void
  placeholder?: string
}) {
  const [display, setDisplay] = useState(isoToBR(value))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value)
    setDisplay(masked)
    const iso = parseBRtoISO(masked)
    if (iso || masked === '') onChange(iso)
  }

  return (
    <input
      className="field"
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={display}
      onChange={handleChange}
      style={{ width: '100%', fontSize: 13 }}
    />
  )
}

// ─── Date Range Filter ────────────────────────────────────────
export interface DateRange { from: string; to: string }

const PRESETS = [
  { label: 'Este mês',        getRange: () => { const t = todayISO(); return { from: t.slice(0, 7) + '-01', to: t.slice(0, 7) + '-31' } } },
  { label: 'Próx. 3 meses',  getRange: () => { const d = new Date(); const f = todayISO(); d.setMonth(d.getMonth() + 3); return { from: f, to: d.toISOString().slice(0, 10) } } },
  { label: 'Próx. 6 meses',  getRange: () => { const d = new Date(); const f = todayISO(); d.setMonth(d.getMonth() + 6); return { from: f, to: d.toISOString().slice(0, 10) } } },
  { label: '2026 completo',   getRange: () => ({ from: '2026-01-01', to: '2026-12-31' }) },
]

export function DateRangeFilter({ value, onChange }: {
  value: DateRange
  onChange: (r: DateRange) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = !!(value.from || value.to)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange({ from: '', to: '' })
  }

  const label = active
    ? [value.from && fmtBR(value.from), value.to && fmtBR(value.to)].filter(Boolean).join(' → ')
    : 'Período'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className={`platform-pill ${active ? 'active' : ''}`}
        onClick={() => setOpen(o => !o)}
        style={{ gap: 6 }}
      >
        <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>
        </svg>
        {label}
        {active && (
          <span onClick={clear} style={{ display: 'grid', placeItems: 'center', width: 14, height: 14, borderRadius: '50%', background: 'rgba(255,255,255,.3)' }}>
            <Icon.x />
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 60,
          background: 'var(--surface)', border: '1px solid var(--line-2)',
          borderRadius: 12, boxShadow: '0 12px 32px -8px rgba(40,30,70,.2), 0 3px 8px rgba(40,30,70,.07)',
          padding: 14, minWidth: 280,
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>
            Atalhos
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {PRESETS.map(p => {
              const r = p.getRange()
              const isCur = r.from === value.from && r.to === value.to
              return (
                <button
                  key={p.label}
                  onClick={() => { onChange(r); setOpen(false) }}
                  style={{
                    padding: '5px 11px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                    border: '1px solid var(--line)',
                    background: isCur ? 'var(--accent-gradient)' : 'var(--surface-2)',
                    color: isCur ? 'white' : 'var(--ink-2)',
                    cursor: 'pointer',
                  }}
                >{p.label}</button>
              )
            })}
          </div>

          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            Personalizado
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>De</div>
              <DateInput value={value.from} onChange={from => onChange({ ...value, from })} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>Até</div>
              <DateInput value={value.to} onChange={to => onChange({ ...value, to })} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button className="btn btn-ghost" style={{ padding: '7px 14px', fontSize: 13 }}
              onClick={() => { onChange({ from: '', to: '' }); setOpen(false) }}>
              Limpar
            </button>
            <button className="btn btn-accent" style={{ padding: '7px 14px', fontSize: 13 }}
              onClick={() => setOpen(false)}>
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
