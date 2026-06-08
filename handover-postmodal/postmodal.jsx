/* ============================================================
   PostModal component (extraído de socialhub-modal.jsx)
   ============================================================
   Dependências:
   - React (hooks: useState, useEffect)
   - PlatformIcon, Icon (ícones)
   - GenericSelect, PlatformSelect, StatusSelect, TagsField, Stars (sub-components)
   - PLATFORMS, STATUSES, TAGS, LINHAS_ED, CAMP_LIST,
     CONTENT_TYPES_IG, CONTENT_TYPES_OTHER, TEAM_NAMES (constantes)
   ============================================================ */

function PostModal({ post, onClose, onSave, onDelete, onDuplicate, showProduct }) {
  const [draft, setDraft] = useStateM(post);
  useEffectM(() => {setDraft(post);}, [post.id]);
  useEffectM(() => {
    const handler = (e) => {if (e.key === 'Escape') onClose();};
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const plat = PLATFORMS.find((p) => p.id === draft.platform);
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const types = draft.platform === 'ig' ? CONTENT_TYPES_IG : CONTENT_TYPES_OTHER;
  const teamOptions = TEAM_NAMES.map((t) => ({ id: t, label: t }));
  const lineaOptions = LINHAS_ED.map((l) => ({ id: l.id, label: l.label }));
  const campOptions = [{ id: '', label: 'Sem campanha' }, ...CAMP_LIST];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-post" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className={`platform-mark plat-${plat.id}`}>
            <PlatformIcon platform={plat.id} size={20} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <input className="modal-title" value={draft.title}
            onChange={(e) => set('title', e.target.value)} placeholder="Título do post" />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
              <StatusSelect value={draft.status} onChange={(v) => set('status', v)} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                #{String(draft.id).padStart(4, '0')}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          {/* LEFT — Detalhes */}
          <div className="col left">
            <div className="modal-col-head">
              <Icon.settings /> Detalhes
            </div>
            <div className="modal-grid">
              <label>Dono</label>
              <GenericSelect value={draft.owner} options={teamOptions} onChange={(v) => set('owner', v)} width="100%" />

              <label>Plataforma</label>
              <div className="field-wrap" style={{ width: '100%' }}>
                <PlatformSelect value={draft.platform} onChange={(v) => set('platform', v)} />
              </div>

              <label>Data e hora</label>
              <div className="field-inline">
                <input className="field" type="date" value={draft.date} onChange={(e) => set('date', e.target.value)} />
                <input className="field" type="time" value={draft.time} onChange={(e) => set('time', e.target.value)} />
              </div>

              <label>Tipo</label>
              <GenericSelect value={draft.type} options={types.map((t) => ({ id: t, label: t }))} onChange={(v) => set('type', v)} width="100%" />

              <label>Produto</label>
              <input className="field" placeholder="ex: Carteira Care..." value={draft.product || ''} onChange={(e) => set('product', e.target.value)} />

              <label>Linha editorial</label>
              <GenericSelect value={draft.linha} options={lineaOptions} onChange={(v) => set('linha', v)} width="100%" />

              <label>Campanha</label>
              <GenericSelect value={draft.campanha || ''} options={campOptions} onChange={(v) => set('campanha', v || null)} placeholder="Sem campanha" width="100%" />

              <label style={{ alignSelf: 'flex-start', paddingTop: 8 }}>Tags</label>
              <TagsField tags={draft.tags || []} onChange={(v) => set('tags', v)} />

              <label>Complexidade</label>
              <div className="field-inline">
                <Stars value={draft.complexity} onChange={(v) => set('complexity', v)} />
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{draft.complexity}/5</span>
              </div>
            </div>
          </div>

          {/* RIGHT — Conteúdo */}
          <div className="col right">
            <div className="modal-col-head">
              <Icon.branding /> Conteúdo
            </div>

            <div className="stacked">
              <label>Legenda</label>
              <textarea className="field legenda" placeholder="Escreva aqui a legenda que vai com o post..."
                value={draft.caption || ''} onChange={(e) => set('caption', e.target.value)} />
            </div>

            <div className="stacked">
              <label>Link da mídia</label>
              <div className="field link-field">
                <Icon.media />
                <input placeholder="https://..." value={draft.link || ''} onChange={(e) => set('link', e.target.value)} />
              </div>
            </div>

            {draft.type === 'Reels' && (
              <div className="stacked">
                <label>Link da capa <span className="hint">capa do Reels</span></label>
                <div className="field link-field">
                  <Icon.cover />
                  <input placeholder="https://..." value={draft.coverLink || ''} onChange={(e) => set('coverLink', e.target.value)} />
                </div>
              </div>
            )}

            <div className="stacked">
              <label>Link de referência</label>
              <div className="field link-field">
                <Icon.ref />
                <input placeholder="https://..." value={draft.ref || ''} onChange={(e) => set('ref', e.target.value)} />
              </div>
            </div>

            <div className="stacked">
              <label>Link do Post</label>
              <div className="field link-field">
                <Icon.post />
                <input placeholder="https://..." value={draft.postLink || ''} onChange={(e) => set('postLink', e.target.value)} />
              </div>
            </div>

            <div className="stacked">
              <label>Observações</label>
              <textarea className="field" rows={2} placeholder="Comentários internos..."
                value={draft.notes || ''} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="danger" onClick={() => {onDelete(draft);onClose();}}>
            <Icon.trash /> Excluir
          </button>
          <button className="btn btn-ghost" onClick={() => onDuplicate(draft)}>
            <Icon.copy /> Duplicar
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={() => {onSave(draft);onClose();}}>Salvar alterações</button>
        </div>
      </div>
    </div>);

}
