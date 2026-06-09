'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LabelList,
  ScatterChart, Scatter, ZAxis, ReferenceLine,
  AreaChart, Area,
} from 'recharts'
import type { Live, Merchan } from '@/lib/types'
import { LIVE_STATUSES, LIVE_STATUS_BY_ID } from '@/lib/types'
import {
  fmtBRL, fmtBRLk, fmtPct, inPeriod,
  liveKpis, perMerchanMetrics, weeklyTrend, heatmapMatrix, monthVsPrev,
  WEEKDAY_LABELS,
} from '@/lib/livesUtils'
import { todayISO } from '@/lib/types'
import { Icon } from './Icons'

// ─── Chart palette ───────────────────────────────────────────

const LIVES_AXIS       = 'oklch(0.62 0.012 300)'
const LIVES_GRID       = 'oklch(0.94 0.01 300)'
const LIVES_INK        = 'oklch(0.22 0.02 300)'
const LIVES_ACCENT     = 'oklch(0.72 0.16 55)'
const LIVES_ACCENT_DEEP = 'oklch(0.62 0.18 50)'

const PERIODS = [
  { id: 7      as number | 'all' | 'custom', label: '7 dias'       },
  { id: 30     as number | 'all' | 'custom', label: '30 dias'      },
  { id: 90     as number | 'all' | 'custom', label: '90 dias'      },
  { id: 365    as number | 'all' | 'custom', label: '12 meses'     },
  { id: 'all'  as number | 'all' | 'custom', label: 'Tudo'         },
  { id: 'custom' as number | 'all' | 'custom', label: 'Período…'  },
]

// ─── Tooltips ────────────────────────────────────────────────

function MerchanTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="live-tip">
      <div className="live-tip-name">
        <span className="dot" style={{ background: d.color }} />{d.name}
      </div>
      <div className="live-tip-row"><span>Receita média / cupom</span><strong>{fmtBRL(d.avg)}</strong></div>
      <div className="live-tip-row"><span>Total no período</span><strong>{fmtBRL(d.total)}</strong></div>
      <div className="live-tip-row"><span>Observações</span><strong>{d.count}</strong></div>
      <div className="live-tip-row"><span>Como cupom 1</span><strong>{fmtPct(d.slot1Pct)}</strong></div>
      {(d.forte || d.sempreSozinho) && (
        <div className="live-tip-tags">
          {d.forte && <span className="merchan-flag-tag forte">forte</span>}
          {d.sempreSozinho && <span className="merchan-flag-tag solo">só sozinho</span>}
        </div>
      )}
    </div>
  )
}

function WeekTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="live-tip">
      <div className="live-tip-name">Semana {label}</div>
      <div className="live-tip-row"><span>Receita</span><strong>{fmtBRL(d.total)}</strong></div>
      <div className="live-tip-row"><span>Lives</span><strong>{d.count}</strong></div>
      <div className="live-tip-row"><span>Média</span><strong>{fmtBRL(d.count > 0 ? d.total / d.count : 0)}</strong></div>
    </div>
  )
}

// ─── KpiCard + DashCard ──────────────────────────────────────

function KpiCard({ label, value, sub, accent, dim }: { label: string; value: string; sub?: string; accent?: string; dim?: boolean }) {
  return (
    <div className={`live-kpi ${dim ? 'dim' : ''}`}>
      <div className="live-kpi-l">{label}</div>
      <div className="live-kpi-v" style={accent ? { color: accent } : undefined}>{value}</div>
      {sub && <div className="live-kpi-s">{sub}</div>}
    </div>
  )
}

function DashCard({ title, hint, action, children, full, className }: {
  title?: string; hint?: string; action?: React.ReactNode; children: React.ReactNode; full?: boolean; className?: string
}) {
  return (
    <div className={`live-card ${full ? 'full' : ''} ${className || ''}`}>
      {(title || action) && (
        <div className="live-card-head">
          <div style={{ minWidth: 0, flex: 1 }}>
            {title && <div className="live-card-title">{title}</div>}
            {hint && <div className="live-card-hint">{hint}</div>}
          </div>
          {action}
        </div>
      )}
      <div className="live-card-body">{children}</div>
    </div>
  )
}

