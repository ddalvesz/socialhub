'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, LabelList, Cell,
} from 'recharts'
import type { Story, DayAggregate } from '@/lib/types'
import {
  storiesKpis, eficienciaAlcance,
  receitaComparacao, receitaVariacao, engajamentoDiario, correlacaoReceitaAlcance,
  projecaoMes, mediaPorDiaSemana, heatmapTiming, performancePorProduto, produtoColor,
  STORY_STATUS_META, fmtBRL, fmtBRLk, fmtNumk, fmtPct,
} from '@/lib/storiesUtils'
import {
  todayISO, buildMonthGrid, addDaysISO, startOfWeekISO, parseISO,
  MONTHS, WEEKDAYS as CAL_WEEKDAYS, WEEKDAYS_FULL, pad,
} from '@/lib/types'
import CreateStoryModal from './CreateStoryModal'

/* ── Constants ────────────────────────────────────────────── */

type PeriodId = 'week' | 'month' | 90 | 'custom'
const PERIOD_OPTS: { id: PeriodId; label: string }[] = [
  { id: 'week',   label: 'Essa semana' },
  { id: 'month',  label: 'Esse mês'   },
  { id: 90,       label: '90 dias'    },
  { id: 'custom', label: 'Período…'   },
]

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const SLOT_LABELS = ['7h–9h','9h–11h','11h–13h','13h–15h','15h–17h','17h–19h','19h–21h','21h–23h']

const AXIS_COLOR = 'oklch(0.62 0.012 300)'
const GRID_COLOR = 'oklch(0.94 0.01 300)'
const ACCENT     = 'oklch(0.72 0.16 55)'
const CHART_BLUE = 'oklch(0.52 0.16 250)'
const CHART_CYAN = 'oklch(0.62 0.13 215)'

/* ── Sub-components ───────────────────────────────────────── */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8, marginTop: 4 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{title}</span>
      <span style={{ fontSize: 11.5, color: AXIS_COLOR }}>{subtitle}</span>
    </div>
  )
}

function DashCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="live-card" style={{ marginBottom: 20 }}>
      <div className="live-card-head">
        <div>
          <div className="live-card-title">{title}</div>
          {hint && <div style={{ fontSize: 11, color: AXIS_COLOR, marginTop: 2 }}>{hint}</div>}
        </div>
      </div>
      <div className="live-card-body">{children}</div>
    </div>
  )
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="live-kpi">
      <div className="live-kpi-l">{label}</div>
      <div className="live-kpi-v" style={accent ? { color: ACCENT } : {}}>{value}</div>
      <div className="live-kpi-s">{sub}</div>
    </div>
  )
}

function VariacaoBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null
  const pos = delta >= 0
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 999, fontSize: 12, fontWeight: 700,
      background: pos ? 'oklch(0.95 0.04 150)' : 'oklch(0.95 0.04 25)',
      color: pos ? 'oklch(0.42 0.13 150)' : 'oklch(0.5 0.15 25)',
      border: `1px solid ${pos ? 'oklch(0.86 0.08 150)' : 'oklch(0.87 0.09 25)'}`,
    }}>
      {delta >= 0 ? '▲' : '▼'} {fmtPct(Math.abs(delta))}
    </span>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LiveTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="live-tip">
      <div className="live-tip-head">{label}</div>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <div key={i} className="live-tip-row">
          <span className="live-tip-swatch" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="live-tip-val">{typeof p.value === 'number' && p.value > 100 ? fmtBRL(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

function StoryStatusPill({ status }: { status: string }) {
  const meta = STORY_STATUS_META[status]
  if (!meta) return <span>{status}</span>
  const cls = status === 'nao_iniciado' ? 's-st-ni'
    : status === 'em_andamento' ? 's-st-ea'
    : status === 'feito' ? 's-st-feito'
    : status === 'proposta' ? 's-st-post'
    : status === 'postado' ? 's-st-postado'
    : 's-st-np'
  return (
    <span className={`status-pill ${cls}`}>
      <span className="sdot" />
      {meta.label}
    </span>
  )
}

function CopyUtmBtn({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])
  return (
    <button className={`btn-copy-utm ${copied ? 'copied' : ''}`} onClick={handleCopy}>
      {copied ? (
        <>
          <svg viewBox="0 0 16 16" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 8 6.5 12 13 4" />
          </svg>
          Copiado!
        </>
      ) : (
        <>
          <svg viewBox="0 0 16 16" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="5" width="9" height="9" rx="2"/>
            <path d="M11 5V3a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
          </svg>
          Copiar UTM
        </>
      )}
    </button>
  )
}

/* ── Chart 1: Comparação de receita ──────────────────────── */

function ReceitaComparacaoChart({ period, stories }: { period: PeriodId; stories: Story[] }) {
  const today = todayISO()
  const legacyPeriod: import('@/lib/storiesUtils').Period =
    period === 'week' ? '7d' : period === 'month' ? '30d' : period === 90 ? '90d' : '30d'
  const data = useMemo(() => receitaComparacao(stories, legacyPeriod, today), [stories, legacyPeriod, today])
  const delta = useMemo(() => receitaVariacao(data), [data])
  const hasComparacao = period !== 'custom'

  const curTotal  = useMemo(() => data.reduce((s, d) => s + ((d as { atual?: number }).atual  || 0), 0), [data])
  const prevTotal = useMemo(() => data.reduce((s, d) => s + ((d as { anterior?: number }).anterior || 0), 0), [data])

  const title = period === 'week' ? 'Esta semana vs semana passada'
    : period === 'month' ? 'Últimos 30 dias vs 30 anteriores'
    : period === 90 ? 'Últimos 90 dias vs 90 anteriores'
    : 'Receita no período'

  const subtitle = hasComparacao
    ? `${fmtBRLk(curTotal)} no período atual · ${fmtBRLk(prevTotal)} no anterior`
    : `Total: ${fmtBRLk(curTotal)}`

  return (
    <div className="live-card" style={{ marginBottom: 20 }}>
      <div className="live-card-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="live-card-title">{title}</div>
          <div style={{ fontSize: 11.5, color: AXIS_COLOR, marginTop: 3 }}>{subtitle}</div>
        </div>
        {hasComparacao && <VariacaoBadge delta={delta} />}
      </div>
      <div className="live-card-body">
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="atualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={ACCENT} stopOpacity={0.22} />
                <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: AXIS_COLOR }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10.5, fill: AXIS_COLOR }} axisLine={false} tickLine={false} tickFormatter={v => fmtBRLk(v)} width={60} />
            <Tooltip content={<LiveTip />} />
            <Area type="monotone" dataKey="atual" name="Período atual" stroke={ACCENT} strokeWidth={2} fill="url(#atualGrad)" dot={false} activeDot={{ r: 4 }} />
            {hasComparacao && (
              <Line type="monotone" dataKey="anterior" name="Período anterior" stroke={AXIS_COLOR} strokeWidth={1.5} strokeDasharray="4 3" dot={false} activeDot={{ r: 3 }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
        {hasComparacao && (
          <div className="cmp-legend" style={{ display: 'flex', gap: 18, borderTop: `1px dashed ${GRID_COLOR}`, paddingTop: 10, marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: AXIS_COLOR }}>
              <span style={{ display: 'inline-block', width: 18, height: 3, borderRadius: 2, background: ACCENT }} />
              {period === 'week' ? 'Estes 7 dias' : period === 'month' ? 'Estes 30 dias' : 'Período atual'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: AXIS_COLOR }}>
              <span style={{ display: 'inline-block', width: 18, borderTop: `2px dashed ${AXIS_COLOR}` }} />
              Período anterior
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Chart 2: Engajamento diário ──────────────────────────── */

function EngajamentoDiarioChart({ aggregates }: { aggregates: DayAggregate[] }) {
  const data = useMemo(() => engajamentoDiario(aggregates), [aggregates])

  if (aggregates.length === 0) {
    return (
      <DashCard title="Alcance e Visualizações" hint="soma diária dos dados de engajamento da conta">
        <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: AXIS_COLOR, fontSize: 13 }}>
          Sem dados de alcance. Preencha os dados diários para ver este gráfico.
        </div>
      </DashCard>
    )
  }

  return (
    <DashCard title="Alcance e Visualizações" hint="soma diária dos dados de engajamento da conta">
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="alcGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={CHART_BLUE} stopOpacity={0.22} />
              <stop offset="95%" stopColor={CHART_BLUE} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={CHART_CYAN} stopOpacity={0.16} />
              <stop offset="95%" stopColor={CHART_CYAN} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_COLOR} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: AXIS_COLOR }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10.5, fill: AXIS_COLOR }} axisLine={false} tickLine={false} tickFormatter={fmtNumk} width={48} />
          <Tooltip content={<LiveTip />} />
          <Area type="monotone" dataKey="visualizacoes" name="Visualizações" stroke={CHART_CYAN} strokeWidth={1.5} fill="url(#viewGrad)" dot={false} />
          <Area type="monotone" dataKey="alcance" name="Alcance" stroke={CHART_BLUE} strokeWidth={2} fill="url(#alcGrad)" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 18, borderTop: `1px dashed ${GRID_COLOR}`, paddingTop: 10, marginTop: 4 }}>
        {[{ color: CHART_BLUE, label: 'Alcance' }, { color: CHART_CYAN, label: 'Visualizações' }].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: AXIS_COLOR }}>
            <span style={{ display: 'inline-block', width: 18, height: 9, borderRadius: 2, background: l.color + '44', borderTop: `2px solid ${l.color}` }} />
            {l.label}
          </div>
        ))}
      </div>
    </DashCard>
  )
}

/* ── Chart 3: Correlação receita × alcance ────────────────── */

