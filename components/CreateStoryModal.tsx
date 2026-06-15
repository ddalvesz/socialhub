'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { todayISO } from '@/lib/types'
import type { Story, StoryStatus } from '@/lib/types'
import { dbToStory } from '@/lib/supabase/mappers'
import { buildStoryUtm } from '@/lib/storiesUtils'
import { useBrand } from '@/lib/brand-context'

/* ── Constants ────────────────────────────────────────────── */

const CATEGORIAS = [
  'GOFLASH','LANÇAMENTOS','CAMPANHAS','INTERAÇÃO','PRODUTOS HIT',
  'NEUTRO','VOLTA ÀS AULAS','VAI DE TOTE','JOGA DO SEU JEITO',
  'CASE','COLEÇÃO','COPA','FUTEBOL',
]

const STATUS_OPTS: { id: StoryStatus; label: string }[] = [
  { id: 'nao_iniciado', label: 'Não iniciado' },
  { id: 'em_andamento', label: 'Em andamento' },
  { id: 'feito',        label: 'Feito'        },
  { id: 'nao_postado',  label: 'Não postado'  },
  { id: 'proposta',     label: 'Proposta'     },
]

interface Props {
  onClose: () => void
  onSaved: (story: Story) => void
}

export default function CreateStoryModal({ onClose, onSaved }: Props) {
  const supabase = createClient()
  const { brand } = useBrand()
  const today = todayISO()

  const [date,     setDate]     = useState(today)
  const [hora,     setHora]     = useState(18)
  const [produto,  setProduto]  = useState('')
  const [categoria,setCategoria] = useState('')
  const [status,   setStatus]   = useState<StoryStatus>('nao_iniciado')
  const [saving,   setSaving]   = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [urlCopied,  setUrlCopied]  = useState(false)

  const utm = useMemo(() => {
    if (!date || !produto.trim()) return null
    return buildStoryUtm(date, hora, produto.trim())
  }, [date, hora, produto])

  const copyCode = () => {
    if (!utm) return
    navigator.clipboard.writeText(utm.campaign)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const copyUrl = () => {
    if (!utm) return
    navigator.clipboard.writeText(utm.url)
    setUrlCopied(true)
    setTimeout(() => setUrlCopied(false), 2000)
  }

  const handleSave = async () => {
    if (!date || !produto.trim()) return
    setSaving(true)

    const d = new Date(date + 'T00:00:00')
    const WEEKDAY_NOMES = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
    const diaSemana = WEEKDAY_NOMES[d.getDay()]

    const payload: Record<string, unknown> = {
      date,
      hora,
      dia_semana:       diaSemana,
      utm:              utm?.campaign ?? '',
      produto:          produto.trim(),
      categoria,
      status,
      link_midia:       null,
      link_utm:         utm?.url ?? null,
      rastreio_receita: utm?.campaign ?? null,
      receita:          null,
      origem:           'manual',
      brand,
    }

    const { data, error } = await supabase.from('stories').insert(payload).select().single()
    setSaving(false)

    if (error || !data) {
      alert('Erro ao salvar story: ' + (error?.message ?? 'desconhecido'))
      return
    }

    onSaved(dbToStory(data as Record<string, unknown>))
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="modal-overlay"
        style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
      >
        <div
          className="st-create-modal"
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 20px 60px rgba(40,30,60,.18), 0 4px 16px rgba(40,30,60,.08)',
            pointerEvents: 'all',
          }}
        >
          {/* Header */}
          <div className="modal-hdr">
            <div>
              <div className="modal-hdr-title">Novo story</div>
              <div className="modal-hdr-sub">UTM gerado automaticamente ao preencher produto</div>
            </div>
            <button className="modal-x" onClick={onClose}>
              <svg viewBox="0 0 16 16" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
              </svg>
            </button>
          </div>

          {/* Form */}
          <div className="st-form">
            <div className="st-form-2col">
              <div className="st-field">
                <label className="st-label">Data</label>
                <input
                  type="date"
                  className="st-input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
              <div className="st-field">
                <label className="st-label">Hora</label>
                <select className="st-input st-select" value={hora} onChange={e => setHora(Number(e.target.value))}>
                  {[7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22].map(h => (
                    <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="st-field">
              <label className="st-label">Produto foco</label>
              <input
                type="text"
                className="st-input"
                placeholder="Ex: Garrafinha Mini"
                value={produto}
                onChange={e => setProduto(e.target.value)}
              />
            </div>

            <div className="st-form-2col">
              <div className="st-field">
                <label className="st-label">Categoria</label>
                <select className="st-input st-select" value={categoria} onChange={e => setCategoria(e.target.value)}>
                  <option value="">Selecionar…</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="st-field">
                <label className="st-label">Status</label>
                <select className="st-input st-select" value={status} onChange={e => setStatus(e.target.value as StoryStatus)}>
                  {STATUS_OPTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* UTM preview */}
          {utm ? (
            <div className="st-utm-block">
              <div className="st-utm-block-label">
                <svg viewBox="0 0 16 16" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="8" cy="8" r="6"/><polyline points="8 5 8 8 10 10"/>
                </svg>
                UTM gerado automaticamente
              </div>

              <div className="st-utm-row">
                <div className="st-utm-field">
                  <div className="st-utm-field-lbl">Código</div>
                  <div className="st-utm-code">{utm.campaign}</div>
                </div>
                <button
                  className={`btn-copy-utm ${codeCopied ? 'copied' : ''}`}
                  style={{ alignSelf: 'flex-end', flexShrink: 0 }}
                  onClick={copyCode}
                >
                  {codeCopied ? 'Copiado!' : 'Copiar código'}
                </button>
              </div>

              <div className="st-utm-row">
                <div className="st-utm-field">
                  <div className="st-utm-field-lbl">URL</div>
                  <div className="st-utm-url-text">{utm.url}</div>
                </div>
                <button
                  className={`btn-copy-utm ${urlCopied ? 'copied' : ''}`}
                  style={{ alignSelf: 'flex-end', flexShrink: 0 }}
                  onClick={copyUrl}
                >
                  {urlCopied ? 'Copiado!' : 'Copiar URL'}
                </button>
              </div>
            </div>
          ) : (
            <div className="st-utm-block" style={{ background: 'var(--surface-2)', borderColor: 'var(--line)' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center' }}>
                Preencha produto foco para gerar o UTM automaticamente
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="st-modal-footer">
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button
              className="btn btn-accent"
              onClick={handleSave}
              disabled={saving || !date || !produto.trim()}
            >
              {saving ? 'Salvando…' : (
                <>
                  <svg viewBox="0 0 16 16" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <polyline points="3 8 6.5 12 13 4" />
                  </svg>
                  Salvar story
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
