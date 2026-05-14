'use client'

import { Icon, PlatformIcon } from './Icons'
import { Post, PLATFORMS } from '@/lib/types'

interface Props {
  post: Post
  onClose: () => void
  onDuplicate: (platform: string) => void
}

export default function DuplicateMenu({ post, onClose, onDuplicate }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose} style={{ background: 'rgba(30,20,50,.5)' }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 420 }}>
        <div className="modal-head">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '.04em' }}>DUPLICAR POST</div>
            <div style={{ fontSize: 20, marginTop: 4, lineHeight: 1.2, fontWeight: 700 }}>Para qual plataforma?</div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="modal-body" style={{ padding: '16px 20px 22px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PLATFORMS.filter(p => p.id !== post.platform).map(p => (
              <button
                key={p.id}
                className="po-item"
                style={{ padding: 14, border: '1px solid var(--line)', borderRadius: 10, fontSize: 14 }}
                onClick={() => { onDuplicate(p.id); onClose() }}
              >
                <span style={{ width: 28, height: 28, borderRadius: 7, background: p.color, display: 'grid', placeItems: 'center' }}>
                  <PlatformIcon platform={p.id} size={14} color="white" />
                </span>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
