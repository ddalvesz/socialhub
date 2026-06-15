'use client'

import { useState, useRef, useEffect } from 'react'
import { BRANDS } from '@/lib/types'
import type { Brand } from '@/lib/types'

interface Props {
  brand: Brand
  onChange: (b: Brand) => void
  loading?: boolean
}

export default function BrandSwitcher({ brand, onChange, loading }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = BRANDS.find(b => b.slug === brand) ?? BRANDS[0]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7, width: '100%',
          padding: '7px 11px', borderRadius: 8, border: '1px solid var(--border)',
          background: 'var(--surface-2)', cursor: 'pointer', fontSize: 13,
          fontWeight: 500, color: 'var(--ink)', transition: 'background 0.12s',
          opacity: loading ? 0.6 : 1,
        }}
        title="Trocar marca"
      >
        <span style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: current.color,
        }} />
        {current.name}
        <svg viewBox="0 0 10 6" width={10} height={6} fill="none" stroke="currentColor" strokeWidth="1.6" style={{ color: 'var(--ink-3)', marginLeft: 2, transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}>
          <path d="M1 1l4 4 4-4" />
        </svg>
        {loading && (
          <span style={{ width: 12, height: 12, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          minWidth: 150, zIndex: 200, overflow: 'hidden',
        }}>
          {BRANDS.map(b => (
            <button
              key={b.slug}
              onClick={() => { onChange(b.slug); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                width: '100%', padding: '9px 14px', border: 'none',
                background: b.slug === brand ? 'var(--accent-softer)' : 'transparent',
                cursor: 'pointer', fontSize: 13, fontWeight: b.slug === brand ? 600 : 400,
                color: 'var(--ink)', textAlign: 'left', transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (b.slug !== brand) e.currentTarget.style.background = 'var(--surface-2)' }}
              onMouseLeave={e => { if (b.slug !== brand) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
              {b.name}
              {b.slug === brand && (
                <svg viewBox="0 0 12 12" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto', color: 'var(--accent)' }}>
                  <path d="M2 6l3 3 5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
