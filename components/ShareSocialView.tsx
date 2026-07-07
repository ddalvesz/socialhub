'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addDaysISO, fmtBR, BRANDS, type Brand } from '@/lib/types'
import { mN, mFull, mPct, KpiCard, SectionHead, ChartLegend, DualBarLineChart, ProgressBar, MONTH_LABELS } from './metrics/SharedMetricsUI'

// ── Colors ────────────────────────────────────────────────────────────────────

const SS_GREEN      = 'oklch(0.48 0.15 152)'
const SS_GREEN_SOFT = 'oklch(0.78 0.08 152)'
const SS_AMBER      = 'oklch(0.55 0.14 50)'
const SS_OK         = 'oklch(0.46 0.13 150)'
const SS_RED        = 'oklch(0.5 0.16 25)'

// ── Data ──────────────────────────────────────────────────────────────────────

interface MesData {
  label: string
  mes: number
  social: number
  meta: number
  gocase: number
  shareM: number
}

interface DiaRaw {
  date: string
  ano: number
  mes: number
  dia: number
  storyReceita: number
  storyOrders: number
  livesReceita: number
  livesOrders: number
  gocaseReceita: number
  meta: number
}

interface DiaData extends DiaRaw {
  socialReceita: number
  accStory: number
  accLives: number
  accSocial: number
  accGocase: number
  prevAccStory: number
  prevAccLives: number
  prevAccSocial: number
  prevAccGocase: number
  shareDia: number
  shareMesAcumulado: number
  shareMesAteOntem: number
  diasNoMes: number
  metaDiaria: number
  metaAcumulada: number
}

function computeDias(raw: DiaRaw[]): DiaData[] {
  let accStory = 0, accLives = 0, accGocase = 0
  return raw.map(d => {
    const prevAccStory = accStory, prevAccLives = accLives, prevAccGocase = accGocase
    const prevAccSocial = prevAccStory + prevAccLives
    accStory += d.storyReceita
    accLives += d.livesReceita
    accGocase += d.gocaseReceita
    const accSocial = accStory + accLives
    const socialReceita = d.storyReceita + d.livesReceita
    const diasNoMes = new Date(d.ano, d.mes, 0).getDate()
    const metaDiaria = diasNoMes > 0 ? d.meta / diasNoMes : 0
    const metaAcumulada = metaDiaria * d.dia
    const shareDia = d.gocaseReceita > 0 ? (socialReceita / d.gocaseReceita) * 100 : 0
    const shareMesAcumulado = accGocase > 0 ? (accSocial / accGocase) * 100 : 0
    const shareMesAteOntem = prevAccGocase > 0 ? (prevAccSocial / prevAccGocase) * 100 : 0
    return {
      ...d, socialReceita, accStory, accLives, accSocial, accGocase,
      prevAccStory, prevAccLives, prevAccSocial, prevAccGocase,
      shareDia, shareMesAcumulado, shareMesAteOntem, diasNoMes, metaDiaria, metaAcumulada,
    }
  })
}

function computeDefaultDay(dias: DiaData[] | undefined, ano: number, mes: number): number | null {
  if (!dias || !dias.length) return null
  const now = new Date()
  const isCurrentMonth = now.getFullYear() === ano && now.getMonth() + 1 === mes
  if (isCurrentMonth) {
    const todayDay = now.getDate()
    return dias.some(d => d.dia === todayDay) ? todayDay : dias[dias.length - 1].dia
  }
  return dias[dias.length - 1].dia
}

function anosDisponiveis(mensalPorAno: Record<number, MesData[]>, diarioPorAnoMes: Record<string, DiaData[]>): number[] {
  const anos = new Set<number>()
  Object.keys(mensalPorAno).forEach(y => anos.add(Number(y)))
  Object.keys(diarioPorAnoMes).forEach(k => anos.add(Number(k.split('-')[0])))
  return Array.from(anos).sort((a, b) => a - b)
}

function mesesDisponiveis(ano: number, mensalPorAno: Record<number, MesData[]>, diarioPorAnoMes: Record<string, DiaData[]>): number[] {
  const meses = new Set<number>()
  ;(mensalPorAno[ano] ?? []).forEach(m => meses.add(m.mes))
  Object.keys(diarioPorAnoMes).forEach(k => {
    const [y, m] = k.split('-').map(Number)
    if (y === ano) meses.add(m)
  })
  return Array.from(meses).sort((a, b) => a - b)
}

