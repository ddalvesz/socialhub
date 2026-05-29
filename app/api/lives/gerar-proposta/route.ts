// ============================================================================
// POST /api/lives/gerar-proposta
//
// Gera a proposta semanal de cupons (algoritmo em lib/lives/gerarProposta.ts —
// port do cupons-gocase/scripts/gerar_proposta.py) e grava no Supabase com
// UPSERT SEGURO: só sobrescreve linhas cujo status já é 'proposta'.
// Datas com status 'realizada' ou 'confirmada' são puladas e reportadas.
//
// Body:    { semana?: "YYYY-MM-DD" }  ← segunda da semana alvo; default = próxima segunda
// Returns: { proposta, lives, inseridas, atualizadas, puladas }
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dbToLive } from '@/lib/supabase/mappers'
import {
  gerarProposta,
  proximaSegunda,
  type ScoreRow,
  type MerchanInfo,
} from '@/lib/lives/gerarProposta'
import type { Live } from '@/lib/types'

// ─── Helpers de data (UTC) ───────────────────────────────────────────────────

function parseIsoUTC(s: string): Date {
  return new Date(s + 'T00:00:00Z')
}
function toIsoUTC(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function addDaysUTC(d: Date, n: number): Date {
  const r = new Date(d.getTime())
  r.setUTCDate(r.getUTCDate() + n)
  return r
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // ── Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // ── Semana alvo
    const body = await req.json().catch(() => ({})) as { semana?: string }
    const semanaIso = body.semana && /^\d{4}-\d{2}-\d{2}$/.test(body.semana)
      ? body.semana
      : proximaSegunda(toIsoUTC(new Date()))

    const semana = parseIsoUTC(semanaIso)
    const hist84Inicio = toIsoUTC(addDaysUTC(semana, -84))
    const recentes14Inicio = toIsoUTC(addDaysUTC(semana, -14))
    const nomes30Inicio    = toIsoUTC(addDaysUTC(semana, -30))

    // ── 1) Histórico (84 dias) — pra calcular score por (dia_semana × merchan)
    const { data: hist, error: histErr } = await supabase
      .from('lives')
      .select('date, dia_semana, merchan1, receita1, merchan2, receita2')
      .in('status', ['realizada', 'confirmada'])
      .gte('date', hist84Inicio)
      .lt('date', semanaIso)
    if (histErr) return NextResponse.json({ error: histErr.message }, { status: 500 })

    // ── 2) Merchans ativos (com flags forte / sempre_sozinho)
    const { data: merchansRows, error: mErr } = await supabase
      .from('merchans')
      .select('nome, ativo, forte, sempre_sozinho')
      .eq('ativo', true)
      .order('nome')
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

    // ── 3) Recentes (14 dias) — continuidade na virada + freshness
    const { data: recentesRows, error: rErr } = await supabase
      .from('lives')
      .select('date, merchan1, merchan2')
      .gte('date', recentes14Inicio)
      .lt('date', semanaIso)
      .order('date')
    if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 })

    // ── 4) Nomes recentes (30 dias) — evita repetição de nominal
    const { data: nomesRows, error: nErr } = await supabase
      .from('lives')
      .select('nominal1, nominal2')
      .gte('date', nomes30Inicio)
      .lt('date', semanaIso)
    if (nErr) return NextResponse.json({ error: nErr.message }, { status: 500 })

    // ── Agrega scores em TS (mesma agregação do SQL no SKILL.md)
    type StackedRow = { dia_semana: string; merchan: string; receita: number }
    const stacked: StackedRow[] = []
    for (const l of hist ?? []) {
      const ds = (l.dia_semana as string) ?? ''
      const m1 = (l.merchan1 as string) ?? ''
      const r1 = Number(l.receita1 ?? 0)
      if (ds && m1 && r1 > 0) stacked.push({ dia_semana: ds, merchan: m1, receita: r1 })
      const m2 = (l.merchan2 as string) ?? ''
      const r2 = Number(l.receita2 ?? 0)
      if (ds && m2 && r2 > 0) stacked.push({ dia_semana: ds, merchan: m2, receita: r2 })
    }

    const grouped = new Map<string, { sum: number; n: number }>()
    for (const s of stacked) {
      const key = `${s.dia_semana}::${s.merchan}`
      const e = grouped.get(key) ?? { sum: 0, n: 0 }
      e.sum += s.receita
      e.n   += 1
      grouped.set(key, e)
    }
    const scores: ScoreRow[] = []
    for (const [key, v] of grouped) {
      const [diaSemana, merchan] = key.split('::')
      scores.push({ diaSemana, merchan, media: v.sum / v.n, usos: v.n })
    }
    const totalReceita = stacked.reduce((s, x) => s + x.receita, 0)
    const mediaGlobal  = stacked.length > 0 ? totalReceita / stacked.length : null

    if (stacked.length === 0) {
      return NextResponse.json({
        error: 'Sem histórico suficiente nas últimas 12 semanas (lives realizadas/confirmadas). Não dá pra gerar proposta.',
      }, { status: 400 })
    }

    const merchans: MerchanInfo[] = (merchansRows ?? []).map(r => ({
      nome:          (r.nome as string) ?? '',
      ativo:         (r.ativo as boolean) ?? true,
      forte:         (r.forte as boolean) ?? false,
      sempreSozinho: (r.sempre_sozinho as boolean) ?? false,
    }))

    const recentes = (recentesRows ?? []).map(r => ({
      date:     (r.date as string) ?? '',
      merchan1: (r.merchan1 as string) ?? '',
      merchan2: (r.merchan2 as string) ?? '',
    }))

    const nomesSet = new Set<string>()
    for (const r of nomesRows ?? []) {
      const n1 = ((r.nominal1 as string) ?? '').trim()
      const n2 = ((r.nominal2 as string) ?? '').trim()
      if (n1) nomesSet.add(n1)
      if (n2) nomesSet.add(n2)
    }
    const nomesRecentes = Array.from(nomesSet)

    // ── Roda o algoritmo
    const proposta = gerarProposta({
      semanaInicio:  semanaIso,
      scores,
      mediaGlobal,
      merchans,
      recentes,
      nomesRecentes,
      seed: 42,
    })

    // ── Upsert SEGURO: só sobrescreve linhas com status='proposta'
    const datas = proposta.map(p => p.date)
    const { data: existentes, error: exErr } = await supabase
      .from('lives')
      .select('id, date, status')
      .in('date', datas)
    if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 })

    const byDate = new Map<string, { id: string; status: string }>()
    for (const e of existentes ?? []) {
      byDate.set(e.date as string, { id: String(e.id), status: (e.status as string) ?? '' })
    }

    const inseridas: string[] = []
    const atualizadas: string[] = []
    const puladas: { date: string; status: string }[] = []
    const livesNovas: Live[] = []

    for (const p of proposta) {
      const cur = byDate.get(p.date)

      // Linha base — gravada como 'proposta' / 'skill'. Receitas zeradas (a live ainda
      // não aconteceu). Outros campos opcionais ficam null.
      const row: Record<string, unknown> = {
        date:          p.date,
        dia_semana:    p.diaSemana,
        cupom_ligado:  true,
        criativo:      false,
        merchan1:      p.merchan1 || null,
        nominal1:      p.nominal1 || null,
        receita1:      0,
        merchan2:      p.merchan2 || null,
        nominal2:      p.nominal2 || null,
        receita2:      0,
        receita_total: 0,
        receita_utm:   0,
        status:        'proposta',
        origem:        'skill',
      }

      if (!cur) {
        const { data, error } = await supabase
          .from('lives')
          .insert(row)
          .select()
          .single()
        if (!error && data) {
          inseridas.push(p.date)
          livesNovas.push(dbToLive(data as Record<string, unknown>))
        }
      } else if (cur.status === 'proposta') {
        // Belt + suspenders: filtro por id E por status pra evitar race.
        // Não usa .single() porque se outra request virou status no meio,
        // o update retorna 0 linhas (race) — não é erro, é "pular".
        const { data, error } = await supabase
          .from('lives')
          .update(row)
          .eq('id', cur.id)
          .eq('status', 'proposta')
          .select()
        if (error) {
          // erro real
          console.error('[lives/gerar-proposta] update', error)
        } else if (data && data.length > 0) {
          atualizadas.push(p.date)
          livesNovas.push(dbToLive(data[0] as Record<string, unknown>))
        } else {
          // race: status virou entre o SELECT e o UPDATE → tratar como pulada
          puladas.push({ date: p.date, status: 'race' })
        }
      } else {
        // realizada / confirmada → NUNCA sobrescrever
        puladas.push({ date: p.date, status: cur.status })
      }
    }

    return NextResponse.json({
      semana: semanaIso,
      proposta,
      lives: livesNovas,
      inseridas,
      atualizadas,
      puladas,
    })

  } catch (err: unknown) {
    console.error('[lives/gerar-proposta]', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
