/* ============================================================
   Stories View — calendar + list focado em stories
   ============================================================ */
const { useState: useStateS, useMemo: useMemoS, useEffect: useEffectS } = React;

/* ---- Constants ---- */
const STORY_CATEGORIES = [
  { id: 'asmr',        label: 'ASMR',         color: 'oklch(0.65 0.16 320)' },
  { id: 'trends',      label: 'Trends',       color: 'oklch(0.6 0.16 265)'  },
  { id: 'bastidores',  label: 'Bastidores',   color: 'oklch(0.65 0.14 60)'  },
  { id: 'produto',     label: 'Produto',      color: 'oklch(0.6 0.15 150)'  },
  { id: 'promocao',    label: 'Promoção',     color: 'oklch(0.6 0.18 25)'   },
  { id: 'branding',    label: 'Branding',     color: 'oklch(0.55 0.15 285)' },
  { id: 'engajamento', label: 'Engajamento',  color: 'oklch(0.62 0.13 210)' },
];

const STORY_STATUSES = [
  { id: 'naoIniciado', label: 'Não iniciado', color: 'oklch(0.65 0.012 300)' },
  { id: 'andamento',   label: 'Em andamento', color: 'oklch(0.62 0.13 75)'   },
  { id: 'feito',       label: 'Feito',        color: 'oklch(0.6 0.13 265)'   },
  { id: 'postado',     label: 'Postado',      color: 'oklch(0.6 0.13 150)'   },
  { id: 'naoPostado',  label: 'Não postado',  color: 'oklch(0.6 0.05 25)'    },
];

const PRODUTOS_FOCO = [
  'Capa Care Verão',
  'Carteira Care',
  'Capa Liso Premium',
  'Capa Floral Autoral',
  'Disney 100 — Princesas',
  'Tampas Pastel',
  'Coleção ASMR',
  'Caneca Care',
  'Pop socket Care',
  'Linha Geométrico',
  'Capa Marvel',
  'Linha Branding',
];

