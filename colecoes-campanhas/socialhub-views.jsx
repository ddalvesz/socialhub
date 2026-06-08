/* Campaigns, Comemorativas, Futebol, Profile — ported from their respective .tsx files */
const { useState: useStateV, useRef: useRefV } = React;

const tipoColors = {
  'Institucional': 'oklch(0.55 0.13 265)',
  'Coleção': 'oklch(0.55 0.13 25)',
  'Produto': 'oklch(0.5 0.12 150)',
  'Data Comemorativa': 'oklch(0.55 0.13 320)'
};

/* ───── Small inputs ───── */
function PackToggle({ value, onChange }) {
  return (
    <div className="pack-toggle-row">
      {['PP', 'P', 'M', 'G'].map((p) =>
      <button key={p} className={value === p ? 'active' : ''} onClick={() => onChange(p)} type="button">{p}</button>
      )}
    </div>);

}

function FieldCheckbox({ label, value, onChange }) {
  return (
    <button className="field-checkbox" onClick={() => onChange(!value)} type="button">
      <span className={`check-cell ${value ? 'on' : ''}`}>{value && <Icon.check />}</span>
      {label}
    </button>);

}

/* ───── Linked Posts Drawer ───── */
function LinkedPostsDrawer({ campaign, posts, onClose, onPostClick }) {
  const linked = [...posts.filter((p) => p.campanha === campaign.slug)].
  sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return (
    <React.Fragment>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div style={{ flex: 1 }}>
            <div className="label">CAMPANHA</div>
            <div className="title">{campaign.nome}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
              <span className={`event-pack ${campaign.pack.toLowerCase()}`}>{campaign.pack}</span>
              <span style={{
                padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 500,
                background: `color-mix(in oklab, ${tipoColors[campaign.tipo] ?? '#999'}, white 88%)`,
                color: tipoColors[campaign.tipo] ?? '#999'
              }}>{campaign.tipo}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>· {linked.length} {linked.length === 1 ? 'post' : 'posts'}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="drawer-body">
          {linked.length === 0 ?
          <div className="drawer-empty">
              <div style={{ fontSize: 18, color: 'var(--ink-2)', marginBottom: 6, fontWeight: 600 }}>Sem posts vinculados ainda</div>
              <div style={{ fontSize: 13 }}>Crie um post e selecione "{campaign.nome}" como campanha.</div>
            </div> :
          linked.map((p) => {
            const plat = PLATFORMS.find((x) => x.id === p.platform);
            const d = new Date(p.date + 'T12:00:00');
            return (
              <div key={p.id} className="linked-post" onClick={() => onPostClick(p)}>
                <div className="lp-date">{d.getDate()}<span className="month">{MONTH_ABBR[d.getMonth()]}</span></div>
                <div className="lp-main">
                  <div className="lp-title">{p.title}</div>
                  <div className="lp-meta">
                    <span>{p.time}</span><span>·</span><span>{p.type}</span><span>·</span><span>{p.owner}</span>
                  </div>
                </div>
                <span className="lp-platform" style={{ background: plat.color }}>
                  <PlatformIcon platform={p.platform} size={12} color="white" />
                </span>
              </div>);

          })}
        </div>
      </div>
    </React.Fragment>);

}

