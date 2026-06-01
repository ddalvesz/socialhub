'use client'
import { Icon } from './Icons'

interface Props {
  open: boolean
  title: string
  subtitle?: string
  body?: string
  onCancel: () => void
  onDelete: () => void
  onArchive?: () => void
}

export default function DeleteConfirmModal({ open, title, subtitle, body, onCancel, onDelete, onArchive }: Props) {
  if (!open) return null

  const defaultBody = onArchive
    ? 'Essa ação é permanente e não pode ser desfeita. Todos os dados serão removidos.\n\nSe preferir manter o histórico, você pode arquivar em vez de excluir.'
    : 'Essa ação é permanente e não pode ser desfeita.'

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" style={{ width: 'min(440px, calc(100vw - 40px))', maxHeight: 'unset' }} onClick={e => e.stopPropagation()}>
        <div className="modal-head" style={{ borderBottom: 'none', paddingBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flex: '0 0 44px',
            background: 'oklch(0.95 0.03 20)', display: 'grid', placeItems: 'center',
            color: 'oklch(0.52 0.18 22)',
          }}>
            <Icon.trash />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.015em' }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 3 }}>"{subtitle}"</div>
            )}
          </div>
          <button className="modal-close" onClick={onCancel}><Icon.x /></button>
        </div>

        <div style={{ padding: '4px 26px 20px', fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          {body ?? defaultBody}
        </div>

        <div className="modal-foot" style={{ justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          {onArchive && (
            <button
              className="btn btn-ghost"
              style={{ color: 'oklch(0.5 0.12 230)', borderColor: 'oklch(0.88 0.04 230)' }}
              onClick={onArchive}
            >
              Arquivar
            </button>
          )}
          <button
            className="btn"
            style={{ background: 'oklch(0.52 0.18 22)', color: 'white' }}
            onClick={onDelete}
          >
            <Icon.trash /> Excluir
          </button>
        </div>
      </div>
    </div>
  )
}
