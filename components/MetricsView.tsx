'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────────

interface IgMonthEntry {
  label: string
  alcance: number
  viewsReels: number
  qtdPosts: number
  mediaViews: number
  interacoes: number
  engaj: number
}

interface TtMonthEntry {
  label: string
  views: number
  viewsCollabs: number
  qtdPosts: number
  interacoes: number
  engaj: number
}

interface IgWeekEntry {
  semana: number
  dias: string
  meta: number
  views: number
  alcance: number
  interacoes: number
  engaj: number
  posts: number
}

interface TtWeekEntry {
  semana: number
  dias: string
  meta: number
  views: number
  posts: number
  engaj: number
}

interface BreakdownEntry {
  alcance: number
  views: number
  posts: number
  mediaViews: number
  interacoes: number
  engaj: number
}

interface MetricsDataShape {
  mes: number
  ano: number
  dia: number
  diasNoMes: number
  ig: {
    metas: { views: number; alcance: number; interacoes: number }
    mensal: IgMonthEntry[]
    reelsMes: BreakdownEntry | null
    postsMes: BreakdownEntry | null
    semanal: IgWeekEntry[]
  }
  tt: {
    metas: { views: number }
    mensal: TtMonthEntry[]
    semanal: TtWeekEntry[]
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS_FULL = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]
const MONTH_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const IG_METAS = { views: 12000000, alcance: 10000000, interacoes: 300000 }
const TT_METAS = { views: 1000000 }
const IG_WEEKLY_GOAL = 2800000
const TT_WEEKLY_GOAL = 233333
const ANO = 2026

// ── Data fetching hook ────────────────────────────────────────────────────────

function weekDays(dias: string): number {
  const parts = dias.split('–')
  if (parts.length < 2) return 7
  const [d1, m1] = parts[0].split('/').map(Number)
  const [d2, m2] = parts[1].split('/').map(Number)
  const a = new Date(ANO, m1 - 1, d1)
  const b = new Date(ANO, m2 - 1, d2)
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1
}

function useMetricsData() {
  const [data, setData] = useState<MetricsDataShape | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const today = new Date()
    const dia = today.getDate()
    const mesIdx = today.getMonth()        // 0-based
    const mes = mesIdx + 1                 // 1-based
    const diasNoMes = MONTH_DAYS[mesIdx]

    async function load() {
      const sb = createClient()

      const [r1, r2, r3, r4, r5] = await Promise.all([
        sb.from('v_metricas_ig_mensal_2026').select('*').order('mes'),
        sb.from('v_metricas_ig_breakdown_2026').select('*').order('mes'),
        sb.from('v_metricas_ig_semanal_2026').select('*').order('semana'),
        sb.from('v_metricas_tt_mensal_2026').select('*').order('mes'),
        sb.from('v_metricas_tt_semanal_2026').select('*').order('semana'),
      ])

      if (r1.error || r2.error || r3.error || r4.error || r5.error) {
        setError('Erro ao carregar métricas')
        setLoading(false)
        return
      }

      // IG mensal
      const igMensal: IgMonthEntry[] = (r1.data ?? []).map((r) => ({
        label: MONTH_LABELS[new Date(r.mes + 'T12:00:00').getMonth()],
        viewsReels: Number(r.views_reels),
        alcance: Number(r.alcance),
        qtdPosts: Number(r.qtd_posts),
        mediaViews: Number(r.media_views_reels),
        interacoes: Number(r.interacoes),
        engaj: Number(r.engaj),
      }))

      // IG breakdown (mês atual)
      const currentMesStr = `${ANO}-${String(mes).padStart(2, '0')}-01`
      const bdRows = (r2.data ?? []).filter((r) => r.mes === currentMesStr)
      const toBreakdown = (r: Record<string, unknown> | undefined): BreakdownEntry | null =>
        r ? {
          views: Number(r.views),
          alcance: Number(r.alcance),
          posts: Number(r.qtd_posts),
          mediaViews: Number(r.media_views),
          interacoes: Number(r.interacoes),
          engaj: Number(r.engaj),
        } : null
      const reelsMes = toBreakdown(bdRows.find((r) => r.tipo === 'Reels'))
      const postsMes = toBreakdown(bdRows.find((r) => r.tipo === 'Posts'))

      // IG semanal
      const igSemanal: IgWeekEntry[] = (r3.data ?? []).map((r) => {
        const days = weekDays(String(r.dias))
        return {
          semana: Number(r.semana),
          dias: String(r.dias),
          meta: days < 7 ? Math.round(IG_WEEKLY_GOAL * days / 7) : IG_WEEKLY_GOAL,
          views: Number(r.views),
          alcance: Number(r.alcance),
          interacoes: Number(r.interacoes),
          engaj: Number(r.engaj),
          posts: Number(r.qtd_posts),
        }
      })

      // TT mensal
      const ttMensal: TtMonthEntry[] = (r4.data ?? []).map((r) => ({
        label: MONTH_LABELS[new Date(r.mes + 'T12:00:00').getMonth()],
        views: Number(r.views),
        viewsCollabs: r.views_collabs ? Number(r.views_collabs) : 0,
        qtdPosts: Number(r.qtd_posts),
        interacoes: Number(r.interacoes),
        engaj: Number(r.engaj),
      }))

      // TT semanal
      const ttSemanal: TtWeekEntry[] = (r5.data ?? []).map((r) => {
        const days = weekDays(String(r.dias))
        return {
          semana: Number(r.semana),
          dias: String(r.dias),
          meta: days < 7 ? Math.round(TT_WEEKLY_GOAL * days / 7) : TT_WEEKLY_GOAL,
          views: Number(r.views),
          posts: Number(r.qtd_posts),
          engaj: Number(r.engaj),
        }
      })

      setData({
        ano: ANO,
        mes,
        dia,
        diasNoMes,
        ig: { metas: IG_METAS, mensal: igMensal, reelsMes, postsMes, semanal: igSemanal },
        tt: { metas: TT_METAS, mensal: ttMensal, semanal: ttSemanal },
      })
      setLoading(false)
    }

    load().catch(() => {
      setError('Erro inesperado ao carregar métricas')
      setLoading(false)
    })
  }, [])

  return { data, loading, error }
}

