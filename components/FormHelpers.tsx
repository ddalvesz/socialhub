'use client'

import React, { useState } from 'react'
import { Icon } from './Icons'

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
  onChange: (v: string) => void; placeholder?: string; width?: number
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
