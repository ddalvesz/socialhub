import type { Brand, Story, DayAggregate } from '@/lib/types'

// ─── Formatting ───────────────────────────────────────────────

export function fmtBRL(n: number): string {
  return 'R$ ' + Math.round(n).toLocaleString('pt-BR')
}

export function fmtBRLk(n: number): string {
  if (n === 0) return 'R$ 0'
  if (Math.abs(n) >= 1000) return 'R$ ' + (n / 1000).toFixed(1).replace('.', ',') + 'k'
  return 'R$ ' + Math.round(n).toLocaleString('pt-BR')
}

export function fmtNumk(n: number): string {
  if (n === 0) return '0'
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1).replace('.', ',') + 'k'
  return String(Math.round(n))
}

export function fmtPct(x: number): string {
  return (x >= 0 ? '+' : '') + Math.round(x * 100) + '%'
}

// ─── Period filtering ─────────────────────────────────────────

export type Period = '7d' | '30d' | '90d' | '12m' | 'tudo'

export function periodDays(period: Period): number | null {
  if (period === '7d') return 7
  if (period === '30d') return 30
  if (period === '90d') return 90
  if (period === '12m') return 365
  return null
}

export function filterByPeriod<T extends { date: string }>(items: T[], period: Period, today: string): T[] {
  const days = periodDays(period)
  if (!days) return items
  const cutoff = addDays(today, -days)
  return items.filter(i => i.date >= cutoff)
}

