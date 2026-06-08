/* ============================================================
   MerchansModal — gestão do catálogo de merchans
   - Lista todos os merchans com toggles: ativo / forte / sempre_sozinho
   - "+ novo merchan"
   - Renomear inline
   - Os flags alimentam a automação que monta as propostas (skill)
   ============================================================ */
const { useState: useStateMM, useEffect: useEffectMM, useMemo: useMemoMM } = React;

function MerchanRow({ m, livesCount, onChange, onRename, onDelete }) {
  const [editing, setEditing] = useStateMM(false);
  const [draft, setDraft] = useStateMM(m.name);

  const submitRename = () => {
    const nm = draft.trim();
    if (nm && nm !== m.name) onRename(m, nm);
    setEditing(false);
  };

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
            onKeyDown={e => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') { setDraft(m.name); setEditing(false); } }} />
        ) : (
          <button className="merchan-row-name" onClick={() => setEditing(true)} title="Clique pra renomear">
            {m.name}
          </button>
        )}
        <div className="merchan-row-sub">
          <span className="merchan-row-short">{m.short}</span>
          <span className="merchan-row-uses">
            {livesCount} live{livesCount === 1 ? '' : 's'}
          </span>
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
        onClick={() => onDelete(m)}
        title="Excluir merchan (só se não tiver lives associadas)"
        disabled={livesCount > 0}>
        <Icon.trash />
      </button>
    </div>
  );
}

function MerchansModal({ merchans, lives, onClose, onChange, onAdd, onRename, onDelete }) {
  const [filter, setFilter] = useStateMM('');
  const [showInactive, setShowInactive] = useStateMM(true);
  const [adding, setAdding] = useStateMM(false);
  const [newName, setNewName] = useStateMM('');

  useEffectMM(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  // count lives per merchan (across both cupom slots)
  const counts = useMemoMM(() => {
    const c = {};
    for (const l of lives) {
      if (l.merchan1) c[l.merchan1] = (c[l.merchan1] || 0) + 1;
      if (l.merchan2) c[l.merchan2] = (c[l.merchan2] || 0) + 1;
    }
    return c;
  }, [lives]);

  const filtered = useMemoMM(() => {
    let arr = merchans;
    if (!showInactive) arr = arr.filter(m => m.ativo);
    if (filter.trim()) {
      const q = filter.toLowerCase();
      arr = arr.filter(m => m.name.toLowerCase().includes(q));
    }
    return arr;
  }, [merchans, filter, showInactive]);

  const submitNew = () => {
    const nm = newName.trim();
    if (!nm) return;
    onAdd(nm);
    setAdding(false); setNewName('');
  };

  const ativos = merchans.filter(m => m.ativo).length;
  const fortes = merchans.filter(m => m.forte).length;
  const sozinhos = merchans.filter(m => m.sempreSozinho).length;

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
            <input
              type="checkbox"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)} />
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
              livesCount={counts[m.name] || 0}
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
                onKeyDown={e => { if (e.key === 'Enter') submitNew(); if (e.key === 'Escape') { setAdding(false); setNewName(''); } }} />
              <button className="btn btn-accent" onClick={submitNew}>Adicionar</button>
              <button className="btn btn-ghost" onClick={() => { setAdding(false); setNewName(''); }}>Cancelar</button>
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
  );
}

Object.assign(window, { MerchansModal });
