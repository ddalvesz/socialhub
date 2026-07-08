'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { safeWrite } from '@/lib/supabase/safeWrite'
import { showToast } from '@/lib/toast'
import type { Brand } from '@/lib/types'
import { mFull, SectionHead, MONTH_LABELS } from './metrics/SharedMetricsUI'

// ── Data ──────────────────────────────────────────────────────────────────────

interface ShareMetaRow { ano: number; mes: number; meta: number }
interface KpiMetaRow { ano: number; mes: number; ig_views: number; ig_alcance: number; ig_interacoes: number; tt_views: number }

interface HistoryRow {
  ano: number
  mes: number
  receita: number | null
  igViews: number | null
  igAlcance: number | null
  igInteracoes: number | null
  ttViews: number | null
}

const CURRENT_YEAR = 2026
const YEAR_OPTIONS = [2025, 2026, 2027]

function buildHistory(shareRows: ShareMetaRow[], kpiRows: KpiMetaRow[]): HistoryRow[] {
  const byKey = new Map<string, HistoryRow>()
  const key = (ano: number, mes: number) => `${ano}-${mes}`
  for (const r of shareRows) {
    byKey.set(key(r.ano, r.mes), { ano: r.ano, mes: r.mes, receita: r.meta, igViews: null, igAlcance: null, igInteracoes: null, ttViews: null })
  }
  for (const r of kpiRows) {
    const k = key(r.ano, r.mes)
    const existing = byKey.get(k)
    if (existing) { existing.igViews = r.ig_views; existing.igAlcance = r.ig_alcance; existing.igInteracoes = r.ig_interacoes; existing.ttViews = r.tt_views }
    else byKey.set(k, { ano: r.ano, mes: r.mes, receita: null, igViews: r.ig_views, igAlcance: r.ig_alcance, igInteracoes: r.ig_interacoes, ttViews: r.tt_views })
  }
  return [...byKey.values()].sort((a, b) => b.ano - a.ano || b.mes - a.mes)
}

// ── Form field ────────────────────────────────────────────────────────────────