/* ---- Helpers ---- */
const storyCode = (iso, time) => {
  if (!iso || !time) return '';
  const [y, m, d] = iso.split('-');
  const [hh] = time.split(':');
  return `${y}${m}${d}${hh}`;
};
const storyCodePretty = (iso, time) => {
  if (!iso || !time) return '—';
  const d = parseISO(iso);
  const [hh] = time.split(':');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, às ${hh}h`;
};
const fmtBRL = (n) => n == null ? '—' : 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtInt = (n) => n == null ? '—' : n.toLocaleString('pt-BR');

/* ---- Mock data: ~30 stories around current month ---- */
function genMockStories() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows = [
    ['Capa Care Verão',      'produto',    9],
    ['Coleção ASMR',         'asmr',       11],
    ['Carteira Care',        'produto',    14],
    ['Linha Branding',       'branding',   18],
    ['Capa Floral Autoral',  'produto',    10],
    ['Caneca Care',          'promocao',   16],
    ['Disney 100 — Princesas', 'produto',  12],
    ['Capa Liso Premium',    'engajamento',19],
    ['Coleção ASMR',         'asmr',       21],
    ['Tampas Pastel',        'bastidores', 13],
    ['Pop socket Care',      'trends',     17],
    ['Capa Marvel',          'produto',    15],
    ['Linha Geométrico',     'bastidores', 11],
    ['Capa Care Verão',      'trends',     14],
    ['Carteira Care',        'branding',   20],
    ['Linha Branding',       'engajamento',8 ],
    ['Tampas Pastel',        'promocao',   16],
    ['Coleção ASMR',         'asmr',       10],
    ['Disney 100 — Princesas','promocao',  18],
    ['Capa Floral Autoral',  'engajamento',12],
    ['Capa Care Verão',      'produto',    21],
    ['Caneca Care',          'bastidores', 9 ],
    ['Pop socket Care',      'produto',    13],
    ['Linha Geométrico',     'trends',     17],
    ['Coleção ASMR',         'asmr',       15],
    ['Capa Marvel',          'trends',     19],
    ['Capa Liso Premium',    'produto',    11],
    ['Tampas Pastel',        'produto',    14],
    ['Linha Branding',       'branding',   16],
    ['Carteira Care',        'engajamento',18],
  ];

  const out = [];
  let id = 1;
  rows.forEach((row, i) => {
    const [produto, categoria, baseHour] = row;
    const dayOffset = (i * 2 + (i % 3)) % (daysInMonth + 4);
    const dayN = 1 + dayOffset;
    let d, m = month, y = year;
    if (dayN > daysInMonth) {
      d = dayN - daysInMonth;
      m = month + 1;
      if (m > 11) { m = 0; y = year + 1; }
    } else { d = dayN; }
    const dateISO = toISO(y, m, d);
    const min = (i * 13) % 60;
    const time = `${pad(baseHour)}:${pad(min)}`;

    // status based on date vs today
    const isPast = (y < year) || (y === year && m < month) || (y === year && m === month && d < today);
    const isToday = (y === year && m === month && d === today);
    let status;
    if (isPast) {
      status = i % 6 === 0 ? 'naoPostado' : 'postado';
    } else if (isToday) {
      status = i % 2 === 0 ? 'feito' : 'andamento';
    } else {
      const cycle = i % 5;
      status = cycle === 0 ? 'feito' : cycle === 1 ? 'andamento' : 'naoIniciado';
    }

    // metrics — only for postados
    let receita = null, sessoes = null, transacoes = null;
    if (status === 'postado') {
      const base = 800 + ((i * 173) % 2400);
      receita = base * (12 + (i % 7));
      sessoes = 2400 + ((i * 311) % 9000);
      transacoes = 12 + ((i * 7) % 95);
    }

    out.push({
      id: id++,
      date: dateISO,
      time,
      produto,
      categoria,
      status,
      receita, sessoes, transacoes,
      link: status === 'postado' ? 'https://instagram.com/story/' + id : '',
      linkCta: 'https://gocase.com.br/' + produto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
    });
  });
  return out;
}

/* ============================================================
   Story Pill (cell + list)
   ============================================================ */
function StoryStatusPill({ status }) {
  const st = STORY_STATUSES.find(s => s.id === status) || STORY_STATUSES[0];
  return (
    <span className="story-status-pill" style={{
      background: `color-mix(in oklab, ${st.color}, white 88%)`,
      color: `color-mix(in oklab, ${st.color}, black 25%)`,
      border: `1px solid color-mix(in oklab, ${st.color}, white 78%)`,
    }}>
      <span className="dot" style={{ background: st.color, width: 6, height: 6 }} />
      {st.label}
    </span>
  );
}

function StoryCategoryChip({ id }) {
  const c = STORY_CATEGORIES.find(x => x.id === id);
  if (!c) return null;
  return (
    <span className="story-cat-chip" style={{
      background: `color-mix(in oklab, ${c.color}, white 90%)`,
      color: `color-mix(in oklab, ${c.color}, black 20%)`,
    }}>
      {c.label}
    </span>
  );
}

/* ============================================================
   Calendar grid for stories
   ============================================================ */
function StoryDot({ story, onClick }) {
  const cat = STORY_CATEGORIES.find(c => c.id === story.categoria);
  const st = STORY_STATUSES.find(s => s.id === story.status);
  const isDone = story.status === 'postado' || story.status === 'feito';
  return (
    <button
      className="story-chip"
      onClick={e => { e.stopPropagation(); onClick(story); }}
      title={`${story.time} · ${story.produto} · ${st.label}`}
      style={{
        background: `color-mix(in oklab, ${cat.color}, white 92%)`,
        borderLeft: `3px solid ${cat.color}`,
        opacity: story.status === 'naoPostado' ? 0.55 : 1,
      }}
    >
      <span className="sc-time">{story.time}</span>
      <span className="sc-title" style={{ textDecoration: story.status === 'naoPostado' ? 'line-through' : 'none' }}>
        {story.produto}
      </span>
      <span className="sc-status-dot" style={{ background: st.color }} title={st.label} />
    </button>
  );
}

function StoriesCalendarGrid({ year, month, stories, onStoryClick, onNewStory, maxPerCell = 3 }) {
  const cells = useMemoS(() => buildMonthGrid(year, month), [year, month]);
  const today = todayISO();

  const byDay = useMemoS(() => {
    const map = {};
    stories.forEach(s => { (map[s.date] = map[s.date] || []).push(s); });
    Object.values(map).forEach(arr => arr.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [stories]);

  return (
    <div className="cal-grid">
      {WEEKDAYS.map(w => <div key={w} className="cal-head">{w}</div>)}
      {cells.map((c, i) => {
        const isToday = c.iso === today;
        const day = byDay[c.iso] || [];
        const visible = day.slice(0, maxPerCell);
        const more = day.length - visible.length;
        return (
          <div key={i}
            className={`cal-cell ${c.other ? 'other' : ''} ${isToday ? 'today' : ''}`}
            onClick={() => !c.other && onNewStory(c.iso)}>
            <div className="cal-num-row">
              <span className="cal-num-box">{c.day}</span>
              {day.length > 0 && (
                <span className="story-day-count" title={`${day.length} story${day.length > 1 ? 's' : ''}`}>
                  {day.length}
                </span>
              )}
            </div>
            {visible.map(s => <StoryDot key={s.id} story={s} onClick={onStoryClick} />)}
            {more > 0 && <div className="cal-more" onClick={e => e.stopPropagation()}>+{more} mais</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   Stories List view — expandable card rows (estilo campanhas)
   ============================================================ */
const LIST_GRID_COLS = '40px 110px 110px 72px minmax(180px, 1fr) 130px 115px 90px 80px 135px 86px 48px';
const LIST_HEADERS = ['', 'Código', 'Data', 'Hora', 'Produto foco', 'Categoria', 'Receita', 'Sessões', 'Trans.', 'Status', 'Links', ''];

function StoryExpandedCard({ draft, set, isPostado, onSave, onCancel, onDelete }) {
  const cat = STORY_CATEGORIES.find(c => c.id === draft.categoria);
  const codePretty = storyCodePretty(draft.date, draft.time);

  return (
    <div className="list-expansion stories-exp">
      <div className="stories-exp-head">
        <div className="story-modal-mark" style={{
          background: `color-mix(in oklab, ${cat?.color || 'var(--accent)'}, white 80%)`,
          color: cat?.color || 'var(--accent-deep)',
          width: 38, height: 38, borderRadius: 10, flex: '0 0 38px',
        }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" strokeDasharray="3 2.4" />
            <circle cx="12" cy="12" r="3.4" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase' }}>
            Editar story · #{storyCode(draft.date, draft.time) || '—'}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            {draft.produto || 'Sem produto'}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 1 }}>{codePretty}</div>
        </div>
      </div>

      <div className="stories-exp-grid">
        <div className="exp-cell">
          <label>Data</label>
          <input className="field" type="date" value={draft.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="exp-cell">
          <label>Hora</label>
          <input className="field" type="time" value={draft.time} onChange={e => set('time', e.target.value)} />
        </div>
        <div className="exp-cell" style={{ gridColumn: 'span 2' }}>
          <label>Produto foco</label>
          <GenericSelect value={draft.produto}
            options={PRODUTOS_FOCO.map(p => ({ id: p, label: p }))}
            onChange={v => set('produto', v)}
            placeholder="Selecionar produto..." width="100%" />
        </div>

        <div className="exp-cell" style={{ gridColumn: '1 / -1' }}>
          <label>Categoria</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {STORY_CATEGORIES.map(c => (
              <button key={c.id} type="button"
                className={`story-cat-btn ${draft.categoria === c.id ? 'active' : ''}`}
                onClick={() => set('categoria', c.id)}
                style={draft.categoria === c.id ? {
                  background: `color-mix(in oklab, ${c.color}, white 84%)`,
                  color: `color-mix(in oklab, ${c.color}, black 25%)`,
                  borderColor: `color-mix(in oklab, ${c.color}, white 70%)`,
                } : {}}>
                <span className="dot" style={{ background: c.color }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="exp-cell" style={{ gridColumn: '1 / -1' }}>
          <label>Status</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {STORY_STATUSES.map(s => (
              <button key={s.id} type="button"
                className={`story-cat-btn ${draft.status === s.id ? 'active' : ''}`}
                onClick={() => set('status', s.id)}
                style={draft.status === s.id ? {
                  background: `color-mix(in oklab, ${s.color}, white 84%)`,
                  color: `color-mix(in oklab, ${s.color}, black 25%)`,
                  borderColor: `color-mix(in oklab, ${s.color}, white 70%)`,
                } : {}}>
                <span className="dot" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="exp-cell" style={{ gridColumn: 'span 2' }}>
          <label>Link do conteúdo</label>
          <input className="field" placeholder="https://instagram.com/story/..."
            value={draft.link || ''} onChange={e => set('link', e.target.value)} />
        </div>
        <div className="exp-cell" style={{ gridColumn: 'span 2' }}>
          <label>Link CTA</label>
          <input className="field" placeholder="https://gocase.com.br/..."
            value={draft.linkCta || ''} onChange={e => set('linkCta', e.target.value)} />
        </div>

        {isPostado && (
          <React.Fragment>
            <div className="exp-section-divider">
              <span>Métricas</span>
            </div>
            <div className="exp-cell">
              <label>Receita do story (R$)</label>
              <input className="field" type="number" placeholder="0"
                value={draft.receita ?? ''}
                onChange={e => set('receita', e.target.value === '' ? null : Number(e.target.value))} />
            </div>
            <div className="exp-cell">
              <label>Sessões totais</label>
              <input className="field" type="number" placeholder="0"
                value={draft.sessoes ?? ''}
                onChange={e => set('sessoes', e.target.value === '' ? null : Number(e.target.value))} />
            </div>
            <div className="exp-cell">
              <label>Transações</label>
              <input className="field" type="number" placeholder="0"
                value={draft.transacoes ?? ''}
                onChange={e => set('transacoes', e.target.value === '' ? null : Number(e.target.value))} />
            </div>
          </React.Fragment>
        )}
      </div>

      <div className="stories-exp-actions">
        <button className="btn btn-ghost danger-ghost" onClick={() => onDelete(draft)}>
          <Icon.trash /> Excluir
        </button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-accent" onClick={() => onSave(draft)}>Salvar alterações</button>
      </div>
    </div>
  );
}

function StoriesList({ stories, onSave, onDelete }) {
  const [expanded, setExpanded] = useStateS(null);
  const [draft, setDraft] = useStateS(null);

  const open = (s) => {
    setExpanded(s.id);
    setDraft({ ...s });
  };
  const close = () => {
    setExpanded(null);
    setDraft(null);
  };
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  const handleSave = (d) => {
    onSave(d);
    close();
  };
  const handleDelete = (d) => {
    onDelete(d);
    close();
  };

  if (stories.length === 0) {
    return (
      <div className="stories-empty">
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-2)' }}>Nenhum story</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>Crie um novo story ou ajuste os filtros.</div>
      </div>
    );
  }
  return (
    <div className="list stories-list">
      <div className="list-row list-head" style={{ gridTemplateColumns: LIST_GRID_COLS }}>
        {LIST_HEADERS.map((h, i) => <div key={i} className="cell">{h}</div>)}
      </div>
      {stories.map(s => {
        const isOpen = expanded === s.id;
        const liveDraft = isOpen && draft ? draft : s;
        return (
          <div key={s.id}>
            <div className={`list-row expandable ${isOpen ? 'expanded' : ''}`}
              style={{ gridTemplateColumns: LIST_GRID_COLS }}
              onClick={() => isOpen ? close() : open(s)}>
              <div className="cell" style={{ padding: '14px 0 14px 12px' }}>
                <span style={{
                  display: 'inline-grid', placeItems: 'center', width: 22, height: 22, borderRadius: 999,
                  color: 'var(--ink-3)', transition: 'transform .2s',
                  transform: isOpen ? 'rotate(0)' : 'rotate(-90deg)',
                }}>
                  <Icon.chevD />
                </span>
              </div>
              <div className="cell" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)' }}>
                {storyCode(s.date, s.time)}
              </div>
              <div className="cell" style={{ fontSize: 13, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                {fmtBR(s.date)}
              </div>
              <div className="cell" style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{s.time}</div>
              <div className="cell" style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.produto}
              </div>
              <div className="cell"><StoryCategoryChip id={s.categoria} /></div>
              <div className="cell" style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: s.receita == null ? 'var(--ink-4)' : 'var(--ink)' }}>
                {fmtBRL(s.receita)}
              </div>
              <div className="cell" style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: s.sessoes == null ? 'var(--ink-4)' : 'var(--ink-2)' }}>
                {fmtInt(s.sessoes)}
              </div>
              <div className="cell" style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: s.transacoes == null ? 'var(--ink-4)' : 'var(--ink-2)' }}>
                {fmtInt(s.transacoes)}
              </div>
              <div className="cell"><StoryStatusPill status={s.status} /></div>
              <div className="cell" style={{ display: 'flex', gap: 6 }}>
                {s.link && <a href={s.link} target="_blank" rel="noopener noreferrer" className="story-link-btn" onClick={e => e.stopPropagation()} title="Link do conteúdo"><Icon.link /></a>}
                {s.linkCta && <a href={s.linkCta} target="_blank" rel="noopener noreferrer" className="story-link-btn cta" onClick={e => e.stopPropagation()} title="Link CTA"><Icon.link /></a>}
              </div>
              <div className="cell" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="story-row-del" onClick={e => { e.stopPropagation(); onDelete(s); }} title="Excluir">
                  <Icon.trash />
                </button>
              </div>
            </div>
            {isOpen && draft && (
              <StoryExpandedCard
                draft={liveDraft}
                set={set}
                isPostado={liveDraft.status === 'postado'}
                onSave={handleSave}
                onCancel={close}
                onDelete={handleDelete}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   Story Modal (create / edit)
   ============================================================ */
function StoryModal({ story, isNew, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useStateS(story);
  useEffectS(() => { setDraft(story); }, [story.id]);
  useEffectS(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const catOpts = STORY_CATEGORIES.map(c => ({ id: c.id, label: c.label }));
  const statusOpts = STORY_STATUSES.map(s => ({ id: s.id, label: s.label }));
  const prodOpts = PRODUTOS_FOCO.map(p => ({ id: p, label: p }));

  const code = storyCode(draft.date, draft.time);
  const codePretty = storyCodePretty(draft.date, draft.time);
  const cat = STORY_CATEGORIES.find(c => c.id === draft.categoria);

  const isPostado = draft.status === 'postado';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="story-modal-mark" style={{ background: `color-mix(in oklab, ${cat?.color || 'var(--accent)'}, white 80%)`, color: cat?.color || 'var(--accent-deep)' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" strokeDasharray="3 2.4" />
              <circle cx="12" cy="12" r="3.4" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase' }}>
              {isNew ? 'Novo story' : 'Editar story'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
              <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                {draft.produto || 'Sem produto'}
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-3)' }}>
                #{code || '—'}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>{codePretty}</div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <label>Data</label>
            <input className="field" type="date" value={draft.date}
              onChange={e => set('date', e.target.value)} style={{ width: 200 }} />

            <label>Hora</label>
            <input className="field" type="time" value={draft.time}
              onChange={e => set('time', e.target.value)} style={{ width: 140 }} />

            <label>Produto foco</label>
            <GenericSelect value={draft.produto} options={prodOpts}
              onChange={v => set('produto', v)} placeholder="Selecionar produto..." width={300} />

            <label>Categoria</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STORY_CATEGORIES.map(c => (
                <button key={c.id} type="button"
                  className={`story-cat-btn ${draft.categoria === c.id ? 'active' : ''}`}
                  onClick={() => set('categoria', c.id)}
                  style={draft.categoria === c.id ? {
                    background: `color-mix(in oklab, ${c.color}, white 84%)`,
                    color: `color-mix(in oklab, ${c.color}, black 25%)`,
                    borderColor: `color-mix(in oklab, ${c.color}, white 70%)`,
                  } : {}}>
                  <span className="dot" style={{ background: c.color }} />
                  {c.label}
                </button>
              ))}
            </div>

            <label>Status</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STORY_STATUSES.map(s => (
                <button key={s.id} type="button"
                  className={`story-cat-btn ${draft.status === s.id ? 'active' : ''}`}
                  onClick={() => set('status', s.id)}
                  style={draft.status === s.id ? {
                    background: `color-mix(in oklab, ${s.color}, white 84%)`,
                    color: `color-mix(in oklab, ${s.color}, black 25%)`,
                    borderColor: `color-mix(in oklab, ${s.color}, white 70%)`,
                  } : {}}>
                  <span className="dot" style={{ background: s.color }} />
                  {s.label}
                </button>
              ))}
            </div>

            <label>Link do conteúdo</label>
            <input className="field" placeholder="https://instagram.com/story/..."
              value={draft.link || ''} onChange={e => set('link', e.target.value)} />

            <label>Link CTA</label>
            <input className="field" placeholder="https://gocase.com.br/..."
              value={draft.linkCta || ''} onChange={e => set('linkCta', e.target.value)} />

            {isPostado && (
              <React.Fragment>
                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--line)', margin: '6px 0 2px',
                  paddingTop: 14, fontSize: 11, fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase',
                  color: 'var(--ink-3)' }}>
                  Métricas
                </div>
                <label>Receita do story</label>
                <div className="field-inline">
                  <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>R$</span>
                  <input className="field" type="number" placeholder="0"
                    value={draft.receita ?? ''} onChange={e => set('receita', e.target.value === '' ? null : Number(e.target.value))}
                    style={{ width: 180 }} />
                </div>

                <label>Sessões totais</label>
                <input className="field" type="number" placeholder="0"
                  value={draft.sessoes ?? ''} onChange={e => set('sessoes', e.target.value === '' ? null : Number(e.target.value))}
                  style={{ width: 180 }} />

                <label>Transações</label>
                <input className="field" type="number" placeholder="0"
                  value={draft.transacoes ?? ''} onChange={e => set('transacoes', e.target.value === '' ? null : Number(e.target.value))}
                  style={{ width: 140 }} />
              </React.Fragment>
            )}
          </div>
        </div>

        <div className="modal-foot">
          {!isNew && (
            <button className="danger" onClick={() => { onDelete(draft); onClose(); }}>
              <Icon.trash /> Excluir
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={() => { onSave(draft); onClose(); }}>
            {isNew ? 'Criar story' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   StoriesView (calendar + list)
   ============================================================ */
function StoriesView() {
  const today = todayISO();
  const todayD = parseISO(today);

  const [stories, setStories] = useStateS(() => genMockStories());
  const [mode, setMode] = useStateS('calendar'); // 'calendar' | 'list'
  const [year, setYear] = useStateS(todayD.getFullYear());
  const [month, setMonth] = useStateS(todayD.getMonth());

  const [catFilter, setCatFilter] = useStateS('all');
  const [statusFilter, setStatusFilter] = useStateS('all');
  const [search, setSearch] = useStateS('');

  const [active, setActive] = useStateS(null);
  const [isNew, setIsNew] = useStateS(false);

  // list sort
  const [sortKey, setSortKey] = useStateS('date');
  const [sortDir, setSortDir] = useStateS('asc');

  const goPrev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const goNext = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const goToday = () => { const t = parseISO(today); setYear(t.getFullYear()); setMonth(t.getMonth()); };

  // filtering
  const filtered = useMemoS(() => {
    let arr = stories;
    if (catFilter !== 'all')    arr = arr.filter(s => s.categoria === catFilter);
    if (statusFilter !== 'all') arr = arr.filter(s => s.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(s =>
        s.produto.toLowerCase().includes(q) ||
        storyCode(s.date, s.time).includes(q));
    }
    return arr;
  }, [stories, catFilter, statusFilter, search]);

  const monthFiltered = useMemoS(() =>
    filtered.filter(s => {
      const d = parseISO(s.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }), [filtered, year, month]);

  const sortedList = useMemoS(() => {
    const arr = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      let av, bv;
      if (sortKey === 'date')     { av = `${a.date} ${a.time}`; bv = `${b.date} ${b.time}`; }
      else if (sortKey === 'code'){ av = storyCode(a.date, a.time); bv = storyCode(b.date, b.time); }
      else if (sortKey === 'receita')    { av = a.receita ?? -1; bv = b.receita ?? -1; }
      else if (sortKey === 'sessoes')    { av = a.sessoes ?? -1; bv = b.sessoes ?? -1; }
      else if (sortKey === 'transacoes') { av = a.transacoes ?? -1; bv = b.transacoes ?? -1; }
      else                        { av = a[sortKey]; bv = b[sortKey]; }
      if (av < bv) return -1 * dir;
      if (av > bv) return  1 * dir;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  /* mutations */
  const saveStory = (s) => {
    setStories(arr => {
      const exists = arr.some(x => x.id === s.id);
      return exists ? arr.map(x => x.id === s.id ? s : x) : [...arr, s];
    });
  };
  const deleteStory = (s) => setStories(arr => arr.filter(x => x.id !== s.id));

  const openNew = (defaults = {}) => {
    const nextId = stories.reduce((m, s) => Math.max(m, s.id), 0) + 1;
    const newStory = {
      id: nextId, date: defaults.date ?? today, time: '12:00',
      produto: PRODUTOS_FOCO[0], categoria: 'produto', status: 'naoIniciado',
      receita: null, sessoes: null, transacoes: null,
      link: '', linkCta: '',
    };
    setActive(newStory);
    setIsNew(true);
  };
  const openExisting = (s) => { setActive(s); setIsNew(false); };

  // monthly aggregate stats
  const stats = useMemoS(() => {
    const monthAll = stories.filter(s => {
      const d = parseISO(s.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const postados = monthAll.filter(s => s.status === 'postado');
    const receita = postados.reduce((sum, s) => sum + (s.receita || 0), 0);
    const sessoes = postados.reduce((sum, s) => sum + (s.sessoes || 0), 0);
    const transacoes = postados.reduce((sum, s) => sum + (s.transacoes || 0), 0);
    return { total: monthAll.length, postados: postados.length, receita, sessoes, transacoes };
  }, [stories, year, month]);

  return (
    <React.Fragment>
      {/* sub-toolbar: mode + period nav */}
      <div className="stories-toolbar">
        <div className="view-toggle">
          <button className={mode === 'calendar' ? 'active' : ''} onClick={() => setMode('calendar')}>
            <Icon.cal /> Calendário
          </button>
          <button className={mode === 'list' ? 'active' : ''} onClick={() => setMode('list')}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
            Lista
          </button>
        </div>

        {mode === 'calendar' && (
          <React.Fragment>
            <div className="month-nav">
              <button onClick={goPrev}><Icon.chevL /></button>
              <div className="label">{MONTHS[month]} {year}</div>
              <button onClick={goNext}><Icon.chevR /></button>
            </div>
            <button className="today-btn" onClick={goToday}>Hoje</button>
          </React.Fragment>
        )}

        <div className="search-box" style={{ minWidth: 220 }}>
          <Icon.search />
          <input placeholder="Buscar story ou código..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ flex: 1 }} />

        <button className="btn btn-accent" onClick={() => openNew({})}>
          <Icon.plus /> Novo story
        </button>
      </div>

      {/* stats strip (calendar mode only) */}
      {mode === 'calendar' && (
        <div className="stories-stats">
          <div className="ss-card">
            <div className="ss-label">No mês</div>
            <div className="ss-value">{stats.total}</div>
            <div className="ss-sub">stories</div>
          </div>
          <div className="ss-card">
            <div className="ss-label">Postados</div>
            <div className="ss-value">{stats.postados}</div>
            <div className="ss-sub">de {stats.total}</div>
          </div>
          <div className="ss-card accent">
            <div className="ss-label">Receita</div>
            <div className="ss-value">{fmtBRL(stats.receita)}</div>
            <div className="ss-sub">soma postados</div>
          </div>
          <div className="ss-card">
            <div className="ss-label">Sessões</div>
            <div className="ss-value">{fmtInt(stats.sessoes)}</div>
            <div className="ss-sub">totais</div>
          </div>
          <div className="ss-card">
            <div className="ss-label">Transações</div>
            <div className="ss-value">{fmtInt(stats.transacoes)}</div>
            <div className="ss-sub">geradas</div>
          </div>
        </div>
      )}

      {/* filter pills */}
      <div className="filter-bar" style={{ paddingTop: 0 }}>
        <button className={`platform-pill ${catFilter === 'all' ? 'active' : ''}`} onClick={() => setCatFilter('all')}>
          Todas categorias
        </button>
        {STORY_CATEGORIES.map(c => (
          <button key={c.id} className={`platform-pill ${catFilter === c.id ? 'active' : ''}`} onClick={() => setCatFilter(c.id)}>
            <span className="dot" style={{ background: c.color }} />
            {c.label}
          </button>
        ))}

        <div style={{ width: 1, height: 18, background: 'var(--line)', margin: '0 8px' }} />

        <button className={`tag-chip ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>Todos status</button>
        {STORY_STATUSES.map(s => (
          <button key={s.id} className={`tag-chip ${statusFilter === s.id ? 'active' : ''}`} onClick={() => setStatusFilter(s.id)}>
            {s.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <span className="count-pill">
          {mode === 'calendar'
            ? `${monthFiltered.length} stories neste mês`
            : `${sortedList.length} stories no total`}
        </span>
      </div>

      {/* body */}
      {mode === 'calendar' ? (
        <div className="cal-wrap">
          <StoriesCalendarGrid year={year} month={month} stories={filtered}
            onStoryClick={openExisting} onNewStory={(d) => openNew({ date: d })} />
        </div>
      ) : (
        <div className="list-wrap">
          <StoriesList stories={sortedList} onSave={saveStory} onDelete={deleteStory} />
        </div>
      )}

      {active && (
        <StoryModal story={active} isNew={isNew}
          onClose={() => { setActive(null); setIsNew(false); }}
          onSave={saveStory} onDelete={deleteStory} />
      )}
    </React.Fragment>
  );
}

Object.assign(window, { StoriesView });
