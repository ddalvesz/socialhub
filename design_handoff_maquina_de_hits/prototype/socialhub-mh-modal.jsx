/* ============================================================
   PostModalMH — Modal for MH posts with Pauta block + IG/TT schedules
   Clone of PostModal with MH-specific sections in the left column,
   and the standard date/time replaced with a two-platform schedule.
   ============================================================ */
const { useState: useStateMM, useEffect: useEffectMM } = React;

function MHCreatorSelect({ value, onChange }) {
  const [open, setOpen] = useStateMM(false);
  const cur = CREATORS_BY_ID[value] || CREATORS[0];
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        className="field"
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', width: '100%' }}
        onClick={() => setOpen(o => !o)}>
        <span className="cc-av" style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'white', fontSize: 11, fontWeight: 700, background: cur.color }}>
          {cur.initial}
        </span>
        <span style={{ flex: 1, textAlign: 'left' }}>{cur.name}</span>
        <Icon.chevD />
      </button>
      <Popover open={open} onClose={() => setOpen(false)}>
        {CREATORS.map(c => (
          <button key={c.id} className="po-item" onClick={() => { onChange(c.id); setOpen(false); }}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'white', fontSize: 10, fontWeight: 700, background: c.color, marginRight: 4 }}>
              {c.initial}
            </span>
            {c.name}
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{semanaLabel(c.semanaAtual)}</span>
            {c.id === value && <span className="check"><Icon.check /></span>}
          </button>
        ))}
      </Popover>
    </div>
  );
}

function MHStatusSelect({ value, onChange }) {
  const [open, setOpen] = useStateMM(false);
  const cur = STATUSES_MH.find(s => s.id === value) || STATUSES_MH[0];
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button className={`status-pill ${cur.className}`} onClick={() => setOpen(o => !o)}>
        <span className="sdot" />{cur.label}<Icon.chevD />
      </button>
      <Popover open={open} onClose={() => setOpen(false)}>
        {STATUSES_MH.map(s => (
          <button key={s.id} className="po-item" onClick={() => { onChange(s.id); setOpen(false); }}>
            <span className="pdot" style={{ background: s.dot }} />
            {s.label}
            {s.id === value && <span className="check"><Icon.check /></span>}
          </button>
        ))}
      </Popover>
    </div>
  );
}