function CorrelacaoChart({ stories, aggregates }: { stories: Story[]; aggregates: DayAggregate[] }) {
  const data = useMemo(() => correlacaoReceitaAlcance(stories, aggregates), [stories, aggregates])
  const barWidth = Math.max(4, Math.min(28, 240 / Math.max(data.length, 1)))

  if (!data.length) return null

  return (
    <DashCard title="Receita vs Alcance" hint="barras = alcance (eixo esq.) · linha = receita via UTM (eixo dir.)">
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 48, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID_COLOR} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: AXIS_COLOR }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis yAxisId="left" tick={{ fontSize: 10, fill: AXIS_COLOR }} axisLine={false} tickLine={false} tickFormatter={fmtNumk} width={48} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: AXIS_COLOR }} axisLine={false} tickLine={false} tickFormatter={fmtBRLk} width={52} />
          <Tooltip content={<LiveTip />} />
          <Bar yAxisId="left" dataKey="alcance" name="Alcance" barSize={barWidth}
            fill={CHART_BLUE} fillOpacity={0.18}
            stroke={CHART_BLUE} strokeWidth={0.5}
            radius={[3, 3, 0, 0]}
          />
          <Line type="monotone" yAxisId="right" dataKey="receita" name="Receita" stroke={ACCENT} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </DashCard>
  )
}

/* ── Chart 4: Projeção do mês ─────────────────────────────── */

function ProjecaoMesCard({ stories, aggregates }: { stories: Story[]; aggregates: DayAggregate[] }) {
  const today = todayISO()
  const proj  = useMemo(() => projecaoMes(stories, aggregates, today), [stories, aggregates, today])
  const [y, m] = today.split('-').map(Number)
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  return (
    <div className="live-card">
      <div className="live-card-head">
        <div className="live-card-title">Projeção do mês</div>
      </div>
      <div className="live-card-body">
        <div className="live-mvp">
          <div className="live-mvp-cur">
            <div className="lbl">{monthNames[m - 1]} <span className="lbl-sub">dia 1 – {proj.dayOfMonth}</span></div>
            <div className="val" style={{ color: ACCENT }}>{fmtBRLk(proj.curRev)}</div>
          </div>
          <div>
            <VariacaoBadge delta={proj.delta} />
            {proj.delta === null && <span style={{ fontSize: 12, color: AXIS_COLOR }}>sem comparativo anterior</span>}
          </div>
          <div className="live-mvp-prev">
            <div className="lbl">Projeção até dia {proj.daysInMonth} <span className="lbl-sub">· ritmo atual</span></div>
            <div className="val">{fmtBRLk(proj.projected)}</div>
          </div>
          <div className="live-mvp-foot">
            Mês anterior mesmo período: {fmtBRLk(proj.prevRev)}
            {proj.alcanceCur > 0 && ` · Alcance: ${fmtNumk(proj.alcanceCur)} vs ${fmtNumk(proj.alcancePrev)} anterior`}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Chart 5: Média por dia da semana ────────────────────── */

function MediaDiaSemana({ stories, aggregates }: { stories: Story[]; aggregates: DayAggregate[] }) {
  const data = useMemo(() => mediaPorDiaSemana(stories, aggregates), [stories, aggregates])

  return (
    <div className="live-card">
      <div className="live-card-head">
        <div className="live-card-title">Média por dia da semana</div>
      </div>
      <div className="live-card-body">
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 4, right: 48, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: AXIS_COLOR }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: AXIS_COLOR }} axisLine={false} tickLine={false} tickFormatter={fmtNumk} width={44} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: AXIS_COLOR }} axisLine={false} tickLine={false} tickFormatter={fmtBRLk} width={52} />
            <Tooltip content={<LiveTip />} />
            <Bar yAxisId="left" dataKey="avgAlcance" name="Alcance médio" fill={CHART_BLUE} fillOpacity={0.20} barSize={30} radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" dataKey="avgReceita" name="Receita média" stroke={ACCENT} strokeWidth={2} dot={{ r: 4, fill: ACCENT }} activeDot={{ r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ── Chart 6: Heatmap timing ─────────────────────────────── */