function useShareSocialData(brand: Brand) {
  const [mensalPorAno, setMensalPorAno] = useState<Record<number, MesData[]> | null>(null)
  const [diarioPorAnoMes, setDiarioPorAnoMes] = useState<Record<string, DiaData[]> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setMensalPorAno(null)
    setDiarioPorAnoMes(null)

    async function load() {
      const sb = createClient()
      const [rMensal, rDiario] = await Promise.all([
        sb.from('v_share_social_mensal').select('*').eq('brand', brand).order('ano').order('mes'),
        sb.from('v_share_social_diario').select('*').eq('brand', brand).order('date'),
      ])

      if (rMensal.error || rDiario.error) {
        setError('Erro ao carregar dados de Share Social')
        setLoading(false)
        return
      }

      const byYear: Record<number, MesData[]> = {}
      for (const r of rMensal.data ?? []) {
        const social = Number(r.receita_social)
        const gocase = Number(r.receita_gocase)
        const meta = r.meta != null ? Number(r.meta) : 0
        const shareM = gocase > 0 ? (social / gocase) * 100 : 0
        if (!byYear[r.ano]) byYear[r.ano] = []
        byYear[r.ano].push({ label: MONTH_LABELS[r.mes - 1], mes: r.mes, social, meta, gocase, shareM })
      }

      const rawByMonth: Record<string, DiaRaw[]> = {}
      for (const r of rDiario.data ?? []) {
        const key = `${r.ano}-${r.mes}`
        if (!rawByMonth[key]) rawByMonth[key] = []
        rawByMonth[key].push({
          date: r.date, ano: r.ano, mes: r.mes, dia: r.dia,
          storyReceita: Number(r.story_receita), storyOrders: Number(r.story_orders),
          livesReceita: Number(r.lives_receita), livesOrders: Number(r.lives_orders),
          gocaseReceita: Number(r.receita_gocase), meta: r.meta != null ? Number(r.meta) : 0,
        })
      }
      const diario: Record<string, DiaData[]> = {}
      for (const key in rawByMonth) diario[key] = computeDias(rawByMonth[key])

      setMensalPorAno(byYear)
      setDiarioPorAnoMes(diario)
      setLoading(false)
    }
    load().catch(() => {
      setError('Erro inesperado ao carregar dados de Share Social')
      setLoading(false)
    })
  }, [brand])

  return { mensalPorAno, diarioPorAnoMes, loading, error }
}

// ── Daily revenue card (Story / Lives / Social) with "accumulated until previous day" hover ──

function DailyRevenueCard({ label, value, dateLabel, accumLabel, accumValue, highlight }: {
  label: string
  value: number
  dateLabel: string
  accumLabel: string
  accumValue: number | null
  highlight?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{
        background: highlight ? 'var(--accent-gradient-softer)' : 'var(--surface)',
        border: `1px solid ${highlight ? 'var(--accent-soft)' : 'var(--line)'}`,
        borderRadius: 'var(--radius-md)', padding: '14px 18px', userSelect: 'none',
      }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: highlight ? 'var(--accent-deep)' : 'var(--ink-3)', marginBottom: 5 }}>
          {label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.022em', color: highlight ? 'var(--accent-deep)' : 'var(--ink)', lineHeight: 1, fontVariantNumeric: 'tabular-nums', marginBottom: 6 }}>
          {mN(value)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{dateLabel}</div>
      </div>

      {hovered && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 7px)', left: 0, right: 0, zIndex: 30,
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)', padding: '10px 14px',
          boxShadow: '0 8px 24px oklch(0 0 0 / 0.1)', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 10, color: 'var(--ink-4)', marginBottom: 4 }}>{accumLabel}</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {accumValue == null ? '—' : mFull(accumValue)}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Pace card ─────────────────────────────────────────────────────────────────
// Em andamento: real = acumulado até ontem (evita distorcer com o dia corrente incompleto), 3ª coluna = pace
// projetado, footer mostra dias restantes + ritmo diário necessário pra bater a meta.
// Mês completo: real = total do mês, 3ª coluna vira Saldo (não faz sentido "projetar" um mês que já fechou).

