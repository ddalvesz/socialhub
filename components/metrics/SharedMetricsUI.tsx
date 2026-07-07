'use client'
import { useState, useEffect, useRef } from 'react'

// ── Formatters ────────────────────────────────────────────────────────────────

export function mN(n: number | null | undefined, dp = 1): string {
  if (n == null) return '—'
  if (n >= 1e6) return (n / 1e6).toFixed(dp).replace(/\.0+$/, '') + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(dp).replace(/\.0+$/, '') + 'K'
  return n.toLocaleString('pt-BR')
}
export function mFull(n: number | null | undefined): string {
  return n == null ? '—' : Math.round(n).toLocaleString('pt-BR')
}
export function mPct(p: number | null | undefined, dp = 2): string {
  return p == null ? '—' : p.toFixed(dp).replace('.', ',') + '%'
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

export function ProgressBar({ pct, color, height = 10 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{ height, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(Math.max(pct, 0), 100)}%`, background: color, borderRadius: 999, transition: 'width .5s' }} />
    </div>
  )
}

// ── Month Picker ──────────────────────────────────────────────────────────────

export function MonthPicker({ mensal, selectedIdx, onChange, ano }: {
  mensal: { label: string }[]
  selectedIdx: number
  onChange: (i: number) => void
  ano: number
}) {
  const canBack = selectedIdx > 0
  const canFwd  = selectedIdx < mensal.length - 1
  const fullName = MONTHS_FULL[selectedIdx]

  const btnStyle = (enabled: boolean): React.CSSProperties => ({
    width: 32, height: 32, borderRadius: '50%', padding: 0, border: '1.5px solid var(--line)',
    background: 'var(--surface)', color: enabled ? 'var(--ink)' : 'var(--ink-4)',
    cursor: enabled ? 'pointer' : 'default', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 20, lineHeight: '1', fontFamily: 'var(--font-sans)',
    opacity: enabled ? 1 : 0.35, flexShrink: 0,
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
      <button onClick={() => canBack && onChange(selectedIdx - 1)} disabled={!canBack} style={btnStyle(canBack)}>‹</button>

      <div style={{ minWidth: 170 }}>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.035em', color: 'var(--ink)', lineHeight: 1 }}>
          {fullName}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{ano}</div>
      </div>

      <button onClick={() => canFwd && onChange(selectedIdx + 1)} disabled={!canFwd} style={btnStyle(canFwd)}>›</button>

      <div style={{ display: 'flex', gap: 4, marginLeft: 6, flexWrap: 'wrap' }}>
        {mensal.map((m, i) => {
          const active = i === selectedIdx
          return (
            <button key={i} onClick={() => onChange(i)} style={{
              padding: '5px 11px', borderRadius: 999, lineHeight: '1',
              border: `1.5px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
              background: active ? 'var(--accent)' : 'var(--surface)',
              color: active ? '#fff' : 'var(--ink-2)',
              fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: active ? 700 : 400,
              cursor: 'pointer',
            }}>{m.label}</button>
          )
        })}
      </div>
    </div>
  )
}

export const MONTHS_FULL = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]
export const MONTH_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

// ── KPI Card ──────────────────────────────────────────────────────────────────