// ── Formatters ────────────────────────────────────────────────────────────────

function mN(n: number | null | undefined, dp = 1): string {
  if (n == null) return '—'
  if (n >= 1e6) return (n / 1e6).toFixed(dp).replace(/\.0+$/, '') + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(dp).replace(/\.0+$/, '') + 'K'
  return n.toLocaleString('pt-BR')
}
function mFull(n: number | null | undefined): string {
  return n == null ? '—' : Math.round(n).toLocaleString('pt-BR')
}
function mPct(p: number | null | undefined, dp = 2): string {
  return p == null ? '—' : p.toFixed(dp).replace('.', ',') + '%'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function weekSem(dias: string): 1 | 2 {
  const start = (dias || '').split(/[–\-]/)[0].trim()
  const parts = start.split('/')
  if (parts.length < 2) return 1
  return parseInt(parts[1], 10) <= 6 ? 1 : 2
}

// ── Month Picker ──────────────────────────────────────────────────────────────

function MonthPicker({ mensal, selectedIdx, onChange, ano }: {
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

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, highlight, currRaw, prevRaw, prevLabel, isPartialMonth, diaAtual, diasNoMesPrev, noProrate, isPct }: {
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
  const deltaColor = delta != null && delta >= 0 ? 'oklch(0.46 0.13 150)' : 'oklch(0.5 0.16 25)'

  return (
    <div style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: highlight ? 'var(--accent-gradient-softer)' : 'var(--surface)',
        border: `1px solid ${hovered && hasTip ? 'var(--accent-soft)' : highlight ? 'var(--accent-soft)' : 'var(--line)'}`,
        borderRadius: 'var(--radius-md)', padding: '14px 18px',
        transition: 'border-color .15s, box-shadow .15s',
        boxShadow: hovered && hasTip ? '0 2px 12px oklch(0 0 0 / 0.07)' : 'none',
        userSelect: 'none',
      }}>
        <div style={{ fontSize: 10.5, color: highlight ? 'var(--accent-deep)' : 'var(--ink-3)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5 }}>
          {label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.022em', color: highlight ? 'var(--accent-deep)' : 'var(--ink)', lineHeight: 1, fontVariantNumeric: 'tabular-nums', marginBottom: 5 }}>
          {value}
        </div>
        <div style={{ minHeight: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          {sub
            ? <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{sub}</span>
            : hasTip && <span style={{ fontSize: 10, color: 'var(--ink-4)', opacity: hovered ? 0 : 0.8, transition: 'opacity .1s' }}>vs {prevLabel} →</span>
          }
        </div>
      </div>

      {hovered && hasTip && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 7px)', left: 0, right: 0, zIndex: 30,
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)', padding: '12px 14px',
          boxShadow: '0 8px 24px oklch(0 0 0 / 0.1)', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>
            {isPartialMonth && !noProrate ? `vs ${prevLabel} · projeção até dia ${diaAtual}` : `vs ${prevLabel}`}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
            <div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-4)', marginBottom: 3 }}>
                {isPartialMonth && !noProrate ? `${prevLabel} estimado no dia ${diaAtual}` : `${prevLabel} (mês completo)`}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-2)', lineHeight: 1 }}>
                {displayFairPrev}
              </div>
            </div>
            {delta != null && (
              <div style={{ fontSize: 20, fontWeight: 800, color: deltaColor, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.025em', lineHeight: 1 }}>
                {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
              </div>
            )}
          </div>
          {isPartialMonth && !noProrate && (
            <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 8, borderTop: '1px solid var(--line)', paddingTop: 6 }}>
              Comparação justa: {prevLabel} projetado proporcionalmente até o dia {diaAtual}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Breakdown Table ───────────────────────────────────────────────────────────

function BreakdownTable({ reels, posts }: { reels: BreakdownEntry | null; posts: BreakdownEntry | null }) {
  if (!reels || !posts) {
    return (
      <div style={{ padding: '18px 22px', color: 'var(--ink-3)', fontSize: 13, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
        Breakdown disponível apenas para o mês atual
      </div>
    )
  }
  const cols = '88px 1fr 1fr 60px 1fr 1fr 76px'
  const hdrs = ['Tipo', 'Views', 'Alcance', 'Posts', 'Méd. Views', 'Interações', 'Engaj']
  return (
    <div className="list">
      <div className="list-row list-head" style={{ gridTemplateColumns: cols }}>
        {hdrs.map(h => <div key={h} className="cell">{h}</div>)}
      </div>
      {([{ label: 'Reels', d: reels, hl: true }, { label: 'Posts', d: posts, hl: false }] as const).map(({ label, d, hl }) => (
        <div key={label} className="list-row" style={{ gridTemplateColumns: cols, background: hl ? 'var(--accent-gradient-softer)' : undefined }}>
          <div className="cell" style={{ fontWeight: 600, color: hl ? 'var(--accent-deep)' : 'var(--ink)' }}>{label}</div>
          <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(d.views)}</div>
          <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(d.alcance)}</div>
          <div className="cell">{d.posts}</div>
          <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(d.mediaViews)}</div>
          <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(d.interacoes)}</div>
          <div className="cell">{mPct(d.engaj)}</div>
        </div>
      ))}
    </div>
  )
}

// ── Pace Table ────────────────────────────────────────────────────────────────

function PaceTable({ items, dia, diasNoMes, isComplete }: {
  items: { label: string; real: number; meta: number }[]
  dia: number
  diasNoMes: number
  isComplete: boolean
}) {
  const cols = '130px 1fr 1fr 80px 64px 1fr'
  const hdrs = ['Métrica', 'Realizado', isComplete ? '—' : 'Pace proj.', 'Meta', '%', 'Progresso']
  return (
    <div className="list">
      <div className="list-row list-head" style={{ gridTemplateColumns: cols }}>
        {hdrs.map((h, i) => <div key={i} className="cell">{h}</div>)}
      </div>
      {items.map(({ label, real, meta }) => {
        const pctReal = (real / meta) * 100
        const pace = isComplete ? real : (real / dia) * diasNoMes
        const pctPace = isComplete ? pctReal : (pace / meta) * 100
        const color = pctPace >= 100 ? 'oklch(0.46 0.13 150)' : pctPace >= 80 ? 'var(--accent)' : 'oklch(0.5 0.16 25)'
        return (
          <div key={label} className="list-row" style={{ gridTemplateColumns: cols, alignItems: 'center' }}>
            <div className="cell" style={{ fontWeight: 600, color: 'var(--ink)' }}>{label}</div>
            <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(real)}</div>
            <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ink-2)' }}>
              {isComplete ? '—' : mFull(Math.round(pace))}
            </div>
            <div className="cell" style={{ color: 'var(--ink-3)' }}>{mN(meta)}</div>
            <div className="cell" style={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
              {pctPace.toFixed(0)}%
            </div>
            <div className="cell">
              <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden', marginBottom: 3 }}>
                <div style={{ height: '100%', width: `${Math.min(pctReal, 100)}%`, background: color, borderRadius: 999, transition: 'width .5s' }} />
              </div>
              <div style={{ fontSize: 10.5, color, fontWeight: 500 }}>
                {pctPace >= 100 ? '✓ meta atingida' : isComplete ? 'meta não atingida' : `${pctReal.toFixed(0)}% do mês realizado`}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Chart Legend ──────────────────────────────────────────────────────────────

function ChartLegend({ items }: { items: { color: string; label: string; type: 'bar' | 'line' | 'dashed' }[] }) {
  return (
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 12 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--ink-3)' }}>
          {it.type === 'bar' ? (
            <div style={{ width: 11, height: 11, background: it.color, borderRadius: 2, flexShrink: 0 }} />
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

// ── Bar + Line SVG chart ──────────────────────────────────────────────────────

function BarLineChart({ data, barKey, barColor, lineKey, lineColor, goalVal, goalColor, labelKey = 'label', showBarLabels = true, height = 210, highlightIdx }: {
  data: Record<string, unknown>[]
  barKey: string
  barColor: string
  lineKey?: string
  lineColor?: string
  goalVal?: number
  goalColor?: string
  labelKey?: string
  showBarLabels?: boolean
  height?: number
  highlightIdx?: number
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(600)
  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(e => setW(Math.floor(e[0].contentRect.width)))
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const P = { t: 28, r: 22, b: 32, l: 56 }
  const cW = Math.max(w - P.l - P.r, 10), cH = height - P.t - P.b, n = data.length
  const bVals = data.map(d => (d[barKey] as number) || 0)
  const lVals = lineKey ? data.map(d => (d[lineKey] as number) || 0) : []
  const maxVal = Math.max(...bVals, ...lVals, goalVal || 0) * 1.15
  if (!maxVal) return <div ref={wrapRef} style={{ width: '100%', height }} />

  const sy = (v: number) => cH * (1 - v / maxVal)
  const step = cW / n, bW = step * 0.58
  const bx = (i: number) => i * step + (step - bW) / 2
  const cx = (i: number) => i * step + step / 2
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ v: maxVal * f, y: cH * (1 - f) }))

  return (
    <div ref={wrapRef} style={{ width: '100%', overflow: 'hidden' }}>
      <svg width={w} height={height} style={{ display: 'block' }}>
        <g transform={`translate(${P.l},${P.t})`}>
          {ticks.map(({ v, y }, i) => (
            <g key={i}>
              <line x1={0} x2={cW} y1={y} y2={y} stroke="var(--line)" strokeWidth={i === 0 ? 1.5 : 0.8} />
              <text x={-8} y={y + 4} textAnchor="end" fontSize={10} fill="var(--ink-3)" fontFamily="var(--font-mono)">{mN(v)}</text>
            </g>
          ))}
          {goalVal != null && (
            <line x1={0} x2={cW} y1={sy(goalVal)} y2={sy(goalVal)}
              stroke={goalColor || 'oklch(0.58 0.13 150)'} strokeWidth={1.5} strokeDasharray="6,3" />
          )}
          {data.map((d, i) => {
            const v = (d[barKey] as number) || 0
            const bH = Math.max(cH - sy(v), 0)
            const isHL = highlightIdx != null ? i === highlightIdx : i === n - 1
            return (
              <g key={i}>
                <rect x={bx(i)} y={sy(v)} width={bW} height={bH} fill={barColor} opacity={isHL ? 1 : 0.62} rx={2} />
                {showBarLabels && v > 0 && (
                  <text x={cx(i)} y={sy(v) - 5} textAnchor="middle" fontSize={9.5} fill="var(--ink-3)" fontFamily="var(--font-mono)">{mN(v)}</text>
                )}
              </g>
            )
          })}
          {lineKey && lineColor && (
            <>
              <polyline points={data.map((d, i) => `${cx(i)},${sy((d[lineKey] as number) || 0)}`).join(' ')}
                fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" />
              {data.map((d, i) => <circle key={i} cx={cx(i)} cy={sy((d[lineKey] as number) || 0)} r={2.5} fill={lineColor} />)}
            </>
          )}
          {data.map((d, i) => (
            <text key={i} x={cx(i)} y={cH + 20} textAnchor="middle" fontSize={10} fill="var(--ink-3)" fontFamily="var(--font-sans)">{d[labelKey] as string}</text>
          ))}
        </g>
      </svg>
    </div>
  )
}

// ── Stacked Bar + Dual-axis Line chart ────────────────────────────────────────

function StackedDualChart({ data, bar1Key, bar2Key, bar1Color, bar2Color, lineKey, lineColor, labelKey = 'label', height = 230, highlightIdx }: {
  data: Record<string, unknown>[]
  bar1Key: string
  bar2Key: string
  bar1Color: string
  bar2Color: string
  lineKey: string
  lineColor: string
  labelKey?: string
  height?: number
  highlightIdx?: number
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(600)
  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(e => setW(Math.floor(e[0].contentRect.width)))
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const P = { t: 28, r: 50, b: 32, l: 56 }
  const cW = Math.max(w - P.l - P.r, 10), cH = height - P.t - P.b, n = data.length
  const totals = data.map(d => ((d[bar1Key] as number) || 0) + ((d[bar2Key] as number) || 0))
  const maxBar = Math.max(...totals) * 1.18
  const lVals = data.map(d => (d[lineKey] as number) || 0)
  const maxLine = Math.max(...lVals, 0.01) * 1.25
  if (!maxBar) return <div ref={wrapRef} style={{ width: '100%', height }} />

  const syB = (v: number) => cH * (1 - v / maxBar)
  const syL = (v: number) => cH * (1 - v / maxLine)
  const step = cW / n, bW = step * 0.58
  const bx = (i: number) => i * step + (step - bW) / 2
  const cx = (i: number) => i * step + step / 2
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ v: maxBar * f, y: cH * (1 - f) }))
  const lineTicks = [0, 0.25, 0.5, 0.75, 1].map(f => maxLine * f)

  return (
    <div ref={wrapRef} style={{ width: '100%', overflow: 'hidden' }}>
      <svg width={w} height={height} style={{ display: 'block' }}>
        <g transform={`translate(${P.l},${P.t})`}>
          {ticks.map(({ v, y }, i) => (
            <g key={i}>
              <line x1={0} x2={cW} y1={y} y2={y} stroke="var(--line)" strokeWidth={i === 0 ? 1.5 : 0.8} />
              <text x={-8} y={y + 4} textAnchor="end" fontSize={10} fill="var(--ink-3)" fontFamily="var(--font-mono)">{mN(v)}</text>
            </g>
          ))}
          {lineTicks.map((v, i) => (
            <text key={i} x={cW + 6} y={cH * (1 - i / 4) + 4} textAnchor="start" fontSize={10} fill={lineColor} fontFamily="var(--font-mono)">
              {v.toFixed(1)}%
            </text>
          ))}
          {data.map((d, i) => {
            const v1 = (d[bar1Key] as number) || 0
            const v2 = (d[bar2Key] as number) || 0
            const total = v1 + v2
            const isHL = highlightIdx != null ? i === highlightIdx : i === n - 1
            const op = isHL ? 1 : 0.62
            return (
              <g key={i}>
                <rect x={bx(i)} y={syB(v1)} width={bW} height={Math.max(cH - syB(v1), 0)} fill={bar1Color} opacity={op} rx={v2 > 0 ? 0 : 2} />
                {v2 > 0 && (
                  <rect x={bx(i)} y={syB(total)} width={bW} height={Math.max(syB(v1) - syB(total), 0)} fill={bar2Color} opacity={op} rx={2} />
                )}
                {total > 0 && (
                  <text x={cx(i)} y={syB(total) - 5} textAnchor="middle" fontSize={9.5} fill="var(--ink-3)" fontFamily="var(--font-mono)">{mN(total)}</text>
                )}
              </g>
            )
          })}
          <>
            <polyline points={data.map((d, i) => `${cx(i)},${syL((d[lineKey] as number) || 0)}`).join(' ')}
              fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" />
            {data.map((d, i) => {
              const v = (d[lineKey] as number) || 0
              return (
                <g key={i}>
                  <circle cx={cx(i)} cy={syL(v)} r={3} fill={lineColor} />
                  <text x={cx(i)} y={syL(v) - 7} textAnchor="middle" fontSize={9} fill={lineColor} fontFamily="var(--font-mono)">
                    {v.toFixed(2).replace('.', ',')}%
                  </text>
                </g>
              )
            })}
          </>
          {data.map((d, i) => (
            <text key={i} x={cx(i)} y={cH + 20} textAnchor="middle" fontSize={10} fill="var(--ink-3)" fontFamily="var(--font-sans)">{d[labelKey] as string}</text>
          ))}
        </g>
      </svg>
    </div>
  )
}

// ── Section Head ──────────────────────────────────────────────────────────────

function SectionHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
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

// ── Monthly Tables ────────────────────────────────────────────────────────────

function IGMonthlyTable({ data, selectedIdx }: { data: IgMonthEntry[]; selectedIdx: number }) {
  const cols = '72px 1fr 1fr 60px 1fr 1fr 76px'
  const hdrs = ['Mês', 'Views Reels', 'Alcance', 'Posts', 'Méd. Views', 'Interações', 'Engaj']
  return (
    <div className="list">
      <div className="list-row list-head" style={{ gridTemplateColumns: cols }}>
        {hdrs.map(h => <div key={h} className="cell">{h}</div>)}
      </div>
      {data.map((d, i) => {
        const isSel = i === selectedIdx
        return (
          <div key={i} className="list-row" style={{ gridTemplateColumns: cols, background: isSel ? 'oklch(0.985 0.018 55)' : undefined }}>
            <div className="cell" style={{ fontWeight: isSel ? 700 : 500, color: isSel ? 'var(--accent-deep)' : 'var(--ink)' }}>{d.label}</div>
            <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(d.viewsReels)}</div>
            <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(d.alcance)}</div>
            <div className="cell">{d.qtdPosts}</div>
            <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(d.mediaViews)}</div>
            <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(d.interacoes)}</div>
            <div className="cell">{mPct(d.engaj)}</div>
          </div>
        )
      })}
    </div>
  )
}

function TTMonthlyTable({ data, selectedIdx }: { data: TtMonthEntry[]; selectedIdx: number }) {
  const cols = '72px 1fr 1fr 60px 1fr 76px'
  const hdrs = ['Mês', 'Views', 'V. Collabs', 'Posts', 'Interações', 'Engaj']
  return (
    <div className="list">
      <div className="list-row list-head" style={{ gridTemplateColumns: cols }}>
        {hdrs.map(h => <div key={h} className="cell">{h}</div>)}
      </div>
      {data.map((d, i) => {
        const isSel = i === selectedIdx
        return (
          <div key={i} className="list-row" style={{ gridTemplateColumns: cols, background: isSel ? 'oklch(0.985 0.018 200)' : undefined }}>
            <div className="cell" style={{ fontWeight: isSel ? 700 : 500, color: isSel ? 'oklch(0.38 0.08 220)' : 'var(--ink)' }}>{d.label}</div>
            <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(d.views)}</div>
            <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', color: d.viewsCollabs ? 'var(--ink)' : 'var(--ink-4)' }}>
              {d.viewsCollabs ? mFull(d.viewsCollabs) : '—'}
            </div>
            <div className="cell">{d.qtdPosts}</div>
            <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(d.interacoes)}</div>
            <div className="cell">{mPct(d.engaj)}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Semester Filter ───────────────────────────────────────────────────────────

type SemFilter = 'sem1' | 'sem2' | 'ano'

function SemFilterPills({ value, onChange }: { value: SemFilter; onChange: (v: SemFilter) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
      {([{ id: 'sem1', label: '1º Sem' }, { id: 'sem2', label: '2º Sem' }, { id: 'ano', label: 'Ano' }] as const).map(o => {
        const active = value === o.id
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            padding: '5px 12px', borderRadius: 999, lineHeight: '1',
            border: `1.5px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
            background: active ? 'var(--accent)' : 'var(--surface)',
            color: active ? '#fff' : 'var(--ink-2)',
            fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: active ? 700 : 400,
            cursor: 'pointer',
          }}>{o.label}</button>
        )
      })}
    </div>
  )
}

// ── Weekly Tables ─────────────────────────────────────────────────────────────

function IGWeeklyTable({ data }: { data: IgWeekEntry[] }) {
  const cols = '38px 118px 88px 108px 108px 96px 68px 52px'
  const hdrs = ['S#', 'Datas', 'Meta', 'Views', 'Alcance', 'Interações', 'Engaj', 'Posts']
  return (
    <div style={{ maxHeight: 380, overflowY: 'auto', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
      <div className="list" style={{ borderRadius: 0, border: 'none' }}>
        <div className="list-row list-head" style={{ gridTemplateColumns: cols, position: 'sticky', top: 0, zIndex: 2, background: 'var(--surface-2)' }}>
          {hdrs.map(h => <div key={h} className="cell">{h}</div>)}
        </div>
        {data.length === 0
          ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Sem dados para este período</div>
          : data.map((d, i) => {
            const hit = d.views >= d.meta
            return (
              <div key={i} className="list-row" style={{ gridTemplateColumns: cols }}>
                <div className="cell" style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{d.semana}</div>
                <div className="cell" style={{ fontSize: 11.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{d.dias}</div>
                <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ink-3)' }}>{mN(d.meta, 1)}</div>
                <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: hit ? 600 : 400, color: hit ? 'oklch(0.42 0.13 150)' : 'var(--ink)' }}>
                  {mFull(d.views)}
                </div>
                <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(d.alcance)}</div>
                <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(d.interacoes)}</div>
                <div className="cell">{mPct(d.engaj)}</div>
                <div className="cell" style={{ color: 'var(--ink-3)' }}>{d.posts}</div>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

function TTWeeklyTable({ data }: { data: TtWeekEntry[] }) {
  const cols = '38px 118px 88px 116px 56px 68px'
  const hdrs = ['S#', 'Datas', 'Meta', 'Views', 'Posts', 'Engaj']
  return (
    <div style={{ maxHeight: 380, overflowY: 'auto', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
      <div className="list" style={{ borderRadius: 0, border: 'none' }}>
        <div className="list-row list-head" style={{ gridTemplateColumns: cols, position: 'sticky', top: 0, zIndex: 2, background: 'var(--surface-2)' }}>
          {hdrs.map(h => <div key={h} className="cell">{h}</div>)}
        </div>
        {data.length === 0
          ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Sem dados para este período</div>
          : data.map((d, i) => {
            const hit = d.views >= d.meta
            return (
              <div key={i} className="list-row" style={{ gridTemplateColumns: cols }}>
                <div className="cell" style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{d.semana}</div>
                <div className="cell" style={{ fontSize: 11.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{d.dias}</div>
                <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ink-3)' }}>{mN(d.meta, 0)}</div>
                <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: hit ? 600 : 400, color: hit ? 'oklch(0.42 0.13 150)' : 'var(--ink)' }}>
                  {mFull(d.views)}
                </div>
                <div className="cell" style={{ color: 'var(--ink-3)' }}>{d.posts}</div>
                <div className="cell">{mPct(d.engaj)}</div>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

// ── IGView ────────────────────────────────────────────────────────────────────

function IGView({ data }: { data: MetricsDataShape }) {
  const { ig, ano, dia, diasNoMes } = data
  const [selIdx, setSelIdx] = useState(ig.mensal.length - 1)
  const [semFilter, setSemFilter] = useState<SemFilter>('sem1')

  const curr = ig.mensal[selIdx]
  const prev = selIdx > 0 ? ig.mensal[selIdx - 1] : null
  const isCurrentMonth = selIdx === ig.mensal.length - 1
  const isPartialMonth = isCurrentMonth && dia < diasNoMes
  const diaUsed = isCurrentMonth ? dia : MONTH_DAYS[selIdx]
  const diasNoMesUsed = MONTH_DAYS[selIdx]
  const diasNoMesPrev = prev ? MONTH_DAYS[selIdx - 1] : null
  const prevLabel = prev ? prev.label : null
  const isComplete = !isPartialMonth

  const reelsMes = isCurrentMonth ? ig.reelsMes : null
  const postsMes = isCurrentMonth ? ig.postsMes : null

  const weeklyFiltered = ig.semanal.filter(d => {
    if (semFilter === 'ano') return true
    return weekSem(d.dias) === (semFilter === 'sem1' ? 1 : 2)
  })
  const weeklyChartData = weeklyFiltered.map(d => ({ ...d, label: `S${d.semana}` }))

  const kpiBase = { prevLabel, isPartialMonth, diaAtual: diaUsed, diasNoMesPrev }

  return (
    <div style={{ padding: '0 32px 48px', display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Month picker + KPIs */}
      <section>
        <MonthPicker mensal={ig.mensal} selectedIdx={selIdx} onChange={setSelIdx} ano={ano} />
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>
          {isPartialMonth ? `Parcial · Dia ${dia} de ${diasNoMes}` : 'Mês concluído · todos os dados disponíveis'}
          {prev && <span style={{ marginLeft: 10, color: 'var(--ink-4)' }}>— passe o mouse sobre os cards para comparar com {prevLabel}</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
          <KpiCard label="Views Reels"  value={mN(curr.viewsReels)}  currRaw={curr.viewsReels}  prevRaw={prev?.viewsReels}  {...kpiBase} />
          <KpiCard label="Alcance"      value={mN(curr.alcance)}     currRaw={curr.alcance}     prevRaw={prev?.alcance}     {...kpiBase} />
          <KpiCard label="Posts"        value={curr.qtdPosts}        currRaw={curr.qtdPosts}    prevRaw={prev?.qtdPosts}    {...kpiBase} sub="publicados" />
          <KpiCard label="Média Views"  value={mN(curr.mediaViews)}  currRaw={curr.mediaViews}  prevRaw={prev?.mediaViews}  {...kpiBase} noProrate />
          <KpiCard label="Interações"   value={mN(curr.interacoes)}  currRaw={curr.interacoes}  prevRaw={prev?.interacoes}  {...kpiBase} />
          <KpiCard label="Engajamento"  value={mPct(curr.engaj)}     currRaw={curr.engaj}       prevRaw={prev?.engaj}       {...kpiBase} highlight noProrate isPct />
        </div>
      </section>

      {/* Breakdown + Pace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <section>
          <SectionHead title="Breakdown do mês" sub={`Reels vs Posts · ${curr.label} ${ano}`} />
          <BreakdownTable reels={reelsMes} posts={postsMes} />
        </section>
        <section>
          <SectionHead
            title="Pace do Mês"
            sub={`${isComplete ? 'Mês concluído' : `Dia ${diaUsed} de ${diasNoMesUsed}`} · ${curr.label} ${ano}`}
          />
          <PaceTable
            items={[
              { label: 'Views Reels', real: curr.viewsReels, meta: ig.metas.views },
              { label: 'Alcance',     real: curr.alcance,    meta: ig.metas.alcance },
              { label: 'Interações',  real: curr.interacoes, meta: ig.metas.interacoes },
            ]}
            dia={diaUsed} diasNoMes={diasNoMesUsed} isComplete={isComplete}
          />
        </section>
      </div>

      {/* Monthly chart + table */}
      <section>
        <SectionHead title="Evolução Mensal" sub={`Jan – ${MONTH_LABELS[ig.mensal.length - 1]} ${ano} · Views Reels e Alcance`} />
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '18px 18px 12px' }}>
          <ChartLegend items={[
            { color: 'var(--accent)', label: 'Views Reels', type: 'bar' },
            { color: 'var(--p-ig)',   label: 'Alcance',     type: 'line' },
          ]} />
          <BarLineChart data={ig.mensal as unknown as Record<string, unknown>[]} barKey="viewsReels" barColor="var(--accent)"
            lineKey="alcance" lineColor="var(--p-ig)" height={220} highlightIdx={selIdx} />
        </div>
        <div style={{ marginTop: 12 }}>
          <IGMonthlyTable data={ig.mensal} selectedIdx={selIdx} />
        </div>
      </section>

      {/* Weekly chart + table */}
      <section>
        <SectionHead
          title="Semana a Semana"
          sub="Instagram · Verde = acima da meta semanal"
          right={<SemFilterPills value={semFilter} onChange={setSemFilter} />}
        />
        {weeklyChartData.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '16px 16px 8px', marginBottom: 12 }}>
            <ChartLegend items={[
              { color: 'var(--accent)',        label: 'Views Reels', type: 'bar' },
              { color: 'var(--p-ig)',          label: 'Alcance',     type: 'line' },
              { color: 'oklch(0.58 0.13 150)', label: 'Meta',        type: 'dashed' },
            ]} />
            <BarLineChart data={weeklyChartData as unknown as Record<string, unknown>[]} barKey="views" barColor="var(--accent)"
              lineKey="alcance" lineColor="var(--p-ig)"
              goalVal={IG_WEEKLY_GOAL} goalColor="oklch(0.58 0.13 150)"
              showBarLabels={false} height={190} />
          </div>
        )}
        <IGWeeklyTable data={weeklyFiltered} />
      </section>
    </div>
  )
}

// ── TTView ────────────────────────────────────────────────────────────────────

function TTView({ data }: { data: MetricsDataShape }) {
  const { tt, ano, dia, diasNoMes } = data
  const [selIdx, setSelIdx] = useState(tt.mensal.length - 1)
  const [semFilter, setSemFilter] = useState<SemFilter>('sem1')

  const curr = tt.mensal[selIdx]
  const prev = selIdx > 0 ? tt.mensal[selIdx - 1] : null
  const isCurrentMonth = selIdx === tt.mensal.length - 1
  const isPartialMonth = isCurrentMonth && dia < diasNoMes
  const diaUsed = isCurrentMonth ? dia : MONTH_DAYS[selIdx]
  const diasNoMesUsed = MONTH_DAYS[selIdx]
  const diasNoMesPrev = prev ? MONTH_DAYS[selIdx - 1] : null
  const prevLabel = prev ? prev.label : null
  const isComplete = !isPartialMonth

  const totalViews = curr.views + (curr.viewsCollabs || 0)
  const prevTotal  = prev ? (prev.views + (prev.viewsCollabs || 0)) : null

  const TT_BAR1 = 'oklch(0.52 0.15 232)'
  const TT_BAR2 = 'oklch(0.74 0.14 82)'
  const TT_LINE = 'oklch(0.5 0.17 25)'

  const weeklyFiltered = tt.semanal.filter(d => {
    if (semFilter === 'ano') return true
    return weekSem(d.dias) === (semFilter === 'sem1' ? 1 : 2)
  })
  const weeklyChartData = weeklyFiltered.map(d => ({ ...d, label: `S${d.semana}` }))

  const kpiBase = { prevLabel, isPartialMonth, diaAtual: diaUsed, diasNoMesPrev }

  return (
    <div style={{ padding: '0 32px 48px', display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Month picker + KPIs */}
      <section>
        <MonthPicker mensal={tt.mensal} selectedIdx={selIdx} onChange={setSelIdx} ano={ano} />
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>
          {isPartialMonth ? `Parcial · Dia ${dia} de ${diasNoMes}` : 'Mês concluído · todos os dados disponíveis'}
          {prev && <span style={{ marginLeft: 10, color: 'var(--ink-4)' }}>— passe o mouse sobre os cards para comparar com {prevLabel}</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          <KpiCard label="Views (total)"   value={mN(totalViews)}             currRaw={totalViews}             prevRaw={prevTotal}              {...kpiBase} />
          <KpiCard label="Views Orgânicas" value={mN(curr.views)}             currRaw={curr.views}             prevRaw={prev?.views}            {...kpiBase} sub="sem collabs" />
          <KpiCard label="Views Collabs"   value={curr.viewsCollabs ? mN(curr.viewsCollabs) : '—'}
            currRaw={curr.viewsCollabs} prevRaw={prev?.viewsCollabs}
            sub={curr.viewsCollabs ? 'colaborações' : 'nenhuma este mês'} {...kpiBase} />
          <KpiCard label="Posts"           value={curr.qtdPosts}              currRaw={curr.qtdPosts}          prevRaw={prev?.qtdPosts}         {...kpiBase} sub="publicados" />
          <KpiCard label="Engajamento"     value={mPct(curr.engaj)}           currRaw={curr.engaj}             prevRaw={prev?.engaj}            {...kpiBase} highlight noProrate isPct />
        </div>
      </section>

      {/* Pace */}
      <section>
        <SectionHead title="Pace do Mês" sub={`${isComplete ? 'Mês concluído' : `Dia ${diaUsed} de ${diasNoMesUsed}`} · ${curr.label} ${ano}`} />
        <PaceTable
          items={[{ label: 'Views', real: totalViews, meta: tt.metas.views }]}
          dia={diaUsed} diasNoMes={diasNoMesUsed} isComplete={isComplete}
        />
      </section>

      {/* Monthly chart + table */}
      <section>
        <SectionHead title="Evolução Mensal" sub={`Jan – ${MONTH_LABELS[tt.mensal.length - 1]} ${ano} · Views orgânicas + Collabs · Engajamento`} />
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '18px 18px 12px' }}>
          <ChartLegend items={[
            { color: TT_BAR1, label: 'Views orgânicas', type: 'bar' },
            { color: TT_BAR2, label: 'Views Collabs',   type: 'bar' },
            { color: TT_LINE, label: 'Engajamento %',   type: 'line' },
          ]} />
          <StackedDualChart data={tt.mensal as unknown as Record<string, unknown>[]}
            bar1Key="views" bar2Key="viewsCollabs"
            bar1Color={TT_BAR1} bar2Color={TT_BAR2}
            lineKey="engaj" lineColor={TT_LINE}
            height={250} highlightIdx={selIdx} />
        </div>
        <div style={{ marginTop: 12 }}>
          <TTMonthlyTable data={tt.mensal} selectedIdx={selIdx} />
        </div>
      </section>

      {/* Weekly chart + table */}
      <section>
        <SectionHead
          title="Semana a Semana"
          sub="TikTok · Verde = acima da meta semanal"
          right={<SemFilterPills value={semFilter} onChange={setSemFilter} />}
        />
        {weeklyChartData.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '16px 16px 8px', marginBottom: 12 }}>
            <ChartLegend items={[
              { color: TT_BAR1,                label: 'Views', type: 'bar' },
              { color: 'oklch(0.58 0.13 150)', label: 'Meta',  type: 'dashed' },
            ]} />
            <BarLineChart data={weeklyChartData as unknown as Record<string, unknown>[]} barKey="views" barColor={TT_BAR1}
              goalVal={TT_WEEKLY_GOAL} goalColor="oklch(0.58 0.13 150)"
              showBarLabels={false} height={180} />
          </div>
        )}
        <TTWeeklyTable data={weeklyFiltered} />
      </section>
    </div>
  )
}

// ── MetricsView — main entry point ────────────────────────────────────────────

export default function MetricsView() {
  const { data, loading, error } = useMetricsData()
  const [platform, setPlatform] = useState<'ig' | 'tt'>('ig')

  const tabs = [
    { id: 'ig' as const, label: 'Instagram', dot: 'var(--c-ig-fg)' },
    { id: 'tt' as const, label: 'TikTok',    dot: 'var(--c-tt-fg)' },
  ]

  return (
    <>
      <div style={{ display: 'flex', gap: 8, padding: '0 32px 18px', alignItems: 'center' }}>
        {tabs.map(t => {
          const active = platform === t.id
          return (
            <button key={t.id} onClick={() => setPlatform(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 999,
              border: `1.5px solid ${active ? t.dot : 'var(--line)'}`,
              background: active ? `color-mix(in oklab, ${t.dot}, white 88%)` : 'var(--surface)',
              color: active ? t.dot : 'var(--ink-2)',
              fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: active ? 600 : 500,
              cursor: 'pointer', transition: 'all .15s',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: t.dot, display: 'inline-block', flexShrink: 0 }} />
              {t.label}
            </button>
          )
        })}
        <div style={{ flex: 1 }} />
        {data && (
          <span style={{ fontSize: 12, color: 'var(--ink-3)', background: 'var(--surface-2)', padding: '5px 12px', borderRadius: 999, border: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>
            {data.ano} · Dia {data.dia}/{data.diasNoMes}
          </span>
        )}
      </div>

      {loading && (
        <div style={{ padding: '64px 32px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
          Carregando métricas…
        </div>
      )}

      {error && (
        <div style={{ padding: '64px 32px', textAlign: 'center', color: 'oklch(0.5 0.16 25)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {data && platform === 'ig' && <IGView data={data} />}
      {data && platform === 'tt' && <TTView data={data} />}
    </>
  )
}