function MetaField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="stacked" style={{ marginTop: 0 }}>
      <label>{label}</label>
      <input
        className="field"
        type="text" inputMode="numeric" placeholder="0"
        value={value ? Number(value).toLocaleString('pt-BR') : ''}
        onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
      />
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, minHeight: 15 }}>{hint ?? ' '}</div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function MetasView({ brand }: { brand: Brand }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [shareRows, setShareRows] = useState<ShareMetaRow[]>([])
  const [kpiRows, setKpiRows] = useState<KpiMetaRow[]>([])

  const today = new Date()
  const [ano, setAno] = useState(CURRENT_YEAR)
  const [mes, setMes] = useState(today.getFullYear() === CURRENT_YEAR ? today.getMonth() + 1 : 1)

  const [receita, setReceita] = useState('')
  const [igViews, setIgViews] = useState('')
  const [igAlcance, setIgAlcance] = useState('')
  const [igInteracoes, setIgInteracoes] = useState('')
  const [ttViews, setTtViews] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    const sb = createClient()
    Promise.all([
      sb.from('share_social_metas').select('ano,mes,meta').eq('brand', brand),
      sb.from('kpi_metas_mensais').select('ano,mes,ig_views,ig_alcance,ig_interacoes,tt_views').eq('brand', brand),
    ]).then(([r1, r2]) => {
      if (!active) return
      setShareRows((r1.data ?? []).map(r => ({ ano: Number(r.ano), mes: Number(r.mes), meta: Number(r.meta) })))
      setKpiRows((r2.data ?? []).map(r => ({
        ano: Number(r.ano), mes: Number(r.mes),
        ig_views: Number(r.ig_views), ig_alcance: Number(r.ig_alcance), ig_interacoes: Number(r.ig_interacoes), tt_views: Number(r.tt_views),
      })))
      setLoading(false)
    })
    return () => { active = false }
  }, [brand])

  const history = useMemo(() => buildHistory(shareRows, kpiRows), [shareRows, kpiRows])

  // Popula o formulário sempre que o mês/ano selecionado ou os dados mudam.
  useEffect(() => {
    const share = shareRows.find(r => r.ano === ano && r.mes === mes)
    const kpi = kpiRows.find(r => r.ano === ano && r.mes === mes)
    setReceita(share ? String(share.meta) : '')
    setIgViews(kpi ? String(kpi.ig_views) : '')
    setIgAlcance(kpi ? String(kpi.ig_alcance) : '')
    setIgInteracoes(kpi ? String(kpi.ig_interacoes) : '')
    setTtViews(kpi ? String(kpi.tt_views) : '')
  }, [ano, mes, shareRows, kpiRows])

  const igViewsNum = Number(igViews) || 0
  const igWeeklyPreview = Math.round(igViewsNum * 7 / 30)
  const ttViewsNum = Number(ttViews) || 0
  const ttWeeklyPreview = Math.round(ttViewsNum * 7 / 30)

  async function handleSave() {
    setSaving(true)
    const sb = createClient()
    const receitaNum = Number(receita) || 0
    const igAlcanceNum = Number(igAlcance) || 0
    const igInteracoesNum = Number(igInteracoes) || 0

    const okShare = await safeWrite(
      sb.from('share_social_metas').upsert({ brand, ano, mes, meta: receitaNum }, { onConflict: 'ano,mes,brand' }),
      'Falha ao salvar a meta de receita. Tente novamente.',
    )
    const okKpi = await safeWrite(
      sb.from('kpi_metas_mensais').upsert(
        { brand, ano, mes, ig_views: igViewsNum, ig_alcance: igAlcanceNum, ig_interacoes: igInteracoesNum, tt_views: ttViewsNum },
        { onConflict: 'brand,ano,mes' },
      ),
      'Falha ao salvar as metas de KPI. Tente novamente.',
    )

    if (okShare) setShareRows(rows => [...rows.filter(r => !(r.ano === ano && r.mes === mes)), { ano, mes, meta: receitaNum }])
    if (okKpi) setKpiRows(rows => [...rows.filter(r => !(r.ano === ano && r.mes === mes)), { ano, mes, ig_views: igViewsNum, ig_alcance: igAlcanceNum, ig_interacoes: igInteracoesNum, tt_views: ttViewsNum }])
    if (okShare && okKpi) showToast('Metas salvas.', 'success')
    setSaving(false)
  }

  if (loading) return <div style={{ padding: '24px 32px', color: 'var(--ink-3)', fontSize: 13 }}>Carregando metas…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720, padding: '0 32px 48px' }}>
      <section>
        <SectionHead title="Cadastrar meta do mês" sub="Usada pelo Pace e pela comparação Semana a Semana nas abas KPIs e Share Social" />

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <select className="field" value={mes} onChange={e => setMes(Number(e.target.value))}>
            {MONTH_LABELS.map((label, i) => <option key={i} value={i + 1}>{label}</option>)}
          </select>
          <select className="field" value={ano} onChange={e => setAno(Number(e.target.value))}>
            {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
            Share Social
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 20 }}>
            <MetaField label="Meta de Receita Social (R$)" value={receita} onChange={setReceita} />
          </div>

          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
            KPIs — Instagram
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20, alignItems: 'start' }}>
            <MetaField label="Views Reels" value={igViews} onChange={setIgViews}
              hint={igViewsNum > 0 ? `Meta semanal: ${mFull(igWeeklyPreview)}` : undefined} />
            <MetaField label="Alcance" value={igAlcance} onChange={setIgAlcance} />
            <MetaField label="Interações" value={igInteracoes} onChange={setIgInteracoes} />
          </div>

          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
            KPIs — TikTok
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 20 }}>
            <MetaField label="Views" value={ttViews} onChange={setTtViews}
              hint={ttViewsNum > 0 ? `Meta semanal: ${mFull(ttWeeklyPreview)}` : undefined} />
          </div>

          <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar metas'}
          </button>
        </div>
      </section>

      <section>
        <SectionHead title="Histórico" sub="Clique num mês pra editar" />
        <div className="list">
          <div className="list-row list-head" style={{ gridTemplateColumns: '90px 1fr 1fr 1fr 1fr 1fr' }}>
            {['Mês', 'Receita Social', 'Views IG', 'Alcance IG', 'Interações IG', 'Views TikTok'].map(h => <div key={h} className="cell">{h}</div>)}
          </div>
          {history.length === 0
            ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Nenhuma meta cadastrada ainda para esta marca</div>
            : history.map(h => {
              const isSel = h.ano === ano && h.mes === mes
              return (
                <div key={`${h.ano}-${h.mes}`}
                  className="list-row"
                  style={{ gridTemplateColumns: '90px 1fr 1fr 1fr 1fr 1fr', cursor: 'pointer', background: isSel ? 'oklch(0.97 0.025 152)' : undefined }}
                  onClick={() => { setAno(h.ano); setMes(h.mes) }}
                >
                  <div className="cell" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{MONTH_LABELS[h.mes - 1]}/{h.ano}</div>
                  <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{h.receita != null ? mFull(h.receita) : '—'}</div>
                  <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{h.igViews != null ? mFull(h.igViews) : '—'}</div>
                  <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{h.igAlcance != null ? mFull(h.igAlcance) : '—'}</div>
                  <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{h.igInteracoes != null ? mFull(h.igInteracoes) : '—'}</div>
                  <div className="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>{h.ttViews != null ? mFull(h.ttViews) : '—'}</div>
                </div>
              )
            })}
        </div>
      </section>
    </div>
  )
}