/* ───── Package Info Panel ───── */
function PackageInfoPanel() {
  const [open, setOpen] = useStateV(false);
  return (
    <div className="pkg-panel-wrap">
      <button className={`pkg-toggle ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)} type="button">
        <span className="pkg-toggle-badge">PP · P · M · G</span>
        Pacotes de campanhas
        <Icon.chevD />
      </button>
      {open &&
      <div className="pkg-panel">
          <div className="pkg-panel-head">
            <span className="ttl">Pacotes de Campanhas</span>
            <span className="sub">Como diferenciar e dimensionar cada tipo</span>
          </div>
          <div className="pkg-grid">
            {PACKAGE_INFO.map((pkg) =>
          <div key={pkg.id} className="pkg-col" data-pack={pkg.id}>
                <div className="pkg-col-head">
                  <span className="badge">{pkg.id}</span>
                  <span className="nm">{pkg.nome.replace(`${pkg.id} — `, '')}</span>
                </div>

                <div className="pkg-field">
                  <span className="lbl">Objetivo principal</span>
                  <span className="val">{pkg.objetivo}</span>
                </div>

                <div className="pkg-field">
                  <span className="lbl">Mensagem × produto</span>
                  <span className="val mensagem">{pkg.mensagem}</span>
                </div>

                <div className="pkg-field">
                  <span className="lbl">Complexidade</span>
                  <span className="pkg-complex">
                    <span className="fogo">{'🔥'.repeat(Math.max(1, pkg.fogo)) || '⚡'}</span>
                    {pkg.complexidade}
                  </span>
                </div>

                <div className="pkg-field">
                  <span className="lbl">Processos</span>
                  <ul className="pkg-list">{pkg.processos.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>

                <div className="pkg-field">
                  <span className="lbl">Principais entregáveis</span>
                  <ul className="pkg-list">{pkg.entregaveis.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>
              </div>
          )}
          </div>
        </div>
      }
    </div>);

}

/* ───── Form modals ───── */
function CampaignFormModal({ initial, onClose, onSave }) {
  const blank = {
    nome: '', slug: '', pack: 'P', dono: TEAM_NAMES[0], tipo: 'Coleção', mes: '',
    dataInsta: todayISO(), dataSite: '-', dataComercial: '-', dataFinal: '', previsao: todayISO(),
    launched: false, progresso: 0,
    brainstormDate: '', brainstormDone: false,
    aprovComercialDate: '', aprovComercialDone: false,
    shootingDate: '', shootingDone: false
  };
  const [draft, setDraft] = useStateV(() => ({ ...blank, ...(initial || {}) }));
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const isNew = !initial;

  const handleSave = () => {
    if (!draft.nome.trim()) return;
    const slug = draft.slug || draft.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20);
    onSave({ ...draft, slug });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{
            width: 40, height: 40, borderRadius: 12, flex: '0 0 40px',
            background: 'var(--accent-gradient)', color: 'white', display: 'grid', placeItems: 'center'
          }}><Icon.campaign /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '.04em' }}>
              {isNew ? 'NOVA CAMPANHA' : 'EDITAR CAMPANHA'}
            </div>
            <input className="modal-title" value={draft.nome} placeholder="Nome da campanha"
            onChange={(e) => set('nome', e.target.value)} autoFocus />
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <div className="modal-section-label">Informações gerais</div>

            <label>Pacote</label>
            <PackToggle value={draft.pack} onChange={(v) => set('pack', v)} />

            <label>Tipo</label>
            <GenericSelect value={draft.tipo} options={CAMP_TIPOS.map((t) => ({ id: t, label: t }))}
            onChange={(v) => set('tipo', v)} width={240} />

            <label>Dono</label>
            <GenericSelect value={draft.dono} options={TEAM_NAMES.map((t) => ({ id: t, label: t }))}
            onChange={(v) => set('dono', v)} width={200} />

            <label>Mês foco</label>
            <input className="field" value={draft.mes} placeholder="ex: Maio"
            onChange={(e) => set('mes', e.target.value)} style={{ maxWidth: 200 }} />

            <div className="modal-section-label">Cronograma</div>

            <label>Previsão de lançamento</label>
            <input className="field" type="date" value={draft.previsao}
            onChange={(e) => set('previsao', e.target.value)} style={{ maxWidth: 200 }} />

            <label>Data Instagram</label>
            <input className="field" type="date" value={draft.dataInsta}
            onChange={(e) => set('dataInsta', e.target.value)} style={{ maxWidth: 200 }} />

            <label>Data site</label>
            <input className="field" type="date" value={draft.dataSite === '-' ? '' : draft.dataSite}
            onChange={(e) => set('dataSite', e.target.value || '-')} style={{ maxWidth: 200 }} />

            <label>Data comercial</label>
            <input className="field" type="date" value={draft.dataComercial === '-' ? '' : draft.dataComercial}
            onChange={(e) => set('dataComercial', e.target.value || '-')} style={{ maxWidth: 200 }} />

            <label>Data final</label>
            <input className="field" type="date" value={draft.dataFinal}
            onChange={(e) => set('dataFinal', e.target.value)} style={{ maxWidth: 200 }} />

            <div className="modal-section-label">Marcos de produção</div>

            <label>Brainstorm</label>
            <div className="field-inline">
              <input className="field" type="date" value={draft.brainstormDate}
              onChange={(e) => set('brainstormDate', e.target.value)} style={{ width: 200 }} />
              <FieldCheckbox label="Concluído" value={draft.brainstormDone}
              onChange={(v) => set('brainstormDone', v)} />
            </div>

            <label>Aprov. comercial</label>
            <div className="field-inline">
              <input className="field" type="date" value={draft.aprovComercialDate}
              onChange={(e) => set('aprovComercialDate', e.target.value)} style={{ width: 200 }} />
              <FieldCheckbox label="Concluído" value={draft.aprovComercialDone}
              onChange={(v) => set('aprovComercialDone', v)} />
            </div>

            <label>Shooting</label>
            <div className="field-inline">
              <input className="field" type="date" value={draft.shootingDate}
              onChange={(e) => set('shootingDate', e.target.value)} style={{ width: 200 }} />
              <FieldCheckbox label="Concluído" value={draft.shootingDone}
              onChange={(v) => set('shootingDone', v)} />
            </div>

            <div className="modal-section-label">Status</div>

            <label>Progresso</label>
            <div className="field-inline">
              <input type="range" min="0" max="100" step="5" value={draft.progresso}
              onChange={(e) => set('progresso', Number(e.target.value))}
              style={{ flex: 1, maxWidth: 280 }} />
              <span style={{ fontSize: 13, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums', minWidth: 40 }}>
                {draft.progresso}%
              </span>
            </div>

            <label>Lançada?</label>
            <FieldCheckbox label="Marcar como lançada" value={draft.launched}
            onChange={(v) => set('launched', v)} />
          </div>
        </div>

        <div className="modal-foot">
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handleSave}>
            {isNew ? 'Criar campanha' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>);

}

function ComemorativaFormModal({ onClose, onSave }) {
  const [draft, setDraft] = useStateV({
    type: 'evento', name: '', start: todayISO(), end: todayISO(),
    pack: 'M', potencial: true, postado: false, format: 'Estático'
  });
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const handleSave = () => {
    if (!draft.name.trim()) return;
    onSave({ ...draft, end: draft.end || draft.start });
    onClose();
  };
  const tp = EVENT_TYPES.find((t) => t.id === draft.type);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal form-modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(640px, calc(100vw - 40px))' }}>
        <div className="modal-head">
          <div style={{
            width: 40, height: 40, borderRadius: 12, flex: '0 0 40px',
            background: tp?.color || '#999', color: 'white', display: 'grid', placeItems: 'center'
          }}><Icon.events /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '.04em' }}>NOVA DATA COMEMORATIVA</div>
            <input className="modal-title" value={draft.name} placeholder="Nome da data"
            onChange={(e) => set('name', e.target.value)} autoFocus />
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <label>Tipo</label>
            <GenericSelect value={draft.type} options={EVENT_TYPES.map((t) => ({ id: t.id, label: t.label }))}
            onChange={(v) => set('type', v)} width={220} />

            <label>Início</label>
            <input className="field" type="date" value={draft.start}
            onChange={(e) => set('start', e.target.value)} style={{ maxWidth: 200 }} />

            <label>Fim</label>
            <input className="field" type="date" value={draft.end}
            onChange={(e) => set('end', e.target.value)} style={{ maxWidth: 200 }} />

            <label>Pacote</label>
            <PackToggle value={draft.pack} onChange={(v) => set('pack', v)} />

            <label>Formato</label>
            <GenericSelect value={draft.format} options={FORMATS_LIST.map((f) => ({ id: f, label: f }))}
            onChange={(v) => set('format', v)} width={200} />

            <label>Status</label>
            <div className="field-inline">
              <FieldCheckbox label="Potencial" value={draft.potencial} onChange={(v) => set('potencial', v)} />
              <FieldCheckbox label="Já postado" value={draft.postado} onChange={(v) => set('postado', v)} />
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handleSave}>Criar data</button>
        </div>
      </div>
    </div>);

}

function FutebolFormModal({ onClose, onSave }) {
  const [draft, setDraft] = useStateV({ type: 'jogo', name: '', date: todayISO() });
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const handleSave = () => {
    if (!draft.name.trim()) return;
    onSave(draft);
    onClose();
  };
  const tp = FUT_TYPES.find((t) => t.id === draft.type);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal form-modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px, calc(100vw - 40px))' }}>
        <div className="modal-head">
          <div style={{
            width: 40, height: 40, borderRadius: 12, flex: '0 0 40px',
            background: tp?.color || '#999', color: 'white', display: 'grid', placeItems: 'center'
          }}><Icon.ball /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '.04em' }}>NOVO EVENTO FUTEBOL 2026</div>
            <input className="modal-title" value={draft.name} placeholder="Ex: Brasil x Argentina"
            onChange={(e) => set('name', e.target.value)} autoFocus />
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <label>Tipo</label>
            <GenericSelect value={draft.type} options={FUT_TYPES.map((t) => ({ id: t.id, label: t.label }))}
            onChange={(v) => set('type', v)} width={240} />

            <label>Data</label>
            <input className="field" type="date" value={draft.date}
            onChange={(e) => set('date', e.target.value)} style={{ maxWidth: 200 }} />
          </div>
        </div>

        <div className="modal-foot">
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handleSave}>Criar evento</button>
        </div>
      </div>
    </div>);

}

/* ───── Milestones row ───── */
function Milestones({ campaign, onChange }) {
  const items = [
  { key: 'brainstorm', label: 'Brainstorm', dateKey: 'brainstormDate', doneKey: 'brainstormDone' },
  { key: 'aprovComercial', label: 'Aprov. Comercial', dateKey: 'aprovComercialDate', doneKey: 'aprovComercialDone' },
  { key: 'shooting', label: 'Shooting', dateKey: 'shootingDate', doneKey: 'shootingDone' }];

  return (
    <div className="milestones-row" onClick={(e) => e.stopPropagation()}>
      {items.map((it) => {
        const done = !!campaign[it.doneKey];
        return (
          <div key={it.key} className={`milestone ${done ? 'done' : ''}`}>
            <span className="ms-check" onClick={() => onChange({ [it.doneKey]: !done })}>
              {done && <Icon.check />}
            </span>
            <div className="ms-body">
              <div className="ms-label">{it.label}</div>
              <div className="ms-date">
                <input type="date" value={campaign[it.dateKey] || ''}
                onChange={(e) => onChange({ [it.dateKey]: e.target.value })} />
              </div>
            </div>
          </div>);

      })}
    </div>);

}

/* ───── Collection link section inside a campaign ───── */
function CollectionLinkSection({ campaign, collections, pickerOpen, onTogglePicker, onLink, onCreate, onUnlink, onNavigate }) {
  const linked = campaign.colecaoId != null
    ? collections.find(c => c.id === campaign.colecaoId)
    : null;
  const available = collections.filter(c => c.campaignId == null || c.campaignId === campaign.id);
  const tipo = linked ? COLECAO_TIPOS.find(t => t.id === linked.tipo) : null;

  return (
    <div className="link-section" onClick={(e) => e.stopPropagation()} style={{ marginTop: 22 }}>
      <div className="link-section-head">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
        <span className="link-section-label">Coleção</span>
        <span className="link-section-sub">
          {linked ? 'O progresso desta campanha é calculado pela coleção' : 'Toda campanha precisa de uma coleção para ter progresso automático'}
        </span>
      </div>
      {linked ? (
        <div className="link-chip-row">
          <button className="link-chip" onClick={() => onNavigate(linked.id)} type="button">
            <span className="link-chip-icon" style={{ background: tipo ? `color-mix(in oklab, ${tipo.color}, white 80%)` : 'var(--accent-soft)', color: tipo ? tipo.color : 'var(--accent-deep)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
            </span>
            <span className="link-chip-name">{linked.nome}</span>
            <span className="link-chip-meta">
              {tipo && <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, background: `color-mix(in oklab, ${tipo.color}, white 88%)`, color: tipo.color }}>{tipo.label}</span>}
              <span>· abrir coleção</span>
              <Icon.chevR />
            </span>
          </button>
          <button className="link-unlink" onClick={onUnlink} type="button" title="Desvincular">
            <Icon.x />
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <button className="btn btn-ghost link-add-btn" onClick={onTogglePicker} type="button">
            <Icon.plus /> Vincular coleção
          </button>
          {pickerOpen && (
            <React.Fragment>
              <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={onTogglePicker} />
              <div className="link-picker">
                <div className="link-picker-head">Vincular a uma coleção</div>
                {available.length > 0 ? (
                  <div className="link-picker-list">
                    {available.map(col => {
                      const tp = COLECAO_TIPOS.find(t => t.id === col.tipo);
                      return (
                        <button key={col.id} type="button" onClick={() => onLink(col.id)}>
                          <span style={{ width: 8, height: 8, borderRadius: 50, background: tp.color, flex: '0 0 8px' }} />
                          <span className="lp-name">{col.nome}</span>
                          <span className="lp-sub">{tp.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="link-picker-empty">Todas as coleções já têm campanha vinculada</div>
                )}
                <button type="button" className="link-picker-create" onClick={onCreate}>
                  <Icon.plus /> Criar nova coleção a partir desta campanha
                </button>
              </div>
            </React.Fragment>
          )}
        </div>
      )}
    </div>
  );
}

/* ───── Campaigns View ───── */
function CampaignsView({ posts, onPostClick, linking, onNavigateCollection }) {
  const { collections, campaigns, setCampaigns,
    linkColCamp, unlinkColCamp, createCollectionFromCampaign,
    setCampaignLaunched } = linking;
  const [filter, setFilter] = useStateV('all');
  const [expanded, setExpanded] = useStateV(null);
  const [linkedCampaign, setLinkedCampaign] = useStateV(null);
  const [showForm, setShowForm] = useStateV(false);
  const [pickerOpen, setPickerOpen] = useStateV(null);

  // listen for cross-view focus
  React.useEffect(() => {
    const h = (e) => setExpanded(e.detail);
    window.addEventListener('focusCampaign', h);
    return () => window.removeEventListener('focusCampaign', h);
  }, []);

  const items = campaigns;
  const getEffectiveProgress = (c) => {
    if (c.colecaoId != null) {
      const col = collections.find(x => x.id === c.colecaoId);
      if (col) return colProgress(col);
    }
    return c.progresso;
  };

  const filtered = filter === 'all' ? items :
  filter === 'launched' ? items.filter((i) => i.launched) :
  filter === 'pending' ? items.filter((i) => !i.launched) :
  items.filter((i) => i.tipo === filter);

  const updateCampaign = (id, patch) => {
    setCampaigns((arr) => arr.map((c) => c.id === id ? { ...c, ...patch } : c));
  };

  const addCampaign = (data) => {
    const id = items.reduce((m, c) => Math.max(m, c.id), 0) + 1;
    setCampaigns((arr) => [...arr, { id, colecaoId: null, ...data }]);
  };

  return (
    <React.Fragment>
      <PackageInfoPanel />

      <div className="filter-bar" style={{ paddingTop: 16 }}>
        {[
        { id: 'all', label: 'Todas' },
        { id: 'pending', label: 'Aguardando', dot: 'oklch(0.62 0.13 75)' },
        { id: 'launched', label: 'Lançadas', dot: 'oklch(0.6 0.13 150)' }].
        map((f) =>
        <button key={f.id} className={`platform-pill ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
            {f.dot && <span className="dot" style={{ background: f.dot }} />}{f.label}
          </button>
        )}
        <div style={{ width: 1, height: 18, background: 'var(--line)', margin: '0 6px' }} />
        {CAMP_TIPOS.map((t) =>
        <button key={t} className={`platform-pill ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
            <span className="dot" style={{ background: tipoColors[t] }} />{t}
          </button>
        )}
        <div style={{ flex: 1 }} />
        <span className="count-pill">{filtered.length} {filtered.length === 1 ? 'campanha' : 'campanhas'}</span>
        <button className="btn btn-accent" onClick={() => setShowForm(true)}><Icon.plus /> Nova campanha</button>
      </div>

      <div className="list-wrap">
        <div className="list">
          <div className="list-row list-head" style={{ gridTemplateColumns: '40px 2.2fr 70px 1.1fr 1.2fr 0.9fr 1.1fr 110px 130px' }}>
            <div className="cell" /><div className="cell">Campanha</div><div className="cell">Pacote</div>
            <div className="cell">Dono</div><div className="cell">Tipo</div><div className="cell">Mês</div>
            <div className="cell">Data Insta</div><div className="cell">Status</div><div className="cell">Progresso</div>
          </div>
          {filtered.map((c) => {
            const isOpen = expanded === c.id;
            const effProg = getEffectiveProgress(c);
            const linkedColecao = c.colecaoId != null ? collections.find(x => x.id === c.colecaoId) : null;
            return (
              <div key={c.id}>
                <div className={`list-row expandable ${isOpen ? 'expanded' : ''}`}
                style={{ gridTemplateColumns: '40px 2.2fr 70px 1.1fr 1.2fr 0.9fr 1.1fr 110px 130px' }}
                onClick={() => setExpanded(isOpen ? null : c.id)}>
                  <div className="cell" style={{ padding: '14px 0 14px 16px' }}>
                    <span style={{ display: 'inline-grid', placeItems: 'center', width: 24, height: 24, borderRadius: 999, color: 'var(--ink-3)', transition: 'transform .2s', transform: isOpen ? 'rotate(0)' : 'rotate(-90deg)' }}>
                      <Icon.chevD />
                    </span>
                  </div>
                  <div className="cell" style={{ fontWeight: 500, fontSize: 13 }}>
                    {c.nome}
                    {linkedColecao && (
                      <span className="link-badge" title={`Coleção vinculada: ${linkedColecao.nome}`}>
                        <Icon.collections /> Coleção
                      </span>
                    )}
                  </div>
                  <div className="cell"><span className={`event-pack ${c.pack.toLowerCase()}`}>{c.pack}</span></div>
                  <div className="cell">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span className="sb-avatar" style={{ width: 24, height: 24, fontSize: 13, flex: '0 0 24px' }}>{c.dono.charAt(0)}</span>
                      {c.dono}
                    </span>
                  </div>
                  <div className="cell">
                    <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: `color-mix(in oklab, ${tipoColors[c.tipo] ?? '#999'}, white 88%)`, color: tipoColors[c.tipo] ?? '#999' }}>{c.tipo}</span>
                  </div>
                  <div className="cell" style={{ color: 'var(--ink-2)' }}>{c.mes}</div>
                  <div className="cell" style={{ fontSize: 13, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>{fmtBR(c.dataInsta)}</div>
                  <div className="cell">
                    {c.launched ?
                    <span className="status-pill s-pub"><span className="sdot" />Lançado</span> :
                    <span className="status-pill s-prod"><span className="sdot" />Aguardando</span>}
                  </div>
                  <div className="cell">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={`progress ${linkedColecao ? 'from-link' : ''}`} style={{ flex: 1 }}><div style={{ width: `${effProg}%` }} /></div>
                      <span style={{ fontSize: 11, color: 'var(--ink-3)', minWidth: 30, textAlign: 'right', fontVariantNumeric: 'tabular-nums', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {effProg}%
                        {linkedColecao && <span className="link-icon-mini" title="Calculado pela coleção"><Icon.link /></span>}
                      </span>
                    </div>
                  </div>
                </div>

                {isOpen &&
                <div className="list-expansion">
                    <div className="exp-grid">
                      {[
                    ['Previsão de lançamento', fmtBR(c.previsao)],
                    ['Data site', fmtBR(c.dataSite)],
                    ['Data Instagram', fmtBR(c.dataInsta)],
                    ['Data comercial', fmtBR(c.dataComercial)],
                    ['Data final', fmtBR(c.dataFinal)],
                    ['Mês foco', c.mes]].
                    map(([label, value]) =>
                    <div key={label} className="exp-cell"><label>{label}</label><div className="v">{value}</div></div>
                    )}
                      <div className="exp-cell"><label>Pacote</label><div className="v"><span className={`event-pack ${c.pack.toLowerCase()}`}>{c.pack}</span></div></div>
                      <div className="exp-cell">
                        <label>Conclusão {linkedColecao && <span style={{ color: 'var(--accent-deep)' }}>· vem da coleção</span>}</label>
                        <div className="v" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className={`progress ${linkedColecao ? 'from-link' : ''}`} style={{ flex: 1, maxWidth: 130 }}><div style={{ width: `${effProg}%` }} /></div>
                          <span style={{ fontSize: 11 }}>{effProg}%</span>
                        </div>
                      </div>
                    </div>

                    <CollectionLinkSection
                      campaign={c}
                      collections={collections}
                      pickerOpen={pickerOpen === c.id}
                      onTogglePicker={() => setPickerOpen(pickerOpen === c.id ? null : c.id)}
                      onLink={(colId) => { linkColCamp(colId, c.id); setPickerOpen(null); }}
                      onCreate={() => { createCollectionFromCampaign(c); setPickerOpen(null); }}
                      onUnlink={() => unlinkColCamp(c.colecaoId, c.id)}
                      onNavigate={onNavigateCollection}
                    />

                    <div style={{ marginTop: 22 }}>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Marcos de produção
                      </div>
                      <Milestones campaign={c} onChange={(patch) => updateCampaign(c.id, patch)} />
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
                      <button className="btn btn-accent" onClick={(e) => {e.stopPropagation();setLinkedCampaign(c);}}>
                        <Icon.link /> Ver posts vinculados
                      </button>
                      <button className="btn btn-ghost">Editar campanha</button>
                      <FieldCheckbox label="Lançada (já no site)"
                        value={c.launched}
                        onChange={v => setCampaignLaunched(c.id, v)} />
                      <div style={{ flex: 1 }} />
                      <button className="btn btn-ghost" style={{ color: 'var(--ink-3)' }}><Icon.trash /> Excluir</button>
                    </div>
                  </div>
                }
              </div>);

          })}
        </div>
      </div>

      {linkedCampaign &&
      <LinkedPostsDrawer campaign={linkedCampaign} posts={posts}
      onClose={() => setLinkedCampaign(null)}
      onPostClick={(p) => {setLinkedCampaign(null);onPostClick(p);}} />
      }

      {showForm &&
      <CampaignFormModal onClose={() => setShowForm(false)} onSave={addCampaign} />
      }
    </React.Fragment>);

}

/* ───── Comemorativas View ───── */
function ComemMiniCalendar({ events, year, month }) {
  const cells = buildMonthGrid(year, month);
  const today = todayISO();
  const byDay = {};
  events.forEach((e) => {
    const s = parseISO(e.start),en = parseISO(e.end);
    for (const d = new Date(s); d <= en; d.setDate(d.getDate() + 1)) {
      const iso = toISO(d.getFullYear(), d.getMonth(), d.getDate());
      (byDay[iso] = byDay[iso] || []).push(e);
    }
  });
  return (
    <div className="cal-grid">
      {WEEKDAYS.map((w) => <div key={w} className="cal-head">{w}</div>)}
      {cells.map((c, i) => {
        const isToday = c.iso === today;
        const dayE = byDay[c.iso] || [];
        return (
          <div key={i} className={`cal-cell ${c.other ? 'other' : ''} ${isToday ? 'today' : ''}`}>
            <div className="cal-num-row"><span className="cal-num-box">{c.day}</span></div>
            {dayE.slice(0, 3).map((e, k) => {
              const color = EVENT_TYPES.find((t) => t.id === e.type)?.color ?? '#999';
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 6,
                  background: `color-mix(in oklab, ${color}, white 88%)`, color: `color-mix(in oklab, ${color}, black 25%)`,
                  fontSize: 11.5, fontWeight: 500 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{e.name}</span>
                  <span className={`event-pack ${e.pack.toLowerCase()}`} style={{ background: 'rgba(255,255,255,.5)', border: 'none' }}>{e.pack}</span>
                </div>);

            })}
            {dayE.length > 3 && <div className="cal-more">+{dayE.length - 3}</div>}
          </div>);

      })}
    </div>);

}

function ComemorativasView() {
  const [view, setView] = useStateV('list');
  const [filter, setFilter] = useStateV('all');
  const [month, setMonth] = useStateV(4);
  const [year] = useStateV(2026);
  const [items, setItems] = useStateV(COMEMORATIVAS);
  const [showForm, setShowForm] = useStateV(false);
  const filtered = filter === 'all' ? items : items.filter((e) => e.type === filter);
  const toggleField = (id, field) => setItems((arr) => arr.map((e) => e.id === id ? { ...e, [field]: !e[field] } : e));
  const addItem = (data) => {
    const id = items.reduce((m, c) => Math.max(m, c.id), 0) + 1;
    setItems((arr) => [...arr, { id, ...data }]);
  };

  return (
    <React.Fragment>
      <div className="filter-bar">
        <button className={`platform-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todas</button>
        {EVENT_TYPES.map((t) =>
        <button key={t.id} className={`platform-pill ${filter === t.id ? 'active' : ''}`} onClick={() => setFilter(t.id)}>
            <span className="dot" style={{ background: t.color }} />{t.label}
          </button>
        )}
        <div style={{ flex: 1 }} />
        <div className="view-toggle">
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>Lista</button>
          <button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>Calendário</button>
        </div>
        <button className="btn btn-accent" onClick={() => setShowForm(true)}><Icon.plus /> Nova data</button>
      </div>

      <div className="list-wrap">
        {view === 'list' ?
        <div className="list">
            <div className="list-row list-head" style={{ gridTemplateColumns: '40px 1.6fr 1.1fr 0.9fr 80px 90px 90px 1fr' }}>
              {['', 'Nome', 'Período', 'Tipo', 'Pacote', 'Potencial', 'Postado', 'Formato'].map((h, i) =>
            <div key={i} className="cell">{h}</div>
            )}
            </div>
            {filtered.map((e) => {
            const tp = EVENT_TYPES.find((t) => t.id === e.type);
            return (
              <div key={e.id} className="list-row" style={{ gridTemplateColumns: '40px 1.6fr 1.1fr 0.9fr 80px 90px 90px 1fr' }}>
                  <div className="cell"><span className="dot" style={{ background: tp.color }} /></div>
                  <div className="cell" style={{ fontWeight: 500, fontSize: 13 }}>{e.name}</div>
                  <div className="cell" style={{ fontSize: 13, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtBR(e.start)}{e.end !== e.start ? ` → ${fmtBR(e.end)}` : ''}
                  </div>
                  <div className="cell">
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                    background: `color-mix(in oklab, ${tp.color}, white 88%)`, color: tp.color }}>{tp.label}</span>
                  </div>
                  <div className="cell"><span className={`event-pack ${e.pack.toLowerCase()}`}>{e.pack}</span></div>
                  <div className="cell">
                    <button className={`check-cell ${e.potencial ? 'on' : ''}`} onClick={() => toggleField(e.id, 'potencial')}>
                      {e.potencial && <Icon.check />}
                    </button>
                  </div>
                  <div className="cell">
                    <button className={`check-cell ${e.postado ? 'on' : ''}`} onClick={() => toggleField(e.id, 'postado')}>
                      {e.postado && <Icon.check />}
                    </button>
                  </div>
                  <div className="cell" style={{ color: 'var(--ink-2)' }}>{e.format}</div>
                </div>);

          })}
          </div> :

        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div className="month-nav">
                <button onClick={() => setMonth((m) => Math.max(0, m - 1))}><Icon.chevL /></button>
                <div className="label">{MONTHS[month]} {year}</div>
                <button onClick={() => setMonth((m) => Math.min(11, m + 1))}><Icon.chevR /></button>
              </div>
            </div>
            <ComemMiniCalendar events={filtered} year={year} month={month} />
          </div>
        }
      </div>

      {showForm &&
      <ComemorativaFormModal onClose={() => setShowForm(false)} onSave={addItem} />
      }
    </React.Fragment>);

}

/* ───── Futebol View ───── */
function FutMiniCalendar({ events, year, month }) {
  const cells = buildMonthGrid(year, month);
  const today = todayISO();
  const byDay = {};
  events.forEach((e) => {(byDay[e.date] = byDay[e.date] || []).push(e);});
  return (
    <div className="cal-grid">
      {WEEKDAYS.map((w) => <div key={w} className="cal-head">{w}</div>)}
      {cells.map((c, i) => {
        const isToday = c.iso === today;
        const dayE = byDay[c.iso] || [];
        return (
          <div key={i} className={`cal-cell ${c.other ? 'other' : ''} ${isToday ? 'today' : ''}`}>
            <div className="cal-num-row"><span className="cal-num-box">{c.day}</span></div>
            {dayE.slice(0, 3).map((e, k) => {
              const color = FUT_TYPES.find((t) => t.id === e.type)?.color ?? '#999';
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 6,
                  background: `color-mix(in oklab, ${color}, white 88%)`,
                  color: `color-mix(in oklab, ${color}, black 25%)`, fontSize: 11.5, fontWeight: 500 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{e.name}</span>
                </div>);

            })}
            {dayE.length > 3 && <div className="cal-more">+{dayE.length - 3}</div>}
          </div>);

      })}
    </div>);

}