function PostModalMH({ post, onClose, onSave, onDelete, onDuplicate }) {
  const [draft, setDraft] = useStateMM(post);
  useEffectMM(() => { setDraft(post); }, [post.id]);
  useEffectMM(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const setMH = (k, v) => setDraft(d => ({ ...d, mh: { ...d.mh, [k]: v } }));
  const setRepost = (k, v) => setDraft(d => ({
    ...d,
    mh: { ...d.mh, repostTT: { ...(d.mh.repostTT || { date: d.date, time: '12:00', status: 'sched', type: 'Vídeo' }), [k]: v } }
  }));
  const removeRepost = () => setDraft(d => ({ ...d, mh: { ...d.mh, repostTT: null } }));
  const addRepost = () => {
    const dt = addDaysISO(draft.date, 7);
    setDraft(d => ({ ...d, mh: { ...d.mh, repostTT: { date: dt, time: '12:00', status: 'pauta', type: 'Vídeo' } } }));
  };

  const lineaOptions = LINHAS_ED.map(l => ({ id: l.id, label: l.label }));
  const creatorObj = CREATORS_BY_ID[draft.mh?.creator] || CREATORS[0];
  const igTypeOptions = CONTENT_TYPES_IG.map(t => ({ id: t, label: t }));
  const ttTypeOptions = CONTENT_TYPES_OTHER.map(t => ({ id: t, label: t }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-post" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="platform-mark plat-ig" style={{ background: 'oklch(0.55 0.12 280)' }}>
            <span style={{ color: 'white', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: '0.03em' }}>MH</span>
          </div>
          <div style={{ flex: 1 }}>
            <input
              className="modal-title"
              value={draft.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Hook / Take inicial..." />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
              <MHStatusSelect value={draft.status} onChange={v => set('status', v)} />
              <span className="creator-chip size-sm" style={{ background: 'transparent', padding: 0 }}>
                <span className="cc-av" style={{ background: creatorObj.color }}>{creatorObj.initial}</span>
                {creatorObj.name} · {semanaLabel(draft.mh.semanaCreator)} · {videoLabel(draft.mh.numVideo)}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                #{String(typeof draft.id === 'number' ? draft.id : 0).padStart(4, '0')}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          {/* LEFT — Detalhes + Pauta + Agendamentos */}
          <div className="col left">
            <div className="modal-col-head">
              <Icon.settings /> Detalhes
            </div>
            <div className="modal-grid">
              <label>Creator</label>
              <MHCreatorSelect value={draft.mh.creator} onChange={v => setMH('creator', v)} />

              <label>Produto foco</label>
              <input
                className="field"
                placeholder="ex: Tote Puffer, Case..."
                value={draft.product || ''}
                onChange={e => set('product', e.target.value)} />

              <label>Linha editorial</label>
              <GenericSelect
                value={draft.linha}
                options={lineaOptions}
                onChange={v => set('linha', v)}
                width="100%" />
            </div>

            {/* Bloco Pauta */}
            <div className="mh-section">
              <div className="mh-section-head">
                <Icon.branding /> Pauta
              </div>
              <div className="mh-pauta-grid">
                <div className="mh-pauta-cell">
                  <div className="mh-pauta-cell-label">Semana</div>
                  <div className="mh-pauta-cell-val">{semanaLabel(draft.mh.semanaCreator)}</div>
                </div>
                <div className="mh-pauta-cell">
                  <div className="mh-pauta-cell-label">Nº do vídeo</div>
                  <div className="mh-pauta-cell-val">{videoLabel(draft.mh.numVideo)}</div>
                </div>
                <div className="mh-pauta-cell">
                  <div className="mh-pauta-cell-label">Prazo</div>
                  <input
                    type="date"
                    className="mh-pauta-input"
                    value={draft.mh.prazo || ''}
                    onChange={e => setMH('prazo', e.target.value)} />
                </div>
                <div className="mh-pauta-cell full">
                  <div className="mh-pauta-cell-label">Áudio sugerido</div>
                  <input
                    className="mh-pauta-input"
                    placeholder="ex: trend BR, lo-fi, voz natural..."
                    value={draft.mh.audio || ''}
                    onChange={e => setMH('audio', e.target.value)} />
                </div>
                <div className="mh-pauta-cell full">
                  <div className="mh-pauta-cell-label">Link de referência</div>
                  <input
                    className="mh-pauta-input"
                    placeholder="https://..."
                    value={draft.ref || ''}
                    onChange={e => set('ref', e.target.value)} />
                </div>
              </div>

              <div className="mh-briefing-row">
                <div className="mh-briefing-left">
                  <div className="mh-briefing-icon">📄</div>
                  <div className="mh-briefing-text">
                    <strong>Pautas {creatorObj.name} · {semanaLabel(draft.mh.semanaCreator)}</strong>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {draft.mh.briefingFile || `dropbox:${creatorObj.dropboxPath}/...`}
                    </span>
                  </div>
                </div>
                <button className="mh-briefing-link-btn">Abrir no Dropbox ↗</button>
              </div>
            </div>

            {/* Bloco Agendamentos */}
            <div className="mh-section">
              <div className="mh-section-head">
                <Icon.cal /> Agendamentos
              </div>

              <div className="mh-sched-block">
                <div className="mh-sched-head">
                  <div className="mh-sched-head-left">
                    <div className="mh-sched-plat ig">IG</div>
                    <div className="mh-sched-label">Instagram</div>
                  </div>
                </div>
                <div className="mh-sched-fields-grid">
                  <div className="mh-sched-field">
                    <div className="mh-sched-field-label">Plataforma</div>
                    <div className="mh-sched-field-static">Instagram</div>
                  </div>
                  <div className="mh-sched-field">
                    <div className="mh-sched-field-label">Data e hora</div>
                    <div className="mh-sched-field-pair">
                      <input
                        className="field"
                        type="date"
                        value={draft.date}
                        onChange={e => set('date', e.target.value)} />
                      <input
                        className="field"
                        type="time"
                        value={draft.time}
                        onChange={e => set('time', e.target.value)} />
                    </div>
                  </div>
                  <div className="mh-sched-field">
                    <div className="mh-sched-field-label">Tipo</div>
                    <GenericSelect
                      value={draft.type}
                      options={igTypeOptions}
                      onChange={v => set('type', v)}
                      width="100%" />
                  </div>
                </div>
              </div>

              {draft.mh.repostTT ? (
                <div className="mh-sched-block">
                  <div className="mh-sched-head">
                    <div className="mh-sched-head-left">
                      <div className="mh-sched-plat tt">TT</div>
                      <div className="mh-sched-label">TikTok <span style={{ fontWeight: 400, color: 'var(--ink-3)', fontSize: 11.5, marginLeft: 4 }}>· repostagem</span></div>
                    </div>
                    <button
                      style={{ background: 'transparent', border: 'none', color: 'var(--ink-3)', fontSize: 11, cursor: 'pointer' }}
                      onClick={removeRepost}>
                      remover
                    </button>
                  </div>
                  <div className="mh-sched-fields-grid">
                    <div className="mh-sched-field">
                      <div className="mh-sched-field-label">Plataforma</div>
                      <div className="mh-sched-field-static">TikTok</div>
                    </div>
                    <div className="mh-sched-field">
                      <div className="mh-sched-field-label">Data e hora</div>
                      <div className="mh-sched-field-pair">
                        <input
                          className="field"
                          type="date"
                          value={draft.mh.repostTT.date}
                          onChange={e => setRepost('date', e.target.value)} />
                        <input
                          className="field"
                          type="time"
                          value={draft.mh.repostTT.time}
                          onChange={e => setRepost('time', e.target.value)} />
                      </div>
                    </div>
                    <div className="mh-sched-field">
                      <div className="mh-sched-field-label">Tipo</div>
                      <GenericSelect
                        value={draft.mh.repostTT.type || 'Vídeo'}
                        options={ttTypeOptions}
                        onChange={v => setRepost('type', v)}
                        width="100%" />
                    </div>
                  </div>
                </div>
              ) : (
                <button className="mh-sched-add" onClick={addRepost}>
                  + Agendar repostagem no TikTok
                </button>
              )}
            </div>
          </div>

          {/* RIGHT — Conteúdo (campos do CSV) */}
          <div className="col right">
            <div className="modal-col-head">
              <Icon.branding /> Conteúdo
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 12, padding: '6px 10px', background: 'var(--surface-2)', borderRadius: 6, letterSpacing: '0.02em' }}>
              Campos exportados no CSV de agendamento. Compartilhados entre IG e TikTok.
            </div>

            <div className="stacked">
              <label>Legenda</label>
              <textarea
                className="field legenda"
                placeholder="Escreva aqui a legenda..."
                value={draft.caption || ''}
                onChange={e => set('caption', e.target.value)} />
            </div>

            <div className="stacked">
              <label>Link da mídia <span className="hint">vídeo com texto no Dropbox</span></label>
              <div className="field link-field">
                <Icon.media />
                <input
                  placeholder="https://www.dropbox.com/..."
                  value={draft.link || ''}
                  onChange={e => set('link', e.target.value)} />
              </div>
            </div>

            <div className="stacked">
              <label>Link da capa <span className="hint">imagem de capa no Dropbox</span></label>
              <div className="field link-field">
                <Icon.cover />
                <input
                  placeholder="https://www.dropbox.com/..."
                  value={draft.coverLink || ''}
                  onChange={e => set('coverLink', e.target.value)} />
              </div>
            </div>

            <div className="stacked">
              <label>Pasta da entrega <span className="hint">no Dropbox da creator</span></label>
              <div className="field link-field">
                <Icon.media />
                <input
                  placeholder="/Creators/.../SEMANA N/"
                  value={draft.mh.dropboxLink || ''}
                  onChange={e => setMH('dropboxLink', e.target.value)} />
              </div>
            </div>

            <div className="stacked">
              <label>Link do Post <span className="hint">após publicar</span></label>
              <div className="field link-field">
                <Icon.post />
                <input
                  placeholder="https://..."
                  value={draft.postLink || ''}
                  onChange={e => set('postLink', e.target.value)} />
              </div>
            </div>

            <div className="stacked">
              <label>Observações</label>
              <textarea
                className="field"
                rows={2}
                placeholder="Detalhes, adaptações..."
                value={draft.notes || ''}
                onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="danger" onClick={() => { onDelete(draft); onClose(); }}>
            <Icon.trash /> Excluir
          </button>
          <button className="btn btn-ghost" onClick={() => onDuplicate(draft)}>
            <Icon.copy /> Duplicar
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={() => { onSave(draft); onClose(); }}>
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PostModalMH, MHStatusSelect, MHCreatorSelect });
