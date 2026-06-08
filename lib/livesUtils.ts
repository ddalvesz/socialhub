// ============================================================
// SocialHub — Lives aggregation helpers & formatters
// Translated from socialhub-lives-data.jsx (design prototype)
// ============================================================

import type { Live, Merchan } from './types'

// ─── Constants ───────────────────────────────────────────────

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const
export const WEEKDAY_NOMES  = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'] as const

export const MONTH_NAMES_PT = [
  'janeiro','fevereiro','março','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro',
] as const

export const MONTH_SHORT_PT = [
  'jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez',
] as const

// ─── Color / label helpers ───────────────────────────────────

export function hashStr(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function colorFromName(name: string): string {
  const h = hashStr(name) % 360
  return `oklch(0.66 0.15 ${h})`
}

const SHORT_MAP: [string, string][] = [
  ['DESCONTO + FRETE GRÁTIS + 3X SEM JUROS', 'D+FG+3X'],
  ['DESCONTO + FRETE GRÁTIS + MIMO', 'D+FG+M'],
  ['DESCONTO + FRETE GRÁTIS', 'D+FG'],
  ['DESCONTO + 3X SEM JUROS', 'D+3X'],
  ['DESCONTO + MIMO', 'D+M'],
  ['FRETE GRÁTIS + 3X SEM JUROS', 'FG+3X'],
  ['FRETE GRÁTIS + MIMO', 'FG+M'],
  ['3X SEM JUROS + MIMO', '3X+M'],
  ['DESCONTO SURPRESA + MIMO', 'DS+M'],
  ['R$20 OFF EM COMPRAS A PARTIR DE R$150', 'R$20 / R$150'],
  ['10% OFF EM COMPRAS A PARTIR DE R$99 VÁLIDO POR TRÊS HORAS', '10% / R$99 · 3h'],
  ['10% OFF EM COMPRAS A PARTIR DE R$99', '10% / R$99'],
  ['ESCOLHA SEU MIMO', 'Escolha mimo'],
  ['MIMO FIXO', 'Mimo fixo'],
  ['2 MIMOS', '2 mimos'],
  ['APENAS LINK UTM', 'Só UTM'],
]

export function shortLabel(name: string): string {
  for (const [k, v] of SHORT_MAP) if (name === k) return v
  return name.split(/\s+/).slice(0, 3).map(w => w[0] ?? '').join('')
}

// ─── Formatters ───────────────────────────────────────────────

export const fmtBRL = (n: number) =>
  'R$ ' + Math.round(n).toLocaleString('pt-BR')

export const fmtBRLk = (n: number): string => {
  if (Math.abs(n) >= 1_000_000) return 'R$ ' + (n / 1_000_000).toFixed(1).replace('.', ',') + 'M'
  if (Math.abs(n) >= 1000) return 'R$ ' + (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',') + 'k'
  return 'R$ ' + Math.round(n).toLocaleString('pt-BR')
}

export const fmtPct = (x: number) => (x * 100).toFixed(0) + '%'

// ─── Period filter ────────────────────────────────────────────

export function inPeriod(iso: string, periodDays: number | 'all', todayIso: string): boolean {
  if (periodDays === 'all') return true
  const a = new Date(iso + 'T00:00:00')
  const b = new Date(todayIso + 'T00:00:00')
  const diff = (b.getTime() - a.getTime()) / 86400000
  return diff >= 0 && diff <= periodDays
}

// ─── KPI aggregation ─────────────────────────────────────────

export interface LiveKpis {
  count: number
  total: number
  avg: number
  best: Live | null
  alcanceCount: number
  alcanceTotal: number
  utmCount: number
  utmShareTotal: number
  utmShareSum: number
}

export function liveKpis(lives: Live[]): LiveKpis {
  const real = lives.filter(l => l.status === 'realizada')
  if (real.length === 0) {
    return { count: 0, total: 0, avg: 0, best: null, alcanceCount: 0, alcanceTotal: 0, utmCount: 0, utmShareTotal: 0, utmShareSum: 0 }
  }
  const total = real.reduce((s, l) => s + l.receitaTotal, 0)
  const best = real.reduce((m, l) => l.receitaTotal > (m?.receitaTotal ?? -1) ? l : m, null as Live | null)
  const withUtm     = real.filter(l => l.receitaUtm > 0)
  const withAlcance = real.filter(l => l.alcance > 0)
  return {
    count: real.length,
    total,
    avg: total / real.length,
    best,
    alcanceCount:  withAlcance.length,
    alcanceTotal:  withAlcance.reduce((s, l) => s + l.alcance, 0),
    utmCount:      withUtm.length,
    utmShareTotal: withUtm.reduce((s, l) => s + l.receitaUtm, 0),
    utmShareSum:   withUtm.reduce((s, l) => s + l.receitaTotal, 0),
  }
}

// ─── Flatten cupons for per-merchan analysis ─────────────────

interface CupomObs {
  live: Live
  merchan: string
  nominal: string
  receita: number
  slot: 1 | 2
}

function flattenCupons(lives: Live[]): CupomObs[] {
  const out: CupomObs[] = []
  for (const l of lives) {
    if (l.merchan1 && l.receita1 > 0) out.push({ live: l, merchan: l.merchan1, nominal: l.nominal1, receita: l.receita1, slot: 1 })
    if (l.merchan2 && l.receita2 > 0) out.push({ live: l, merchan: l.merchan2, nominal: l.nominal2, receita: l.receita2, slot: 2 })
  }
  return out
}

// ─── Per-merchan metrics ──────────────────────────────────────

export interface MerchanMetric {
  merchanId: string
  name: string
  short: string
  color: string
  forte: boolean
  sempreSozinho: boolean
  count: number
  countSlot1: number
  countSlot2: number
  total: number
  avg: number
  slot1Pct: number
}

export function perMerchanMetrics(lives: Live[], merchans: Merchan[]): MerchanMetric[] {
  const real = lives.filter(l => l.status === 'realizada')
  const obs  = flattenCupons(real)
  return merchans.map(m => {
    const mine  = obs.filter(o => o.merchan === m.nome)
    const slot1 = mine.filter(o => o.slot === 1)
    const total = mine.reduce((s, o) => s + o.receita, 0)
    return {
      merchanId:     m.id,
      name:          m.nome,
      short:         m.short,
      color:         m.color,
      forte:         m.forte,
      sempreSozinho: m.sempreSozinho,
      count:         mine.length,
      countSlot1:    slot1.length,
      countSlot2:    mine.length - slot1.length,
      total,
      avg:           mine.length > 0 ? total / mine.length : 0,
      slot1Pct:      mine.length > 0 ? slot1.length / mine.length : 0,
    }
  }).filter(x => x.count > 0).sort((a, b) => b.avg - a.avg)
}

// ─── Weekly trend ─────────────────────────────────────────────

export interface WeekData {
  key: string
  year: number
  week: number
  total: number
  count: number
  label: string
}

function weekKey(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  const day = d.getDay() || 7
  d.setDate(d.getDate() + (4 - day))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { year: d.getFullYear(), week, key: `${d.getFullYear()}-W${String(week).padStart(2, '0')}` }
}

export function weeklyTrend(lives: Live[]): WeekData[] {
  const real = lives.filter(l => l.status === 'realizada')
  const map = new Map<string, WeekData>()
  for (const l of real) {
    const k = weekKey(l.date)
    if (!map.has(k.key)) map.set(k.key, { key: k.key, year: k.year, week: k.week, total: 0, count: 0, label: `${String(k.week).padStart(2, '0')}/${String(k.year).slice(-2)}` })
    const e = map.get(k.key)!
    e.total += l.receitaTotal
    e.count += 1
  }
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key))
}

