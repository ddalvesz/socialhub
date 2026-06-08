/* ExportMetricoolModal — SocialHub
 * Abre via: <ExportMetricoolModal onClose={() => setExportOpen(false)} posts={posts} />
 */
const { useState: useStateX, useMemo: useMemoX, useEffect: useEffectX } = React;

// ─── helpers ────────────────────────────────────────────────────────────────
function fmtDate(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function isoDate(d) {
  return d.toISOString().split('T')[0];
}
function rangeFor(period) {
  const now = new Date();
  if (period === 'week') {
    const day = now.getDay();
    const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7));
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return [mon, sun];
  }
  if (period === 'month') {
    return [
      new Date(now.getFullYear(), now.getMonth(), 1),
      new Date(now.getFullYear(), now.getMonth() + 1, 0),
    ];
  }
  if (period === 'last30') {
    const ago = new Date(now); ago.setDate(now.getDate() - 29);
    return [ago, now];
  }
  return [now, now];
}

// ─── sub-components ──────────────────────────────────────────────────────────
function PeriodChip({ label, active, onClick }) {
  return (
    <button
      className={`chip${active ? ' active' : ''}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function PlatformChipX({ platform, label, active, onClick }) {
  const colorMap = {
    all:     null,
    ig:      'linear-gradient(135deg,#f58529,#dd2a7b,#8134af)',
    tiktok:  '#000',
    twitter: '#000',
  };
  const style = active && colorMap[platform]
    ? { background: colorMap[platform], borderColor: 'transparent', color: 'white' }
    : active
    ? { background: 'var(--ink)', borderColor: 'transparent', color: 'white' }
    : {};

  return (
    <button
      className={`platform-chip${active ? ' active' : ''}`}
      data-p={platform}
      style={style}
      onClick={onClick}
      type="button"
    >
      <span className="picon" style={{ background: active ? 'rgba(255,255,255,.2)' : 'var(--surface-3)' }}>
        <PlatformIcon platform={platform === 'all' ? null : platform} size={11} color={active ? 'white' : 'var(--ink-3)'} />
        {platform === 'all' && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : 'var(--ink-3)'} strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 12h18M12 5l7 7-7 7"/>
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

function StatusChipX({ statusKey, label, dotColor, active, onClick }) {
  const activeBg = { agendado: 'oklch(0.92 0.06 265)', publicado: 'oklch(0.92 0.06 150)', producao: 'oklch(0.93 0.07 75)' };
  const activeColor = { agendado: 'oklch(0.45 0.13 265)', publicado: 'oklch(0.42 0.13 150)', producao: 'oklch(0.48 0.13 75)' };
  const activeBorder = { agendado: 'oklch(0.82 0.09 265)', publicado: 'oklch(0.82 0.09 150)', producao: 'oklch(0.83 0.10 75)' };

  const style = active
    ? { background: activeBg[statusKey], color: activeColor[statusKey], borderColor: activeBorder[statusKey] }
    : {};

  return (
    <button className={`status-chip${active ? ' active' : ''}`} data-s={statusKey} style={style} onClick={onClick} type="button">
      <span className="sdot" style={{ background: dotColor }} />
      {label}
    </button>
  );
}

// ─── CSV generation ──────────────────────────────────────────────────────────
function generateCSV(posts, platforms, statuses, dateFrom, dateTo) {
  const header = ['Data', 'Plataforma', 'Status', 'Legenda', 'Link da mídia', 'Link do post'];
  const from = new Date(dateFrom + 'T00:00:00');
  const to   = new Date(dateTo   + 'T23:59:59');

  const rows = posts
    .filter(p => {
      const d = new Date(p.date);
      if (d < from || d > to) return false;
      if (!platforms.has('all') && !platforms.has(p.platform)) return false;
      if (!statuses.has(p.status)) return false;
      return true;
    })
    .map(p => [
      new Date(p.date).toLocaleDateString('pt-BR'),
      p.platform,
      p.status,
      `"${(p.caption || '').replace(/"/g, '""')}"`,
      p.mediaUrl || '',
      p.postUrl  || '',
    ]);

  return [header, ...rows].map(r => r.join(',')).join('\n');
}