// ─── PropostaPanel ───────────────────────────────────────────

function PropostaPanel({ propostas, merchans, onApprove, onApproveAll, onDiscard, onEdit, onGenerate, generating }: {
  propostas: Live[]
  merchans: Merchan[]
  onApprove: (l: Live) => void
  onApproveAll: () => void
  onDiscard: (l: Live) => void
  onEdit: (l: Live) => void
  onGenerate: () => void
  generating: boolean
}) {
  const byDate = [...propostas].sort((a, b) => a.date.localeCompare(b.date))
  const pendentes = byDate.filter(p => p.status === 'proposta').length

  if (propostas.length === 0) {
    return (
      <div className="proposta-panel">
        <div className="proposta-head">
          <div>
            <div className="proposta-title">
              <span className="proposta-badge">📅 proposta</span>
              Proposta da próxima semana
            </div>
            <div className="proposta-sub">Nenhuma proposta ainda — gere a da próxima semana.</div>
          </div>
          <button className="btn btn-accent" onClick={onGenerate} disabled={generating}>
            {generating ? 'Gerando…' : '⚡ Gerar proposta da semana'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="proposta-panel">
      <div className="proposta-head">
        <div>
          <div className="proposta-title">
            <span className="proposta-badge">🤖 skill</span>
            Proposta da próxima semana
          </div>
          <div className="proposta-sub">
            {pendentes > 0
              ? <><strong>{pendentes}</strong> dia{pendentes === 1 ? '' : 's'} aguardando sua aprovação · {byDate.length - pendentes} já confirmado{byDate.length - pendentes === 1 ? '' : 's'}</>
              : 'Todos os dias confirmados.'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onGenerate} disabled={generating}>
            {generating ? 'Gerando…' : '↺ Regerar'}
          </button>
          {pendentes > 0 && (
            <button className="btn btn-accent" onClick={onApproveAll}>
              <Icon.check /> Aprovar tudo
            </button>
          )}
        </div>
      </div>
      <div className="proposta-grid">
        {byDate.map(p => {
          const d = new Date(p.date + 'T00:00:00')
          const m1 = merchans.find(m => m.nome === p.merchan1)
          const m2 = merchans.find(m => m.nome === p.merchan2)
          const confirmed = p.status === 'confirmada'
          return (
            <div key={p.id} className={`proposta-day ${confirmed ? 'confirmed' : ''}`} onClick={() => onEdit(p)}>
              <div className="proposta-day-head">
                <div className="proposta-day-date">
                  <span className="num">{d.getDate()}</span>
                  <span className="dow">{WEEKDAY_LABELS[d.getDay()]}</span>
                </div>
                {confirmed
                  ? <span className="status-pill s-conf"><span className="sdot" />confirmada</span>
                  : <span className="status-pill s-prop"><span className="sdot" />proposta</span>}
              </div>
              <div className="proposta-cupom proposta-cupom-1">
                {m1 && <span className="dot" style={{ background: m1.color }} />}
                <div className="cm-text">
                  <div className="cm-merchan" title={p.merchan1}>{m1?.short || p.merchan1}</div>
                  <div className="cm-nominal">{p.nominal1}</div>
                </div>
              </div>
              {m2 && (
                <div className="proposta-cupom proposta-cupom-2">
                  <span className="dot" style={{ background: m2.color }} />
                  <div className="cm-text">
                    <div className="cm-merchan" title={p.merchan2}>{m2?.short || p.merchan2}</div>
                    <div className="cm-nominal">{p.nominal2}</div>
                  </div>
                </div>
              )}
              <div className="proposta-actions" onClick={e => e.stopPropagation()}>
                {!confirmed && (
                  <button className="btn btn-mini btn-accent" onClick={() => onApprove(p)}>
                    <Icon.check /> aprovar
                  </button>
                )}
                <button className="btn btn-mini btn-ghost danger" onClick={() => onDiscard(p)}>
                  descartar
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── MerchanBars ─────────────────────────────────────────────

function MerchanBars({ data }: { data: ReturnType<typeof perMerchanMetrics> }) {
  const chartData = data.map(d => ({ ...d, yLabel: d.short }))
  const height = Math.max(180, 28 + data.length * 36)
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 80, left: 8, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke={LIVES_GRID} />
          <XAxis type="number" tickFormatter={fmtBRLk} stroke={LIVES_AXIS} tick={{ fontSize: 11, fill: LIVES_AXIS }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="yLabel" stroke={LIVES_AXIS} tick={{ fontSize: 11.5, fill: LIVES_INK, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} width={92} />
          <Tooltip content={<MerchanTooltip />} cursor={{ fill: 'oklch(0.985 0.012 300)' }} />
          <Bar dataKey="avg" radius={[0, 6, 6, 0]} barSize={18}>
            {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
            <LabelList dataKey="avg" position="right" formatter={(v: unknown) => fmtBRLk(Number(v))} style={{ fontSize: 10.5, fill: LIVES_INK, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── MerchanScatter ──────────────────────────────────────────

function MerchanScatter({ data }: { data: ReturnType<typeof perMerchanMetrics> }) {
  const counts = data.map(d => d.count).sort((a, b) => a - b)
  const avgs   = data.map(d => d.avg).sort((a, b) => a - b)
  const medCount = counts[Math.floor(counts.length / 2)] || 0
  const medAvg   = avgs[Math.floor(avgs.length / 2)] || 0
  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 16, right: 32, left: 8, bottom: 38 }}>
          <CartesianGrid stroke={LIVES_GRID} />
          <XAxis type="number" dataKey="count" name="Uso (cupons no período)" stroke={LIVES_AXIS} tick={{ fontSize: 11, fill: LIVES_AXIS }} axisLine={false} tickLine={false}
            label={{ value: 'Uso (vezes que apareceu) →', position: 'insideBottom', offset: -8, fill: LIVES_AXIS, fontSize: 11 }} />
          <YAxis type="number" dataKey="avg" name="Receita média" stroke={LIVES_AXIS} tick={{ fontSize: 11, fill: LIVES_AXIS }} tickFormatter={fmtBRLk} axisLine={false} tickLine={false} width={70}
            label={{ value: 'R$ médio', angle: -90, position: 'insideLeft', offset: 16, fill: LIVES_AXIS, fontSize: 11 }} />
          <ZAxis dataKey="total" range={[80, 480]} />
          <ReferenceLine x={medCount} stroke={LIVES_GRID} strokeDasharray="3 3" />
          <ReferenceLine y={medAvg} stroke={LIVES_GRID} strokeDasharray="3 3" />
          <Tooltip content={<MerchanTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={data}>
            {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} stroke={d.color} />)}
            <LabelList dataKey="short" position="top" offset={8} style={{ fontSize: 9.5, fill: LIVES_INK, fontFamily: 'var(--font-mono)', fontWeight: 600 }} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── WeeklyTrend ─────────────────────────────────────────────

function WeeklyTrend({ data }: { data: ReturnType<typeof weeklyTrend> }) {
  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 24, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="liveAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={LIVES_ACCENT} stopOpacity={0.28} />
              <stop offset="95%" stopColor={LIVES_ACCENT} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={LIVES_GRID} vertical={false} />
          <XAxis dataKey="label" stroke={LIVES_AXIS} tick={{ fontSize: 11, fill: LIVES_AXIS }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={32} />
          <YAxis stroke={LIVES_AXIS} tick={{ fontSize: 11, fill: LIVES_AXIS }} tickFormatter={fmtBRLk} axisLine={false} tickLine={false} width={64} />
          <Tooltip content={<WeekTooltip />} cursor={{ stroke: LIVES_ACCENT_DEEP, strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Area type="monotone" dataKey="total" stroke={LIVES_ACCENT_DEEP} strokeWidth={2} fill="url(#liveAreaGrad)" dot={false} activeDot={{ r: 5, fill: LIVES_ACCENT_DEEP }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── MonthVsPrev ─────────────────────────────────────────────

function MonthVsPrev({ mvp, today }: { mvp: ReturnType<typeof monthVsPrev>; today: string }) {
  const todayDate = new Date(today + 'T00:00:00')
  const monthNames = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  const curMonth  = monthNames[todayDate.getMonth()]
  const prevMonth = monthNames[(todayDate.getMonth() + 11) % 12]
  const hasComp   = mvp.prev > 0
  const up        = mvp.delta >= 0
  const absDiff   = Math.abs(mvp.diff)
  return (
    <div className="live-mvp">
      <div className="live-mvp-cur">
        <div className="lbl">{curMonth} · 1–{mvp.dayOfMonth}</div>
        <div className="val">{fmtBRLk(mvp.cur)}</div>
      </div>
      {hasComp ? (
        <div className={`live-mvp-delta ${up ? 'up' : 'down'}`}>{up ? '▲' : '▼'} {Math.abs(mvp.delta * 100).toFixed(0)}%</div>
      ) : (
        <div className="live-mvp-delta neutral">—</div>
      )}
      <div className="live-mvp-prev">
        <div className="lbl">{prevMonth} · 1–{mvp.endDayPrev} <span className="lbl-sub">(mesmo período)</span></div>
        <div className="val">{hasComp ? fmtBRLk(mvp.prev) : '—'}</div>
      </div>
      <div className="live-mvp-foot">
        {hasComp
          ? (up ? `+${fmtBRLk(absDiff)} ante o mesmo período do mês passado` : `−${fmtBRLk(absDiff)} ante o mesmo período do mês passado`)
          : 'Sem receita registrada no mesmo período do mês passado.'}
      </div>
    </div>
  )
}

// ─── Heatmap ─────────────────────────────────────────────────

function Heatmap({ matrix, max, merchans }: { matrix: ReturnType<typeof heatmapMatrix>['matrix']; max: number; merchans: Merchan[] }) {
  const cellBg = (avg: number) => {
    if (!avg) return 'var(--surface-2)'
    const t = Math.min(1, avg / max)
    const L = (0.97 - t * 0.32).toFixed(3)
    const C = (0.02 + t * 0.16).toFixed(3)
    return `oklch(${L} ${C} 50)`
  }
  const cellFg = (avg: number) => {
    if (!avg) return 'var(--ink-4)'
    const t = Math.min(1, avg / max)
    return t > 0.55 ? 'white' : 'var(--ink)'
  }
  const colsTemplate = `48px repeat(${merchans.length}, minmax(74px, 1fr))`
  return (
    <div className="live-heat-scroll">
      <div className="live-heat" style={{ minWidth: 48 + merchans.length * 74 + 20 }}>
        <div className="live-heat-row live-heat-header" style={{ gridTemplateColumns: colsTemplate }}>
          <div className="live-heat-corner" />
          {merchans.map(m => (
            <div key={m.id} className="live-heat-col-label" title={m.nome}>
              <span className="dot" style={{ background: m.color }} />
              <span className="lbl-text">{m.short}</span>
            </div>
          ))}
        </div>
        {matrix.map(row => (
          <div className="live-heat-row" key={row.weekday} style={{ gridTemplateColumns: colsTemplate }}>
            <div className="live-heat-row-label">{WEEKDAY_LABELS[row.weekday]}</div>
            {row.cells.map(c => (
              <div
                key={c.merchan}
                className={`live-heat-cell ${c.count === 0 ? 'empty' : ''}`}
                style={{ background: cellBg(c.avg), color: cellFg(c.avg) }}
                title={`${WEEKDAY_LABELS[row.weekday]} · ${c.merchan} — ${c.count} cupom${c.count === 1 ? '' : 's'}, média ${fmtBRL(c.avg)}`}>
                {c.count > 0 ? fmtBRLk(c.avg) : '—'}
                {c.count > 1 && <span className="cnt">{c.count}×</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── LivesTable ──────────────────────────────────────────────

function LivesTable({ lives, merchans, onRowClick, limit }: {
  lives: Live[]; merchans: Merchan[]; onRowClick: (l: Live) => void; limit?: number
}) {
  const shown = limit ? lives.slice(0, limit) : lives
  const more  = limit && lives.length > limit ? lives.length - limit : 0
  return (
    <div className="live-table">
      <div className="live-table-head">
        <div>Data</div>
        <div>Cupom 1</div>
        <div>Cupom 2</div>
        <div>Status</div>
        <div className="num">Receita</div>
        <div className="num">UTM</div>
      </div>
      {shown.length === 0 && (
        <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--ink-3)' }}>Nenhuma live no período.</div>
      )}
      {shown.map(l => {
        const m1 = merchans.find(x => x.nome === l.merchan1)
        const m2 = merchans.find(x => x.nome === l.merchan2)
        const s  = LIVE_STATUS_BY_ID[l.status] ?? LIVE_STATUSES[0]
        const utmPct = l.receitaTotal > 0 && l.receitaUtm > 0 ? l.receitaUtm / l.receitaTotal : 0
        const d   = new Date(l.date + 'T00:00:00')
        const day = d.getDate()
        const mon = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][d.getMonth()]
        return (
          <div key={l.id} className="live-table-row" onClick={() => onRowClick(l)}>
            <div className="live-table-date">
              <span className="day">{day}</span>
              <span className="mon">{mon} {d.getFullYear().toString().slice(-2)}</span>
              <span className="time">{WEEKDAY_LABELS[d.getDay()]}</span>
            </div>
            <div className="live-cupom-cell">
              {m1 ? (
                <>
                  <span className="live-merchan-chip" title={m1.nome}>
                    <span className="dot" style={{ background: m1.color }} />{m1.short}
                  </span>
                  <span className="nominal-code">{l.nominal1}</span>
                </>
              ) : <span className="ink-4">—</span>}
            </div>
            <div className="live-cupom-cell">
              {m2 ? (
                <>
                  <span className="live-merchan-chip" title={m2.nome}>
                    <span className="dot" style={{ background: m2.color }} />{m2.short}
                  </span>
                  <span className="nominal-code">{l.nominal2}</span>
                </>
              ) : <span className="ink-4">só 1 cupom</span>}
            </div>
            <div>
              <span className={`status-pill ${s.className}`} style={{ pointerEvents: 'none' }}>
                <span className="sdot" />{s.label}
              </span>
            </div>
            <div className="num">
              {l.receitaTotal > 0 ? fmtBRL(l.receitaTotal) : '—'}
              {l.receitaTotal > 0 && l.receita2 > 0 && (
                <div className="num-split">{fmtBRLk(l.receita1)} + {fmtBRLk(l.receita2)}</div>
              )}
            </div>
            <div className="num">
              {utmPct > 0 ? (
                <>
                  {fmtBRLk(l.receitaUtm)}
                  <div className="num-split">{fmtPct(utmPct)}</div>
                </>
              ) : <span className="ink-4">—</span>}
            </div>
          </div>
        )
      })}
      {more > 0 && (
        <div className="live-table-more">+ {more} live{more === 1 ? '' : 's'} (use filtros pra ver tudo)</div>
      )}
    </div>
  )
}

// ─── LivesView (main) ─────────────────────────────────────────

interface Props {
  lives: Live[]
  merchans: Merchan[]
  onLiveClick: (l: Live) => void
  onNewLive: (defaults?: Partial<Live>) => void
  onOpenMerchans: () => void
  onApproveProposta: (l: Live) => void
  onApproveAll: () => void
  onDiscardProposta: (l: Live) => void
  onGenerateProposta: () => void
  generatingProposta: boolean
}

export default function LivesView({
  lives, merchans,
  onLiveClick, onNewLive, onOpenMerchans,
  onApproveProposta, onApproveAll, onDiscardProposta,
  onGenerateProposta, generatingProposta,
}: Props) {
  const today = todayISO()
  const [period, setPeriod] = useState<number | 'all' | 'custom'>(90)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [search, setSearch] = useState('')
  const [merchanFilter, setMerchanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const propostas = useMemo(
    () => lives.filter(l => l.status === 'proposta' || l.status === 'confirmada'),
    [lives]
  )

  const livesInPeriod = useMemo(() => {
    if (period === 'custom') {
      const from = customFrom
      const to   = customTo || today
      return lives.filter(l => (!from || l.date >= from) && l.date <= to)
    }
    return lives.filter(l => inPeriod(l.date, period, today))
  }, [lives, period, today, customFrom, customTo])

  const kpis      = useMemo(() => liveKpis(livesInPeriod), [livesInPeriod])
  const perMerchan = useMemo(() => perMerchanMetrics(livesInPeriod, merchans), [livesInPeriod, merchans])

  const heatMerchans = useMemo(() => {
    const sorted = [...perMerchan].sort((a, b) => b.count - a.count).slice(0, 10)
    return merchans
      .filter(m => sorted.some(x => x.merchanId === m.id))
      .sort((a, b) => {
        const ai = sorted.findIndex(x => x.merchanId === a.id)
        const bi = sorted.findIndex(x => x.merchanId === b.id)
        return ai - bi
      })
  }, [perMerchan, merchans])

  const weekly = useMemo(() => weeklyTrend(livesInPeriod), [livesInPeriod])
  const heat   = useMemo(() => heatmapMatrix(livesInPeriod, heatMerchans), [livesInPeriod, heatMerchans])
  const mvp    = useMemo(() => monthVsPrev(lives, today), [lives, today])

  const tableLives = useMemo(() => {
    let arr = livesInPeriod
    if (merchanFilter !== 'all') arr = arr.filter(l => l.merchan1 === merchanFilter || l.merchan2 === merchanFilter)
    if (statusFilter !== 'all')  arr = arr.filter(l => l.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      arr = arr.filter(l =>
        (l.nominal1 || '').toLowerCase().includes(q) ||
        (l.nominal2 || '').toLowerCase().includes(q) ||
        (l.merchan1 || '').toLowerCase().includes(q) ||
        (l.merchan2 || '').toLowerCase().includes(q)
      )
    }
    return arr
  }, [livesInPeriod, merchanFilter, statusFilter, search])

  return (
    <div className="lives-wrap">
      {/* Proposta da semana */}
      <PropostaPanel
        propostas={propostas}
        merchans={merchans}
        onApprove={onApproveProposta}
        onApproveAll={onApproveAll}
        onDiscard={onDiscardProposta}
        onEdit={onLiveClick}
        onGenerate={onGenerateProposta}
        generating={generatingProposta} />

      {/* Period bar */}
      <div className="lives-period-bar">
        <div className="view-toggle">
          {PERIODS.map(p => (
            <button key={String(p.id)} className={period === p.id ? 'active' : ''} onClick={() => setPeriod(p.id)}>
              {p.label}
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
          {kpis.count} live{kpis.count === 1 ? '' : 's'} realizadas no período
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost" onClick={onOpenMerchans}>
          <Icon.settings /> Gerenciar merchans
        </button>
      </div>

      {/* KPIs */}
      <div className="lives-kpis lives-kpis-3">
        <KpiCard label="Receita total" value={fmtBRLk(kpis.total)} sub={`${kpis.count} live${kpis.count === 1 ? '' : 's'}`} />
        <KpiCard label="Média por live" value={fmtBRLk(kpis.avg)} sub="ticket médio" />
        <KpiCard
          label="Melhor live"
          value={kpis.best ? fmtBRLk(kpis.best.receitaTotal) : '—'}
          sub={kpis.best ? `${new Date(kpis.best.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })} · ${kpis.best.nominal1}` : ''} />
      </div>

      {/* Métricas secundárias */}
      {(kpis.utmCount > 0 || kpis.alcanceCount > 0) && (
        <div className="lives-kpis-secondary">
          <span className="lks-label">Secundário</span>
          {kpis.utmCount > 0 && (
            <span className="lks-item">
              <strong>% UTM:</strong> {fmtPct(kpis.utmShareSum > 0 ? kpis.utmShareTotal / kpis.utmShareSum : 0)}
              <span className="lks-foot">({kpis.utmCount} de {kpis.count} lives com dado de UTM)</span>
            </span>
          )}
          {kpis.alcanceCount > 0 && (
            <span className="lks-item">
              <strong>Alcance:</strong> {(kpis.alcanceTotal / 1000).toFixed(0)}k
              <span className="lks-foot">({kpis.alcanceCount} de {kpis.count} lives com alcance)</span>
            </span>
          )}
        </div>
      )}

      {/* Performance por merchan */}
      <div className="lives-section-title">
        Performance por merchan
        <span className="sub">cada cupom (1 ou 2) conta como uma observação · descobre qual cupom realmente puxa receita</span>
      </div>
      <div className="lives-grid">
        <DashCard title="Receita média por cupom" hint={`${perMerchan.length} merchans usados no período · ordenado por R$ médio`}>
          <MerchanBars data={perMerchan} />
        </DashCard>
        <DashCard title="Uso × receita média" hint="quadrante superior direito = grande hit · inferior direito = popular-mas-fraco">
          <MerchanScatter data={perMerchan} />
          <div className="quadrant-legend">
            <div><span className="qchip qchip-up">↑→</span> hits</div>
            <div><span className="qchip">↓→</span> overfit (usa muito, rende pouco)</div>
            <div><span className="qchip qchip-up">↑←</span> subexplorado (rende, usa pouco)</div>
          </div>
        </DashCard>
      </div>

      <DashCard
        title="Heatmap — dia da semana × merchan"
        hint={`top ${heatMerchans.length} merchans por uso · scroll horizontal pra ver tudo · '—' = combinação não testada`}
        full>
        <Heatmap matrix={heat.matrix} max={heat.max} merchans={heatMerchans} />
      </DashCard>

      {/* Tendência */}
      <div className="lives-section-title">
        Tendência temporal
        <span className="sub">receita semana a semana · mês até hoje vs mesmo período do mês anterior</span>
      </div>
      <div className="lives-grid lives-grid-trend">
        <DashCard title="Receita semanal" hint={`período: ${period === 'all' ? 'jan/2025 → hoje' : period === 'custom' ? `${customFrom || '?'} → ${customTo || 'hoje'}` : `últimos ${period} dias`}`}>
          <WeeklyTrend data={weekly} />
        </DashCard>
        <DashCard title="Mês atual vs anterior" hint={`comparativo justo · dia 1–${mvp.dayOfMonth} de cada mês`}>
          <MonthVsPrev mvp={mvp} today={today} />
        </DashCard>
      </div>

      {/* Tabela */}
      <div className="lives-section-title">
        Histórico de lives
        <span className="sub">clica numa linha pra editar · {tableLives.length} no recorte atual</span>
      </div>
      <div className="live-table-filters">
        <div className="search-box" style={{ minWidth: 240 }}>
          <Icon.search />
          <input
            placeholder="Buscar código de cupom ou merchan..."
            value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-mini">
          <span className="lbl">Merchan</span>
          <select className="field" value={merchanFilter} onChange={e => setMerchanFilter(e.target.value)} style={{ minWidth: 180, maxWidth: 240 }}>
            <option value="all">Todos</option>
            {merchans.filter(m => m.ativo).map(m => <option key={m.id} value={m.nome}>{m.short} — {m.nome}</option>)}
          </select>
        </div>
        <div className="filter-mini">
          <span className="lbl">Status</span>
          <select className="field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ minWidth: 130 }}>
            <option value="all">Todos</option>
            {LIVE_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }} />
        <span className="count-pill">{tableLives.length} live{tableLives.length === 1 ? '' : 's'}</span>
      </div>
      <DashCard full>
        <LivesTable lives={tableLives} merchans={merchans} onRowClick={onLiveClick} limit={60} />
      </DashCard>
    </div>
  )
}
