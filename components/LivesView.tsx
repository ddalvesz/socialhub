'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LabelList,
  ScatterChart, Scatter, ZAxis, ReferenceLine,
  AreaChart, Area,
} from 'recharts'
import type { Live, Merchan, LiveStatus } from '@/lib/types'
import { LIVE_STATUSES, LIVE_STATUS_BY_ID } from '@/lib/types'
import { MerchanSelect } from './LiveModal'
import { DatePicker } from './FormHelpers'
import {
  fmtBRL, fmtBRLk, fmtPct, inPeriod,
  liveKpis, perMerchanMetrics, weeklyTrend, heatmapMatrix, monthVsPrev,
  WEEKDAY_LABELS,
} from '@/lib/livesUtils'
import {
  todayISO, buildMonthGrid, addDaysISO, startOfWeekISO, parseISO,
  MONTHS, WEEKDAYS as CAL_WEEKDAYS, WEEKDAYS_FULL,
} from '@/lib/types'
import { Icon } from './Icons'

// ─── CSV export ──────────────────────────────────────────────

function exportLivesCSV(lives: Live[]) {
  const headers = [
    'Data', 'Dia da semana', 'Hora', 'Status',
    'Merchan 1', 'Cupom 1', 'Receita Cupom 1',
    'Merchan 2', 'Cupom 2', 'Receita Cupom 2',
    'Cupom extra', 'Receita extra',
    'Receita UTM', 'Receita total',
    'Pedidos cupom', 'Pedidos UTM', 'Pedidos total',
    'Alcance', 'Produto', 'Criativo', 'UTM Campaign', 'Notes',
  ]

  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const rows = lives.map(l => [
    l.date, l.diaSemana, l.hora, l.status,
    l.merchan1, l.nominal1, l.receita1,
    l.merchan2, l.nominal2, l.receita2,
    l.cupomExtra, l.receitaExtra,
    l.receitaUtm, l.receitaTotal,
    l.ordersCupom ?? '', l.ordersUtm ?? '', l.ordersTotal ?? '',
    l.alcance, l.produto, l.criativo, l.utmCampaign, l.notes,
  ].map(escape).join(','))

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lives_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Chart palette ───────────────────────────────────────────

const LIVES_AXIS       = 'oklch(0.62 0.012 300)'
const LIVES_GRID       = 'oklch(0.94 0.01 300)'
const LIVES_INK        = 'oklch(0.22 0.02 300)'
const LIVES_ACCENT     = 'oklch(0.72 0.16 55)'
const LIVES_ACCENT_DEEP = 'oklch(0.62 0.18 50)'

type PeriodId = 'week' | 'month' | 90 | 'custom'
const PERIODS: { id: PeriodId; label: string }[] = [
  { id: 'week',   label: 'Essa semana' },
  { id: 'month',  label: 'Esse mês'   },
  { id: 90,       label: '90 dias'    },
  { id: 'custom', label: 'Período…'   },
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
      <div className="live-tip-row"><span>Receita cupom</span><strong>{fmtBRL(d.totalCupom)}</strong></div>
      <div className="live-tip-row"><span>Receita UTM</span><strong>{fmtBRL(d.totalUtm)}</strong></div>
      <div className="live-tip-row"><span>Lives</span><strong>{d.count}</strong></div>
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
  const allConfirmed = propostas.length > 0 && pendentes === 0
  const [open, setOpen] = useState(!allConfirmed)

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
    <div className={`proposta-panel ${open ? 'is-open' : 'is-closed'}`}>
      <div className="proposta-head" onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="proposta-title">
            <span className="proposta-badge">🤖 skill</span>
            Proposta da próxima semana
            <span className="proposta-chevron">{open ? '▲' : '▼'}</span>
          </div>
          <div className="proposta-sub">
            {pendentes > 0
              ? <><strong>{pendentes}</strong> dia{pendentes === 1 ? '' : 's'} aguardando aprovação · {byDate.length - pendentes} confirmado{byDate.length - pendentes === 1 ? '' : 's'}</>
              : <span className="all-confirmed">✓ Todos os {byDate.length} dias confirmados</span>}
          </div>
        </div>

        <div className="proposta-head-actions" onClick={e => e.stopPropagation()}>
          <button className="btn btn-ghost" onClick={onGenerate} disabled={generating}>
            {generating ? 'Gerando…' : '↺ Regerar'}
          </button>
          {open && pendentes > 0 && (
            <button className="btn btn-accent" onClick={onApproveAll}>
              <Icon.check /> Aprovar tudo
            </button>
          )}
        </div>
      </div>

      {open && (
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
      )}
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

const LIVES_UTM_COLOR = 'oklch(0.58 0.13 265)'

function WeeklyTrend({ data }: { data: ReturnType<typeof weeklyTrend> }) {
  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 24, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="liveAreaGradCupom" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={LIVES_ACCENT} stopOpacity={0.28} />
              <stop offset="95%" stopColor={LIVES_ACCENT} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="liveAreaGradUtm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={LIVES_UTM_COLOR} stopOpacity={0.24} />
              <stop offset="95%" stopColor={LIVES_UTM_COLOR} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={LIVES_GRID} vertical={false} />
          <XAxis dataKey="label" stroke={LIVES_AXIS} tick={{ fontSize: 11, fill: LIVES_AXIS }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={32} />
          <YAxis stroke={LIVES_AXIS} tick={{ fontSize: 11, fill: LIVES_AXIS }} tickFormatter={fmtBRLk} axisLine={false} tickLine={false} width={64} />
          <Tooltip content={<WeekTooltip />} cursor={{ stroke: LIVES_ACCENT_DEEP, strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Area type="monotone" dataKey="totalCupom" name="Receita cupom" stroke={LIVES_ACCENT_DEEP} strokeWidth={2} fill="url(#liveAreaGradCupom)" dot={false} activeDot={{ r: 5, fill: LIVES_ACCENT_DEEP }} />
          <Area type="monotone" dataKey="totalUtm" name="Receita UTM" stroke={LIVES_UTM_COLOR} strokeWidth={2} fill="url(#liveAreaGradUtm)" dot={false} activeDot={{ r: 5, fill: LIVES_UTM_COLOR }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── MonthVsPrev ─────────────────────────────────────────────

function MonthVsPrevRow({ label, cur, prev, delta, diff, curMonth, prevMonth, mvp }: {
  label: string
  cur: number; prev: number; delta: number; diff: number
  curMonth: string; prevMonth: string
  mvp: ReturnType<typeof monthVsPrev>
}) {
  const hasComp = prev > 0
  const up      = delta >= 0
  const absDiff = Math.abs(diff)
  return (
    <div className="live-mvp">
      <div className="live-mvp-label">{label}</div>
      <div className="live-mvp-cur">
        <div className="lbl">{curMonth} · 1–{mvp.dayOfMonth}</div>
        <div className="val">{fmtBRLk(cur)}</div>
      </div>
      {hasComp ? (
        <div className={`live-mvp-delta ${up ? 'up' : 'down'}`}>{up ? '▲' : '▼'} {Math.abs(delta * 100).toFixed(0)}%</div>
      ) : (
        <div className="live-mvp-delta neutral">—</div>
      )}
      <div className="live-mvp-prev">
        <div className="lbl">{prevMonth} · 1–{mvp.endDayPrev} <span className="lbl-sub">(mesmo período)</span></div>
        <div className="val">{hasComp ? fmtBRLk(prev) : '—'}</div>
      </div>
      <div className="live-mvp-foot">
        {hasComp
          ? (up ? `+${fmtBRLk(absDiff)} ante o mesmo período do mês passado` : `−${fmtBRLk(absDiff)} ante o mesmo período do mês passado`)
          : 'Sem receita registrada no mesmo período do mês passado.'}
      </div>
    </div>
  )
}

function MonthVsPrev({ mvp, today }: { mvp: ReturnType<typeof monthVsPrev>; today: string }) {
  const todayDate = new Date(today + 'T00:00:00')
  const monthNames = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  const curMonth  = monthNames[todayDate.getMonth()]
  const prevMonth = monthNames[(todayDate.getMonth() + 11) % 12]
  return (
    <div className="live-mvp-wrap">
      <MonthVsPrevRow label="Cupom" cur={mvp.curCupom} prev={mvp.prevCupom} delta={mvp.deltaCupom} diff={mvp.diffCupom} curMonth={curMonth} prevMonth={prevMonth} mvp={mvp} />
      <MonthVsPrevRow label="UTM" cur={mvp.curUtm} prev={mvp.prevUtm} delta={mvp.deltaUtm} diff={mvp.diffUtm} curMonth={curMonth} prevMonth={prevMonth} mvp={mvp} />
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
                key={`${row.weekday}-${c.merchan}`}
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

// ─── Calendar helpers ────────────────────────────────────────

const LIVE_STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  proposta:   { bg: 'oklch(0.97 0.05 70)',  border: 'oklch(0.88 0.10 60)',  text: 'oklch(0.52 0.14 55)'  },
  confirmada: { bg: 'oklch(0.93 0.05 265)', border: 'oklch(0.80 0.10 265)', text: 'oklch(0.45 0.14 265)' },
  realizada:  { bg: 'oklch(0.94 0.05 150)', border: 'oklch(0.82 0.09 150)', text: 'oklch(0.42 0.13 150)' },
}

function LiveChip({ live, merchans, onClick }: { live: Live; merchans: Merchan[]; onClick: () => void }) {
  const col = LIVE_STATUS_COLORS[live.status] ?? LIVE_STATUS_COLORS.confirmada
  const m1 = merchans.find(m => m.nome === live.merchan1)
  const label = m1 ? m1.short : (live.merchan1 || '—')
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
      title={`${live.hora} · ${live.merchan1}${live.merchan2 ? ' + ' + live.merchan2 : ''}`}
    >
      {m1 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: m1.color, flexShrink: 0 }} />}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, flexShrink: 0, opacity: 0.75 }}>
        {live.hora}
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
        {label}
      </span>
    </button>
  )
}

function LivesMonthView({ year, month, lives, merchans, onLiveClick, onNewLive }: {
  year: number; month: number; lives: Live[]; merchans: Merchan[]
  onLiveClick: (l: Live) => void
  onNewLive: (date: string) => void
}) {
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month])
  const today = todayISO()
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  const byDay = useMemo(() => {
    const map: Record<string, Live[]> = {}
    lives.forEach(l => { (map[l.date] = map[l.date] || []).push(l) })
    Object.values(map).forEach(arr => arr.sort((a, b) => a.hora.localeCompare(b.hora)))
    return map
  }, [lives])

  const MAX_VISIBLE = 3

  return (
    <div className="cal-grid">
      {CAL_WEEKDAYS.map(w => <div key={w} className="cal-head">{w}</div>)}
      {cells.map((c, i) => {
        const isToday = c.iso === today
        const dayLives = byDay[c.iso] || []
        const visible = dayLives.slice(0, MAX_VISIBLE)
        const more = dayLives.length - visible.length
        return (
          <div
            key={i}
            className={`cal-cell ${c.other ? 'other' : ''} ${isToday ? 'today' : ''}`}
            style={{ position: 'relative' }}
            onClick={() => !c.other && onNewLive(c.iso)}
          >
            <div className="cal-num-row">
              <span className="cal-num-box">{c.day}</span>
            </div>
            {visible.map(l => (
              <div key={l.id} onClick={e => e.stopPropagation()} style={{ marginBottom: 2 }}>
                <LiveChip live={l} merchans={merchans} onClick={() => onLiveClick(l)} />
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
                  {c.day}/{month + 1} — {dayLives.length} live{dayLives.length === 1 ? '' : 's'}
                </div>
                {dayLives.map(l => (
                  <LiveChip key={l.id} live={l} merchans={merchans} onClick={() => { onLiveClick(l); setExpandedDay(null) }} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Lives Calendar — Week view ──────────────────────────────

const WEEK_START_HOUR = 6
const WEEK_END_HOUR = 24
const HOUR_HEIGHT = 56

function LivesWeekView({ weekStart, lives, merchans, onLiveClick }: {
  weekStart: string; lives: Live[]; merchans: Merchan[]
  onLiveClick: (l: Live) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i))
  const hours = Array.from({ length: WEEK_END_HOUR - WEEK_START_HOUR }, (_, i) => WEEK_START_HOUR + i)
  const today = todayISO()

  const now = new Date()
  const nowOffset = ((now.getHours() + now.getMinutes() / 60) - WEEK_START_HOUR) * HOUR_HEIGHT

  const byDay = useMemo(() => {
    const map: Record<string, Live[]> = {}
    days.forEach(d => { map[d] = [] })
    lives.forEach(l => { if (map[l.date] !== undefined) map[l.date].push(l) })
    return map
  }, [lives, weekStart])

  const pad2 = (n: number) => String(n).padStart(2, '0')

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
              {h === WEEK_START_HOUR ? '' : `${pad2(h)}:00`}
            </div>
          ))}
        </div>
        {days.map(d => {
          const isToday = d === today
          const dayLives = byDay[d] || []
          return (
            <div key={d} className={`week-day-col ${isToday ? 'today' : ''}`}>
              {hours.map(h => <div key={h} className="week-hour-cell" />)}
              {isToday && nowOffset >= 0 && (
                <div className="week-now-line" style={{ top: `${nowOffset}px` }} />
              )}
              {dayLives.map(l => {
                const [hh, mm] = l.hora.split(':').map(Number)
                const top = ((hh + mm / 60) - WEEK_START_HOUR) * HOUR_HEIGHT
                if (top < 0) return null
                const col = LIVE_STATUS_COLORS[l.status] ?? LIVE_STATUS_COLORS.confirmada
                const m1 = merchans.find(m => m.nome === l.merchan1)
                const m2 = merchans.find(m => m.nome === l.merchan2)
                return (
                  <button
                    key={l.id}
                    onClick={() => onLiveClick(l)}
                    style={{
                      position: 'absolute', top: `${top}px`, height: 62,
                      left: 3, right: 3,
                      background: col.bg, border: `1.5px solid ${col.border}`,
                      borderRadius: 8, padding: '4px 7px', cursor: 'pointer',
                      textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: col.text, opacity: 0.8 }}>
                      {l.hora}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
                      {m1 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: m1.color, flexShrink: 0 }} />}
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: col.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m1 ? m1.short : (l.merchan1 || '—')}
                      </span>
                    </div>
                    {m2 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: m2.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: col.text, opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m2.short}
                        </span>
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

// ─── Copy UTM button ─────────────────────────────────────────

function CopyUtmBtn({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className={`live-copy-utm ${copied ? 'copied' : ''}`}
      title="Copiar UTM"
      onClick={e => {
        e.stopPropagation()
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
    >
      {copied ? (
        <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 8 6.5 12 13 4" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="5" width="7.5" height="7.5" rx="1.5" />
          <path d="M10 5V4A1.5 1.5 0 0 0 8.5 2.5h-5A1.5 1.5 0 0 0 2 4v8A1.5 1.5 0 0 0 3.5 13.5H5" />
        </svg>
      )}
    </button>
  )
}

// ─── StatusCell ──────────────────────────────────────────────

function StatusCell({ live, onStatusChange }: { live: Live; onStatusChange?: (l: Live, id: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const s = LIVE_STATUS_BY_ID[live.status] ?? LIVE_STATUSES[0]

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const pick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (onStatusChange) onStatusChange(live, id)
    setOpen(false)
  }

  return (
    <div className="live-status-cell" ref={ref}>
      <button
        className={`status-pill ${s.className} status-pill-btn`}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
      >
        <span className="sdot" />
        {s.label}
      </button>
      {open && (
        <div className="status-dropdown" onClick={e => e.stopPropagation()}>
          {LIVE_STATUSES.map(st => (
            <button
              key={st.id}
              className={`status-opt ${st.className} ${live.status === st.id ? 'active' : ''}`}
              onClick={e => pick(e, st.id)}
            >
              <span className="sdot" />{st.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Lives Calendar — List view ──────────────────────────────

interface DraftLiveRow {
  tempId: string
  date: string
  hora: string
  merchan1: string
  nominal1: string
  status: LiveStatus
}

function draftToFakeLive(d: DraftLiveRow): Live {
  return {
    id: d.tempId, date: d.date, hora: d.hora, diaSemana: '', cupomLigado: true, criativo: '',
    merchan1: d.merchan1, nominal1: d.nominal1, receita1: 0, merchan2: '', nominal2: '', receita2: 0,
    cupomExtra: '', receitaExtra: 0, receitaTotal: 0, receitaUtm: 0,
    ordersCupom: null, ordersUtm: null, ordersTotal: null, alcance: 0, produto: '',
    linkUtm: '', utmCampaign: '', status: d.status, origem: 'manual', notes: '',
  }
}

function LiveDraftRow({
  draft, merchans, saving, onHoraChange, onMerchanCommit, onNominalChange, onStatusChange, onDiscard, onAddMerchan,
}: {
  draft: DraftLiveRow
  merchans: Merchan[]
  saving: boolean
  onHoraChange: (hora: string) => void
  onMerchanCommit: (merchan1: string) => void
  onNominalChange: (nominal1: string) => void
  onStatusChange: (l: Live, id: string) => void
  onDiscard: () => void
  onAddMerchan: (nome: string) => Promise<Merchan>
}) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', marginBottom: 4,
        borderRadius: 10, background: 'var(--surface)', border: '1px dashed var(--line-2)',
        opacity: saving ? 0.55 : 1, pointerEvents: saving ? 'none' : 'auto', transition: 'opacity 0.12s',
      }}
    >
      <input
        type="time"
        className="field"
        value={draft.hora}
        onChange={e => onHoraChange(e.target.value)}
        style={{ fontSize: 12.5, padding: '5px 8px', width: 92, flexShrink: 0, fontFamily: 'var(--font-mono)', boxSizing: 'border-box' }}
      />
      <div style={{ width: 220, flexShrink: 0, boxSizing: 'border-box' }}>
        <MerchanSelect
          value={draft.merchan1}
          merchans={merchans}
          onChange={onMerchanCommit}
          onAddMerchan={onAddMerchan}
          placeholder="Merchan…"
        />
      </div>
      <input
        className="field"
        value={draft.nominal1}
        onChange={e => onNominalChange(e.target.value)}
        placeholder="Cupom…"
        style={{ fontSize: 12.5, padding: '5px 8px', width: 130, flexShrink: 0, boxSizing: 'border-box' }}
      />
      <div style={{ flex: 1 }} />
      <StatusCell live={draftToFakeLive(draft)} onStatusChange={onStatusChange} />
      <button
        onClick={onDiscard}
        title="Descartar rascunho"
        style={{
          width: 22, height: 22, flexShrink: 0, borderRadius: 6, border: 'none', background: 'transparent',
          color: 'var(--ink-3)', cursor: 'pointer', display: 'grid', placeItems: 'center',
        }}
      >
        <svg viewBox="0 0 16 16" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
        </svg>
      </button>
    </div>
  )
}

function LivesCalListView({ year, month, lives, merchans, onLiveClick, onQuickCreateLive, onAddMerchan }: {
  year: number; month: number; lives: Live[]; merchans: Merchan[]
  onLiveClick: (l: Live) => void
  onQuickCreateLive: (partial: { date: string; hora: string; merchan1: string; nominal1: string; status: LiveStatus }) => Promise<void>
  onAddMerchan: (nome: string) => Promise<Merchan>
}) {
  const today = todayISO()
  const [drafts, setDrafts] = useState<DraftLiveRow[]>([])
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkDate, setBulkDate] = useState(today)
  const [bulkQty, setBulkQty] = useState(7)
  const [bulkSkipped, setBulkSkipped] = useState(0)

  const datesWithLive = useMemo(() => new Set(lives.map(l => l.date)), [lives])
  const datesWithDraft = new Set(drafts.map(d => d.date))

  const monthLives = lives
    .filter(l => {
      const [y, m] = l.date.split('-').map(Number)
      return y === year && m - 1 === month
    })
    .sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.hora.localeCompare(b.hora))

  const monthDrafts = drafts
    .filter(d => {
      const [y, m] = d.date.split('-').map(Number)
      return y === year && m - 1 === month
    })

  const dates = Array.from(new Set([...monthLives.map(l => l.date), ...monthDrafts.map(d => d.date)])).sort()

  const weekdayShort = (iso: string) => {
    const d = parseISO(iso)
    return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()]
  }

  const nextFreeDate = (from: string) => {
    let d = from
    while (datesWithLive.has(d) || datesWithDraft.has(d)) d = addDaysISO(d, 1)
    return d
  }

  const addDraft = (date: string) => {
    if (datesWithLive.has(date) || datesWithDraft.has(date)) return
    setDrafts(ds => [...ds, { tempId: crypto.randomUUID(), date, hora: '20:00', merchan1: '', nominal1: '', status: 'confirmada' as LiveStatus }])
  }

  const patchDraft = (tempId: string, patch: Partial<DraftLiveRow>) => {
    setDrafts(ds => ds.map(d => d.tempId === tempId ? { ...d, ...patch } : d))
  }

  const removeDraft = (tempId: string) => setDrafts(ds => ds.filter(d => d.tempId !== tempId))

  const commitDraftMerchan = async (draft: DraftLiveRow, merchan1: string) => {
    patchDraft(draft.tempId, { merchan1 })
    if (!merchan1) return
    setSavingIds(ids => new Set(ids).add(draft.tempId))
    await onQuickCreateLive({ date: draft.date, hora: draft.hora, merchan1, nominal1: draft.nominal1, status: draft.status })
    removeDraft(draft.tempId)
    setSavingIds(ids => { const next = new Set(ids); next.delete(draft.tempId); return next })
  }

  const confirmBulk = () => {
    const n = Math.max(1, Math.min(30, Math.round(bulkQty) || 1))
    let cursor = bulkDate
    let skipped = 0
    const novos: DraftLiveRow[] = []
    for (let i = 0; i < n; i++) {
      if (datesWithLive.has(cursor) || datesWithDraft.has(cursor) || novos.some(d => d.date === cursor)) {
        skipped++
      } else {
        novos.push({ tempId: crypto.randomUUID(), date: cursor, hora: '20:00', merchan1: '', nominal1: '', status: 'confirmada' as LiveStatus })
      }
      cursor = addDaysISO(cursor, 1)
    }
    setDrafts(ds => [...ds, ...novos])
    setBulkSkipped(skipped)
    setBulkOpen(false)
  }

  const toolbar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
      <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: '6px 12px' }} onClick={() => addDraft(nextFreeDate(today))}>
        + Nova live
      </button>
      <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: '6px 12px' }} onClick={() => setBulkOpen(o => !o)}>
        + Adicionar em lote
      </button>
      {bulkOpen && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-2)' }}>
          <DatePicker value={bulkDate} onChange={setBulkDate} style={{ width: 130 }} />
          <span>×</span>
          <input type="number" min={1} max={30} className="field" value={bulkQty} onChange={e => setBulkQty(Number(e.target.value))} style={{ fontSize: 12.5, padding: '5px 8px', width: 56 }} />
          <span>dias</span>
          <button className="btn btn-accent" style={{ fontSize: 12.5, padding: '5px 12px' }} onClick={confirmBulk}>Adicionar</button>
          <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: '5px 12px' }} onClick={() => setBulkOpen(false)}>Cancelar</button>
        </div>
      )}
      {bulkSkipped > 0 && (
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          {bulkSkipped} dia{bulkSkipped === 1 ? '' : 's'} já {bulkSkipped === 1 ? 'tinha' : 'tinham'} live e {bulkSkipped === 1 ? 'foi pulado' : 'foram pulados'}
        </span>
      )}
    </div>
  )

  if (!dates.length) {
    return (
      <div style={{ paddingTop: 16 }}>
        {toolbar}
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--ink-3)' }}>
          Nenhuma live neste mês.
        </div>
      </div>
    )
  }

  return (
    <div className="pautas-view" style={{ paddingTop: 16 }}>
      {toolbar}
      {dates.map(date => {
        const dayLives = monthLives.filter(l => l.date === date)
        const dayDrafts = monthDrafts.filter(d => d.date === date)
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
              {dayLives.map(l => {
                const col = LIVE_STATUS_COLORS[l.status] ?? LIVE_STATUS_COLORS.confirmada
                const s = LIVE_STATUS_BY_ID[l.status]
                const m1 = merchans.find(m => m.nome === l.merchan1)
                const m2 = merchans.find(m => m.nome === l.merchan2)
                return (
                  <div
                    key={l.id}
                    onClick={() => onLiveClick(l)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', marginBottom: 4,
                      borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)',
                      cursor: 'pointer', transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = col.bg }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)' }}
                  >
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-3)', width: 40, flexShrink: 0 }}>
                      {l.hora}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                        {m1 && <span style={{ width: 8, height: 8, borderRadius: '50%', background: m1.color, flexShrink: 0 }} />}
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m1 ? m1.short : (l.merchan1 || '—')}
                          {m2 && <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}> + {m2.short}</span>}
                        </span>
                      </div>
                      {(l.nominal1 || l.nominal2) && (
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {[l.nominal1, l.nominal2].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                    {l.receitaTotal > 0 && (
                      <div style={{ fontSize: 12, fontWeight: 600, color: LIVES_ACCENT, flexShrink: 0 }}>
                        {fmtBRL(l.receitaTotal)}
                      </div>
                    )}
                    {s && (
                      <span className={`status-pill ${s.className}`} style={{ flexShrink: 0 }}>
                        <span className="sdot" />{s.label}
                      </span>
                    )}
                    {l.linkUtm && <CopyUtmBtn url={l.linkUtm} />}
                  </div>
                )
              })}
              {dayDrafts.map(d => (
                <LiveDraftRow
                  key={d.tempId}
                  draft={d}
                  merchans={merchans}
                  saving={savingIds.has(d.tempId)}
                  onHoraChange={hora => patchDraft(d.tempId, { hora })}
                  onMerchanCommit={v => commitDraftMerchan(d, v)}
                  onNominalChange={v => patchDraft(d.tempId, { nominal1: v })}
                  onStatusChange={(_, id) => patchDraft(d.tempId, { status: id as LiveStatus })}
                  onDiscard={() => removeDraft(d.tempId)}
                  onAddMerchan={onAddMerchan}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── LivesTable ──────────────────────────────────────────────

const MONTH_NAMES_BR = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                        'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function LiveSortHeader({ label, col, sortBy, sortAsc, onSort, align, className }: {
  label: string
  col: 'date' | 'cupom' | 'utm' | 'ticketCupom' | 'ticketUtm'
  sortBy: string
  sortAsc: boolean
  onSort: (col: 'date' | 'cupom' | 'utm' | 'ticketCupom' | 'ticketUtm') => void
  align?: 'right' | 'center'
  className?: string
}) {
  const active = sortBy === col
  return (
    <div
      className={`live-sort-header${align ? ' live-sort-header-' + align : ''}${className ? ' ' + className : ''}`}
      onClick={() => onSort(col)}
    >
      {label}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: active ? 1 : 0.35, flexShrink: 0 }}>
        {(active ? sortAsc : true)
          ? <path d="M5 2L9 8H1L5 2Z" fill="currentColor" />
          : <path d="M5 8L1 2H9L5 8Z" fill="currentColor" />}
      </svg>
    </div>
  )
}

function LivesTable({ lives, merchans, onRowClick, onStatusChange, limit }: {
  lives: Live[]; merchans: Merchan[]
  onRowClick: (l: Live) => void
  onStatusChange?: (l: Live, id: string) => void
  limit?: number
}) {
  const [sortBy, setSortBy] = useState<'date' | 'cupom' | 'utm' | 'ticketCupom' | 'ticketUtm'>('date')
  const [sortAsc, setSortAsc] = useState(false)

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortAsc(v => !v)
    else { setSortBy(col); setSortAsc(col === 'date' ? false : true) }
  }

  const sorted = useMemo(() => {
    return [...lives].sort((a, b) => {
      let diff = 0
      if (sortBy === 'date') {
        diff = a.date < b.date ? -1 : a.date > b.date ? 1 : 0
      } else if (sortBy === 'cupom') {
        diff = ((a.receita1 || 0) + (a.receita2 || 0)) - ((b.receita1 || 0) + (b.receita2 || 0))
      } else if (sortBy === 'utm') {
        diff = (a.receitaUtm || 0) - (b.receitaUtm || 0)
      } else if (sortBy === 'ticketCupom') {
        const ta = a.ordersCupom && a.ordersCupom > 0 ? ((a.receita1 || 0) + (a.receita2 || 0)) / a.ordersCupom : -1
        const tb = b.ordersCupom && b.ordersCupom > 0 ? ((b.receita1 || 0) + (b.receita2 || 0)) / b.ordersCupom : -1
        diff = ta - tb
      } else {
        const ta = a.ordersUtm && a.ordersUtm > 0 ? (a.receitaUtm || 0) / a.ordersUtm : -1
        const tb = b.ordersUtm && b.ordersUtm > 0 ? (b.receitaUtm || 0) / b.ordersUtm : -1
        diff = ta - tb
      }
      return sortAsc ? diff : -diff
    })
  }, [lives, sortBy, sortAsc])

  const shown = limit ? sorted.slice(0, limit) : sorted
  const more  = limit && lives.length > limit ? lives.length - limit : 0

  // Agrupar por mês com rows acessíveis para subtotal
  type Group = { key: string; label: string; rows: Live[] }
  const groups: Group[] = []
  let curGroup: Group | null = null
  for (const l of shown) {
    const d = new Date(l.date + 'T00:00:00')
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!curGroup || curGroup.key !== key) {
      curGroup = { key, label: `${MONTH_NAMES_BR[d.getMonth()]} ${d.getFullYear()}`, rows: [] }
      groups.push(curGroup)
    }
    curGroup.rows.push(l)
  }

  return (
    <div className="live-table">
      <div className="live-table-head">
        <LiveSortHeader label="Data" col="date" sortBy={sortBy} sortAsc={sortAsc} onSort={toggleSort} />
        <div>Cupons</div>
        <LiveSortHeader label="Rec. cupom" col="cupom" sortBy={sortBy} sortAsc={sortAsc} onSort={toggleSort} align="right" />
        <LiveSortHeader label="Rec. UTM" col="utm" sortBy={sortBy} sortAsc={sortAsc} onSort={toggleSort} align="right" />
        <LiveSortHeader label="Tkt. cupom" col="ticketCupom" sortBy={sortBy} sortAsc={sortAsc} onSort={toggleSort} align="right" />
        <LiveSortHeader label="Tkt. UTM" col="ticketUtm" sortBy={sortBy} sortAsc={sortAsc} onSort={toggleSort} align="right" />
        <div className="ctr">Status</div>
        <div />
      </div>
      {shown.length === 0 && (
        <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--ink-3)' }}>Nenhuma live no período.</div>
      )}
      {groups.map(group => {
        const withRevenue = group.rows.filter(l => (l.receita1 || 0) + (l.receita2 || 0) + (l.receitaUtm || 0) > 0)
        const mCupom       = withRevenue.reduce((s, l) => s + (l.receita1 || 0) + (l.receita2 || 0), 0)
        const mUtm         = withRevenue.reduce((s, l) => s + (l.receitaUtm || 0), 0)
        const mOrdersCupom = withRevenue.reduce((s, l) => s + (l.ordersCupom ?? 0), 0)
        const mOrdersUtm   = withRevenue.reduce((s, l) => s + (l.ordersUtm ?? 0), 0)
        const mTicketCupom = mOrdersCupom > 0 ? mCupom / mOrdersCupom : null
        const mTicketUtm   = mOrdersUtm   > 0 ? mUtm   / mOrdersUtm   : null

        return (
          <div key={group.key}>
            <div className="live-table-month-header">{group.label}</div>

            {group.rows.map(l => {
              const m1 = merchans.find(x => x.nome === l.merchan1)
              const m2 = merchans.find(x => x.nome === l.merchan2)
              const receitaCupom = (l.receita1 || 0) + (l.receita2 || 0)
              const ticketCupom = l.ordersCupom && l.ordersCupom > 0 && receitaCupom > 0
                ? receitaCupom / l.ordersCupom
                : null
              const ticketUtm = l.ordersUtm && l.ordersUtm > 0 && l.receitaUtm > 0
                ? l.receitaUtm / l.ordersUtm
                : null

              const d = new Date(l.date + 'T00:00:00')
              const day = d.getDate()
              const isWeekend = d.getDay() === 0 || d.getDay() === 6
              const splitTooltip = l.receita2 > 0
                ? `${fmtBRLk(l.receita1)} (cupom 1) + ${fmtBRLk(l.receita2)} (cupom 2)`
                : undefined

              return (
                <div key={l.id} className={`live-table-row${isWeekend ? ' weekend' : ''}`} onClick={() => onRowClick(l)}>
                  {/* 1. Data */}
                  <div className="live-table-date">
                    <span className="day">{day}</span>
                    <span className="time">{WEEKDAY_LABELS[d.getDay()]}{l.hora ? ` • ${l.hora}` : ''}</span>
                  </div>
                  {/* 2. Cupons (unificado) */}
                  <div className="live-cupons-cell">
                    <div className="live-cupom-row">
                      {(m1 || l.nominal1) ? (
                        <>
                          {m1 && (
                            <span className="live-merchan-chip" title={m1.nome}>
                              <span className="dot" style={{ background: m1.color }} />{m1.short}
                            </span>
                          )}
                          {l.nominal1 && <span className="nominal-code">{l.nominal1}</span>}
                        </>
                      ) : <span className="ink-4">—</span>}
                    </div>
                    {(m2 || l.nominal2) && (
                      <div className="live-cupom-row">
                        {m2 && (
                          <span className="live-merchan-chip" title={m2.nome}>
                            <span className="dot" style={{ background: m2.color }} />{m2.short}
                          </span>
                        )}
                        {l.nominal2 && <span className="nominal-code">{l.nominal2}</span>}
                      </div>
                    )}
                  </div>
                  {/* 3. Receita cupom */}
                  <div className="live-receita-sec" data-tooltip={splitTooltip}>
                    {receitaCupom > 0
                      ? <span className="val has-data">{fmtBRL(receitaCupom)}</span>
                      : <span className="ink-4">—</span>}
                  </div>
                  {/* 4. Receita UTM */}
                  <div className="live-receita-sec">
                    {l.receitaUtm > 0
                      ? <span className="val has-data">{fmtBRL(l.receitaUtm)}</span>
                      : <span className="ink-4">—</span>}
                  </div>
                  {/* 5. Ticket médio cupom */}
                  <div className="live-receita-sec">
                    {ticketCupom != null
                      ? <span className="val has-data">{fmtBRL(ticketCupom)}</span>
                      : <span className="ink-4">—</span>}
                  </div>
                  {/* 6. Ticket médio UTM */}
                  <div className="live-receita-sec">
                    {ticketUtm != null
                      ? <span className="val has-data">{fmtBRL(ticketUtm)}</span>
                      : <span className="ink-4">—</span>}
                  </div>
                  {/* 6. Status */}
                  <StatusCell live={l} onStatusChange={onStatusChange} />
                  {/* 7. Botão UTM */}
                  <div className="live-utm-btn-cell" onClick={e => e.stopPropagation()}>
                    {l.linkUtm && <CopyUtmBtn url={l.linkUtm} />}
                  </div>
                </div>
              )
            })}

            {(mCupom > 0 || mUtm > 0) && (
              <div className="live-table-summary">
                <div className="summary-label">
                  <span className="summary-label-title">Subtotal {group.label}</span>
                  <span className="summary-label-count">{withRevenue.length} live{withRevenue.length !== 1 ? 's' : ''} com receita</span>
                </div>
                <div className="summary-val">{fmtBRLk(mCupom)}</div>
                <div className="summary-val">{fmtBRLk(mUtm)}</div>
                <div className="summary-val">{mTicketCupom != null ? fmtBRLk(mTicketCupom) : '—'}</div>
                <div className="summary-val">{mTicketUtm != null ? fmtBRLk(mTicketUtm) : '—'}</div>
                <div /><div />
              </div>
            )}
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
  onStatusChange?: (l: Live, newStatus: string) => void
  onQuickCreateLive: (partial: { date: string; hora: string; merchan1: string; nominal1: string; status: LiveStatus }) => Promise<void>
  onAddMerchan: (nome: string) => Promise<Merchan>
}

export default function LivesView({
  lives, merchans,
  onLiveClick, onNewLive, onOpenMerchans,
  onApproveProposta, onApproveAll, onDiscardProposta,
  onGenerateProposta, generatingProposta,
  onStatusChange,
  onQuickCreateLive, onAddMerchan,
}: Props) {
  const today = todayISO()
  const todayDate = parseISO(today)

  // ── view mode ──
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

  // ── analytics state ──
  const [period, setPeriod] = useState<PeriodId>('month')
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
    if (period === 'week') {
      const d = new Date(today + 'T00:00:00')
      const dow = d.getDay()
      const monday = new Date(d); monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
      const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
      const from = monday.toISOString().slice(0, 10)
      const to   = sunday.toISOString().slice(0, 10)
      return lives.filter(l => l.date >= from && l.date <= to)
    }
    if (period === 'month') {
      const from = today.slice(0, 7) + '-01'
      const lastDay = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0)
      const to = lastDay.toISOString().slice(0, 10)
      return lives.filter(l => l.date >= from && l.date <= to)
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
      {/* Proposta da semana — sempre visível */}
      <PropostaPanel
        propostas={propostas}
        merchans={merchans}
        onApprove={onApproveProposta}
        onApproveAll={onApproveAll}
        onDiscard={onDiscardProposta}
        onEdit={onLiveClick}
        onGenerate={onGenerateProposta}
        generating={generatingProposta} />

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
              {PERIODS.map(p => (
                <button key={String(p.id)} className={period === p.id ? 'active' : ''} onClick={() => setPeriod(p.id)}>
                  {p.label}
                </button>
              ))}
            </div>
            {period === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <DatePicker value={customFrom} onChange={setCustomFrom} style={{ width: 130 }} />
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>até</span>
                <DatePicker value={customTo} onChange={setCustomTo} style={{ width: 130 }} />
              </div>
            )}
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
              {kpis.count} live{kpis.count === 1 ? '' : 's'} realizadas no período
            </div>
          </>
        )}

        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost" onClick={() => exportLivesCSV(lives)} title="Exportar histórico completo como CSV">
          <Icon.download /> Exportar CSV
        </button>
        <button className="btn btn-ghost" onClick={onOpenMerchans}>
          <Icon.settings /> Gerenciar merchans
        </button>
        <button className="btn btn-accent" onClick={() => onNewLive({})}>
          <Icon.plus /> Nova live
        </button>
      </div>

      {/* ── Calendar view ── */}
      {viewMode === 'calendar' && calMode !== 'list' && (
        <div className="cal-wrap">
          {calMode === 'month' ? (
            <LivesMonthView
              year={year}
              month={month}
              lives={lives}
              merchans={merchans}
              onLiveClick={onLiveClick}
              onNewLive={date => onNewLive({ date })}
            />
          ) : (
            <LivesWeekView
              weekStart={weekStart}
              lives={lives}
              merchans={merchans}
              onLiveClick={onLiveClick}
            />
          )}
        </div>
      )}
      {viewMode === 'calendar' && calMode === 'list' && (
        <LivesCalListView
          year={year}
          month={month}
          lives={lives}
          merchans={merchans}
          onLiveClick={onLiveClick}
          onQuickCreateLive={onQuickCreateLive}
          onAddMerchan={onAddMerchan}
        />
      )}

      {/* ── Analytics view ── */}
      {viewMode === 'analytics' && (
        <>
          {/* KPIs — cupom e UTM são fontes de atribuição independentes (podem se sobrepor),
              por isso nunca aparecem somadas em um "total" */}
          <div className="lives-kpis lives-kpis-6">
            <KpiCard label="Receita cupom" value={fmtBRLk(kpis.totalCupom)} sub={`${kpis.count} live${kpis.count === 1 ? '' : 's'}`} />
            <KpiCard
              label="Ticket médio cupom"
              value={kpis.ticketMedioCupom != null ? fmtBRLk(kpis.ticketMedioCupom) : '—'}
              sub={kpis.ordersCupomTotal > 0 ? `${kpis.ordersCupomTotal} pedidos no período` : 'sem dados de pedidos'} />
            <KpiCard
              label="Melhor live (cupom)"
              value={kpis.bestCupom ? fmtBRLk((kpis.bestCupom.receita1 || 0) + (kpis.bestCupom.receita2 || 0)) : '—'}
              sub={kpis.bestCupom ? `${new Date(kpis.bestCupom.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })} · ${kpis.bestCupom.nominal1}` : ''} />
            <KpiCard label="Receita UTM" value={fmtBRLk(kpis.totalUtm)} sub={`${kpis.utmCount} de ${kpis.count} lives com dado de UTM`} />
            <KpiCard
              label="Ticket médio UTM"
              value={kpis.ticketMedioUtm != null ? fmtBRLk(kpis.ticketMedioUtm) : '—'}
              sub={kpis.ordersUtmTotal > 0 ? `${kpis.ordersUtmTotal} pedidos no período` : 'sem dados de pedidos'} />
            <KpiCard
              label="Melhor live (UTM)"
              value={kpis.bestUtm && kpis.bestUtm.receitaUtm > 0 ? fmtBRLk(kpis.bestUtm.receitaUtm) : '—'}
              sub={kpis.bestUtm && kpis.bestUtm.receitaUtm > 0 ? `${new Date(kpis.bestUtm.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })} · ${kpis.bestUtm.nominal1}` : ''} />
          </div>

          {kpis.alcanceCount > 0 && (
            <div className="lives-kpis-secondary">
              <span className="lks-label">Secundário</span>
              <span className="lks-item">
                <strong>Alcance:</strong> {(kpis.alcanceTotal / 1000).toFixed(0)}k
                <span className="lks-foot">({kpis.alcanceCount} de {kpis.count} lives com alcance)</span>
              </span>
            </div>
          )}

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

          <div className="lives-section-title">
            Tendência temporal
            <span className="sub">receita semana a semana · mês até hoje vs mesmo período do mês anterior</span>
          </div>
          <div className="lives-grid lives-grid-trend">
            <DashCard title="Receita semanal" hint={`período: ${period === 'week' ? 'essa semana' : period === 'month' ? 'esse mês' : period === 'custom' ? `${customFrom || '?'} → ${customTo || 'hoje'}` : `últimos ${period} dias`}`}>
              <WeeklyTrend data={weekly} />
            </DashCard>
            <DashCard title="Mês atual vs anterior" hint={`comparativo justo · dia 1–${mvp.dayOfMonth} de cada mês`}>
              <MonthVsPrev mvp={mvp} today={today} />
            </DashCard>
          </div>

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
            <LivesTable lives={tableLives} merchans={merchans} onRowClick={onLiveClick} onStatusChange={onStatusChange} limit={60} />
          </DashCard>
        </>
      )}
    </div>
  )
}
