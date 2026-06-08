/* Post modal + Duplicate menu, ported from components/PostModal.tsx + DuplicateMenu.tsx */
const { useState: useStateM, useEffect: useEffectM } = React;

function Popover({ open, onClose, anchor = 'left', children }) {
  if (!open) return null;
  return (
    <React.Fragment>
      <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={onClose} />
      <div className="popover" style={{ top: '100%', marginTop: 4, [anchor]: 0 }}>{children}</div>
    </React.Fragment>);

}

function StatusSelect({ value, onChange }) {
  const [open, setOpen] = useStateM(false);
  const cur = STATUSES.find((s) => s.id === value);
  const dotColors = {
    prod: 'oklch(0.62 0.13 75)', sched: 'oklch(0.6 0.13 265)',
    pub: 'oklch(0.6 0.13 150)', cancel: 'oklch(0.6 0.05 25)'
  };
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button className={`status-pill ${cur.className}`} onClick={() => setOpen((o) => !o)}>
        <span className="sdot" />{cur.label}<Icon.chevD />
      </button>
      <Popover open={open} onClose={() => setOpen(false)}>
        {STATUSES.map((s) =>
        <button key={s.id} className="po-item" onClick={() => {onChange(s.id);setOpen(false);}}>
            <span className="pdot" style={{ background: dotColors[s.id] }} />
            {s.label}
            {s.id === value && <span className="check"><Icon.check /></span>}
          </button>
        )}
      </Popover>
    </div>);

}

function PlatformSelect({ value, onChange }) {
  const [open, setOpen] = useStateM(false);
  const cur = PLATFORMS.find((p) => p.id === value);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button className="field" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, paddingRight: 10, cursor: 'pointer' }} onClick={() => setOpen((o) => !o)}>
        <span style={{ width: 18, height: 18, borderRadius: 5, background: cur.color, display: 'grid', placeItems: 'center' }}>
          <PlatformIcon platform={cur.id} size={11} color="white" />
        </span>
        {cur.label}<Icon.chevD />
      </button>
      <Popover open={open} onClose={() => setOpen(false)}>
        {PLATFORMS.map((p) =>
        <button key={p.id} className="po-item" onClick={() => {onChange(p.id);setOpen(false);}}>
            <span style={{ width: 16, height: 16, borderRadius: 4, background: p.color, display: 'grid', placeItems: 'center' }}>
              <PlatformIcon platform={p.id} size={10} color="white" />
            </span>
            {p.label}
            {p.id === value && <span className="check"><Icon.check /></span>}
          </button>
        )}
      </Popover>
    </div>);

}

function GenericSelect({ value, options, onChange, placeholder = 'Selecionar...', width = 200 }) {
  const [open, setOpen] = useStateM(false);
  const [q, setQ] = useStateM('');
  const filtered = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
  const cur = options.find((o) => o.id === value);
  return (
    <div style={{ position: 'relative', display: 'inline-block', width }}>
      <button className="field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', width: '100%' }} onClick={() => setOpen((o) => !o)}>
        <span style={{ color: cur ? 'var(--ink)' : 'var(--ink-3)' }}>{cur ? cur.label : placeholder}</span>
        <Icon.chevD />
      </button>
      <Popover open={open} onClose={() => {setOpen(false);setQ('');}}>
        <input className="po-input" placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 4 }}>
          {filtered.map((o) =>
          <button key={o.id} className="po-item" onClick={() => {onChange(o.id);setOpen(false);setQ('');}}>
              {o.label}
              {o.id === value && <span className="check"><Icon.check /></span>}
            </button>
          )}
        </div>
      </Popover>
    </div>);

}

function TagsField({ tags, onChange }) {
  const [open, setOpen] = useStateM(false);
  const [q, setQ] = useStateM('');
  const filtered = TAGS.filter((t) => t.label.toLowerCase().includes(q.toLowerCase()));
  const toggle = (id) => onChange(tags.includes(id) ? tags.filter((t) => t !== id) : [...tags, id]);
  return (
    <div className="modal-tags" style={{ position: 'relative' }}>
      {tags.map((t) => {
        const tag = TAGS.find((x) => x.id === t) || { label: t };
        return (
          <span key={t} className="modal-tag">
            {tag.label}
            <span className="x" onClick={() => onChange(tags.filter((x) => x !== t))}><Icon.x /></span>
          </span>);

      })}
      <button className="modal-tag-add" onClick={() => setOpen(true)}>+ Tag</button>
      <Popover open={open} onClose={() => {setOpen(false);setQ('');}}>
        <input className="po-input" placeholder="Buscar tag..." value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        <div style={{ marginTop: 4 }}>
          {filtered.map((t) =>
          <button key={t.id} className="po-item" onClick={() => toggle(t.id)}>
              {t.label}
              {tags.includes(t.id) && <span className="check"><Icon.check /></span>}
            </button>
          )}
        </div>
      </Popover>
    </div>);

}

function Stars({ value, onChange }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((n) =>
      <button key={n} className={n <= value ? 'on' : ''} onClick={() => onChange(n)}>
          <Icon.star />
        </button>
      )}
    </div>);

}

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

function DuplicateMenu({ post, onClose, onDuplicate }) {
  return (
    <div className="modal-backdrop" onClick={onClose} style={{ background: 'rgba(30,20,50,.5)' }}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 420 }}>
        <div className="modal-head">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '.04em' }}>DUPLICAR POST</div>
            <div style={{ fontSize: 20, marginTop: 4, lineHeight: 1.2, fontWeight: 700 }}>Para qual plataforma?</div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="modal-body" style={{ padding: '16px 20px 22px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PLATFORMS.filter((p) => p.id !== post.platform).map((p) =>
            <button key={p.id} className="po-item"
            style={{ padding: 14, border: '1px solid var(--line)', borderRadius: 10, fontSize: 14 }}
            onClick={() => {onDuplicate(p.id);onClose();}}>
                <span style={{ width: 28, height: 28, borderRadius: 7, background: p.color, display: 'grid', placeItems: 'center' }}>
                  <PlatformIcon platform={p.id} size={14} color="white" />
                </span>
                {p.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>);

}

Object.assign(window, { PostModal, DuplicateMenu, GenericSelect });