function PaceCard({ dia, meta }: { dia: DiaData; meta: number }) {
  const now = new Date()
  const isMonthComplete = !(now.getFullYear() === dia.ano && now.getMonth() + 1 === dia.mes)
  const baseDias = isMonthComplete ? dia.dia : dia.dia - 1
  const real = isMonthComplete ? dia.accSocial : dia.prevAccSocial
  const pace = baseDias > 0 ? (real / baseDias) * dia.diasNoMes : 0
  const pctPace = meta > 0 && baseDias > 0 ? (pace / meta) * 100 : 0
  const pctReal = meta > 0 ? (real / meta) * 100 : 0
  const saldo = real - meta
  const remainingDays = dia.diasNoMes - baseDias
  const neededPerDay = !isMonthComplete && remainingDays > 0 ? (meta - real) / remainingDays : null

  if (meta <= 0) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Pace do Mês</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Meta do mês ainda não cadastrada.</div>
      </div>
    )
  }

  const color = pctPace >= 100 ? SS_OK : pctPace >= 80 ? SS_AMBER : SS_RED

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Pace do Mês</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {pctPace.toFixed(0)}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>no pace atual</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>Real</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{mN(real)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>Meta</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>{mN(meta)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>{isMonthComplete ? 'Saldo' : 'Pace proj.'}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
            {isMonthComplete ? `${saldo >= 0 ? '+' : ''}${mFull(saldo)}` : mN(pace)}
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', height: 10, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ position: 'absolute', inset: 0, width: `${Math.min(pctPace, 100)}%`, background: color, opacity: 0.3, borderRadius: 999, transition: 'width .5s' }} />
        <div style={{ position: 'absolute', inset: 0, width: `${Math.min(pctReal, 100)}%`, background: color, borderRadius: 999, transition: 'width .5s' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>
          {pctReal.toFixed(0)}% {isMonthComplete ? (pctReal >= 100 ? '✓ meta atingida' : 'realizado') : 'do mês realizado'}
        </span>
        {!isMonthComplete && neededPerDay != null && (
          <span style={{ fontSize: 11.5, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
            {remainingDays}d · {mN(neededPerDay)}/dia
          </span>
        )}
      </div>
    </div>
  )
}

// ── Legacy pace panel (usado apenas em 2025, sem dado diário) ────────────────

function SSPacePanel({ curr, prev, brandName }: { curr: MesData; prev: MesData | null; brandName: string }) {
  const pct = curr.meta > 0 ? (curr.social / curr.meta) * 100 : 0
  const saldo = curr.social - curr.meta
  const color = pct >= 100 ? SS_OK : pct >= 80 ? SS_AMBER : SS_RED

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Meta Mensal</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{mN(curr.meta)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Realizado</div>
            <div style={{ fontSize: 20, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{mN(curr.social)}</div>
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <ProgressBar pct={pct} color={color} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color }}>
            {pct.toFixed(1)}% {pct >= 100 ? '✓ meta atingida' : 'da meta'}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>
            {saldo >= 0 ? '+' : ''}{mFull(saldo)}
          </span>
        </div>
      </div>

      {prev && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '14px 18px' }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>vs {prev.label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {([
              { label: 'Receita Social', curr: curr.social, prev: prev.social, fmt: mN, isPct: false },
              { label: 'Share %',        curr: curr.shareM, prev: prev.shareM, fmt: mPct, isPct: true },
              { label: brandName,        curr: curr.gocase, prev: prev.gocase, fmt: mN, isPct: false },
            ] as const).map(({ label, curr: c, prev: p, fmt, isPct }) => {
              const delta = isPct ? (c - p) : ((c - p) / Math.abs(p)) * 100
              const up = delta >= 0
              return (
                <div key={label}>
                  <div style={{ fontSize: 10, color: 'var(--ink-4)', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(c)}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: up ? SS_OK : SS_RED, marginTop: 2 }}>
                    {up ? '+' : ''}{isPct ? delta.toFixed(2).replace('.', ',') + 'pp' : delta.toFixed(1) + '%'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Daily tracking table ("Acompanhamento do Mês") ───────────────────────────

const PRIMARY_CELL: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }
const SECONDARY_CELL: React.CSSProperties = { fontSize: 11, fontWeight: 500, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }

// Mini indicador de progresso (% de Social Ac. sobre Meta Ac. do mesmo dia) — verde ≥100%, âmbar 80-99%, vermelho <80%.
function MetaProgressCell({ pct }: { pct: number }) {
  const color = pct >= 100 ? SS_OK : pct >= 80 ? SS_AMBER : SS_RED
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingRight: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{pct.toFixed(0)}%</span>
      <ProgressBar pct={pct} color={color} height={5} />
    </div>
  )
}

// Cards de resumo do mês, acima da tabela diária.
function SSDailySummary({ dias, meta }: { dias: DiaData[]; meta: number }) {
  const last = dias[dias.length - 1]
  const total = last.accSocial
  const pctMeta = meta > 0 ? (total / meta) * 100 : 0
  const melhorDia = dias.reduce((best, d) => (d.socialReceita > best.socialReceita ? d : best), dias[0])
  const color = pctMeta >= 100 ? SS_OK : pctMeta >= 80 ? SS_AMBER : SS_RED
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
      <KpiCard label="Total do Mês (Social)" value={mN(total)} sub={mFull(total)} />
      <KpiCard
        label="% Meta Atingida"
        value={`${pctMeta.toFixed(0)}%`}
        sub={meta > 0 ? `meta ${mN(meta)}` : 'meta não cadastrada'}
        valueColor={meta > 0 ? color : undefined}
      />
      <KpiCard label="Melhor Dia (Social)" value={mN(melhorDia.socialReceita)} sub={`dia ${String(melhorDia.dia).padStart(2, '0')}`} />
    </div>
  )
}

interface ColGroup { label: string; span: number; bg: string }
// Agrupamento visual das colunas — ajuste `span` se adicionar/remover colunas dentro de um bloco.
const DAILY_TABLE_GROUPS: ColGroup[] = [
  { label: '',       span: 1, bg: 'var(--surface-2)' },       // Data
  { label: 'STORY',  span: 3, bg: 'oklch(0.965 0.02 340)' },  // Story R$ / Ac. / Ped.
  { label: 'LIVES',  span: 3, bg: 'oklch(0.965 0.02 230)' },  // Lives R$ / Ac. / Ped.
  { label: 'SOCIAL', span: 5, bg: 'oklch(0.97 0.025 152)' },  // Social R$ / Meta Social / Meta Ac. / Social Ac. / % Meta
  { label: 'SHARE',  span: 2, bg: 'oklch(0.97 0.025 50)' },   // Share Dia / Share Mês
]

function SSDailyTable({ dias, mes, selectedDay, onSelectDay }: { dias: DiaData[]; mes: number; selectedDay: number; onSelectDay: (dia: number) => void }) {
  // Largura de cada coluna — Data e Pedidos ficam fixas (não há por que crescer), o resto usa
  // minmax(mínimo, 1fr) pra esticar e preencher a largura da página. Ajuste o valor mínimo livremente.
  const colWidths = [
    '110px',              // Data (fixa ao rolar)
    'minmax(90px,1fr)',   // Story R$
    'minmax(100px,1fr)',  // Story Ac.
    '80px',               // Ped. (story)
    'minmax(100px,1fr)',  // Lives R$
    'minmax(110px,1fr)',  // Lives Ac.
    '85px',               // Ped. (lives)
    'minmax(110px,1fr)',  // Social R$
    'minmax(115px,1fr)',  // Meta Social
    'minmax(115px,1fr)',  // Meta Ac.
    'minmax(115px,1fr)',  // Social Ac.
    'minmax(96px,1fr)',   // % Meta (progresso Social Ac. / Meta Ac.)
    'minmax(85px,1fr)',   // Share Dia
    'minmax(85px,1fr)',   // Share Mês
  ]
  const cols = colWidths.join(' ')
  const hdrs = ['Data', 'Story R$', 'Story Ac.', 'Ped.', 'Lives R$', 'Lives Ac.', 'Ped.', 'Social R$', 'Meta Social', 'Meta Ac.', 'Social Ac.', '% Meta', 'Share Dia', 'Share Mês']
  const now = new Date()
  // Média de shareDia do mês — base do critério de cor da coluna "Share Dia" (verde ≥110% da média, vermelho <90%).
  const mediaShareDia = dias.length ? dias.reduce((s, d) => s + d.shareDia, 0) / dias.length : 0

  return (
    // overflow-x:auto sozinho força o navegador a tratar overflow-y como não-visible também (regra do spec de
    // overflow), o que faz este wrapper virar o "ancestral de scroll" do position:sticky em vez da janela — por
    // isso o header sticky não funcionava. Solução: assumir de propósito um scroll interno (max-height + overflow-y
    // auto) e ancorar o sticky em top:0 relativo a este wrapper, não mais em var(--topbar-h)/janela.
    <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 640 }}>
      {/* overflow:visible aqui é necessário — .list tem overflow:hidden por padrão, que por spec também conta como
          "ancestral de scroll" pro sticky e intercetaria antes do wrapper acima (o que realmente tem overflow-y:auto). */}
      <div className="list" style={{ width: '100%', overflow: 'visible' }}>
        {/* Header sticky (grupo + colunas) ao rolar verticalmente dentro do wrapper acima */}
        <div style={{ position: 'sticky', top: 0, zIndex: 3 }}>
          <div className="list-row" style={{ gridTemplateColumns: cols, borderBottom: 'none' }}>
            {DAILY_TABLE_GROUPS.map((g, i) => (
              <div
                key={i}
                style={{
                  gridColumn: `span ${g.span}`,
                  alignSelf: 'stretch',
                  display: 'flex', alignItems: 'center',
                  background: g.bg,
                  padding: '6px 16px',
                  fontSize: 9.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
                  color: 'var(--ink-3)', justifyContent: g.label ? 'center' : 'flex-start',
                  ...(i === 0 ? { position: 'sticky' as const, left: 0, zIndex: 1 } : {}),
                }}
              >
                {g.label}
              </div>
            ))}
          </div>
          <div className="list-row list-head" style={{ gridTemplateColumns: cols }}>
            {hdrs.map((h, i) => (
              <div
                key={i}
                className="cell"
                style={i === 0 ? { position: 'sticky', left: 0, zIndex: 1, background: 'var(--surface-2)', borderRight: '1px solid var(--line)' } : undefined}
              >
                {h}
              </div>
            ))}
          </div>
        </div>

        {/* Data column (Data) fica fixa (sticky) ao rolar horizontalmente */}
        {dias.map(d => {
          const isSel = d.dia === selectedDay
          const isToday = now.getFullYear() === d.ano && now.getMonth() + 1 === d.mes && now.getDate() === d.dia
          const rowBg = isSel ? 'oklch(0.97 0.025 152)' : 'var(--surface)'
          const shareDiaColor = mediaShareDia > 0
            ? d.shareDia >= mediaShareDia * 1.10 ? SS_OK : d.shareDia < mediaShareDia * 0.90 ? SS_RED : 'var(--ink)'
            : 'var(--ink)'
          const pctMetaDia = d.metaAcumulada > 0 ? (d.accSocial / d.metaAcumulada) * 100 : 0
          return (
            <div
              key={d.dia}
              className="list-row"
              onClick={() => onSelectDay(d.dia)}
              style={{ gridTemplateColumns: cols, cursor: 'pointer', background: isSel ? rowBg : undefined }}
            >
              <div
                className="cell"
                style={{
                  position: 'sticky', left: 0, zIndex: 1, background: rowBg, borderRight: '1px solid var(--line)',
                  fontWeight: isSel ? 700 : 500, color: isSel ? SS_GREEN : isToday ? SS_AMBER : 'var(--ink)',
                }}
              >
                {String(d.dia).padStart(2, '0')}/{String(mes).padStart(2, '0')}{isToday ? ' •' : ''}
              </div>
              <div className="cell" style={PRIMARY_CELL}>{mFull(d.storyReceita)}</div>
              <div className="cell" style={SECONDARY_CELL}>{mFull(d.accStory)}</div>
              <div className="cell" style={SECONDARY_CELL}>{d.storyOrders}</div>
              <div className="cell" style={PRIMARY_CELL}>{mFull(d.livesReceita)}</div>
              <div className="cell" style={SECONDARY_CELL}>{mFull(d.accLives)}</div>
              <div className="cell" style={SECONDARY_CELL}>{d.livesOrders}</div>
              <div className="cell" style={PRIMARY_CELL}>{mFull(d.socialReceita)}</div>
              <div className="cell" style={SECONDARY_CELL}>{mFull(d.metaDiaria)}</div>
              <div className="cell" style={SECONDARY_CELL}>{mFull(d.metaAcumulada)}</div>
              <div className="cell" style={SECONDARY_CELL}>{mFull(d.accSocial)}</div>
              <div className="cell"><MetaProgressCell pct={pctMetaDia} /></div>
              <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: shareDiaColor }}>{mPct(d.shareDia, 1)}</div>
              <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{mPct(d.shareMesAcumulado, 1)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Monthly Summary Table ─────────────────────────────────────────────────────

function SSMonthlyTable({ data, selectedIdx, brandName }: { data: MesData[]; selectedIdx: number; brandName: string }) {
  // Mesmo agrupamento visual da tabela diária (SSDailyTable), adaptado às 7 colunas do resumo mensal.
  const monthlyTableGroups: ColGroup[] = [
    { label: '',                      span: 1, bg: 'var(--surface-2)' },      // Mês
    { label: 'SOCIAL',                span: 3, bg: 'oklch(0.97 0.025 152)' }, // Receita Social / Meta / % Meta
    { label: 'SHARE',                 span: 1, bg: 'oklch(0.97 0.025 50)' },  // Share %
    { label: brandName.toUpperCase(), span: 1, bg: 'oklch(0.965 0.02 230)' }, // Receita da marca
    { label: 'RESULTADO',             span: 1, bg: 'var(--surface-2)' },      // Saldo
  ]
  // Mês fica fixo ao rolar; o resto usa minmax(mínimo, 1fr) pra preencher a largura da página.
  const colWidths = [
    '80px',              // Mês (fixa ao rolar)
    'minmax(110px,1fr)', // Receita Social
    'minmax(100px,1fr)', // Meta
    'minmax(96px,1fr)',  // % Meta (progresso)
    'minmax(80px,1fr)',  // Share %
    'minmax(110px,1fr)', // Receita da marca
    'minmax(110px,1fr)', // Saldo
  ]
  const cols = colWidths.join(' ')
  const hdrs = ['Mês', 'Receita Social', 'Meta', '% Meta', 'Share %', `Receita ${brandName}`, 'Saldo']
  const tot = data.reduce((acc, d) => ({ social: acc.social + d.social, meta: acc.meta + d.meta, gocase: acc.gocase + d.gocase }), { social: 0, meta: 0, gocase: 0 })
  const totPct = tot.meta > 0 ? (tot.social / tot.meta) * 100 : 0
  const totSaldo = tot.social - tot.meta

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 640 }}>
      <div className="list" style={{ width: '100%', overflow: 'visible' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 3 }}>
          <div className="list-row" style={{ gridTemplateColumns: cols, borderBottom: 'none' }}>
            {monthlyTableGroups.map((g, i) => (
              <div
                key={i}
                style={{
                  gridColumn: `span ${g.span}`,
                  alignSelf: 'stretch',
                  display: 'flex', alignItems: 'center',
                  background: g.bg,
                  padding: '6px 16px',
                  fontSize: 9.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
                  color: 'var(--ink-3)', justifyContent: g.label ? 'center' : 'flex-start',
                  ...(i === 0 ? { position: 'sticky' as const, left: 0, zIndex: 1 } : {}),
                }}
              >
                {g.label}
              </div>
            ))}
          </div>
          <div className="list-row list-head" style={{ gridTemplateColumns: cols }}>
            {hdrs.map((h, i) => (
              <div
                key={i}
                className="cell"
                style={i === 0 ? { position: 'sticky', left: 0, zIndex: 1, background: 'var(--surface-2)', borderRight: '1px solid var(--line)' } : undefined}
              >
                {h}
              </div>
            ))}
          </div>
        </div>

        {data.map((d, i) => {
          const isSel = i === selectedIdx
          const pct = d.meta > 0 ? (d.social / d.meta) * 100 : 0
          const saldo = d.social - d.meta
          const rowBg = isSel ? 'oklch(0.97 0.025 152)' : 'var(--surface)'
          return (
            <div key={d.mes} className="list-row" style={{ gridTemplateColumns: cols, background: isSel ? rowBg : undefined }}>
              <div
                className="cell"
                style={{
                  position: 'sticky', left: 0, zIndex: 1, background: rowBg, borderRight: '1px solid var(--line)',
                  fontWeight: isSel ? 700 : 500, color: isSel ? SS_GREEN : 'var(--ink)',
                }}
              >
                {d.label}
              </div>
              <div className="cell" style={PRIMARY_CELL}>{mFull(d.social)}</div>
              <div className="cell" style={SECONDARY_CELL}>{mN(d.meta)}</div>
              <div className="cell"><MetaProgressCell pct={pct} /></div>
              <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{mPct(d.shareM)}</div>
              <div className="cell" style={SECONDARY_CELL}>{mN(d.gocase)}</div>
              <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: saldo >= 0 ? SS_OK : SS_RED }}>
                {saldo >= 0 ? '+' : ''}{mFull(saldo)}
              </div>
            </div>
          )
        })}

        <div className="list-row" style={{ gridTemplateColumns: cols, background: 'var(--surface-2)', borderTop: '2px solid var(--line)' }}>
          <div className="cell" style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--surface-2)', borderRight: '1px solid var(--line)', fontWeight: 700, color: 'var(--ink)', fontSize: 11 }}>Total</div>
          <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{mFull(tot.social)}</div>
          <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--ink-3)' }}>{mN(tot.meta)}</div>
          <div className="cell"><MetaProgressCell pct={totPct} /></div>
          <div className="cell" style={{ color: 'var(--ink-4)', fontSize: 11 }}>—</div>
          <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--ink-2)' }}>{mN(tot.gocase)}</div>
          <div className="cell" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: totSaldo >= 0 ? SS_OK : SS_RED }}>
            {totSaldo >= 0 ? '+' : ''}{mFull(totSaldo)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────

export default function ShareSocialView({ brand }: { brand: Brand }) {
  const brandName = BRANDS.find(b => b.slug === brand)?.name ?? brand
  const { mensalPorAno, diarioPorAnoMes, loading, error } = useShareSocialData(brand)
  const [year, setYear] = useState<number | null>(null)
  const [mes, setMes] = useState<number | null>(null)
  const [selDay, setSelDay] = useState<number | null>(null)

  useEffect(() => {
    setYear(null)
    setMes(null)
    setSelDay(null)
  }, [brand])

  useEffect(() => {
    if (!mensalPorAno || !diarioPorAnoMes || year != null) return
    const anos = anosDisponiveis(mensalPorAno, diarioPorAnoMes)
    if (!anos.length) return
    const y = anos[anos.length - 1]
    const meses = mesesDisponiveis(y, mensalPorAno, diarioPorAnoMes)
    const m = meses[meses.length - 1]
    setYear(y)
    setMes(m)
    setSelDay(computeDefaultDay(diarioPorAnoMes[`${y}-${m}`], y, m))
  }, [mensalPorAno, diarioPorAnoMes, year])

  if (loading) return <div style={{ padding: 32, color: 'var(--ink-3)' }}>Carregando…</div>
  if (error) return <div style={{ padding: 32, color: SS_RED }}>{error}</div>
  if (!mensalPorAno || !diarioPorAnoMes || year == null || mes == null) {
    return <div style={{ padding: 32, color: 'var(--ink-3)' }}>Sem dados disponíveis ainda.</div>
  }

  const anos = anosDisponiveis(mensalPorAno, diarioPorAnoMes)
  const mesesAno = mesesDisponiveis(year, mensalPorAno, diarioPorAnoMes)
  const mesesCompletos = mensalPorAno[year] ?? []
  const selIdxMensal = mesesCompletos.findIndex(m => m.mes === mes)
  const dias = diarioPorAnoMes[`${year}-${mes}`] ?? []
  const hasDaily = dias.length > 0
  const selDia = hasDaily ? (dias.find(d => d.dia === selDay) ?? dias[dias.length - 1]) : null
  const now = new Date()
  const isToday = !!selDia && now.getFullYear() === year && now.getMonth() + 1 === mes && now.getDate() === selDia.dia

  const handleYear = (y: number) => {
    const meses = mesesDisponiveis(y, mensalPorAno, diarioPorAnoMes)
    const m = meses[meses.length - 1]
    setYear(y)
    setMes(m)
    setSelDay(computeDefaultDay(diarioPorAnoMes[`${y}-${m}`], y, m))
  }
  const handleMes = (m: number) => {
    setMes(m)
    setSelDay(computeDefaultDay(diarioPorAnoMes[`${year}-${m}`], year, m))
  }

  return (
    <>
      {/* Year + month selector */}
      <div style={{ display: 'flex', gap: 8, padding: '0 32px 18px', alignItems: 'center', flexWrap: 'wrap' }}>
        {anos.map(y => {
          const active = y === year
          return (
            <button key={y} onClick={() => handleYear(y)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 999,
              border: `1.5px solid ${active ? SS_GREEN : 'var(--line)'}`,
              background: active ? `color-mix(in oklab, ${SS_GREEN}, white 88%)` : 'var(--surface)',
              color: active ? SS_GREEN : 'var(--ink-2)',
              fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: active ? 600 : 500,
              cursor: 'pointer', transition: 'all .15s',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: active ? SS_GREEN : 'var(--ink-4)', display: 'inline-block' }} />
              {y}
            </button>
          )
        })}
        <div style={{ width: 1, height: 20, background: 'var(--line)', margin: '0 4px' }} />
        {mesesAno.map(m => {
          const active = m === mes
          return (
            <button key={m} onClick={() => handleMes(m)} style={{
              padding: '6px 14px', borderRadius: 999, lineHeight: '1',
              border: `1.5px solid ${active ? SS_GREEN : 'var(--line)'}`,
              background: active ? SS_GREEN : 'var(--surface)',
              color: active ? '#fff' : 'var(--ink-2)',
              fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: active ? 700 : 400, cursor: 'pointer',
            }}>{MONTH_LABELS[m - 1]}</button>
          )
        })}
        <div style={{ flex: 1 }} />
        {selDia && (
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 999,
            border: `1px solid ${isToday ? SS_GREEN : 'var(--line)'}`,
            color: isToday ? SS_GREEN : 'var(--ink-3)',
            background: isToday ? 'color-mix(in oklab, ' + SS_GREEN + ', white 92%)' : 'var(--surface-2)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {isToday ? 'Hoje' : 'Dia selecionado'} · {String(selDia.dia).padStart(2, '0')}/{String(mes).padStart(2, '0')}
          </span>
        )}
        <span style={{ fontSize: 12, color: 'var(--ink-3)', background: 'var(--surface-2)', padding: '5px 12px', borderRadius: 999, border: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>
          {mesesCompletos.length} {mesesCompletos.length === 1 ? 'mês' : 'meses'} · dados completos
        </span>
      </div>

      <div style={{ padding: '0 32px 48px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {hasDaily && selDia ? (
          <>
            {/* Daily-driven KPI cards */}
            <section>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                <DailyRevenueCard
                  label="Receita Story" value={selDia.storyReceita}
                  dateLabel={fmtBR(selDia.date)}
                  accumLabel={selDia.dia > 1 ? `Acumulado até ${fmtBR(addDaysISO(selDia.date, -1))}` : 'Início do mês'}
                  accumValue={selDia.dia > 1 ? selDia.prevAccStory : 0}
                />
                <DailyRevenueCard
                  label="Receita Lives" value={selDia.livesReceita}
                  dateLabel={fmtBR(selDia.date)}
                  accumLabel={selDia.dia > 1 ? `Acumulado até ${fmtBR(addDaysISO(selDia.date, -1))}` : 'Início do mês'}
                  accumValue={selDia.dia > 1 ? selDia.prevAccLives : 0}
                />
                <DailyRevenueCard
                  label="Receita Social" value={selDia.socialReceita}
                  dateLabel={fmtBR(selDia.date)}
                  accumLabel={selDia.dia > 1 ? `Acumulado até ${fmtBR(addDaysISO(selDia.date, -1))}` : 'Início do mês'}
                  accumValue={selDia.dia > 1 ? selDia.prevAccSocial : 0}
                  highlight
                />
                <KpiCard label="Share do Mês" value={mPct(selDia.shareMesAteOntem)} sub="Acumulado até ontem" />
                <KpiCard
                  label="Meta Mensal"
                  value={selDia.meta > 0 ? mN(selDia.meta) : '—'}
                  sub={selDia.meta > 0 ? `${((selDia.accSocial / selDia.meta) * 100).toFixed(0)}% atingido` : 'meta não cadastrada'}
                />
              </div>
            </section>

            {/* Pace + Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
              <section>
                <SectionHead title="Meta do Mês" sub={`${MONTH_LABELS[mes - 1]} ${year}`} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Meta Mensal</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{selDia.meta > 0 ? mN(selDia.meta) : '—'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Realizado</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{mN(selDia.accSocial)}</div>
                      </div>
                    </div>
                    {(() => {
                      const pct = selDia.meta > 0 ? (selDia.accSocial / selDia.meta) * 100 : 0
                      const color = pct >= 100 ? SS_OK : pct >= 80 ? SS_AMBER : SS_RED
                      return (
                        <>
                          <div style={{ marginBottom: 8 }}>
                            <ProgressBar pct={pct} color={color} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color }}>
                              {pct.toFixed(1)}% {pct >= 100 ? '✓ meta atingida' : 'da meta'}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>
                              {selDia.accSocial - selDia.meta >= 0 ? '+' : ''}{mFull(selDia.accSocial - selDia.meta)}
                            </span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  <PaceCard dia={selDia} meta={selDia.meta} />
                </div>
              </section>

              <section>
                <SectionHead title="Evolução Anual" sub={`${year} · Receita Social vs Meta · Share %`} />
                <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '18px 18px 12px' }}>
                  <ChartLegend items={[
                    { color: SS_GREEN_SOFT, label: 'Meta', type: 'bar', soft: true },
                    { color: SS_GREEN, label: 'Receita Social', type: 'bar' },
                    { color: SS_AMBER, label: 'Share %', type: 'line' },
                  ]} />
                  <DualBarLineChart
                    data={mesesCompletos as unknown as Record<string, unknown>[]}
                    barKey="social"
                    metaKey="meta"
                    lineKey="shareM"
                    barColor={SS_GREEN}
                    metaColor={SS_GREEN_SOFT}
                    lineColor={SS_AMBER}
                    height={230}
                    highlightIdx={selIdxMensal}
                    barLabel="Receita Social"
                    metaLabel="Meta"
                    lineLabel="Share %"
                  />
                </div>
              </section>
            </div>

            {/* Daily tracking table */}
            <section>
              <SectionHead
                title="Acompanhamento do Mês"
                sub={`${MONTH_LABELS[mes - 1]} ${year} · clique num dia para ver os cards daquele dia`}
              />
              <SSDailySummary dias={dias} meta={selDia.meta} />
              <SSDailyTable dias={dias} mes={mes} selectedDay={selDia.dia} onSelectDay={setSelDay} />
            </section>
          </>
        ) : (
          (() => {
            const curr = mesesCompletos[selIdxMensal]
            if (!curr) return <div style={{ color: 'var(--ink-3)' }}>Sem dados para este mês.</div>
            const prev = selIdxMensal > 0 ? mesesCompletos[selIdxMensal - 1] : null
            const saldo = curr.social - curr.meta
            const pct = curr.meta > 0 ? (curr.social / curr.meta) * 100 : 0
            return (
              <>
                <section>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                    <KpiCard label="Receita Social" value={mN(curr.social)} sub={mFull(curr.social)} />
                    <KpiCard label="Share % Mês" value={mPct(curr.shareM)} sub={`Social / ${brandName}`} highlight />
                    <KpiCard label="Meta Mensal" value={mN(curr.meta)} sub={`${pct.toFixed(0)}% atingido`} />
                    <KpiCard
                      label="Saldo vs Meta"
                      value={mFull(Math.abs(saldo))}
                      sub={saldo >= 0 ? '▲ acima da meta' : '▼ abaixo da meta'}
                      valueColor={saldo >= 0 ? SS_OK : SS_RED}
                    />
                    <KpiCard label={`Receita ${brandName}`} value={mN(curr.gocase)} sub="canal total" />
                  </div>
                </section>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
                  <section>
                    <SectionHead title="Meta do Mês" sub={`${curr.label} ${year}`} />
                    <SSPacePanel curr={curr} prev={prev} brandName={brandName} />
                  </section>

                  <section>
                    <SectionHead title="Evolução Anual" sub={`${year} · Receita Social vs Meta · Share %`} />
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '18px 18px 12px' }}>
                      <ChartLegend items={[
                        { color: SS_GREEN_SOFT, label: 'Meta', type: 'bar', soft: true },
                        { color: SS_GREEN, label: 'Receita Social', type: 'bar' },
                        { color: SS_AMBER, label: 'Share %', type: 'line' },
                      ]} />
                      <DualBarLineChart
                        data={mesesCompletos as unknown as Record<string, unknown>[]}
                        barKey="social"
                        metaKey="meta"
                        lineKey="shareM"
                        barColor={SS_GREEN}
                        metaColor={SS_GREEN_SOFT}
                        lineColor={SS_AMBER}
                        height={230}
                        highlightIdx={selIdxMensal}
                        barLabel="Receita Social"
                        metaLabel="Meta"
                        lineLabel="Share %"
                      />
                    </div>
                  </section>
                </div>
              </>
            )
          })()
        )}

        {/* Monthly summary table */}
        <section>
          <SectionHead
            title="Resumo Mensal"
            sub={`${year} · Receita Social, Meta, Share %, ${brandName}, Saldo`}
          />
          <SSMonthlyTable data={mesesCompletos} selectedIdx={selIdxMensal} brandName={brandName} />
        </section>

      </div>
    </>
  )
}
