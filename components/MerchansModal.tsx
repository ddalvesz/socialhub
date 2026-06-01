'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Live, Merchan } from '@/lib/types'
import { Icon } from './Icons'
import DeleteConfirmModal from './DeleteConfirmModal'

// ─── MerchanRow ──────────────────────────────────────────────

function MerchanRow({ m, livesCount, onChange, onRename, onDelete }: {
  m: Merchan
  livesCount: number
  onChange: (m: Merchan, patch: Partial<Pick<Merchan, 'ativo' | 'forte' | 'sempreSozinho'>>) => void
  onRename: (m: Merchan, novoNome: string) => void
  onDelete: (m: Merchan) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(m.nome)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const submitRename = () => {
    const nm = draft.trim()
    if (nm && nm !== m.nome) onRename(m, nm)
    setEditing(false)
  }

  return (
    <div className="merchan-row">
      <span className="merchan-row-dot" style={{ background: m.color }} />
      <div className="merchan-row-main">
        {editing ? (
          <input
            className="field"
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={submitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') submitRename()
              if (e.key === 'Escape') { setDraft(m.nome); setEditing(false) }
            }} />
        ) : (
          <button className="merchan-row-name" onClick={() => setEditing(true)} title="Clique pra renomear">
            {m.nome}
          </button>
        )}
        <div className="merchan-row-sub">
          <span className="merchan-row-short">{m.short}</span>
          <span className="merchan-row-uses">{livesCount} live{livesCount === 1 ? '' : 's'}</span>
        </div>
      </div>
      <div className="merchan-row-flags">
        <label className={`flag-pill ${m.ativo ? 'on' : 'off'}`} title="Disponível para selecionar nas lives">
          <input type="checkbox" checked={m.ativo} onChange={e => onChange(m, { ativo: e.target.checked })} />
          <span>ativo</span>
        </label>
        <label className={`flag-pill ${m.forte ? 'on accent' : 'off'}`} title="Merchan forte — usa em datas/dias importantes">
          <input type="checkbox" checked={m.forte} onChange={e => onChange(m, { forte: e.target.checked })} />
          <span>forte</span>
        </label>
        <label className={`flag-pill ${m.sempreSozinho ? 'on warn' : 'off'}`} title="Nunca aparece como CUPOM 2 — sempre é o único cupom da live">
          <input type="checkbox" checked={m.sempreSozinho} onChange={e => onChange(m, { sempreSozinho: e.target.checked })} />
          <span>sozinho</span>
        </label>
      </div>
      <button
        className="icon-btn danger-btn"
        onClick={() => setConfirmDelete(true)}
        title="Excluir merchan (só se não tiver lives associadas)"
        disabled={livesCount > 0}>
        <Icon.trash />
      </button>
      <DeleteConfirmModal
        open={confirmDelete}
        title="Excluir merchan?"
        subtitle={m.nome}
        onCancel={() => setConfirmDelete(false)}
        onDelete={() => { onDelete(m); setConfirmDelete(false) }}
      />
    </div>
  )
}

// ─── MerchansModal ───────────────────────────────────────────

interface Props {
  merchans: Merchan[]
  lives: Live[]
  onClose: () => void
  onChange: (m: Merchan, patch: Partial<Pick<Merchan, 'ativo' | 'forte' | 'sempreSozinho'>>) => void
  onAdd: (nome: string) => void
  onRename: (m: Merchan, novoNome: string) => void
  onDelete: (m: Merchan) => void
}

export default function MerchansModal({ merchans, lives, onClose, onChange, onAdd, onRename, onDelete }: Props) {
  const [filter, setFilter] = useState('')
  const [showInactive, setShowInactive] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const l of lives) {
      if (l.merchan1) c[l.merchan1] = (c[l.merchan1] || 0) + 1
      if (l.merchan2) c[l.merchan2] = (c[l.merchan2] || 0) + 1
    }
    return c
  }, [lives])

  const filtered = useMemo(() => {
    let arr = merchans
    if (!showInactive) arr = arr.filter(m => m.ativo)
    if (filter.trim()) {
      const q = filter.toLowerCase()
      arr = arr.filter(m => m.nome.toLowerCase().includes(q))
    }
    return arr
  }, [merchans, filter, showInactive])

  const submitNew = () => {
    const nm = newName.trim()
    if (!nm) return
    onAdd(nm)
    setAdding(false); setNewName('')
  }

  const ativos   = merchans.filter(m => m.ativo).length
  const fortes   = merchans.filter(m => m.forte).length
  const sozinhos = merchans.filter(m => m.sempreSozinho).length

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-merchans" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="platform-mark" style={{ background: 'oklch(0.62 0.18 50)' }}>
            <span style={{ color: 'white', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, letterSpacing: '0.03em' }}>MRC</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Catálogo de merchans</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4 }}>
              <strong>{merchans.length}</strong> total · {ativos} ativos · {fortes} fortes · {sozinhos} sozinhos
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="merchans-toolbar">
          <div className="search-box" style={{ minWidth: 220, flex: 1 }}>
            <Icon.search />
            <input
              placeholder="Buscar merchan..."
              value={filter}
              onChange={e => setFilter(e.target.value)} />
          </div>
          <label className="filter-toggle">
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
            <span>mostrar inativos</span>
          </label>
        </div>

        <div className="merchans-legend">
          <div><span className="legend-chip">ativo</span> aparece nos selects da live</div>
          <div><span className="legend-chip accent">forte</span> destacado pra datas/dias chave</div>
          <div><span className="legend-chip warn">sozinho</span> nunca aparece como CUPOM 2</div>
        </div>

        <div className="merchans-list">
          {filtered.map(m => (
            <MerchanRow
              key={m.id}
              m={m}
              livesCount={counts[m.nome] || 0}
              onChange={onChange}
              onRename={onRename}
              onDelete={onDelete} />
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '40px 12px', textAlign: 'center', color: 'var(--ink-3)' }}>
              Nenhum merchan encontrado.
            </div>
          )}
        </div>

        <div className="merchans-add">
          {!adding ? (
            <button className="btn btn-ghost" onClick={() => setAdding(true)}>
              <Icon.plus /> Novo merchan
            </button>
          ) : (
            <div className="merchans-add-inline">
              <input
                className="field"
                autoFocus
                placeholder="Nome do merchan (ex: DESCONTO + FRETE GRÁTIS)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') submitNew()
                  if (e.key === 'Escape') { setAdding(false); setNewName('') }
                }} />
              <button className="btn btn-accent" onClick={submitNew}>Adicionar</button>
              <button className="btn btn-ghost" onClick={() => { setAdding(false); setNewName('') }}>Cancelar</button>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <div style={{ flex: 1, fontSize: 11.5, color: 'var(--ink-3)' }}>
            Esses flags alimentam a skill de proposta semanal.
          </div>
          <button className="btn btn-accent" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  )
}
