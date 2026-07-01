'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  useReactTable, getCoreRowModel, flexRender,
  type ColumnDef, type VisibilityState, type SortingState,
} from '@tanstack/react-table'

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
    breakdown: Record<string, { reels: BreakdownEntry | null; posts: BreakdownEntry | null }>
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

      // IG breakdown — todos os meses
      const toBreakdown = (r: Record<string, unknown> | undefined): BreakdownEntry | null =>
        r ? {
          views: Number(r.views),
          alcance: Number(r.alcance),
          posts: Number(r.qtd_posts),
          mediaViews: Number(r.media_views),
          interacoes: Number(r.interacoes),
          engaj: Number(r.engaj),
        } : null
      const breakdown: Record<string, { reels: BreakdownEntry | null; posts: BreakdownEntry | null }> = {}
      for (const r of (r2.data ?? [])) {
        const key = r.mes as string
        if (!breakdown[key]) breakdown[key] = { reels: null, posts: null }
        if (r.tipo === 'Reels') breakdown[key].reels = toBreakdown(r as Record<string, unknown>)
        if (r.tipo === 'Posts') breakdown[key].posts = toBreakdown(r as Record<string, unknown>)
      }

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

      // Garante que Julho (mês 7) sempre aparece, mesmo sem dados
      const minMonths = 7
      for (let m = igMensal.length + 1; m <= minMonths; m++) {
        igMensal.push({ label: MONTH_LABELS[m - 1], viewsReels: 0, alcance: 0, qtdPosts: 0, mediaViews: 0, interacoes: 0, engaj: 0 })
      }
      for (let m = ttMensal.length + 1; m <= minMonths; m++) {
        ttMensal.push({ label: MONTH_LABELS[m - 1], views: 0, viewsCollabs: 0, qtdPosts: 0, interacoes: 0, engaj: 0 })
      }

      setData({
        ano: ANO,
        mes,
        dia,
        diasNoMes,
        ig: { metas: IG_METAS, mensal: igMensal, breakdown, semanal: igSemanal },
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
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.022em', color: highlight ? 'var(--accent-deep)' : 'var(--ink)', lineHeight: 1, fontVariantNumeric: 'tabular-nums', marginBottom: 6 }}>
          {value}
        </div>
        <div style={{ minHeight: 16, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          {sub && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{sub}</span>}
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

// ── Breakdown Table ───────────────────────────────────────────────────────────

function BreakdownTable({ reels, posts }: { reels: BreakdownEntry | null; posts: BreakdownEntry | null }) {
  if (!reels || !posts) {
    return (
      <div style={{ padding: '18px 22px', color: 'var(--ink-3)', fontSize: 13, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
        Breakdown disponível apenas para o mês atual
      </div>
    )
  }
  const cols = '88px 1fr 1fr 76px 1fr 1fr 76px'
  const hdrs = ['Tipo', 'Views', 'Alcance', 'Posts', 'Méd. Views', 'Interações', 'Engaj']
  return (
    <div className="list">
      <div className="list-row list-head" style={{ gridTemplateColumns: cols }}>
        {hdrs.map((h, i) => <div key={h} className="cell" style={i === 4 ? { paddingLeft: 40 } : undefined}>{h}</div>)}
      </div>
      {([{ label: 'Reels', d: reels }, { label: 'Posts', d: posts }] as const).map(({ label, d }) => (
        <div key={label} className="list-row" style={{ gridTemplateColumns: cols }}>
          <div className="cell" style={{ fontWeight: 600 }}>{label}</div>
          <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(d.views)}</div>
          <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(d.alcance)}</div>
          <div className="cell">{d.posts}</div>
          <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', paddingLeft: 40 }}>{mFull(d.mediaViews)}</div>
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
  const cols = '140px 120px 110px 116px 76px 1fr'
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
            <div className="cell" style={{ color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{mFull(meta)}</div>
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
  const [hovIdx, setHovIdx] = useState<number | null>(null)
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
    <div ref={wrapRef} style={{ width: '100%', position: 'relative' }}>
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
        const bv = (d[barKey] as number) || 0
        const lv = lineKey ? (d[lineKey] as number) || 0 : null
        const xc = P.l + hovIdx * step + step / 2
        const tipW = 152
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
              {mFull(bv)}
            </div>
            {lv !== null && lineColor && (
              <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-2)', marginTop: 5 }}>
                <svg width={10} height={8} style={{ flexShrink: 0 }}>
                  <line x1={0} y1={4} x2={10} y2={4} stroke={lineColor} strokeWidth={1.5} />
                  <circle cx={5} cy={4} r={2} fill={lineColor} />
                </svg>
                {mFull(lv)}
              </div>
            )}
          </div>
        )
      })()}
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
  const cols = '72px 1fr 1fr 76px 1fr 1fr 76px'
  const hdrs = ['Mês', 'Views Reels', 'Alcance', 'Posts', 'Méd. Views', 'Interações', 'Engaj']
  return (
    <div className="list">
      <div className="list-row list-head" style={{ gridTemplateColumns: cols }}>
        {hdrs.map((h, i) => <div key={h} className="cell" style={i === 4 ? { paddingLeft: 40 } : undefined}>{h}</div>)}
      </div>
      {data.map((d, i) => {
        const isSel = i === selectedIdx
        return (
          <div key={i} className="list-row" style={{ gridTemplateColumns: cols, background: isSel ? 'oklch(0.985 0.018 55)' : undefined }}>
            <div className="cell" style={{ fontWeight: isSel ? 700 : 500, color: isSel ? 'var(--accent-deep)' : 'var(--ink)' }}>{d.label}</div>
            <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(d.viewsReels)}</div>
            <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(d.alcance)}</div>
            <div className="cell">{d.qtdPosts}</div>
            <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', paddingLeft: 40 }}>{mFull(d.mediaViews)}</div>
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
  const cols = '60px 130px 120px 270px 220px 220px 220px 220px 64px'
  const hdrs = ['S#', 'Datas', 'Meta', 'Views', 'Cresc. semana ant.', 'Alcance', 'Interações', 'Engaj', 'Posts']
  return (
    <div style={{ maxHeight: 380, overflowY: 'auto', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
      <div className="list" style={{ borderRadius: 0, border: 'none', overflow: 'visible' }}>
        <div className="list-row list-head" style={{ gridTemplateColumns: cols, position: 'sticky', top: 0, zIndex: 2, background: 'var(--surface-2)' }}>
          {hdrs.map((h, i) => <div key={h} className="cell" style={i === 3 ? { paddingLeft: 40 } : undefined}>{h}</div>)}
        </div>
        {data.length === 0
          ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Sem dados para este período</div>
          : data.map((d, i) => {
            const hit = d.views >= d.meta
            const metaDelta = d.meta > 0 ? ((d.views - d.meta) / d.meta) * 100 : null
            const metaDeltaColor = metaDelta != null && metaDelta >= 0 ? 'oklch(0.46 0.13 150)' : 'oklch(0.5 0.16 25)'
            const prev = i > 0 ? data[i - 1] : null
            const weekDelta = prev && prev.views > 0 ? ((d.views - prev.views) / prev.views) * 100 : null
            const weekDeltaColor = weekDelta != null && weekDelta >= 0 ? 'oklch(0.46 0.13 150)' : 'oklch(0.5 0.16 25)'
            return (
              <div key={i} className="list-row" style={{ gridTemplateColumns: cols }}>
                <div className="cell" style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{d.semana}</div>
                <div className="cell" style={{ fontSize: 11.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{d.dias}</div>
                <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ink-3)' }}>{mFull(d.meta)}</div>
                <div className="cell" style={{ paddingLeft: 40, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: hit ? 600 : 400, color: hit ? 'oklch(0.42 0.13 150)' : 'var(--ink)' }}>
                    {mFull(d.views)}
                  </span>
                  {metaDelta != null && (
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: metaDeltaColor, fontVariantNumeric: 'tabular-nums' }}>
                      {metaDelta >= 0 ? '+' : ''}{metaDelta.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: weekDelta != null ? 600 : 400, color: weekDelta != null ? weekDeltaColor : 'var(--ink-4)' }}>
                  {weekDelta != null ? `${weekDelta >= 0 ? '+' : ''}${weekDelta.toFixed(1)}%` : '—'}
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
  const cols = '38px 118px 70px 1fr 110px 64px 72px'
  const hdrs = ['S#', 'Datas', 'Meta', 'Views', 'Cresc. sem. ant.', 'Posts', 'Engaj']
  return (
    <div style={{ maxHeight: 380, overflowY: 'auto', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
      <div className="list" style={{ borderRadius: 0, border: 'none', overflow: 'visible' }}>
        <div className="list-row list-head" style={{ gridTemplateColumns: cols, position: 'sticky', top: 0, zIndex: 2, background: 'var(--surface-2)' }}>
          {hdrs.map(h => <div key={h} className="cell">{h}</div>)}
        </div>
        {data.length === 0
          ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Sem dados para este período</div>
          : data.map((d, i) => {
            const hit = d.views >= d.meta
            const metaDelta = d.meta > 0 ? ((d.views - d.meta) / d.meta) * 100 : null
            const metaDeltaColor = metaDelta != null && metaDelta >= 0 ? 'oklch(0.46 0.13 150)' : 'oklch(0.5 0.16 25)'
            const prev = i > 0 ? data[i - 1] : null
            const weekDelta = prev && prev.views > 0 ? ((d.views - prev.views) / prev.views) * 100 : null
            const weekDeltaColor = weekDelta != null && weekDelta >= 0 ? 'oklch(0.46 0.13 150)' : 'oklch(0.5 0.16 25)'
            return (
              <div key={i} className="list-row" style={{ gridTemplateColumns: cols }}>
                <div className="cell" style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{d.semana}</div>
                <div className="cell" style={{ fontSize: 11.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{d.dias}</div>
                <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ink-3)' }}>{mFull(d.meta)}</div>
                <div className="cell" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: hit ? 600 : 400, color: hit ? 'oklch(0.42 0.13 150)' : 'var(--ink)' }}>
                    {mFull(d.views)}
                  </span>
                  {metaDelta != null && (
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: metaDeltaColor, fontVariantNumeric: 'tabular-nums' }}>
                      {metaDelta >= 0 ? '+' : ''}{metaDelta.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: weekDelta != null ? 600 : 400, color: weekDelta != null ? weekDeltaColor : 'var(--ink-4)' }}>
                  {weekDelta != null ? `${weekDelta >= 0 ? '+' : ''}${weekDelta.toFixed(1)}%` : '—'}
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

  const mesStr = `${ANO}-${String(selIdx + 1).padStart(2, '0')}-01`
  const { reels: reelsMes, posts: postsMes } = ig.breakdown[mesStr] ?? { reels: null, posts: null }

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

// ── CollabView ────────────────────────────────────────────────────────────────

const COLLAB_YEAR_MIN = 2025
const COLLAB_BAR = 'oklch(0.6 0.17 320)'
const COLLAB_LINE = 'oklch(0.5 0.17 25)'

interface CollabMonthEntry {
  key: string
  label: string
  posts: number
  views: number
  interacoes: number
  criadoras: number
  engaj: number
}

interface CollabAccountEntry {
  conta: string
  posts: number
  views: number
  interacoes: number
  engaj: number
}

function parseIgNum(v: unknown): number {
  const n = parseInt(String(v ?? '').replace(/\D/g, ''), 10)
  return isNaN(n) ? 0 : n
}

function useCollabPosts() {
  const [rows, setRows] = useState<RawRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    createClient()
      .from('metricas_posts_instagram_gocase')
      .select('*')
      .eq('TIPO', 'COLLAB')
      .limit(5000)
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); setLoading(false); return }
        setRows((data as RawRow[]) ?? [])
        setLoading(false)
      })
  }, [])

  return { rows, loading, error }
}

function mesKeyOrder(key: string): number {
  const [m, y] = key.split('-').map(Number)
  return y * 12 + m
}

function buildCollabMonthly(rows: RawRow[]): CollabMonthEntry[] {
  const byMonth = new Map<string, { posts: number; views: number; interacoes: number; contas: Set<string> }>()

  for (const r of rows) {
    const mes = String(r['MÊS'] ?? '')
    const [, yearStr] = mes.split('-')
    if (!yearStr || Number(yearStr) < COLLAB_YEAR_MIN) continue

    const entry = byMonth.get(mes) ?? { posts: 0, views: 0, interacoes: 0, contas: new Set<string>() }
    entry.posts += 1
    entry.views += parseIgNum(r['Visualizações'])
    entry.interacoes += parseIgNum(r['INTERAÇÕES'])
    const conta = String(r['Nome da conta'] ?? '').trim()
    if (conta) entry.contas.add(conta)
    byMonth.set(mes, entry)
  }

  return [...byMonth.entries()]
    .sort((a, b) => mesKeyOrder(a[0]) - mesKeyOrder(b[0]))
    .map(([key, v]) => {
      const [m, y] = key.split('-')
      return {
        key,
        label: `${MONTH_LABELS[Number(m) - 1]}/${y.slice(2)}`,
        posts: v.posts,
        views: v.views,
        interacoes: v.interacoes,
        criadoras: v.contas.size,
        engaj: v.views > 0 ? (v.interacoes / v.views) * 100 : 0,
      }
    })
}

function buildCollabRanking(rows: RawRow[]): CollabAccountEntry[] {
  const byConta = new Map<string, { posts: number; views: number; interacoes: number }>()

  for (const r of rows) {
    const conta = String(r['Nome da conta'] ?? '').trim()
    if (!conta) continue
    const entry = byConta.get(conta) ?? { posts: 0, views: 0, interacoes: 0 }
    entry.posts += 1
    entry.views += parseIgNum(r['Visualizações'])
    entry.interacoes += parseIgNum(r['INTERAÇÕES'])
    byConta.set(conta, entry)
  }

  return [...byConta.entries()]
    .map(([conta, v]) => ({
      conta, posts: v.posts, views: v.views, interacoes: v.interacoes,
      engaj: v.views > 0 ? (v.interacoes / v.views) * 100 : 0,
    }))
    .sort((a, b) => b.views - a.views)
}

function CollabMonthPicker({ entries, selectedIdx, onChange }: {
  entries: CollabMonthEntry[]
  selectedIdx: number
  onChange: (i: number) => void
}) {
  const canBack = selectedIdx > 0
  const canFwd = selectedIdx < entries.length - 1
  const curr = entries[selectedIdx]

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

      <div style={{ minWidth: 110 }}>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.035em', color: 'var(--ink)', lineHeight: 1 }}>
          {curr?.label ?? '—'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>Collabs</div>
      </div>

      <button onClick={() => canFwd && onChange(selectedIdx + 1)} disabled={!canFwd} style={btnStyle(canFwd)}>›</button>

      <div style={{ display: 'flex', gap: 4, marginLeft: 6, flexWrap: 'wrap', maxWidth: 560 }}>
        {entries.map((m, i) => {
          const active = i === selectedIdx
          return (
            <button key={m.key} onClick={() => onChange(i)} style={{
              padding: '5px 11px', borderRadius: 999, lineHeight: '1',
              border: `1.5px solid ${active ? COLLAB_BAR : 'var(--line)'}`,
              background: active ? COLLAB_BAR : 'var(--surface)',
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

function CollabMonthlyTable({ data, selectedIdx }: { data: CollabMonthEntry[]; selectedIdx: number }) {
  const cols = '72px 1fr 76px 1fr 1fr 76px'
  const hdrs = ['Mês', 'Views', 'Posts', 'Criadoras', 'Interações', 'Engaj']
  return (
    <div className="list">
      <div className="list-row list-head" style={{ gridTemplateColumns: cols }}>
        {hdrs.map(h => <div key={h} className="cell">{h}</div>)}
      </div>
      {data.map((d, i) => {
        const isSel = i === selectedIdx
        return (
          <div key={d.key} className="list-row" style={{ gridTemplateColumns: cols, background: isSel ? 'oklch(0.98 0.02 320)' : undefined }}>
            <div className="cell" style={{ fontWeight: isSel ? 700 : 500, color: isSel ? COLLAB_BAR : 'var(--ink)' }}>{d.label}</div>
            <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(d.views)}</div>
            <div className="cell">{d.posts}</div>
            <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{d.criadoras}</div>
            <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(d.interacoes)}</div>
            <div className="cell">{mPct(d.engaj)}</div>
          </div>
        )
      })}
    </div>
  )
}

function CollabRankingTable({ rows }: { rows: RawRow[] }) {
  const [scope, setScope] = useState<'periodo' | 'mes'>('periodo')
  const months = useMemo(() => buildCollabMonthly(rows), [rows])
  const [selMes, setSelMes] = useState<string>(() => months[months.length - 1]?.key ?? '')

  useEffect(() => {
    if (months.length && !months.some(m => m.key === selMes)) setSelMes(months[months.length - 1].key)
  }, [months, selMes])

  const scopedRows = scope === 'mes' ? rows.filter(r => String(r['MÊS'] ?? '') === selMes) : rows.filter(r => {
    const y = Number(String(r['MÊS'] ?? '').split('-')[1])
    return y >= COLLAB_YEAR_MIN
  })

  const ranking = useMemo(() => buildCollabRanking(scopedRows), [scopedRows])
  const top = ranking.slice(0, 20)

  const cols = '40px 1fr 70px 1fr 1fr 76px'
  const hdrs = ['#', 'Conta', 'Posts', 'Views', 'Interações', 'Engaj']

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <button onClick={() => setScope('periodo')} style={{
          padding: '5px 12px', borderRadius: 999, border: `1.5px solid ${scope === 'periodo' ? COLLAB_BAR : 'var(--line)'}`,
          background: scope === 'periodo' ? COLLAB_BAR : 'var(--surface)', color: scope === 'periodo' ? '#fff' : 'var(--ink-2)',
          fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: scope === 'periodo' ? 700 : 400, cursor: 'pointer',
        }}>Todo o período</button>
        <button onClick={() => setScope('mes')} style={{
          padding: '5px 12px', borderRadius: 999, border: `1.5px solid ${scope === 'mes' ? COLLAB_BAR : 'var(--line)'}`,
          background: scope === 'mes' ? COLLAB_BAR : 'var(--surface)', color: scope === 'mes' ? '#fff' : 'var(--ink-2)',
          fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: scope === 'mes' ? 700 : 400, cursor: 'pointer',
        }}>Mês selecionado</button>
        {scope === 'mes' && (
          <select value={selMes} onChange={e => setSelMes(e.target.value)} style={selectStyle()}>
            {months.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        )}
        <span style={{ fontSize: 11.5, color: 'var(--ink-3)', marginLeft: 4 }}>{ranking.length} contas parceiras</span>
      </div>
      <div className="list">
        <div className="list-row list-head" style={{ gridTemplateColumns: cols }}>
          {hdrs.map(h => <div key={h} className="cell">{h}</div>)}
        </div>
        {top.length === 0
          ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Sem dados para este período</div>
          : top.map((a, i) => (
            <div key={a.conta} className="list-row" style={{ gridTemplateColumns: cols }}>
              <div className="cell" style={{ color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</div>
              <div className="cell" style={{ fontWeight: 600 }}>{a.conta}</div>
              <div className="cell">{a.posts}</div>
              <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(a.views)}</div>
              <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{mFull(a.interacoes)}</div>
              <div className="cell">{mPct(a.engaj)}</div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

function CollabView() {
  const { rows, loading, error } = useCollabPosts()
  const monthly = useMemo(() => buildCollabMonthly(rows), [rows])
  const [selIdx, setSelIdx] = useState(0)
  const [contaFilter, setContaFilter] = useState('')

  useEffect(() => {
    if (monthly.length) setSelIdx(monthly.length - 1)
  }, [monthly.length])

  if (loading) return <div style={{ padding: '64px 32px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Carregando métricas de collab…</div>
  if (error) return <div style={{ padding: '64px 32px', textAlign: 'center', color: 'oklch(0.5 0.16 25)', fontSize: 13 }}>{error}</div>

  const curr = monthly[selIdx]
  const prev = selIdx > 0 ? monthly[selIdx - 1] : null
  const kpiBase = { prevLabel: prev?.label ?? null, noProrate: true }

  const totalPosts = monthly.reduce((s, m) => s + m.posts, 0)
  const totalContas = new Set(rows.map(r => String(r['Nome da conta'] ?? '').trim()).filter(Boolean)).size

  return (
    <div style={{ padding: '0 32px 48px', display: 'flex', flexDirection: 'column', gap: 32 }}>

      <section>
        {curr ? <CollabMonthPicker entries={monthly} selectedIdx={selIdx} onChange={setSelIdx} /> : (
          <div style={{ color: 'var(--ink-3)', fontSize: 13, marginBottom: 14 }}>Sem posts de collab a partir de {COLLAB_YEAR_MIN}.</div>
        )}
        {curr && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            <KpiCard label="Posts Collab"    value={curr.posts}             currRaw={curr.posts}       prevRaw={prev?.posts}       {...kpiBase} sub="publicados" />
            <KpiCard label="Views Collab"    value={mN(curr.views)}         currRaw={curr.views}       prevRaw={prev?.views}       {...kpiBase} />
            <KpiCard label="Criadoras Ativas" value={curr.criadoras}        currRaw={curr.criadoras}   prevRaw={prev?.criadoras}   {...kpiBase} sub="contas parceiras" />
            <KpiCard label="Interações"      value={mN(curr.interacoes)}   currRaw={curr.interacoes}  prevRaw={prev?.interacoes} {...kpiBase} />
            <KpiCard label="Engajamento"     value={mPct(curr.engaj)}      currRaw={curr.engaj}       prevRaw={prev?.engaj}      {...kpiBase} highlight isPct />
          </div>
        )}
        <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-3)' }}>
          {totalContas} contas parceiras diferentes · {totalPosts} posts collab desde {COLLAB_YEAR_MIN}
        </div>
      </section>

      {monthly.length > 0 && (
        <section>
          <SectionHead title="Evolução Mensal" sub={`${monthly[0].label} – ${monthly[monthly.length - 1].label} · Views collab · Engajamento`} />
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '18px 18px 12px' }}>
            <ChartLegend items={[
              { color: COLLAB_BAR, label: 'Views Collab', type: 'bar' },
              { color: COLLAB_LINE, label: 'Engajamento %', type: 'line' },
            ]} />
            <BarLineChart data={monthly as unknown as Record<string, unknown>[]} barKey="views" barColor={COLLAB_BAR}
              lineKey="engaj" lineColor={COLLAB_LINE} height={220} highlightIdx={selIdx} />
          </div>
          <div style={{ marginTop: 12 }}>
            <CollabMonthlyTable data={monthly} selectedIdx={selIdx} />
          </div>
        </section>
      )}

      <section>
        <SectionHead title="Ranking de Criadoras / Contas Parceiras" sub="Top 20 por views · alterne entre todo o período ou o mês selecionado" />
        <CollabRankingTable rows={rows} />
      </section>

      <section>
        <SectionHead title="Posts de Collab" sub="Filtre por nome da conta parceira" />
        <div style={{ marginBottom: 12 }}>
          <FilterField label="Conta">
            <input
              value={contaFilter}
              onChange={e => setContaFilter(e.target.value)}
              placeholder="Buscar por nome da conta…"
              style={{ ...selectStyle(), cursor: 'text', minWidth: 220 }}
            />
          </FilterField>
        </div>
        <IgPostsTable filters={{ ...EMPTY_FILTERS, tipo: 'COLLAB', conta: contaFilter }} />
      </section>
    </div>
  )
}

// ── Posts Tables ──────────────────────────────────────────────────────────────

interface IgPost {
  mes: string
  data: string
  nome_conta: string
  tipo_publicacao: string
  tipo: string
  tema: string
  nicho: string
  interacoes: number | null
  engajamento: string
  visualizacoes: string
  curtidas: number | null
  comentarios: number | null
  salvamentos: number | null
  seguimentos: string
  titulo: string
  link: string
}

interface TtPost {
  mes: string
  data: string
  engajamento: string
  visualizacoes: number | null
  interacoes: number | null
  curtidas: number | null
  comentarios: number | null
  compartilhamentos: number | null
  titulo: string
  link: string
}

const PAGE_SIZE = 100

// TikTok stores numbers as pt-BR text ("10.992" = 10992)
function parsePtBrInt(v: unknown): number | null {
  if (v == null) return null
  const n = parseInt(String(v).replace(/\./g, ''), 10)
  return isNaN(n) ? null : n
}

type RawRow = Record<string, unknown>

function mapIgRow(r: RawRow): IgPost {
  return {
    mes:             String(r['MÊS'] ?? ''),
    data:            String(r['DATA'] ?? ''),
    nome_conta:      String(r['Nome da conta'] ?? ''),
    tipo_publicacao: String(r['Tipo de publicação'] ?? ''),
    tipo:            String(r['TIPO'] ?? ''),
    tema:            String(r['TEMA'] ?? ''),
    nicho:           String(r['NICHO'] ?? ''),
    interacoes:      r['INTERAÇÕES'] != null ? Number(r['INTERAÇÕES']) : null,
    engajamento:     String(r['ENGAJAMENTO'] ?? ''),
    visualizacoes:   String(r['Visualizações'] ?? ''),
    curtidas:        r['Curtidas'] != null ? Number(r['Curtidas']) : null,
    comentarios:     r['Comentários'] != null ? Number(r['Comentários']) : null,
    salvamentos:     r['Salvamentos'] != null ? Number(r['Salvamentos']) : null,
    seguimentos:     String(r['Seguimentos'] ?? ''),
    titulo:          String(r['Descrição'] ?? ''),
    link:            String(r['Link permanente'] ?? ''),
  }
}

function mapTtRow(r: RawRow): TtPost {
  return {
    mes:               String(r['MÊS'] ?? ''),
    data:              String(r['DATA'] ?? ''),
    engajamento:       String(r['ENGAJAMENTO'] ?? ''),
    visualizacoes:     parsePtBrInt(r['Visualizações do vídeo']),
    interacoes:        parsePtBrInt(r['INTERAÇÕES']),
    curtidas:          parsePtBrInt(r['Curtidas']),
    comentarios:       parsePtBrInt(r['Comentários']),
    compartilhamentos: parsePtBrInt(r['Compartilhamentos']),
    titulo:            String(r['Título do vídeo'] ?? ''),
    link:              String(r['Link para o vídeo'] ?? ''),
  }
}

// accessorKey -> nome real da coluna no banco, só para campos onde a ordenação
// no banco é equivalente à ordenação "correta" (datas, texto puro, inteiros reais).
// Campos guardados como texto formatado (percentuais, números com separador de
// milhar) ficam de fora porque ordenar por eles no banco dá resultado errado.
const IG_SORT_DB_COLUMN: Partial<Record<keyof IgPost, string>> = {
  mes: 'MÊS', data: 'DATA', nome_conta: 'Nome da conta', tipo_publicacao: 'Tipo de publicação',
  tipo: 'TIPO', tema: 'TEMA', nicho: 'NICHO', interacoes: 'INTERAÇÕES',
  curtidas: 'Curtidas', comentarios: 'Comentários', salvamentos: 'Salvamentos', titulo: 'Descrição',
}

const TT_SORT_DB_COLUMN: Partial<Record<keyof TtPost, string>> = {
  mes: 'MÊS', data: 'DATA', titulo: 'Título do vídeo',
}

interface SortSpec { id: string; desc: boolean }

function useIgPosts(filters: PostsFilters, sort: SortSpec | null) {
  const [rows, setRows] = useState<IgPost[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { mes, ano, conta, tipoPub, tipo, nicho } = filters

  useEffect(() => { setPage(0) }, [mes, ano, conta, tipoPub, tipo, nicho, sort?.id, sort?.desc])

  useEffect(() => {
    setLoading(true)
    setError(null)
    const sb = createClient()
    let q = sb
      .from('metricas_posts_instagram_gocase')
      .select('*', { count: 'exact' })

    q = applyMesFilter(q, mes, ano)
    if (conta) q = q.ilike('Nome da conta', `%${conta}%`)
    if (tipoPub) q = q.eq('Tipo de publicação', tipoPub)
    if (tipo) q = q.eq('TIPO', tipo)
    if (nicho) q = q.eq('NICHO', nicho)

    const dbCol = sort ? IG_SORT_DB_COLUMN[sort.id as keyof IgPost] : undefined

    q
      .order(dbCol ?? 'DATA', { ascending: dbCol ? !sort!.desc : false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      .then(({ data, count, error: err }) => {
        if (err) { setError(err.message); setLoading(false); return }
        setRows((data as RawRow[] ?? []).map(mapIgRow))
        setTotal(count ?? 0)
        setLoading(false)
      })
  }, [mes, ano, conta, tipoPub, tipo, nicho, page, sort])

  return { rows, total, page, setPage, loading, error }
}

function useTtPosts(filters: PostsFilters, sort: SortSpec | null) {
  const [rows, setRows] = useState<TtPost[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { mes, ano } = filters

  useEffect(() => { setPage(0) }, [mes, ano, sort?.id, sort?.desc])

  useEffect(() => {
    setLoading(true)
    setError(null)
    const sb = createClient()
    let q = sb
      .from('metricas_posts_tiktok_gocase')
      .select('*', { count: 'exact' })

    q = applyMesFilter(q, mes, ano)
    const dbCol = sort ? TT_SORT_DB_COLUMN[sort.id as keyof TtPost] : undefined

    q
      .order(dbCol ?? 'DATA', { ascending: dbCol ? !sort!.desc : false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      .then(({ data, count, error: err }) => {
        if (err) { setError(err.message); setLoading(false); return }
        setRows((data as RawRow[] ?? []).map(mapTtRow))
        setTotal(count ?? 0)
        setLoading(false)
      })
  }, [mes, ano, page, sort])

  return { rows, total, page, setPage, loading, error }
}

function useDistinctValues(table: string, column: string) {
  const [values, setValues] = useState<string[]>([])
  useEffect(() => {
    createClient()
      .from(table)
      .select('*')
      .limit(10000)
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set((data as RawRow[]).map(r => String(r[column] ?? '')))]
            .filter(Boolean)
            .sort()
          setValues(unique)
        }
      })
  }, [table, column])
  return values
}

const MONTH_OPTIONS = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' }, { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' }, { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
]

interface PostsFilters {
  mes: string
  ano: string
  conta: string
  tipoPub: string
  tipo: string
  nicho: string
}

const EMPTY_FILTERS: PostsFilters = { mes: '', ano: '', conta: '', tipoPub: '', tipo: '', nicho: '' }

function applyMesFilter<Q extends { eq: any; like: any }>(q: Q, mes: string, ano: string): Q {
  if (mes && ano) return q.eq('MÊS', `${mes}-${ano}`)
  if (mes) return q.like('MÊS', `${mes}-%`)
  if (ano) return q.like('MÊS', `%-${ano}`)
  return q
}

function PostsPaginator({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  if (totalPages <= 1) return null
  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 999, border: '1.5px solid var(--line)',
    background: 'var(--surface)', color: disabled ? 'var(--ink-4)' : 'var(--ink)',
    fontFamily: 'var(--font-sans)', fontSize: 12, cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
      <button disabled={page === 0} onClick={() => onPage(0)} style={btnStyle(page === 0)}>«</button>
      <button disabled={page === 0} onClick={() => onPage(page - 1)} style={btnStyle(page === 0)}>‹</button>
      <span style={{ fontSize: 12, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
        {page + 1} / {totalPages} · {total.toLocaleString('pt-BR')} registros
      </span>
      <button disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)} style={btnStyle(page >= totalPages - 1)}>›</button>
      <button disabled={page >= totalPages - 1} onClick={() => onPage(totalPages - 1)} style={btnStyle(page >= totalPages - 1)}>»</button>
    </div>
  )
}

function ColumnVisibilityMenu({ table }: { table: ReturnType<typeof useReactTable<any>> }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--line)',
          background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'var(--font-sans)',
          fontSize: 12, cursor: 'pointer',
        }}
      >
        Colunas ▾
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 10,
          background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)',
          padding: 8, minWidth: 160, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', maxHeight: 280, overflowY: 'auto',
        }}>
          {table.getAllLeafColumns().map(col => (
            <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '3px 4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={col.getIsVisible()} onChange={col.getToggleVisibilityHandler()} />
              {String(col.columnDef.header)}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function PostsDataTable<T>({ data, columns, storageKey, sort, onSortChange }: {
  data: T[]; columns: ColumnDef<T, any>[]; storageKey: string
  sort: SortSpec | null; onSortChange: (s: SortSpec | null) => void
}) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setColumnVisibility(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [storageKey])

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(columnVisibility)) } catch { /* ignore */ }
  }, [storageKey, columnVisibility])

  const sorting: SortingState = sort ? [{ id: sort.id, desc: sort.desc }] : []

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility, sorting },
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: updater => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      onSortChange(next.length ? { id: next[0].id, desc: next[0].desc } : null)
    },
    enableMultiSort: false,
    manualSorting: true,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <ColumnVisibilityMenu table={table} />
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
        <table style={{ borderCollapse: 'collapse', width: table.getTotalSize(), tableLayout: 'fixed' }}>
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th
                    key={h.id}
                    style={{
                      position: 'sticky', top: 0, zIndex: 2, background: 'var(--surface-2)',
                      textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--ink-3)',
                      padding: '8px 10px', borderBottom: '1px solid var(--line)', borderRight: '1px solid var(--line)',
                      width: h.getSize(), whiteSpace: 'nowrap',
                    }}
                  >
                    <div
                      onClick={h.column.getToggleSortingHandler()}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4,
                        cursor: h.column.getCanSort() ? 'pointer' : 'default', userSelect: 'none',
                      }}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getCanSort() && (
                        <span style={{ fontSize: 10, opacity: h.column.getIsSorted() ? 1 : 0.35 }}>
                          {h.column.getIsSorted() === 'desc' ? '↓' : h.column.getIsSorted() === 'asc' ? '↑' : '↕'}
                        </span>
                      )}
                    </div>
                    <div
                      onMouseDown={h.getResizeHandler()}
                      onTouchStart={h.getResizeHandler()}
                      style={{
                        position: 'absolute', right: 0, top: 0, height: '100%', width: 5,
                        cursor: 'col-resize', userSelect: 'none', touchAction: 'none',
                        background: h.column.getIsResizing() ? 'var(--accent)' : 'transparent',
                      }}
                    />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 20, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                  Nenhum registro
                </td>
              </tr>
            ) : table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    style={{
                      fontSize: 11, padding: '6px 10px', borderBottom: '1px solid var(--line)',
                      borderRight: '1px solid var(--line)', width: cell.column.getSize(),
                      whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top',
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

const numCell = (v: number | null | undefined) => v?.toLocaleString('pt-BR') ?? '—'

function useIgColumns(): ColumnDef<IgPost, any>[] {
  return useMemo(() => [
    { accessorKey: 'mes', header: 'Mês', size: 70, cell: c => <span style={{ color: 'var(--ink-3)' }}>{c.getValue<string>()}</span> },
    { accessorKey: 'data', header: 'Data', size: 90, cell: c => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{c.getValue<string>()}</span> },
    { accessorKey: 'nome_conta', header: 'Conta', size: 110 },
    { accessorKey: 'tipo_publicacao', header: 'Tipo Pub.', size: 110 },
    { accessorKey: 'tipo', header: 'Tipo', size: 80 },
    { accessorKey: 'tema', header: 'Tema', size: 90 },
    { accessorKey: 'nicho', header: 'Nicho', size: 80 },
    { accessorKey: 'interacoes', header: 'Interações', size: 90, cell: c => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{numCell(c.getValue<number | null>())}</span> },
    { accessorKey: 'engajamento', header: 'Engaj.', size: 80, enableSorting: false },
    { accessorKey: 'visualizacoes', header: 'Visualiz.', size: 90, enableSorting: false, cell: c => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{c.getValue<string>()}</span> },
    { accessorKey: 'curtidas', header: 'Curtidas', size: 80, cell: c => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{numCell(c.getValue<number | null>())}</span> },
    { accessorKey: 'comentarios', header: 'Coment.', size: 80, cell: c => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{numCell(c.getValue<number | null>())}</span> },
    { accessorKey: 'salvamentos', header: 'Salv.', size: 80, cell: c => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{numCell(c.getValue<number | null>())}</span> },
    { accessorKey: 'seguimentos', header: 'Segu.', size: 80, enableSorting: false },
    { accessorKey: 'titulo', header: 'Título', size: 320 },
    {
      accessorKey: 'link', header: 'Link', size: 60, enableSorting: false,
      cell: c => c.getValue<string>()
        ? <a href={c.getValue<string>()} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>↗</a>
        : '—',
    },
  ], [])
}

function useTtColumns(): ColumnDef<TtPost, any>[] {
  return useMemo(() => [
    { accessorKey: 'mes', header: 'Mês', size: 70, cell: c => <span style={{ color: 'var(--ink-3)' }}>{c.getValue<string>()}</span> },
    { accessorKey: 'data', header: 'Data', size: 90, cell: c => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{c.getValue<string>()}</span> },
    { accessorKey: 'engajamento', header: 'Engaj.', size: 80, enableSorting: false },
    { accessorKey: 'visualizacoes', header: 'Visualiz.', size: 90, enableSorting: false, cell: c => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{numCell(c.getValue<number | null>())}</span> },
    { accessorKey: 'interacoes', header: 'Interações', size: 90, enableSorting: false, cell: c => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{numCell(c.getValue<number | null>())}</span> },
    { accessorKey: 'curtidas', header: 'Curtidas', size: 80, enableSorting: false, cell: c => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{numCell(c.getValue<number | null>())}</span> },
    { accessorKey: 'comentarios', header: 'Coment.', size: 80, enableSorting: false, cell: c => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{numCell(c.getValue<number | null>())}</span> },
    { accessorKey: 'compartilhamentos', header: 'Compart.', size: 90, enableSorting: false, cell: c => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{numCell(c.getValue<number | null>())}</span> },
    { accessorKey: 'titulo', header: 'Título', size: 320 },
    {
      accessorKey: 'link', header: 'Link', size: 60, enableSorting: false,
      cell: c => c.getValue<string>()
        ? <a href={c.getValue<string>()} target="_blank" rel="noreferrer" style={{ color: 'oklch(0.52 0.15 232)', textDecoration: 'none' }}>↗</a>
        : '—',
    },
  ], [])
}

function IgPostsTable({ filters }: { filters: PostsFilters }) {
  const [sort, setSort] = useState<SortSpec | null>(null)
  const { rows, total, page, setPage, loading, error } = useIgPosts(filters, sort)
  const columns = useIgColumns()

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Carregando…</div>
  if (error) return <div style={{ padding: '20px', color: 'oklch(0.5 0.16 25)', fontSize: 12, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>Erro: {error}</div>

  return (
    <>
      <PostsDataTable data={rows} columns={columns} storageKey="posts-table-cols-ig" sort={sort} onSortChange={setSort} />
      <PostsPaginator page={page} total={total} onPage={setPage} />
    </>
  )
}

function TtPostsTable({ filters }: { filters: PostsFilters }) {
  const [sort, setSort] = useState<SortSpec | null>(null)
  const { rows, total, page, setPage, loading, error } = useTtPosts(filters, sort)
  const columns = useTtColumns()

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Carregando…</div>
  if (error) return <div style={{ padding: '20px', color: 'oklch(0.5 0.16 25)', fontSize: 12, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>Erro: {error}</div>

  return (
    <>
      <PostsDataTable data={rows} columns={columns} storageKey="posts-table-cols-tt" sort={sort} onSortChange={setSort} />
      <PostsPaginator page={page} total={total} onPage={setPage} />
    </>
  )
}

function selectStyle(): React.CSSProperties {
  return {
    padding: '6px 10px', borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--line)', background: 'var(--surface)',
    color: 'var(--ink)', fontFamily: 'var(--font-sans)', fontSize: 13,
    cursor: 'pointer', outline: 'none',
  }
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <label style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}:</label>
      {children}
    </div>
  )
}

function PostsFiltersBar({ platform, years, tipoPubOptions, tipoOptions, nichoOptions, filters, onChange }: {
  platform: 'ig' | 'tt'
  years: string[]
  tipoPubOptions: string[]
  tipoOptions: string[]
  nichoOptions: string[]
  filters: PostsFilters
  onChange: (f: PostsFilters) => void
}) {
  const set = (patch: Partial<PostsFilters>) => onChange({ ...filters, ...patch })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
      <FilterField label="Mês">
        <select value={filters.mes} onChange={e => set({ mes: e.target.value })} style={selectStyle()}>
          <option value="">Todos</option>
          {MONTH_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </FilterField>
      <FilterField label="Ano">
        <select value={filters.ano} onChange={e => set({ ano: e.target.value })} style={selectStyle()}>
          <option value="">Todos</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </FilterField>
      {platform === 'ig' && (
        <>
          <FilterField label="Conta">
            <input
              type="text" value={filters.conta} placeholder="Buscar conta…"
              onChange={e => set({ conta: e.target.value })}
              style={{ ...selectStyle(), cursor: 'text', minWidth: 160 }}
            />
          </FilterField>
          <FilterField label="Tipo Pub.">
            <select value={filters.tipoPub} onChange={e => set({ tipoPub: e.target.value })} style={selectStyle()}>
              <option value="">Todos</option>
              {tipoPubOptions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </FilterField>
          <FilterField label="Tipo">
            <select value={filters.tipo} onChange={e => set({ tipo: e.target.value })} style={selectStyle()}>
              <option value="">Todos</option>
              {tipoOptions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </FilterField>
          <FilterField label="Nicho">
            <select value={filters.nicho} onChange={e => set({ nicho: e.target.value })} style={selectStyle()}>
              <option value="">Todos</option>
              {nichoOptions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </FilterField>
        </>
      )}
      {(filters.mes || filters.ano || filters.conta || filters.tipoPub || filters.tipo || filters.nicho) && (
        <button
          onClick={() => onChange(EMPTY_FILTERS)}
          style={{ ...selectStyle(), color: 'var(--ink-3)' }}
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}

function PostsView() {
  const [platform, setPlatform] = useState<'ig' | 'tt'>('ig')
  const [filters, setFilters] = useState<PostsFilters>(EMPTY_FILTERS)

  const igMonths = useDistinctValues('metricas_posts_instagram_gocase', 'MÊS')
  const ttMonths = useDistinctValues('metricas_posts_tiktok_gocase', 'MÊS')
  const tipoPubOptions = useDistinctValues('metricas_posts_instagram_gocase', 'Tipo de publicação')
  const tipoOptions = useDistinctValues('metricas_posts_instagram_gocase', 'TIPO')
  const nichoOptions = useDistinctValues('metricas_posts_instagram_gocase', 'NICHO')

  const months = platform === 'ig' ? igMonths : ttMonths
  const years = useMemo(
    () => [...new Set(months.map(m => m.split('-')[1]).filter(Boolean))].sort(),
    [months]
  )

  const subTabs = [
    { id: 'ig' as const, label: 'Instagram', color: 'var(--c-ig-fg)' },
    { id: 'tt' as const, label: 'TikTok',    color: 'oklch(0.52 0.15 232)' },
  ]

  return (
    <div style={{ padding: '0 32px 48px' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {subTabs.map(t => {
          const active = platform === t.id
          return (
            <button key={t.id} onClick={() => { setPlatform(t.id); setFilters(EMPTY_FILTERS) }} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 999,
              border: `1.5px solid ${active ? t.color : 'var(--line)'}`,
              background: active ? `color-mix(in oklab, ${t.color}, white 88%)` : 'var(--surface)',
              color: active ? t.color : 'var(--ink-2)',
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: active ? 600 : 500,
              cursor: 'pointer',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: t.color, display: 'inline-block' }} />
              {t.label}
            </button>
          )
        })}
      </div>
      <PostsFiltersBar
        platform={platform}
        years={years}
        tipoPubOptions={tipoPubOptions}
        tipoOptions={tipoOptions}
        nichoOptions={nichoOptions}
        filters={filters}
        onChange={setFilters}
      />
      {platform === 'ig' && <IgPostsTable filters={filters} />}
      {platform === 'tt' && <TtPostsTable filters={filters} />}
    </div>
  )
}

// ── MetricsView — main entry point ────────────────────────────────────────────

// Aba Collab bloqueada temporariamente: a fonte de dados parou de marcar
// TIPO = 'COLLAB' a partir de nov/2025 (posts recentes caem como INTERNO).
// Religar assim que a planilha/import voltar a classificar collabs corretamente.
const COLLAB_TAB_ENABLED = false

export default function MetricsView() {
  const { data, loading, error } = useMetricsData()
  const [platform, setPlatform] = useState<'ig' | 'tt' | 'collab' | 'posts'>('ig')

  const tabs = [
    { id: 'ig'     as const, label: 'Instagram',     dot: 'var(--c-ig-fg)' },
    { id: 'tt'     as const, label: 'TikTok',         dot: 'var(--c-tt-fg)' },
    ...(COLLAB_TAB_ENABLED ? [{ id: 'collab' as const, label: 'Collab', dot: COLLAB_BAR }] : []),
    { id: 'posts'  as const, label: 'Tabela de Posts', dot: 'var(--ink-3)' },
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
        {data && (platform === 'ig' || platform === 'tt') && (
          <span style={{ fontSize: 12, color: 'var(--ink-3)', background: 'var(--surface-2)', padding: '5px 12px', borderRadius: 999, border: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>
            {data.ano} · Dia {data.dia}/{data.diasNoMes}
          </span>
        )}
      </div>

      {(platform === 'ig' || platform === 'tt') && loading && (
        <div style={{ padding: '64px 32px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
          Carregando métricas…
        </div>
      )}

      {(platform === 'ig' || platform === 'tt') && error && (
        <div style={{ padding: '64px 32px', textAlign: 'center', color: 'oklch(0.5 0.16 25)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {data && platform === 'ig' && <IGView data={data} />}
      {data && platform === 'tt' && <TTView data={data} />}
      {COLLAB_TAB_ENABLED && platform === 'collab' && <CollabView />}
      {platform === 'posts' && <PostsView />}
    </>
  )
}