function HeatmapTiming({ stories }: { stories: Story[] }) {
  const { cells, maxVal } = useMemo(() => heatmapTiming(stories), [stories])
  const [tooltip, setTooltip] = useState<{ slot: number; dow: number; avg: number; count: number } | null>(null)

  function cellColor(avg: number): string {
    if (!maxVal) return 'var(--surface-3)'
    const t = avg / maxVal
    const L = 0.96 - t * 0.34
    const C = 0.02 + t * 0.16
    return `oklch(${L.toFixed(3)} ${C.toFixed(3)} 55)`
  }

  const cellMap = new Map(cells.map(c => [`${c.slot}_${c.dow}`, c]))

  // gradient stops for legend
  const gradStops = Array.from({ length: 10 }, (_, i) => {
    const t = i / 9
    const L = 0.96 - t * 0.34
    const C = 0.02 + t * 0.16
    return `oklch(${L.toFixed(3)} ${C.toFixed(3)} 55) ${(t * 100).toFixed(0)}%`
  }).join(', ')

  return (
    <DashCard title="Timing de postagem">
      <div className="st-heatmap">
        <div className="st-hm-grid">
          <div className="st-hm-corner" />
          {WEEKDAYS.map(d => <div key={d} className="st-hm-day-hdr">{d}</div>)}
          {SLOT_LABELS.map((slot, si) => (
            <React.Fragment key={si}>
              <div className="st-hm-slot-lbl">{slot}</div>
              {WEEKDAYS.map((_, di) => {
                const cell = cellMap.get(`${si}_${di}`)
                return (
                  <div
                    key={`c-${si}-${di}`}
                    className={`st-hm-cell ${cell ? 'has-data' : ''}`}
                    style={{ background: cell ? cellColor(cell.avg) : undefined }}
                    onMouseEnter={() => cell && setTooltip(cell)}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {cell && <span className="st-hm-count">{cell.count}</span>}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
        {tooltip && (
          <div style={{
            fontSize: 12, color: 'var(--ink)', background: 'var(--surface)',
            border: '1px solid var(--line)', borderRadius: 8, padding: '6px 10px',
            boxShadow: '0 4px 12px rgba(40,30,60,.1)', alignSelf: 'flex-start',
          }}>
            <strong>{WEEKDAYS[(tooltip.dow)]} · {SLOT_LABELS[tooltip.slot]}</strong>
            <div>Receita média: {fmtBRL(tooltip.avg)}</div>
            <div>Stories: {tooltip.count}</div>
          </div>
        )}
        <div className="st-hm-legend">
          <span>Menos receita</span>
          <div className="st-hm-legend-bar" style={{ background: `linear-gradient(to right, ${gradStops})` }} />
          <span>Mais receita</span>
        </div>
      </div>
    </DashCard>
  )
}

/* ── Chart 7: Performance por produto ───────────────────── */

function ProdutosChart({ stories }: { stories: Story[] }) {
  const data = useMemo(() => performancePorProduto(stories), [stories])

  if (!data.length) {
    return (
      <DashCard title="Performance por produto foco">
        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: AXIS_COLOR, fontSize: 13 }}>
          Sem receita registrada no período.
        </div>
      </DashCard>
    )
  }

  return (
    <DashCard title="Performance por produto foco">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 16, right: 8, bottom: 48, left: 0 }}>
          <CartesianGrid stroke={GRID_COLOR} vertical={false} />
          <XAxis dataKey="produto" tick={{ fontSize: 10.5, fill: AXIS_COLOR }} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" />
          <YAxis tick={{ fontSize: 10, fill: AXIS_COLOR }} axisLine={false} tickLine={false} tickFormatter={fmtBRLk} width={48} />
          <Tooltip content={<LiveTip />} />
          <Bar dataKey="total" name="Receita total" barSize={32} radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={produtoColor(entry.produto, i)} fillOpacity={0.85} />
            ))}
            <LabelList dataKey="total" position="top" formatter={(v: unknown) => fmtBRLk(Number(v))} style={{ fontSize: 10, fill: 'var(--ink-2)', fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </DashCard>
  )
}

/* ── Stories Table ───────────────────────────────────────── */

const STATUS_FILTERS = [
  { id: 'all',         label: 'Todos os status', dot: AXIS_COLOR },
  { id: 'nao_iniciado', label: 'Não iniciado',   dot: 'oklch(0.72 0.02 300)' },
  { id: 'em_andamento', label: 'Em andamento',   dot: 'oklch(0.72 0.16 55)' },
  { id: 'feito',        label: 'Feito',           dot: 'oklch(0.6 0.13 265)' },
  { id: 'proposta',     label: 'Proposta',        dot: 'oklch(0.6 0.13 150)' },
  { id: 'nao_postado',  label: 'Não postado',     dot: 'oklch(0.5 0.15 25)' },
]

function StoriesTable({ stories, onRowClick }: { stories: Story[]; onRowClick: (s: Story) => void }) {
  const [statusFilt, setStatusFilt] = useState('all')

  const filtered = useMemo(() => {
    const base = statusFilt === 'all' ? stories : stories.filter(s => s.status === statusFilt)
    return base.slice(0, 100)
  }, [stories, statusFilt])

  return (
    <DashCard title="Histórico de stories">
      <div className="st-table-filters">
        {STATUS_FILTERS.map(sf => (
          <button
            key={sf.id}
            className={`platform-pill ${statusFilt === sf.id ? 'active' : ''}`}
            onClick={() => setStatusFilt(sf.id)}
          >
            <span className="st-filter-dot" style={{ background: sf.dot }} />
            {sf.label}
          </button>
        ))}
      </div>
      <div className="st-table-wrap">
        <table className="st-table">
          <thead>
            <tr>
              <th>Data / Hora</th>
              <th>Produto foco</th>
              <th>Categoria</th>
              <th>Status</th>
              <th className="st-td-num">Receita</th>
              <th>UTM</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const [, mm, dd] = s.date.split('-')
              const hh = String(s.hora).padStart(2, '0')
              return (
                <tr key={s.id} className="st-row" style={{ cursor: 'pointer' }} onClick={() => onRowClick(s)}>
                  <td className="st-td">
                    <div className="st-date-cell">
                      <span className="st-day">{dd}/{mm}</span>
                      <span className="st-time">{hh}:00</span>
                    </div>
                  </td>
                  <td className="st-td">
                    <div className="st-produto-cell">
                      <span className="st-dot" style={{ background: produtoColor(s.produto, i) }} />
                      {s.produto || '—'}
                    </div>
                  </td>
                  <td className="st-td">
                    {s.categoria && <span className="st-cat-chip">{s.categoria}</span>}
                  </td>
                  <td className="st-td">
                    <StoryStatusPill status={s.status} />
                  </td>
                  <td className="st-td st-td-num">
                    {s.receita ? (
                      <span className="st-receita">{fmtBRL(s.receita)}</span>
                    ) : (
                      <span className="st-no-rev">—</span>
                    )}
                  </td>
                  <td className="st-td">
                    {s.linkUtm
                      ? <CopyUtmBtn code={s.linkUtm} />
                      : <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>—</span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {stories.length > 100 && (
        <div className="st-table-footer">Exibindo 100 de {stories.length} stories</div>
      )}
    </DashCard>
  )
}

/* ── Story status color map ──────────────────────────────── */

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  nao_iniciado: { bg: 'oklch(0.96 0.01 300)',  border: 'oklch(0.84 0.03 300)',  text: 'oklch(0.50 0.04 300)' },
  em_andamento: { bg: 'oklch(0.97 0.05 70)',   border: 'oklch(0.88 0.10 60)',   text: 'oklch(0.52 0.14 55)'  },
  feito:        { bg: 'oklch(0.93 0.05 265)',  border: 'oklch(0.80 0.10 265)',  text: 'oklch(0.45 0.14 265)' },
  proposta:     { bg: 'oklch(0.94 0.05 150)',  border: 'oklch(0.82 0.09 150)',  text: 'oklch(0.42 0.13 150)' },
  nao_postado:  { bg: 'oklch(0.95 0.05 25)',   border: 'oklch(0.84 0.09 25)',   text: 'oklch(0.50 0.15 25)'  },
  postado:      { bg: 'oklch(0.93 0.05 290)',  border: 'oklch(0.78 0.12 290)',  text: 'oklch(0.42 0.15 290)' },
}

/* ── Stories Calendar — Month view ──────────────────────── */

function StoryChip({ story, onClick }: { story: Story; onClick: () => void }) {
  const col = STATUS_COLORS[story.status] ?? STATUS_COLORS.nao_iniciado
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      style={{
        display: 'flex', alignItems: 'center', gap: 4, width: '100%',
        padding: '2px 5px', borderRadius: 5, border: `1px solid ${col.border}`,
        background: col.bg, cursor: 'pointer', textAlign: 'left', lineHeight: 1.3,
        fontSize: 10.5, fontWeight: 500, color: col.text,
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      }}
      title={`${String(story.hora).padStart(2,'0')}:00 · ${story.produto || '—'}`}
    >
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, flexShrink: 0, opacity: 0.75 }}>
        {String(story.hora).padStart(2,'0')}h
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
        {story.produto || '—'}
      </span>
    </button>
  )
}