export function KpiCard({ label, value, sub, highlight, currRaw, prevRaw, prevLabel, isPartialMonth, diaAtual, diasNoMesPrev, noProrate, isPct, valueColor }: {
  label: string
  value: string | number
  sub?: string
  highlight?: boolean
  currRaw?: number | null
  prevRaw?: number | null
  prevLabel?: string | null
  isPartialMonth?: boolean
  diaAtual?: number
  diasNoMesPrev?: number | null
  noProrate?: boolean
  isPct?: boolean
  valueColor?: string
}) {
  const [hovered, setHovered] = useState(false)

  const fairPrev = (isPartialMonth && !noProrate && prevRaw != null && diasNoMesPrev)
    ? prevRaw * ((diaAtual ?? 0) / diasNoMesPrev)
    : prevRaw

  const delta = (currRaw != null && fairPrev)
    ? ((currRaw - fairPrev) / Math.abs(fairPrev)) * 100
    : null

  const hasTip = prevLabel != null && prevRaw != null && currRaw != null
  const displayFairPrev = isPct ? mPct(fairPrev) : mFull(fairPrev != null ? Math.round(fairPrev) : null)
  const displayCurr = isPct ? mPct(currRaw ?? null) : mFull(currRaw != null ? Math.round(currRaw) : null)
  const deltaColor = delta != null && delta >= 0 ? 'oklch(0.46 0.13 150)' : 'oklch(0.5 0.16 25)'

  const cardBg = highlight
    ? 'var(--accent-gradient-softer)'
    : (hasTip && delta != null)
      ? delta >= 0 ? 'oklch(0.975 0.016 150)' : 'oklch(0.975 0.016 25)'
      : 'var(--surface)'

  const cardBorder = (hovered && hasTip)
    ? 'var(--accent-soft)'
    : highlight
      ? 'var(--accent-soft)'
      : (hasTip && delta != null)
        ? delta >= 0 ? 'oklch(0.87 0.055 150)' : 'oklch(0.87 0.055 25)'
        : 'var(--line)'

  return (
    <div style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 'var(--radius-md)', padding: '14px 18px',
        transition: 'border-color .15s, box-shadow .15s',
        boxShadow: hovered && hasTip ? '0 2px 12px oklch(0 0 0 / 0.07)' : 'none',
        userSelect: 'none',
      }}>
        <div style={{ fontSize: 10.5, color: highlight ? 'var(--accent-deep)' : 'var(--ink-3)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5 }}>
          {label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.022em', color: valueColor ?? (highlight ? 'var(--accent-deep)' : 'var(--ink)'), lineHeight: 1, fontVariantNumeric: 'tabular-nums', marginBottom: 6 }}>
          {value}
        </div>
        <div style={{ minHeight: 16, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          {sub && <span style={{ fontSize: 11, color: valueColor ?? 'var(--ink-3)' }}>{sub}</span>}
          {hasTip && delta != null && (
            <span style={{ fontSize: 11, fontWeight: 700, color: deltaColor, fontVariantNumeric: 'tabular-nums' }}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {hovered && hasTip && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 7px)', left: 0, right: 0, zIndex: 30,
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)', padding: '12px 14px',
          boxShadow: '0 8px 24px oklch(0 0 0 / 0.1)', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 10 }}>
            {isPartialMonth && !noProrate ? `vs ${prevLabel} · proporcional ao dia ${diaAtual}` : `vs ${prevLabel}`}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-4)', marginBottom: 3 }}>Este mês</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--ink)', lineHeight: 1 }}>
                {displayCurr}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-4)', marginBottom: 3 }}>
                {isPartialMonth && !noProrate ? `${prevLabel} (dia ${diaAtual})` : prevLabel}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-2)', lineHeight: 1 }}>
                {displayFairPrev}
              </div>
            </div>
          </div>
          {delta != null && (
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>
                {isPartialMonth && !noProrate ? 'Comparação proporcional' : 'Variação'}
              </span>
              <span style={{ fontSize: 20, fontWeight: 800, color: deltaColor, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.025em', lineHeight: 1 }}>
                {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Section Head ──────────────────────────────────────────────────────────────

export function SectionHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 14 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--ink)' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}

// ── Chart Legend ──────────────────────────────────────────────────────────────

export function ChartLegend({ items }: { items: { color: string; label: string; type: 'bar' | 'line' | 'dashed'; soft?: boolean }[] }) {
  return (
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 12 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--ink-3)' }}>
          {it.type === 'bar' ? (
            <div style={{ width: 11, height: 11, background: it.color, borderRadius: 2, opacity: it.soft ? 0.55 : 1, flexShrink: 0 }} />
          ) : it.type === 'dashed' ? (
            <svg width={18} height={6} style={{ overflow: 'visible', flexShrink: 0 }}>
              <line x1={0} y1={3} x2={18} y2={3} stroke={it.color} strokeWidth={2} strokeDasharray="4,2" />
            </svg>
          ) : (
            <svg width={18} height={8} style={{ overflow: 'visible', flexShrink: 0 }}>
              <line x1={0} y1={4} x2={18} y2={4} stroke={it.color} strokeWidth={2} />
              <circle cx={9} cy={4} r={2.5} fill={it.color} />
            </svg>
          )}
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Dual-bar + right-axis line SVG chart (barras de meta + realizado, linha de %) ──

export function DualBarLineChart({ data, barKey, metaKey, lineKey, barColor, metaColor, lineColor, labelKey = 'label', height = 230, highlightIdx, barLabel = 'Valor', metaLabel = 'Meta', lineLabel = '%' }: {
  data: Record<string, unknown>[]
  barKey: string
  metaKey?: string
  lineKey?: string
  barColor: string
  metaColor?: string
  lineColor?: string
  labelKey?: string
  height?: number
  highlightIdx?: number
  barLabel?: string
  metaLabel?: string
  lineLabel?: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(600)
  const [hovIdx, setHovIdx] = useState<number | null>(null)
  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(e => setW(Math.floor(e[0].contentRect.width)))
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const P = { t: 28, r: 52, b: 32, l: 56 }
  const cW = Math.max(w - P.l - P.r, 10), cH = height - P.t - P.b, n = data.length
  const allVals = data.flatMap(d => [(d[barKey] as number) || 0, metaKey ? (d[metaKey] as number) || 0 : 0])
  const maxBar = Math.max(...allVals) * 1.12
  const lVals = lineKey ? data.map(d => (d[lineKey] as number) || 0) : []
  const maxLine = Math.max(...lVals, 0.01) * 1.3
  if (!maxBar) return <div ref={wrapRef} style={{ width: '100%', height }} />

  const syB = (v: number) => cH * (1 - v / maxBar)
  const syL = (v: number) => cH * (1 - v / maxLine)
  const step = cW / n, bW = step * 0.68
  const bx = (i: number) => i * step + (step - bW) / 2
  const cx = (i: number) => i * step + step / 2
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ v: maxBar * f, y: cH * (1 - f) }))
  const lineTicks = [0, 0.25, 0.5, 0.75, 1].map(f => maxLine * f)

  return (
    <div ref={wrapRef} style={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
      <svg width={w} height={height} style={{ display: 'block' }}>
        <g transform={`translate(${P.l},${P.t})`}>
          {ticks.map(({ v, y }, i) => (
            <g key={i}>
              <line x1={0} x2={cW} y1={y} y2={y} stroke="var(--line)" strokeWidth={i === 0 ? 1.5 : 0.7} />
              <text x={-8} y={y + 4} textAnchor="end" fontSize={10} fill="var(--ink-3)" fontFamily="var(--font-mono)">{mN(v)}</text>
            </g>
          ))}
          {lineKey && lineColor && lineTicks.map((v, i) => (
            <text key={i} x={cW + 6} y={cH * (1 - i / 4) + 4} textAnchor="start" fontSize={10} fill={lineColor} fontFamily="var(--font-mono)">
              {v.toFixed(1)}%
            </text>
          ))}
          {metaKey && metaColor && data.map((d, i) => {
            const v = (d[metaKey] as number) || 0, bH = Math.max(cH - syB(v), 0)
            return <rect key={`m${i}`} x={bx(i)} y={syB(v)} width={bW} height={bH} fill={metaColor} opacity={i === highlightIdx ? 0.5 : 0.25} rx={2} />
          })}
          {data.map((d, i) => {
            const v = (d[barKey] as number) || 0, bH = Math.max(cH - syB(v), 0)
            return <rect key={`b${i}`} x={bx(i)} y={syB(v)} width={bW} height={bH} fill={barColor} opacity={i === highlightIdx ? 1 : 0.6} rx={2} />
          })}
          {lineKey && lineColor && (
            <>
              <polyline points={data.map((d, i) => `${cx(i)},${syL((d[lineKey] as number) || 0)}`).join(' ')}
                fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" />
              {data.map((d, i) => (
                <g key={i}>
                  <circle cx={cx(i)} cy={syL((d[lineKey] as number) || 0)} r={3} fill={lineColor} />
                  <text x={cx(i)} y={syL((d[lineKey] as number) || 0) - 7} textAnchor="middle" fontSize={9} fill={lineColor} fontFamily="var(--font-mono)">
                    {((d[lineKey] as number) || 0).toFixed(1).replace('.', ',')}%
                  </text>
                </g>
              ))}
            </>
          )}
          {data.map((d, i) => (
            <text key={i} x={cx(i)} y={cH + 20} textAnchor="middle" fontSize={10} fill="var(--ink-3)" fontFamily="var(--font-sans)">{d[labelKey] as string}</text>
          ))}
          {data.map((_, i) => (
            <rect key={`hit-${i}`} x={i * step} y={-P.t} width={step} height={height}
              fill="transparent"
              onMouseEnter={() => setHovIdx(i)}
              onMouseLeave={() => setHovIdx(null)}
            />
          ))}
        </g>
      </svg>
      {hovIdx !== null && w > 0 && (() => {
        const d = data[hovIdx]
        const barV = (d[barKey] as number) || 0
        const metaV = metaKey ? (d[metaKey] as number) || 0 : null
        const lineV = lineKey ? (d[lineKey] as number) || 0 : null
        const xc = P.l + hovIdx * step + step / 2
        const tipW = 172
        const left = Math.max(0, Math.min(xc - tipW / 2, w - tipW))
        return (
          <div style={{
            position: 'absolute', top: 4, left,
            minWidth: tipW,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            pointerEvents: 'none',
            zIndex: 20,
            boxShadow: '0 4px 16px oklch(0 0 0 / 0.10)',
            fontFamily: 'var(--font-sans)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', marginBottom: 7 }}>
              {d[labelKey] as string}
            </div>
            <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-2)' }}>
              <span style={{ width: 8, height: 8, background: barColor, borderRadius: 2, flexShrink: 0, display: 'inline-block' }} />
              {barLabel}: {mFull(barV)}
            </div>
            {metaV != null && metaColor && (
              <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-2)', marginTop: 5 }}>
                <span style={{ width: 8, height: 8, background: metaColor, borderRadius: 2, flexShrink: 0, display: 'inline-block' }} />
                {metaLabel}: {mFull(metaV)}
              </div>
            )}
            {lineV != null && lineColor && (
              <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-2)', marginTop: 5 }}>
                <svg width={10} height={8} style={{ flexShrink: 0 }}>
                  <line x1={0} y1={4} x2={10} y2={4} stroke={lineColor} strokeWidth={1.5} />
                  <circle cx={5} cy={4} r={2} fill={lineColor} />
                </svg>
                {lineLabel}: {lineV.toFixed(2).replace('.', ',')}%
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