function addDays(isoDate: string, n: number): string {
  const d = new Date(isoDate + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// ─── KPIs ─────────────────────────────────────────────────────

export interface StoriesKpis {
  receitaTotal: number
  alcanceTotal: number
  viewsTotal: number
  count: number
  countComUtm: number
}

export function storiesKpis(stories: Story[], aggregates: DayAggregate[]): StoriesKpis {
  const receitaTotal = stories.reduce((s, x) => s + (x.receita ?? 0), 0)
  const alcanceTotal = aggregates.reduce((s, x) => s + x.alcance, 0)
  const viewsTotal   = aggregates.reduce((s, x) => s + x.visualizacoes, 0)
  const count        = stories.length
  const countComUtm  = stories.filter(s => s.rastreioReceita).length
  return { receitaTotal, alcanceTotal, viewsTotal, count, countComUtm }
}

export function eficienciaAlcance(receita: number, alcance: number): number | null {
  if (!alcance) return null
  return (receita / alcance) * 1000
}

// ─── UTM generation ───────────────────────────────────────────

// Mantida para compatibilidade com código existente (gocase stories legado)
export function buildStoryUtm(date: string, hora: number, produtoNome: string) {
  const d = date.replace(/-/g, '')
  const h = String(hora).padStart(2, '0')
  const norm = produtoNome.normalize('NFD').replace(/[̀-ͯ]/g, '')
  const pascalCase = norm.split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('')
  const slug = pascalCase.toLowerCase().replace(/[^a-z0-9]/g, '')
  const campaign = `stories_${d}${h}_${pascalCase}`
  const url = `https://www.gocase.com.br/${slug}?utm_source=instagram&utm_medium=organic_social&utm_campaign=${campaign}`
  return { campaign, url, slug }
}

function removerAcentos(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function toPascalCase(nome: string): string {
  return removerAcentos(nome)
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('')
}

function toSlug(nome: string): string {
  return removerAcentos(nome).toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function buildUtmForStory(
  brand: Brand,
  date: string,
  hora: number,
  produtoNome: string,
  baseLink: string,
): { campaign: string; url: string } {
  const d = date.replace(/-/g, '')
  const h = String(hora).padStart(2, '0')

  if (brand === 'gocase') {
    const pascal = toPascalCase(produtoNome)
    const campaign = `stories_${d}${h}_${pascal}`
    const url = `${baseLink}?utm_source=instagram&utm_medium=organic_social&utm_campaign=${campaign}`
    return { campaign, url }
  }

  // Gobeauté (barbours, kokeshi, lescent)
  const slug = toSlug(produtoNome)
  const campaign = `${d}${h}_stories${slug}`
  const url = `${baseLink}?utm_source=instagram&utm_medium=stories&utm_campaign=${campaign}`
  return { campaign, url }
}

export function buildUtmForLive(
  brand: Brand,
  date: string,
  hora: string,        // "HH:mm"
  produtoNome?: string,
  baseLink?: string,
): { campaign: string; url: string } {
  const d = date.replace(/-/g, '')
  const hRaw = (hora ?? '').slice(0, 2)
  const h = hRaw.length === 2 ? hRaw.padStart(2, '0') : ''

  if (brand === 'gocase') {
    const campaign = `live_${d}${h}`
    const url = `https://www.gocase.com.br/?utm_source=instagram&utm_medium=organic_live&utm_campaign=${campaign}`
    return { campaign, url }
  }

  // Gobeauté (barbours, kokeshi, lescent)
  const slug = toSlug(produtoNome ?? '')
  const campaign = `${d}${h}_live${slug}`
  const url = `${baseLink ?? ''}?utm_source=instagram&utm_medium=live&utm_campaign=${campaign}`
  return { campaign, url }
}

// ─── Chart 1: Comparação de receita ──────────────────────────

export interface CompPoint { label: string; atual: number | null; anterior: number | null }

export function receitaComparacao(stories: Story[], period: Period, today: string): CompPoint[] {
  if (period === '7d') {
    const weekStart = addDays(today, -6)
    const prevStart = addDays(today, -13)
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
    return Array.from({ length: 7 }, (_, i) => {
      const curDate  = addDays(weekStart, i)
      const prevDate = addDays(prevStart, i)
      const dow = (new Date(curDate + 'T12:00:00').getDay() + 6) % 7
      return {
        label: days[dow],
        atual:    stories.filter(s => s.date === curDate).reduce((a, s) => a + (s.receita ?? 0), 0),
        anterior: stories.filter(s => s.date === prevDate).reduce((a, s) => a + (s.receita ?? 0), 0),
      }
    })
  }
  if (period === '30d') {
    const start = addDays(today, -29)
    const prevStart = addDays(today, -59)
    return Array.from({ length: 30 }, (_, i) => {
      const curDate  = addDays(start, i)
      const prevDate = addDays(prevStart, i)
      return {
        label: `Dia ${i + 1}`,
        atual:    stories.filter(s => s.date === curDate).reduce((a, s) => a + (s.receita ?? 0), 0),
        anterior: stories.filter(s => s.date === prevDate).reduce((a, s) => a + (s.receita ?? 0), 0),
      }
    })
  }
  if (period === '90d') {
    // weekly sums, 13 weeks
    const start = addDays(today, -89)
    return Array.from({ length: 13 }, (_, i) => {
      const wStart = addDays(start, i * 7)
      const wEnd   = addDays(start, i * 7 + 6)
      const prevWStart = addDays(start, i * 7 - 91)
      const prevWEnd   = addDays(start, i * 7 - 85)
      return {
        label: `Sem ${i + 1}`,
        atual:    stories.filter(s => s.date >= wStart && s.date <= wEnd).reduce((a, s) => a + (s.receita ?? 0), 0),
        anterior: stories.filter(s => s.date >= prevWStart && s.date <= prevWEnd).reduce((a, s) => a + (s.receita ?? 0), 0),
      }
    })
  }
  // fallback para 12m/tudo: barras semanais simples
  const cutoff = period === '12m' ? addDays(today, -364) : (stories[0]?.date ?? today)
  const grouped = new Map<string, number>()
  for (const s of stories) {
    if (s.date < cutoff) continue
    const d = new Date(s.date + 'T12:00:00')
    const year = d.getFullYear()
    const week = Math.ceil(((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7)
    const key = `${year}-W${String(week).padStart(2, '0')}`
    grouped.set(key, (grouped.get(key) ?? 0) + (s.receita ?? 0))
  }
  return Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({ label: key.replace(/^\d{4}-/, ''), atual: v, anterior: null }))
}

export function receitaVariacao(data: CompPoint[]): number | null {
  const atualTotal    = data.reduce((s, d) => s + (d.atual ?? 0), 0)
  const anteriorTotal = data.reduce((s, d) => s + (d.anterior ?? 0), 0)
  if (!anteriorTotal) return null
  return (atualTotal - anteriorTotal) / anteriorTotal
}

// ─── Chart 2: Engajamento diário ─────────────────────────────

export interface EngajPoint { date: string; label: string; alcance: number; visualizacoes: number }

export function engajamentoDiario(aggregates: DayAggregate[]): EngajPoint[] {
  return aggregates
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(ag => {
      const [, mm, dd] = ag.date.split('-')
      return { date: ag.date, label: `${dd}/${mm}`, alcance: ag.alcance, visualizacoes: ag.visualizacoes }
    })
}

// ─── Chart 3: Correlação receita × alcance ───────────────────

export interface CorrelPoint { date: string; label: string; alcance: number; receita: number }

export function correlacaoReceitaAlcance(stories: Story[], aggregates: DayAggregate[]): CorrelPoint[] {
  const aggMap = new Map(aggregates.map(ag => [ag.date, ag]))
  const byDate = new Map<string, number>()
  for (const s of stories) {
    byDate.set(s.date, (byDate.get(s.date) ?? 0) + (s.receita ?? 0))
  }
  const dates = Array.from(new Set([...aggMap.keys(), ...byDate.keys()])).sort()
  return dates.map(date => {
    const [, mm, dd] = date.split('-')
    return {
      date,
      label:    `${dd}/${mm}`,
      alcance:  aggMap.get(date)?.alcance ?? 0,
      receita:  byDate.get(date) ?? 0,
    }
  })
}

// ─── Chart 4: Projeção do mês ─────────────────────────────────

export interface ProjecaoMes {
  curRev: number
  prevRev: number
  delta: number | null
  projected: number
  dayOfMonth: number
  daysInMonth: number
  alcanceCur: number
  alcancePrev: number
}

export function projecaoMes(stories: Story[], aggregates: DayAggregate[], today: string): ProjecaoMes {
  const [year, month] = today.split('-').map(Number)
  const dayOfMonth = Number(today.split('-')[2])
  const daysInMonth = new Date(year, month, 0).getDate()

  const firstCur  = `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-01`
  const lastPrevMonth = new Date(year, month - 1, 0).getDate()
  const prevYear  = month === 1 ? year - 1 : year
  const prevMonth = month === 1 ? 12 : month - 1
  const firstPrev = `${String(prevYear).padStart(4,'0')}-${String(prevMonth).padStart(2,'0')}-01`
  const lastPrev  = `${String(prevYear).padStart(4,'0')}-${String(prevMonth).padStart(2,'0')}-${String(Math.min(dayOfMonth, lastPrevMonth)).padStart(2,'0')}`

  const curRev  = stories.filter(s => s.date >= firstCur && s.date <= today).reduce((a, s) => a + (s.receita ?? 0), 0)
  const prevRev = stories.filter(s => s.date >= firstPrev && s.date <= lastPrev).reduce((a, s) => a + (s.receita ?? 0), 0)
  const delta   = prevRev ? (curRev - prevRev) / prevRev : null
  const projected = dayOfMonth ? (curRev / dayOfMonth) * daysInMonth : 0

  const aggMap = new Map(aggregates.map(ag => [ag.date, ag]))
  const alcanceCur  = Array.from(aggMap.entries()).filter(([d]) => d >= firstCur && d <= today).reduce((a, [, ag]) => a + ag.alcance, 0)
  const alcancePrev = Array.from(aggMap.entries()).filter(([d]) => d >= firstPrev && d <= lastPrev).reduce((a, [, ag]) => a + ag.alcance, 0)

  return { curRev, prevRev, delta, projected, dayOfMonth, daysInMonth, alcanceCur, alcancePrev }
}

// ─── Chart 5: Média por dia da semana ────────────────────────

export interface DiaSemanaPoint {
  label: string
  avgAlcance: number
  avgReceita: number
}

export function mediaPorDiaSemana(stories: Story[], aggregates: DayAggregate[]): DiaSemanaPoint[] {
  const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const receitaBuckets: number[][] = Array.from({ length: 7 }, () => [])
  const alcanceBuckets: number[][] = Array.from({ length: 7 }, () => [])

  for (const s of stories) {
    if (!s.date) continue
    const dow = (new Date(s.date + 'T12:00:00').getDay() + 6) % 7
    receitaBuckets[dow].push(s.receita ?? 0)
  }
  for (const ag of aggregates) {
    if (!ag.date) continue
    const dow = (new Date(ag.date + 'T12:00:00').getDay() + 6) % 7
    alcanceBuckets[dow].push(ag.alcance)
  }

  return labels.map((label, i) => ({
    label,
    avgAlcance: alcanceBuckets[i].length ? alcanceBuckets[i].reduce((a, v) => a + v, 0) / alcanceBuckets[i].length : 0,
    avgReceita: receitaBuckets[i].length ? receitaBuckets[i].reduce((a, v) => a + v, 0) / receitaBuckets[i].length : 0,
  }))
}

// ─── Chart 6: Heatmap timing ──────────────────────────────────

export interface HeatCell { slot: number; dow: number; avg: number; count: number }

export function heatmapTiming(stories: Story[]): { cells: HeatCell[]; maxVal: number } {
  const buckets = new Map<string, number[]>()
  for (const s of stories) {
    if (!s.date || s.receita == null) continue
    const dow  = (new Date(s.date + 'T12:00:00').getDay() + 6) % 7
    const slot = Math.floor((s.hora - 7) / 2)
    if (slot < 0 || slot > 7) continue
    const key = `${slot}_${dow}`
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(s.receita)
  }

  const cells: HeatCell[] = []
  let maxVal = 0
  for (const [key, vals] of buckets.entries()) {
    const [slot, dow] = key.split('_').map(Number)
    const avg = vals.reduce((a, v) => a + v, 0) / vals.length
    if (avg > maxVal) maxVal = avg
    cells.push({ slot, dow, avg, count: vals.length })
  }
  return { cells, maxVal }
}

// ─── Chart 7: Performance por produto ────────────────────────

export interface ProdutoMetric { produto: string; total: number; count: number }

export function performancePorProduto(stories: Story[]): ProdutoMetric[] {
  const map = new Map<string, { total: number; count: number }>()
  for (const s of stories) {
    if (!s.produto || !s.receita) continue
    const cur = map.get(s.produto) ?? { total: 0, count: 0 }
    map.set(s.produto, { total: cur.total + s.receita, count: cur.count + 1 })
  }
  return Array.from(map.entries())
    .map(([produto, v]) => ({ produto, ...v }))
    .sort((a, b) => b.total - a.total)
}

// ─── Product colors ───────────────────────────────────────────

const PRODUCT_COLORS = [
  'oklch(0.66 0.16 30)',
  'oklch(0.60 0.15 200)',
  'oklch(0.60 0.14 260)',
  'oklch(0.60 0.16 320)',
  'oklch(0.58 0.15 150)',
  'oklch(0.62 0.14 50)',
  'oklch(0.60 0.15 90)',
  'oklch(0.58 0.14 180)',
  'oklch(0.60 0.15 340)',
  'oklch(0.58 0.14 120)',
]

export function produtoColor(produto: string, index: number): string {
  return PRODUCT_COLORS[index % PRODUCT_COLORS.length]
}

// ─── Status labels ────────────────────────────────────────────

export const STORY_STATUS_META: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  nao_iniciado: {
    label: 'Não iniciado',
    bg: 'var(--surface-3)',
    text: 'var(--ink-3)',
    border: 'var(--line)',
    dot: 'oklch(0.72 0.02 300)',
  },
  em_andamento: {
    label: 'Em andamento',
    bg: 'oklch(0.96 0.06 60)',
    text: 'oklch(0.4 0.15 50)',
    border: 'oklch(0.86 0.1 60)',
    dot: 'oklch(0.72 0.16 55)',
  },
  feito: {
    label: 'Feito',
    bg: 'oklch(0.96 0.04 265)',
    text: 'oklch(0.4 0.13 265)',
    border: 'oklch(0.85 0.08 265)',
    dot: 'oklch(0.6 0.13 265)',
  },
  nao_postado: {
    label: 'Não postado',
    bg: 'oklch(0.95 0.04 25)',
    text: 'oklch(0.46 0.14 25)',
    border: 'oklch(0.87 0.09 25)',
    dot: 'oklch(0.5 0.15 25)',
  },
  proposta: {
    label: 'Proposta',
    bg: 'oklch(0.95 0.04 150)',
    text: 'oklch(0.38 0.13 150)',
    border: 'oklch(0.86 0.08 150)',
    dot: 'oklch(0.6 0.13 150)',
  },
  postado: {
    label: 'Postado',
    bg: 'oklch(0.93 0.06 145)',
    text: 'oklch(0.32 0.12 145)',
    border: 'oklch(0.80 0.1 145)',
    dot: 'oklch(0.42 0.15 145)',
  },
}