function StoriesMonthView({ year, month, stories, onStoryClick, onNewStory }: {
  year: number; month: number; stories: Story[]
  onStoryClick: (s: Story) => void
  onNewStory: (date: string) => void
}) {
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month])
  const today = todayISO()
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  const byDay = useMemo(() => {
    const map: Record<string, Story[]> = {}
    stories.forEach(s => { (map[s.date] = map[s.date] || []).push(s) })
    Object.values(map).forEach(arr => arr.sort((a, b) => a.hora - b.hora))
    return map
  }, [stories])

  const MAX_VISIBLE = 3

  return (
    <div className="cal-grid">
      {CAL_WEEKDAYS.map(w => <div key={w} className="cal-head">{w}</div>)}
      {cells.map((c, i) => {
        const isToday = c.iso === today
        const dayStories = byDay[c.iso] || []
        const visible = dayStories.slice(0, MAX_VISIBLE)
        const more = dayStories.length - visible.length
        return (
          <div
            key={i}
            className={`cal-cell ${c.other ? 'other' : ''} ${isToday ? 'today' : ''}`}
            style={{ position: 'relative' }}
            onClick={() => !c.other && onNewStory(c.iso)}
          >
            <div className="cal-num-row">
              <span className="cal-num-box">{c.day}</span>
            </div>
            {visible.map(s => (
              <div key={s.id} onClick={e => e.stopPropagation()} style={{ marginBottom: 2 }}>
                <StoryChip story={s} onClick={() => onStoryClick(s)} />
              </div>
            ))}
            {more > 0 && (
              <div
                className="cal-more"
                style={{ cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); setExpandedDay(c.iso === expandedDay ? null : c.iso) }}
              >
                +{more} mais
              </div>
            )}
            {expandedDay === c.iso && (
              <div
                style={{
                  position: 'absolute', zIndex: 50, top: '100%', left: 0,
                  background: 'var(--surface)', border: '1px solid var(--line)',
                  borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                  padding: '10px 8px', minWidth: 220, display: 'flex', flexDirection: 'column', gap: 4,
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', padding: '0 4px 4px' }}>
                  {c.day}/{month + 1} — {dayStories.length} stories
                </div>
                {dayStories.map(s => (
                  <StoryChip key={s.id} story={s} onClick={() => { onStoryClick(s); setExpandedDay(null) }} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Stories Calendar — Week view ────────────────────────── */

const WEEK_START_HOUR = 6
const WEEK_END_HOUR = 24
const HOUR_HEIGHT = 56

function StoriesWeekView({ weekStart, stories, onStoryClick }: {
  weekStart: string; stories: Story[]
  onStoryClick: (s: Story) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i))
  const hours = Array.from({ length: WEEK_END_HOUR - WEEK_START_HOUR }, (_, i) => WEEK_START_HOUR + i)
  const today = todayISO()

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowOffset = ((nowMinutes / 60) - WEEK_START_HOUR) * HOUR_HEIGHT

  const byDay = useMemo(() => {
    const map: Record<string, Story[]> = {}
    days.forEach(d => { map[d] = [] })
    stories.forEach(s => { if (map[s.date] !== undefined) map[s.date].push(s) })
    return map
  }, [stories, weekStart])

  return (
    <div className="week-grid">
      <div className="week-head">
        <div className="week-tz">GMT-3</div>
        {days.map(d => {
          const dt = parseISO(d)
          const isToday = d === today
          return (
            <div key={d} className={`week-day-head ${isToday ? 'today' : ''}`}>
              <div className="wdh-dow">{WEEKDAYS_FULL[dt.getDay()]}</div>
              <div className="wdh-num">{dt.getDate()}</div>
            </div>
          )
        })}
      </div>
      <div className="week-body" style={{ '--hour-h': `${HOUR_HEIGHT}px` } as React.CSSProperties}>
        <div className="week-time-col">
          {hours.map(h => (
            <div key={h} className="week-time-cell">
              {h === WEEK_START_HOUR ? '' : `${pad(h)}:00`}
            </div>
          ))}
        </div>
        {days.map(d => {
          const isToday = d === today
          const dayStories = byDay[d] || []
          return (
            <div key={d} className={`week-day-col ${isToday ? 'today' : ''}`}>
              {hours.map(h => <div key={h} className="week-hour-cell" />)}
              {isToday && nowOffset >= 0 && (
                <div className="week-now-line" style={{ top: `${nowOffset}px` }} />
              )}
              {dayStories.map(s => {
                const top = (s.hora - WEEK_START_HOUR) * HOUR_HEIGHT
                if (top < 0) return null
                const col = STATUS_COLORS[s.status] ?? STATUS_COLORS.nao_iniciado
                return (
                  <button
                    key={s.id}
                    onClick={() => onStoryClick(s)}
                    style={{
                      position: 'absolute', top: `${top}px`, height: 62,
                      left: 3, right: 3,
                      background: col.bg, border: `1.5px solid ${col.border}`,
                      borderRadius: 8, padding: '4px 7px', cursor: 'pointer',
                      textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2,
                      overflow: 'hidden',
                    }}
                    title={`${pad(s.hora)}:00 · ${s.produto || '—'}`}
                  >
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: col.text, opacity: 0.8 }}>
                      {pad(s.hora)}:00
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: col.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.produto || '—'}
                    </div>
                    {s.categoria && (
                      <div style={{ fontSize: 10, color: col.text, opacity: 0.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.categoria}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Stories Calendar — List view ────────────────────────── */

function StoriesListView({ year, month, stories, onStoryClick }: {
  year: number; month: number; stories: Story[]
  onStoryClick: (s: Story) => void
}) {
  const today = todayISO()
  const monthStories = stories
    .filter(s => {
      const [y, m] = s.date.split('-').map(Number)
      return y === year && m - 1 === month
    })
    .sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.hora - b.hora)

  const grouped: [string, Story[]][] = []
  for (const s of monthStories) {
    const last = grouped[grouped.length - 1]
    if (last && last[0] === s.date) last[1].push(s)
    else grouped.push([s.date, [s]])
  }

  if (!grouped.length) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--ink-3)' }}>
        Nenhum story neste mês.
      </div>
    )
  }

  const weekdayShort = (iso: string) => {
    const d = parseISO(iso)
    return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()]
  }

  return (
    <div className="pautas-view" style={{ paddingTop: 16 }}>
      {grouped.map(([date, dayStories]) => {
        const isToday = date === today
        const isPast = date < today
        const [, mm, dd] = date.split('-')
        return (
          <div key={date} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', paddingBottom: 2 }}>
            <div style={{
              width: 64, flexShrink: 0, paddingTop: 10, textAlign: 'right',
              fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.3,
              color: isToday ? 'var(--accent)' : isPast ? 'var(--ink-3)' : 'var(--ink-2)',
              fontWeight: isToday ? 700 : 500,
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{dd}</div>
              <div style={{ fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{weekdayShort(date)}/{mm}</div>
              {isToday && <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2, fontWeight: 700 }}>hoje</div>}
            </div>
            <div style={{ flex: 1, borderLeft: `2px solid ${isToday ? 'var(--accent-soft)' : 'var(--border)'}`, paddingLeft: 16, paddingTop: 8, paddingBottom: 8 }}>
              {dayStories.map(s => {
                const col = STATUS_COLORS[s.status] ?? STATUS_COLORS.nao_iniciado
                const meta = STORY_STATUS_META[s.status]
                return (
                  <div
                    key={s.id}
                    onClick={() => onStoryClick(s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', marginBottom: 4,
                      borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)',
                      cursor: 'pointer', transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = col.bg }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)' }}
                  >
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-3)', width: 40, flexShrink: 0 }}>
                      {pad(s.hora)}:00
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.produto || '—'}
                      </div>
                      {s.categoria && (
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{s.categoria}</div>
                      )}
                    </div>
                    {s.receita != null && (
                      <div style={{ fontSize: 12, fontWeight: 600, color: ACCENT, flexShrink: 0 }}>
                        {fmtBRL(s.receita)}
                      </div>
                    )}
                    <span className={`status-pill ${
                      s.status === 'nao_iniciado' ? 's-st-ni'
                      : s.status === 'em_andamento' ? 's-st-ea'
                      : s.status === 'feito' ? 's-st-feito'
                      : s.status === 'proposta' ? 's-st-post'
                      : s.status === 'postado' ? 's-st-postado'
                      : 's-st-np'
                    }`} style={{ flexShrink: 0 }}>
                      <span className="sdot" />{meta?.label ?? s.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Main StoriesView ────────────────────────────────────── */

interface Props {
  stories: Story[]
  dayAggregates: DayAggregate[]
  onStoryCreated: (s: Story) => void
  onStoryUpdated: (s: Story) => void
  onStoryClick: (s: Story) => void
}

export default function StoriesView({ stories, dayAggregates, onStoryCreated, onStoryClick }: Props) {
  const today = todayISO()
  const todayDate = parseISO(today)
  const [viewMode, setViewMode] = useState<'analytics' | 'calendar'>('analytics')
  const [calMode, setCalMode] = useState<'month' | 'week' | 'list'>('month')
  const [year, setYear] = useState(todayDate.getFullYear())
  const [month, setMonth] = useState(todayDate.getMonth())
  const [weekStart, setWeekStart] = useState(() => startOfWeekISO(today))

  const goPrev = () => {
    if (calMode === 'week') { setWeekStart(w => addDaysISO(w, -7)); return }
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  const goNext = () => {
    if (calMode === 'week') { setWeekStart(w => addDaysISO(w, 7)); return }
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
  }
  const goToday = () => {
    const t = parseISO(today)
    setYear(t.getFullYear()); setMonth(t.getMonth())
    setWeekStart(startOfWeekISO(today))
  }

  const navLabel = calMode === 'week' ? (() => {
    const s = parseISO(weekStart)
    const e = parseISO(addDaysISO(weekStart, 6))
    if (s.getMonth() === e.getMonth())
      return `${s.getDate()} – ${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`
    return `${s.getDate()} ${MONTHS[s.getMonth()].slice(0,3)} – ${e.getDate()} ${MONTHS[e.getMonth()].slice(0,3)} ${e.getFullYear()}`
  })() : `${MONTHS[month]} ${year}`

  const [period, setPeriod] = useState<PeriodId>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const filteredStories = useMemo(() => {
    if (period === 'custom') {
      const from = customFrom
      const to   = customTo || today
      return stories.filter(s => (!from || s.date >= from) && s.date <= to)
    }
    if (period === 'week') {
      const d = new Date(today + 'T00:00:00')
      const dow = d.getDay()
      const monday = new Date(d); monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
      const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
      const from = monday.toISOString().slice(0, 10)
      const to   = sunday.toISOString().slice(0, 10)
      return stories.filter(s => s.date >= from && s.date <= to)
    }
    if (period === 'month') {
      const from = today.slice(0, 7) + '-01'
      return stories.filter(s => s.date >= from && s.date <= today)
    }
    // 90 days
    const cutoff = new Date(today + 'T00:00:00')
    cutoff.setDate(cutoff.getDate() - 90)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    return stories.filter(s => s.date >= cutoffStr && s.date <= today)
  }, [stories, period, today, customFrom, customTo])

  const filteredAggregates = useMemo(() => {
    if (period === 'custom') {
      const from = customFrom
      const to   = customTo || today
      return dayAggregates.filter(d => (!from || d.date >= from) && d.date <= to)
    }
    if (period === 'week') {
      const d = new Date(today + 'T00:00:00')
      const dow = d.getDay()
      const monday = new Date(d); monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
      const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
      const from = monday.toISOString().slice(0, 10)
      const to   = sunday.toISOString().slice(0, 10)
      return dayAggregates.filter(d => d.date >= from && d.date <= to)
    }
    if (period === 'month') {
      const from = today.slice(0, 7) + '-01'
      return dayAggregates.filter(d => d.date >= from && d.date <= today)
    }
    const cutoff = new Date(today + 'T00:00:00')
    cutoff.setDate(cutoff.getDate() - 90)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    return dayAggregates.filter(d => d.date >= cutoffStr && d.date <= today)
  }, [dayAggregates, period, today, customFrom, customTo])

  const kpis = useMemo(
    () => storiesKpis(filteredStories, filteredAggregates),
    [filteredStories, filteredAggregates]
  )

  const eficiencia = useMemo(
    () => eficienciaAlcance(kpis.receitaTotal, kpis.alcanceTotal),
    [kpis.receitaTotal, kpis.alcanceTotal]
  )

  const periodHint = period === 'week' ? 'essa semana'
    : period === 'month' ? 'esse mês'
    : period === 'custom' ? `${customFrom || '?'} → ${customTo || 'hoje'}`
    : 'últimos 90 dias'

  return (
    <div className="lives-wrap">
      {/* Top bar */}
      <div className="lives-period-bar">
        {/* Análise / Calendário toggle */}
        <div className="view-toggle">
          <button className={viewMode === 'analytics' ? 'active' : ''} onClick={() => setViewMode('analytics')}>
            Análise
          </button>
          <button className={viewMode === 'calendar' ? 'active' : ''} onClick={() => setViewMode('calendar')}>
            Calendário
          </button>
        </div>

        {/* Calendar toolbar */}
        {viewMode === 'calendar' && (
          <>
            <div className="month-nav" style={{ marginLeft: 8 }}>
              <button onClick={goPrev}>‹</button>
              <div className="label">{navLabel}</div>
              <button onClick={goNext}>›</button>
            </div>
            <button className="today-btn" onClick={goToday}>Hoje</button>
            <div className="view-toggle" style={{ marginLeft: 4 }}>
              <button className={calMode === 'month' ? 'active' : ''} onClick={() => setCalMode('month')}>Mês</button>
              <button className={calMode === 'week'  ? 'active' : ''} onClick={() => setCalMode('week')}>Semana</button>
              <button className={calMode === 'list'  ? 'active' : ''} onClick={() => setCalMode('list')}>Lista</button>
            </div>
          </>
        )}

        {/* Analytics period filter */}
        {viewMode === 'analytics' && (
          <>
            <div className="view-toggle">
              {PERIOD_OPTS.map(opt => (
                <button
                  key={String(opt.id)}
                  className={period === opt.id ? 'active' : ''}
                  onClick={() => setPeriod(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {period === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="date" className="field" style={{ fontSize: 12, padding: '3px 8px', width: 130 }}
                  value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>até</span>
                <input type="date" className="field" style={{ fontSize: 12, padding: '3px 8px', width: 130 }}
                  value={customTo} onChange={e => setCustomTo(e.target.value)} />
              </div>
            )}
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
              {kpis.count} stor{kpis.count === 1 ? 'y' : 'ies'} no período
            </div>
          </>
        )}

        <div style={{ flex: 1 }} />
        <button className="btn btn-accent" style={{ fontSize: 13, padding: '8px 14px' }} onClick={() => setCreateOpen(true)}>
          <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" />
          </svg>
          Novo story
        </button>
      </div>

      {/* ── Calendar view ── */}
      {viewMode === 'calendar' && calMode !== 'list' && (
        <div className="cal-wrap">
          {calMode === 'month' ? (
            <StoriesMonthView
              year={year}
              month={month}
              stories={stories}
              onStoryClick={onStoryClick}
              onNewStory={() => setCreateOpen(true)}
            />
          ) : (
            <StoriesWeekView
              weekStart={weekStart}
              stories={stories}
              onStoryClick={onStoryClick}
            />
          )}
        </div>
      )}
      {viewMode === 'calendar' && calMode === 'list' && (
        <StoriesListView
          year={year}
          month={month}
          stories={stories}
          onStoryClick={onStoryClick}
        />
      )}

      {/* ── Analytics view ── */}
      {viewMode === 'analytics' && (
        <>
          {/* KPI strip */}
          <div className="lives-kpis" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
            <KpiCard
              label="Receita rastreada"
              value={fmtBRLk(kpis.receitaTotal)}
              sub={`${kpis.countComUtm} stories com UTM postados`}
              accent
            />
            <KpiCard
              label="Alcance total"
              value={fmtNumk(kpis.alcanceTotal)}
              sub="soma dos dias no período"
            />
            <KpiCard
              label="Visualizações"
              value={fmtNumk(kpis.viewsTotal)}
              sub="total de views dos stories"
            />
            <KpiCard
              label="Stories criados"
              value={String(kpis.count)}
              sub={`postados no período`}
            />
          </div>

          {eficiencia !== null && (
            <div className="lives-kpis-secondary" style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: AXIS_COLOR, textTransform: 'uppercase' }}>Eficiência</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                R$ {eficiencia.toFixed(2).replace('.', ',')} por 1k de alcance
              </span>
            </div>
          )}

          <SectionHeader title="Comparação de receita" subtitle="receita rastreada via UTM · período atual vs anterior" />
          <ReceitaComparacaoChart period={period} stories={filteredStories} />

          <SectionHeader title="Engajamento diário" subtitle="dados por dia · não vinculados a stories específicos após 24h" />
          <EngajamentoDiarioChart aggregates={filteredAggregates} />

          <SectionHeader title="Correlação receita × alcance" subtitle="a receita acompanha o alcance neste período?" />
          <CorrelacaoChart stories={filteredStories} aggregates={filteredAggregates} />

          <SectionHeader title="Análise do mês corrente" subtitle="projeção baseada no ritmo atual · médias por dia da semana" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <ProjecaoMesCard stories={stories} aggregates={dayAggregates} />
            <MediaDiaSemana stories={filteredStories} aggregates={filteredAggregates} />
          </div>

          <HeatmapTiming stories={filteredStories} />
          <ProdutosChart stories={filteredStories} />
          <StoriesTable stories={filteredStories} onRowClick={onStoryClick} />
        </>
      )}

      {/* Create modal */}
      {createOpen && (
        <CreateStoryModal
          onClose={() => setCreateOpen(false)}
          onSaved={story => {
            onStoryCreated(story)
            setCreateOpen(false)
          }}
        />
      )}
    </div>
  )
}