function downloadCSV(content, filename) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main component ──────────────────────────────────────────────────────────
function ExportMetricoolModal({ onClose, posts = [] }) {
  const [period, setPeriod]       = useStateX('month');
  const [customFrom, setFrom]     = useStateX(isoDate(new Date()));
  const [customTo,   setTo]       = useStateX(isoDate(new Date()));
  const [platforms,  setPlatforms]= useStateX(new Set(['all']));
  const [statuses,   setStatuses] = useStateX(new Set(['agendado']));

  // close on Escape
  useEffectX(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const [dateFrom, dateTo] = useMemoX(() => {
    if (period === 'custom') return [customFrom, customTo];
    const [a, b] = rangeFor(period);
    return [isoDate(a), isoDate(b)];
  }, [period, customFrom, customTo]);

  const rangeLabel = `${fmtDate(new Date(dateFrom + 'T12:00:00'))} – ${fmtDate(new Date(dateTo + 'T12:00:00'))}`;

  function togglePlatform(key) {
    setPlatforms(prev => {
      const next = new Set(prev);
      if (key === 'all') return new Set(['all']);
      next.delete('all');
      if (next.has(key)) { next.delete(key); if (next.size === 0) next.add('all'); }
      else next.add(key);
      return next;
    });
  }

  function toggleStatus(key) {
    setStatuses(prev => {
      if (prev.has(key) && prev.size === 1) return prev;
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleDownload() {
    const statusMap = { agendado: 'sched', publicado: 'pub', producao: 'prod' };
    const mappedStatuses = new Set([...statuses].map(s => statusMap[s] || s));
    const csv = generateCSV(posts, platforms, mappedStatuses, dateFrom, dateTo);
    const month = new Date(dateFrom + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace(' de ', '-');
    downloadCSV(csv, `metricool-${month}.csv`);
  }

  const PLATFORM_OPTIONS = [
    { id: 'all',     label: 'Todas' },
    { id: 'ig',      label: 'Instagram' },
    { id: 'tiktok',  label: 'TikTok' },
    { id: 'twitter', label: 'Twitter' },
  ];
  const STATUS_OPTIONS = [
    { id: 'agendado',  label: 'Agendado',     dot: 'oklch(0.6 0.13 265)' },
    { id: 'publicado', label: 'Publicado',     dot: 'oklch(0.6 0.13 150)' },
    { id: 'producao',  label: 'Em produção',   dot: 'oklch(0.62 0.13 75)' },
  ];

  return (
    <React.Fragment>
      {/* backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(30,20,50,.38)', backdropFilter: 'blur(3px)', zIndex: 49 }}
        onClick={onClose}
      />

      {/* modal */}
      <div className="modal modal-export" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 50 }}>

        {/* header */}
        <div className="mhead">
          <div className="mhead-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div className="mhead-text">
            <div className="mhead-title">Exportar para Metricool</div>
            <div className="mhead-sub">Gera um CSV para importar no Metricool</div>
          </div>
          <button className="btn-close" onClick={onClose} title="Fechar"><Icon.x /></button>
        </div>

        {/* body */}
        <div className="mbody">

          {/* Período */}
          <div className="field-group">
            <div className="field-label">
              <Icon.cal style={{ width: 13, height: 13 }} /> Período
            </div>
            <div className="chip-row">
              {[
                { id: 'week',   label: 'Semana atual' },
                { id: 'month',  label: 'Mês atual' },
                { id: 'last30', label: 'Últimos 30 dias' },
                { id: 'custom', label: 'Personalizado' },
              ].map(p => (
                <PeriodChip key={p.id} label={p.label} active={period === p.id} onClick={() => setPeriod(p.id)} />
              ))}
            </div>

            {period !== 'custom' ? (
              <div className="date-range-display">
                <Icon.clock style={{ width: 14, height: 14, color: 'var(--ink-4)', flexShrink: 0 }} />
                <span className="date-range-text">{rangeLabel}</span>
              </div>
            ) : (
              <div className="date-range-custom visible">
                <div className="date-range-inputs">
                  <div style={{ flex: 1 }}>
                    <label>De</label>
                    <input type="date" value={customFrom} onChange={e => setFrom(e.target.value)} />
                  </div>
                  <span className="date-range-separator">→</span>
                  <div style={{ flex: 1 }}>
                    <label>Até</label>
                    <input type="date" value={customTo} onChange={e => setTo(e.target.value)} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Plataforma */}
          <div className="field-group">
            <div className="field-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              Plataforma
            </div>
            <div className="platform-grid">
              {PLATFORM_OPTIONS.map(p => (
                <PlatformChipX
                  key={p.id}
                  platform={p.id}
                  label={p.label}
                  active={platforms.has(p.id)}
                  onClick={() => togglePlatform(p.id)}
                />
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="field-group">
            <div className="field-label">
              <Icon.clock style={{ width: 13, height: 13 }} /> Status incluídos
            </div>
            <div className="status-chips">
              {STATUS_OPTIONS.map(s => (
                <StatusChipX
                  key={s.id}
                  statusKey={s.id}
                  label={s.label}
                  dotColor={s.dot}
                  active={statuses.has(s.id)}
                  onClick={() => toggleStatus(s.id)}
                />
              ))}
            </div>
          </div>

          {/* Notice */}
          <div className="notice-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1, color: 'var(--accent)' }}>
              <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            <span style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              O CSV segue o formato de importação do <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>Metricool</strong>. Cada linha representa um post com data, plataforma e legenda.
            </span>
          </div>

        </div>{/* /mbody */}

        {/* footer */}
        <div className="mfoot">
          <div className="spacer" />
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handleDownload}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Baixar CSV
          </button>
        </div>

      </div>
    </React.Fragment>
  );
}

Object.assign(window, { ExportMetricoolModal });