// ─── Heatmap ──────────────────────────────────────────────────

export interface HeatCell { merchan: string; avg: number; count: number }
export interface HeatRow  { weekday: number; cells: HeatCell[] }
export interface HeatData { matrix: HeatRow[]; max: number }

export function heatmapMatrix(lives: Live[], merchans: Merchan[]): HeatData {
  const real = lives.filter(l => l.status === 'realizada')
  const obs  = flattenCupons(real)
  const grid: Record<string, { sum: number; n: number }> = {}
  for (const o of obs) {
    const wd  = new Date(o.live.date + 'T00:00:00').getDay()
    const key = `${wd}::${o.merchan}`
    if (!grid[key]) grid[key] = { sum: 0, n: 0 }
    grid[key].sum += o.receita
    grid[key].n   += 1
  }
  let max = 0
  const matrix: HeatRow[] = []
  for (let wd = 0; wd < 7; wd++) {
    const cells: HeatCell[] = []
    for (const m of merchans) {
      const e   = grid[`${wd}::${m.nome}`]
      const avg = e ? e.sum / e.n : 0
      if (avg > max) max = avg
      cells.push({ merchan: m.nome, avg, count: e ? e.n : 0 })
    }
    matrix.push({ weekday: wd, cells })
  }
  return { matrix, max }
}

// ─── Month vs previous month ──────────────────────────────────

export interface MonthVsPrevData {
  cur: number
  prev: number
  delta: number
  diff: number
  dayOfMonth: number
  endDayPrev: number
}

export function monthVsPrev(lives: Live[], todayIso: string): MonthVsPrevData {
  const today      = new Date(todayIso + 'T00:00:00')
  const dayOfMonth = today.getDate()
  const startCur   = new Date(today.getFullYear(), today.getMonth(), 1)
  const startPrev  = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate()
  const endDayPrev = Math.min(dayOfMonth, lastDayPrevMonth)
  const endPrev    = new Date(today.getFullYear(), today.getMonth() - 1, endDayPrev)
  const real = lives.filter(l => l.status === 'realizada')
  const sumIn = (a: Date, b: Date) =>
    real.filter(l => {
      const d = new Date(l.date + 'T00:00:00')
      return d >= a && d <= b
    }).reduce((s, l) => s + l.receitaTotal, 0)
  const cur  = sumIn(startCur, today)
  const prev = sumIn(startPrev, endPrev)
  return {
    cur,
    prev,
    delta: prev === 0 ? 0 : (cur - prev) / prev,
    diff: cur - prev,
    dayOfMonth,
    endDayPrev,
  }
}