function FutebolView() {
  const [view, setView] = useStateV('list');
  const [filter, setFilter] = useStateV('all');
  const [month, setMonth] = useStateV(4);
  const [year] = useStateV(2026);
  const [items, setItems] = useStateV(FUTEBOL_2026);
  const [showForm, setShowForm] = useStateV(false);
  const today = todayISO();
  const filtered = filter === 'all' ? items : items.filter((e) => e.type === filter);
  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
  const addItem = (data) => {
    const id = items.reduce((m, c) => Math.max(m, c.id), 0) + 1;
    setItems((arr) => [...arr, { id, ...data }]);
  };

  return (
    <React.Fragment>
      <div className="filter-bar">
        <button className={`platform-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todos</button>
        {FUT_TYPES.map((t) =>
        <button key={t.id} className={`platform-pill ${filter === t.id ? 'active' : ''}`} onClick={() => setFilter(t.id)}>
            <span className="dot" style={{ background: t.color }} />{t.label}
          </button>
        )}
        <div style={{ flex: 1 }} />
        <div className="view-toggle">
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>Lista</button>
          <button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>Calendário</button>
        </div>
        <button className="btn btn-accent" onClick={() => setShowForm(true)}><Icon.plus /> Novo evento</button>
      </div>

      <div className="list-wrap">
        {view === 'list' ?
        <div className="list">
            <div className="list-row list-head" style={{ gridTemplateColumns: '40px 1.1fr 2fr 160px' }}>
              {['', 'Tipo', 'Nome', 'Data'].map((h, i) => <div key={i} className="cell">{h}</div>)}
            </div>
            {sorted.map((e) => {
            const tp = FUT_TYPES.find((t) => t.id === e.type);
            const past = e.date < today;
            return (
              <div key={e.id} className="list-row" style={{ gridTemplateColumns: '40px 1.1fr 2fr 160px', opacity: past ? 0.5 : 1 }}>
                  <div className="cell"><span className="dot" style={{ background: tp.color }} /></div>
                  <div className="cell">
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                    background: `color-mix(in oklab, ${tp.color}, white 88%)`, color: tp.color }}>{tp.label}</span>
                  </div>
                  <div className="cell" style={{ fontSize: 14, fontWeight: 500 }}>{e.name}</div>
                  <div className="cell" style={{ fontSize: 13, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>{fmtBR(e.date)}</div>
                </div>);

          })}
          </div> :

        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div className="month-nav">
                <button onClick={() => setMonth((m) => Math.max(0, m - 1))}><Icon.chevL /></button>
                <div className="label">{MONTHS[month]} {year}</div>
                <button onClick={() => setMonth((m) => Math.min(11, m + 1))}><Icon.chevR /></button>
              </div>
            </div>
            <FutMiniCalendar events={filtered} year={year} month={month} />
          </div>
        }
      </div>

      {showForm &&
      <FutebolFormModal onClose={() => setShowForm(false)} onSave={addItem} />
      }
    </React.Fragment>);

}

/* ───── Profile View ───── */
function ProfileAvatar({ profile, size = 80, photo, editable = false, onPickPhoto }) {
  const ref = useRefV(null);
  return (
    <div className="profile-avatar-wrap" style={{ width: size, height: size }}>
      {photo ?
      <img src={photo} alt={profile.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> :

      <div className="profile-avatar" style={{
        width: '100%', height: '100%',
        background: `linear-gradient(135deg, ${profile.color}, color-mix(in oklab, ${profile.color}, black 15%))`,
        fontSize: size * 0.4
      }}>{profile.initial}</div>
      }
      {editable &&
      <React.Fragment>
          <button className="profile-avatar-edit" onClick={() => ref.current?.click()} title="Trocar foto"><Icon.camera /></button>
          <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f || !onPickPhoto) return;
          const reader = new FileReader();
          reader.onload = () => onPickPhoto(reader.result);
          reader.readAsDataURL(f);
        }} />
        </React.Fragment>
      }
    </div>);

}

function ProfileStats({ posts, profileId }) {
  const mine = posts.filter((p) => p.owner === profileId);
  const counts = {
    total: mine.length,
    prod: mine.filter((p) => p.status === 'prod').length,
    sched: mine.filter((p) => p.status === 'sched').length,
    pub: mine.filter((p) => p.status === 'pub').length
  };
  return (
    <div className="profile-stats">
      <div className="stat"><div className="stat-n">{counts.total}</div><div className="stat-l">Posts atribuídos</div></div>
      <div className="stat"><div className="stat-n" style={{ color: 'var(--s-prod)' }}>{counts.prod}</div><div className="stat-l">Em produção</div></div>
      <div className="stat"><div className="stat-n" style={{ color: 'var(--s-sched)' }}>{counts.sched}</div><div className="stat-l">Agendados</div></div>
      <div className="stat"><div className="stat-n" style={{ color: 'var(--s-pub)' }}>{counts.pub}</div><div className="stat-l">Publicados</div></div>
    </div>);

}

function ActivitiesList({ posts, profile, onPostClick }) {
  const [statusFilter, setStatusFilter] = useStateV('all');
  let mine = posts.filter((p) => p.owner === profile.id);
  if (statusFilter !== 'all') mine = mine.filter((p) => p.status === statusFilter);
  mine.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        <button className={`tag-chip ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>Todos</button>
        {STATUSES.map((s) =>
        <button key={s.id} className={`tag-chip ${statusFilter === s.id ? 'active' : ''}`} onClick={() => setStatusFilter(s.id)}>{s.label}</button>
        )}
      </div>
      {mine.length === 0 ?
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: 60, textAlign: 'center', color: 'var(--ink-3)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 4 }}>Nenhuma atividade</div>
          <div style={{ fontSize: 13 }}>Nenhum post com esse status.</div>
        </div> :

      <div className="activity-list">
          {mine.map((p) => {
          const plat = PLATFORMS.find((x) => x.id === p.platform);
          const status = STATUSES.find((s) => s.id === p.status);
          const d = new Date(p.date + 'T12:00:00');
          return (
            <div key={p.id} className="activity-row" onClick={() => onPostClick(p)}>
                <div className="ar-date">
                  <div className="day">{d.getDate()}</div>
                  <div className="month">{MONTH_ABBR[d.getMonth()]}</div>
                </div>
                <span style={{ width: 28, height: 28, flex: '0 0 28px', borderRadius: 8, background: plat.color, display: 'grid', placeItems: 'center' }}>
                  <PlatformIcon platform={p.platform} size={14} color="white" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ar-title">{p.title}</div>
                  <div className="ar-meta"><span>{p.time}</span><span>·</span><span>{p.type}</span></div>
                </div>
                <span className={`status-pill ${status.className}`}><span className="sdot" />{status.label}</span>
              </div>);

        })}
        </div>
      }
    </div>);

}

function TeamGrid({ posts, currentId, onSelect, photos }) {
  return (
    <div className="team-grid">
      {TEAM_PROFILES.map((p) => {
        const count = posts.filter((x) => x.owner === p.id).length;
        const photo = photos[p.id];
        return (
          <button key={p.id} className={`team-card ${p.id === currentId ? 'current' : ''}`} onClick={() => onSelect(p.id)}>
            <ProfileAvatar profile={p} photo={photo} size={56} />
            <div style={{ marginTop: 14 }}>
              <div className="tc-name">{p.name}{p.isMe && <span className="me-tag">você</span>}</div>
              <div className="tc-role">{p.role}</div>
            </div>
            <div className="tc-stat"><span className="n">{count}</span><span>posts atribuídos</span></div>
          </button>);

      })}
    </div>);

}

function ProfileView({ posts, profileId, meId, onSelectProfile, onPostClick, photos, onSetPhoto }) {
  const profile = TEAM_PROFILES.find((p) => p.id === profileId) ?? TEAM_PROFILES[0];
  const [tab, setTab] = useStateV('activities');
  const isMe = profile.id === meId;
  const photo = photos[profile.id];
  const fmtDate = (iso) => {
    const d = new Date(iso + 'T12:00:00');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };
  return (
    <div className="profile-wrap">
      <div className="profile-hero">
        {!isMe &&
        <button className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => onSelectProfile(meId)}>
            <Icon.chevL /> Voltar ao meu perfil
          </button>
        }
        <div className="profile-hero-card">
          <ProfileAvatar profile={profile} size={96} photo={photo} editable={isMe} onPickPhoto={(d) => onSetPhoto(profile.id, d)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ph-name">{profile.name}{isMe && <span className="me-tag">você</span>}</div>
            <div className="ph-role">{profile.role}</div>
            <div className="ph-meta">
              <span><Icon.mail /> {profile.email}</span>
              <span><Icon.cal /> Na equipe desde {fmtDate(profile.joined)}</span>
            </div>
          </div>
          {isMe && <button className="btn btn-ghost"><Icon.settings /> Editar perfil</button>}
        </div>
        <ProfileStats posts={posts} profileId={profile.id} />
      </div>

      <div className="profile-tabs">
        <button className={tab === 'activities' ? 'active' : ''} onClick={() => setTab('activities')}>Atividades atribuídas</button>
        {isMe && <button className={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}>Equipe</button>}
      </div>

      <div>
        {tab === 'activities' && <ActivitiesList posts={posts} profile={profile} onPostClick={onPostClick} />}
        {tab === 'team' && isMe && <TeamGrid posts={posts} currentId={profile.id} onSelect={onSelectProfile} photos={photos} />}
      </div>
    </div>);

}

Object.assign(window, {
  CampaignsView, ComemorativasView, FutebolView, ProfileView
});