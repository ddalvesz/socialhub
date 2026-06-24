'use client'

import { useState, useMemo } from 'react'
import type { Brand, SiteLink } from '@/lib/types'
import { Icon } from './Icons'

interface Props {
  brand: Brand
  siteLinks: SiteLink[]
  onAdd: (sl: Omit<SiteLink, 'id'>) => Promise<SiteLink>
  onUpdate: (sl: SiteLink) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

interface EditingRow {
  id: string | null
  categoria: string
  produto: string
  link: string
}

export default function SiteLinksView({ brand, siteLinks, onAdd, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState<EditingRow | null>(null)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return siteLinks
    return siteLinks.filter(sl =>
      sl.categoria.toLowerCase().includes(q) ||
      sl.produto.toLowerCase().includes(q) ||
      sl.link.toLowerCase().includes(q)
    )
  }, [siteLinks, search])

  const categorias = useMemo(() =>
    Array.from(new Set(siteLinks.map(sl => sl.categoria))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
  [siteLinks])

  const startNew = () => {
    setSaveError(null)
    setEditing({ id: null, categoria: '', produto: '', link: '' })
  }

  const startEdit = (sl: SiteLink) => {
    setSaveError(null)
    setEditing({ id: sl.id, categoria: sl.categoria, produto: sl.produto, link: sl.link })
  }

  const cancelEdit = () => { setEditing(null); setSaveError(null) }

  const saveEditing = async () => {
    if (!editing) return
    const { categoria, produto, link } = editing
    if (!categoria.trim() || !produto.trim() || !link.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      if (editing.id === null) {
        await onAdd({ brand, categoria: categoria.trim(), produto: produto.trim(), link: link.trim() })
      } else {
        await onUpdate({ id: editing.id, brand, categoria: categoria.trim(), produto: produto.trim(), link: link.trim() })
      }
      setEditing(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar. Verifique se a migration foi aplicada no Supabase.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  const isValid = editing && editing.categoria.trim() && editing.produto.trim() && editing.link.trim()

  return (
    <div className="view-wrap" style={{ padding: '28px 32px' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 2 }}>
            Links do Site
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            Catálogo de produtos e links usados para gerar UTMs automáticas em stories e lives.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <input
            className="field"
            style={{ width: 240 }}
            placeholder="Buscar por categoria, produto ou link…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn btn-accent" onClick={startNew} disabled={editing !== null}>
            <Icon.plus /> Adicionar link
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 20 }}>
        <div className="kpi-mini">
          <span className="kpi-mini-val">{siteLinks.length}</span>
          <span className="kpi-mini-lbl">produtos cadastrados</span>
        </div>
        <div className="kpi-mini">
          <span className="kpi-mini-val">{categorias.length}</span>
          <span className="kpi-mini-lbl">categorias</span>
        </div>
      </div>

      {/* Erro de salvamento */}
      {saveError && (
        <div style={{
          background: 'oklch(0.97 0.03 25)', border: '1px solid oklch(0.88 0.06 25)',
          color: 'oklch(0.45 0.18 25)', borderRadius: 'var(--radius)', padding: '10px 14px',
          fontSize: 13, marginBottom: 16
        }}>
          {saveError}
        </div>
      )}

      {/* Formulário nova linha */}
      {editing?.id === null && (
        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--line)',
          borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 20
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 12 }}>
            Nova entrada
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="stacked" style={{ flex: '0 0 160px', minWidth: 120 }}>
              <label>Categoria</label>
              <input
                className="field"
                list="sl-categorias-list"
                placeholder="Ex: Case, Térmicos…"
                value={editing.categoria}
                onChange={e => setEditing(ed => ed ? { ...ed, categoria: e.target.value } : ed)}
                autoFocus
              />
              <datalist id="sl-categorias-list">
                {categorias.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="stacked" style={{ flex: '0 0 200px', minWidth: 140 }}>
              <label>Produto</label>
              <input
                className="field"
                placeholder="Ex: CaseBold, CopoDaily…"
                value={editing.produto}
                onChange={e => setEditing(ed => ed ? { ...ed, produto: e.target.value } : ed)}
              />
            </div>
            <div className="stacked" style={{ flex: 1, minWidth: 200 }}>
              <label>Link</label>
              <input
                className="field"
                placeholder="https://…"
                value={editing.link}
                onChange={e => setEditing(ed => ed ? { ...ed, link: e.target.value } : ed)}
                onKeyDown={e => { if (e.key === 'Enter') saveEditing() }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
            <button className="btn btn-ghost" onClick={cancelEdit}>Cancelar</button>
            <button
              className="btn btn-accent"
              onClick={saveEditing}
              disabled={!isValid || saving}
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="site-links-table">
        <div className="site-links-thead">
          <div className="sl-col-cat">Categoria</div>
          <div className="sl-col-prod">Produto</div>
          <div className="sl-col-link">Link</div>
          <div className="sl-col-act" />
        </div>

        {filtered.length === 0 && (
          <div className="site-links-empty">
            {siteLinks.length === 0
              ? 'Nenhum link cadastrado ainda. Clique em "Adicionar link" para começar.'
              : 'Nenhum resultado para a busca.'}
          </div>
        )}

        {filtered.map(sl => {
          const isEditingThis = editing?.id === sl.id

          if (isEditingThis && editing) {
            return (
              <div key={sl.id} className="site-links-row editing">
                <div className="sl-col-cat">
                  <input
                    className="field field-sm"
                    list="sl-categorias-list"
                    value={editing.categoria}
                    onChange={e => setEditing(ed => ed ? { ...ed, categoria: e.target.value } : ed)}
                    autoFocus
                  />
                </div>
                <div className="sl-col-prod">
                  <input
                    className="field field-sm"
                    value={editing.produto}
                    onChange={e => setEditing(ed => ed ? { ...ed, produto: e.target.value } : ed)}
                  />
                </div>
                <div className="sl-col-link">
                  <input
                    className="field field-sm"
                    value={editing.link}
                    onChange={e => setEditing(ed => ed ? { ...ed, link: e.target.value } : ed)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEditing() }}
                  />
                </div>
                <div className="sl-col-act" style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>Cancelar</button>
                  <button
                    className="btn btn-accent btn-sm"
                    onClick={saveEditing}
                    disabled={!isValid || saving}
                  >
                    {saving ? '…' : 'OK'}
                  </button>
                </div>
              </div>
            )
          }

          return (
            <div
              key={sl.id}
              className="site-links-row"
              onClick={() => { if (!editing) startEdit(sl) }}
              title="Clique para editar"
            >
              <div className="sl-col-cat">
                <span className="sl-badge">{sl.categoria}</span>
              </div>
              <div className="sl-col-prod">{sl.produto}</div>
              <div className="sl-col-link">
                <a
                  href={sl.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sl-link"
                  onClick={e => e.stopPropagation()}
                >
                  {sl.link}
                </a>
              </div>
              <div className="sl-col-act" onClick={e => e.stopPropagation()}>
                <button
                  className="btn-icon danger-hover"
                  title="Excluir"
                  disabled={deletingId === sl.id}
                  onClick={() => handleDelete(sl.id)}
                >
                  {deletingId === sl.id ? '…' : <Icon.trash />}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
